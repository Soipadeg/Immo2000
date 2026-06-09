# 🔐 Diagrammes d'Authentification JWT - Immo2000

## 1️⃣ Flux d'authentification (Register → Login → Protected Route)

```mermaid
sequenceDiagram
    participant Client as 👤 Client
    participant API as 🔧 API Flask
    participant DB as 💾 PostgreSQL

    Note over Client,DB: REGISTRATION
    Client->>API: POST /auth/register {email, password, nom, prenom, role}
    API->>API: Valide email, password, role
    API->>DB: Crée user (password hashé avec bcrypt)
    DB-->>API: user_id=1
    API-->>Client: 201 {user_id, message}

    Note over Client,DB: LOGIN
    Client->>API: POST /auth/login {email, password}
    API->>DB: Cherche user par email
    DB-->>API: Utilisateur trouvé
    API->>API: Vérifie password avec bcrypt
    API->>API: Génère JWT access_token (24h) + refresh_token (7j)
    API-->>Client: 200 {access_token, refresh_token, expires_in}

    Note over Client,DB: PROTECTED ROUTE
    Client->>API: GET /biens (Header: Authorization: Bearer <token>)
    API->>API: @token_required décorateur
    API->>API: Extrait token du header
    API->>API: Vérifie signature JWT + expiration
    API->>DB: Vérifie que user existe (pas supprimé)
    DB-->>API: ✓ Utilisateur existe
    API->>API: Exécute route avec current_user
    API-->>Client: 200 {biens: [...]}
```

---

## 2️⃣ Flux de rafraîchissement de token

```mermaid
sequenceDiagram
    participant Client as 👤 Client
    participant API as 🔧 API Flask
    participant DB as 💾 PostgreSQL

    Client->>API: Access token expiré ❌
    Client->>API: POST /auth/refresh {refresh_token}
    API->>API: Vérifie signature refresh_token
    API->>API: Vérifie expiration (7j)
    API->>API: Vérifie que type="refresh"
    API->>DB: Cherche user par user_id du token
    DB-->>API: ✓ Utilisateur existe
    API->>API: Génère nouveau access_token (24h)
    API-->>Client: 200 {access_token, expires_in}
    Client->>API: GET /biens (Header: Bearer <new_token>)
    API-->>Client: 200 {biens: [...]} ✓
```

---

## 3️⃣ Architecture des rôles et restrictions

```mermaid
graph LR
    A["👤 Utilisateur"] -->|role=vendeur| B["POST /biens<br/>(créer bien)"]
    A -->|role=acheteur| C["GET /biens<br/>(voir biens)"]
    A -->|role=agent| D["GET /admin/stats<br/>(statistiques)"]
    A -->|tous les rôles| E["GET /auth/me<br/>(infos perso)"]

    style B fill:#4CAF50
    style C fill:#2196F3
    style D fill:#FF9800
    style E fill:#9C27B0
```

---

## 4️⃣ Structure du JWT

```mermaid
graph TB
    subgraph JWT["JWT Token: eyJhbGciOi..."]
        Header["📋 HEADER<br/>{<br/>  alg: HS256<br/>  typ: JWT<br/>}"]
        Payload["📦 PAYLOAD<br/>{<br/>  user_id: 1<br/>  email: user@ex.com<br/>  role: vendeur<br/>  exp: 1717500000<br/>  type: access<br/>}"]
        Signature["🔒 SIGNATURE<br/>HMACSHA256(<br/>  header.payload<br/>  secret_key<br/>)"]
    end

    Header -->|encode base64url| Dot1["•"]
    Payload -->|encode base64url| Dot1
    Signature -->|encode base64url| Dot2["•"]

    Dot1 --> Result["eyJhbGciOiJIUzI1NiI...<br/>.eyJ1c2VyX2lkIjox<br/>.SflKxwRJSMeKKF2QT4fw..."]
```

---

## 5️⃣ Flux d'erreur d'authentification

```mermaid
graph TD
    A["🔐 Request avec JWT"] --> B{Token présent?}
    B -->|Non| C["❌ 401<br/>Missing Authorization"]
    B -->|Oui| D{Format Bearer?}
    D -->|Non| E["❌ 401<br/>Invalid format"]
    D -->|Oui| F{Signature valide?}
    F -->|Non| G["❌ 401<br/>Invalid token"]
    F -->|Oui| H{Token expiré?}
    H -->|Oui| I["❌ 401<br/>Expired token"]
    H -->|Non| J{User existe?}
    J -->|Non| K["❌ 404<br/>User not found"]
    J -->|Oui| L{Account actif?}
    L -->|Non| M["❌ 403<br/>Account deactivated"]
    L -->|Oui| N["✅ 200<br/>Request approved"]

    style C fill:#f44336
    style E fill:#f44336
    style G fill:#f44336
    style I fill:#f44336
    style K fill:#f44336
    style M fill:#ff9800
    style N fill:#4CAF50
```

---

## 6️⃣ Cycle de vie des tokens

```mermaid
timeline
    title Cycle de vie Access Token (24h) vs Refresh Token (7j)

    Access Token:
        00:00: Généré (exp: +24h)
        12:00: Valide ✓
        23:59: Valide ✓
        24:01: Expiré ❌
            : Refresh → Nouveau token

    Refresh Token:
        00:00: Généré (exp: +7j)
        01:00: Valide ✓
        07:00: Valide ✓
        07:01: Expiré ❌
            : Reconnecter (login)
```

---

## 7️⃣ Intégration avec les décorateurs

```mermaid
graph LR
    A["Route<br/>@token_required"] --> B["Vérifie JWT"]
    B --> C{Valide?}
    C -->|Non| D["❌ 401"]
    C -->|Oui| E["current_user =<br/>{user_id, email,<br/>role, exp}"]

    E --> F["Route<br/>@role_required<br/>roles=agent"]
    F --> G{Role OK?}
    G -->|Non| H["❌ 403<br/>Forbidden"]
    G -->|Oui| I["✅ Exécute route<br/>avec current_user"]

    style D fill:#f44336
    style H fill:#ff9800
    style I fill:#4CAF50
```

---

## 8️⃣ Schéma de sécurité

```mermaid
graph TB
    subgraph Client["🔐 Client"]
        A["JWT en mémoire<br/>(localStorage ou sessionStorage)"]
    end

    subgraph Transport["🔒 Transport"]
        B["HTTPS/TLS<br/>(chiffrage)"]
    end

    subgraph Request["📨 Requête"]
        C["Authorization: Bearer<br/>&lt;token&gt;"]
    end

    subgraph Server["🖥️ Serveur"]
        D["Extrait token"]
        E["Vérifie signature<br/>(JWT_SECRET_KEY)"]
        F["Vérifie expiration"]
        G["Cherche user en DB"]
        H["Exécute route"]
    end

    A --> B
    B --> Request
    Request --> D
    D --> E
    E --> F
    F --> G
    G --> H

    style A fill:#2196F3
    style B fill:#4CAF50
    style C fill:#FF9800
    style D fill:#9C27B0
    style E fill:#9C27B0
    style F fill:#9C27B0
    style G fill:#9C27B0
    style H fill:#4CAF50
```

---

## 📊 Tableau comparatif : Access vs Refresh Token

| Aspect | Access Token | Refresh Token |
|--------|--------------|---------------|
| **Durée** | 24h | 7 jours |
| **Usage** | Toutes les requêtes | Rafraîchir access token |
| **Stockage** | Memory/localStorage | Secure cookie (idéal) |
| **Risque** | Court → Perte limitée | Long → À protéger |
| **Type JWT** | `"type": "access"` | `"type": "refresh"` |
| **Endpoint** | Inclus dans chaque requête | POST /auth/refresh |

---

## 🔐 Bonnes pratiques illustrées

```mermaid
graph LR
    A["✅ Hacher avec bcrypt<br/>(12 rounds)"] --> B["Stockage sûr"]
    C["✅ JWT signé HS256<br/>(secret key)"] --> D["Intégrité vérifiée"]
    E["✅ Tokens court-lived<br/>(24h max)"] --> F["Risque limité"]
    G["✅ Refresh en HTTP-only<br/>cookie"] --> H["XSS protection"]

    I["❌ Mot de passe en clair"] --> J["Danger!"]
    K["❌ Secret hardcodé"] --> L["Fuite facile"]
    M["❌ Tokens long-lived"] --> N["Risque élevé"]

    style B fill:#4CAF50
    style D fill:#4CAF50
    style F fill:#4CAF50
    style H fill:#4CAF50
    style J fill:#f44336
    style L fill:#f44336
    style N fill:#f44336
```

---

**Version** : 1.0
**Dernière mise à jour** : 2026-05-04
