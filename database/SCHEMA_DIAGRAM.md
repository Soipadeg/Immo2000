# Diagramme ER - Immo2000

## Modèle Entité-Relation

```mermaid
erDiagram
    SOURCES ||--o{ ESTIMATIONS : fournit
    SOURCES ||--o{ ERREURS : cause
    SOURCES ||--o{ DONNEES_MARCHE : fournit

    UTILISATEURS ||--o{ BIENS : possede
    UTILISATEURS ||--o{ COMPARAISONS : cree

    BIENS ||--o{ ESTIMATIONS : "a pour"
    BIENS ||--o{ ERREURS : "peut avoir"

    ESTIMATIONS ||--o{ COMPARAISONS_BIENS : "est dans"
    COMPARAISONS ||--o{ COMPARAISONS_BIENS : "contient"
    BIENS ||--o{ COMPARAISONS_BIENS : "est dans"

    SOURCES {
        int source_id PK
        string nom UK "VARCHAR(50)"
        text description
        string url
        bool actif
        timestamp date_ajout
    }

    UTILISATEURS {
        int utilisateur_id PK
        string email UK "VARCHAR(255)"
        string mot_de_passe_hash
        string nom "VARCHAR(100)"
        string prenom "VARCHAR(100)"
        string telephone
        string adresse_contact
        enum role "vendeur|acheteur|agent"
        bool actif
        timestamp date_inscription
        timestamp date_derniere_connexion
        timestamp updated_at
    }

    BIENS {
        int bien_id PK
        int utilisateur_id FK
        string adresse "VARCHAR(255)"
        string code_postal
        string ville
        string arrondissement
        int surface "m² > 0"
        enum type_bien "appartement|maison|terrain|commercial"
        int nombre_pieces
        int nombre_chambres
        int etage
        int date_construction "année"
        text description
        string url_photo
        string statut "actif|vendu|retiré"
        timestamp date_creation
        timestamp date_modification
    }

    ESTIMATIONS {
        int estimation_id PK
        int bien_id FK
        int source_id FK
        decimal prix_m2 "€/m², >0"
        decimal prix_estime "€ total"
        decimal fourchette_basse "€ min"
        decimal fourchette_haute "€ max"
        decimal marge_incertitude "%"
        jsonb donnees_marche "données du marché"
        timestamp date_estimation
        enum status "success|error|pending"
        text message_erreur
    }

    ERREURS {
        int erreur_id PK
        int bien_id FK "nullable"
        int source_id FK
        string adresse_tentee
        text message_erreur
        string code_erreur
        jsonb reponse_api
        timestamp date_erreur
        int retry_count
    }

    DONNEES_MARCHE {
        int marche_id PK
        int source_id FK
        string ville
        string code_postal
        string arrondissement
        enum type_bien "nullable"
        decimal prix_moyen_m2
        decimal prix_min_m2
        decimal prix_max_m2
        int nombre_biens
        decimal volume_transactions
        string tendance_prix_3m "hausse|baisse|stable"
        decimal variation_pct_3m
        string tendance_prix_12m
        decimal variation_pct_12m
        timestamp date_collecte
        timestamp date_mise_a_jour
    }

    COMPARAISONS {
        int comparaison_id PK
        int utilisateur_id FK
        string titre
        text description
        int nombre_biens
        decimal prix_moyen_estime
        decimal prix_min_estime
        decimal prix_max_estime
        jsonb resume_comparatif
        timestamp date_creation
        timestamp date_modification
    }

    COMPARAISONS_BIENS {
        int comparaison_id FK PK
        int bien_id FK PK
        int estimation_id FK "nullable"
        int position
        timestamp date_ajout
    }
```

## Vue d'ensemble hiérarchique

```
┌─────────────────────────────────────────────────────────┐
│                     IMMO2000 DATABASE                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐                    ┌──────────────────┐  │
│  │ SOURCES  │◄──┐                │  UTILISATEURS    │  │
│  │ (Melo,   │   │    fournit     │ (Vendeurs,       │  │
│  │ Keyzia)  │   │                │  Acheteurs)      │  │
│  └──────────┘   │                └────────┬─────────┘  │
│                 │                         │            │
│              ┌──┴─────────────────────────┤            │
│              │                            │            │
│         ┌────▼────────┐            ┌──────▼────────┐   │
│         │ ESTIMATIONS │            │    BIENS      │   │
│         │  (Melo API) │◄───────────┤ (Immobilier)  │   │
│         │             │            │               │   │
│         │ - prix_m2   │            │ - adresse     │   │
│         │ - fourchette│            │ - surface     │   │
│         │ - données   │            │ - type_bien   │   │
│         │   marché    │            │               │   │
│         └────┬────────┘            └───────┬───────┘   │
│              │                             │            │
│              │                    ┌────────▼────────┐   │
│              │                    │ COMPARAISONS    │   │
│              │                    │ (Groupes de     │   │
│              │                    │  biens)         │   │
│              │                    └────────┬────────┘   │
│              │                             │            │
│              └──────────┬──────────────────┘            │
│                         │                              │
│              ┌──────────▼───────────┐                  │
│              │ COMPARAISONS_BIENS   │                  │
│              │ (Relation M2M)       │                  │
│              └──────────────────────┘                  │
│                                                         │
│  ┌─────────────┐          ┌───────────────────────┐   │
│  │   ERREURS   │          │  DONNEES_MARCHE       │   │
│  │  (Audit)    │          │ (Statistiques/        │   │
│  │             │          │  Tendances)           │   │
│  └─────────────┘          └───────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Flux de données

```
                  ┌─────────────────┐
                  │   melo_api.py   │
                  │  (Python)       │
                  └────────┬────────┘
                           │
                API Call   │
                  (Melo)   │
                           │
                    ┌──────▼──────┐
                    │ Estimations │
                    │ (JSON)      │
                    └──────┬──────┘
                           │
              ┌────────────┼─────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼──┐ ┌──────▼───┐
        │   BIENS   │ │SOURCES│ │ERREURS   │
        └─────┬─────┘ └───┬──┘ └──────┬───┘
              │           │          │
        INSERT/UPDATE     │       (si erreur)
              │           │          │
        ┌─────▼──────────┬┴──────────┘
        │                │
    ┌───▼────────────────┴─┐
    │   ESTIMATIONS        │
    │  (Stockage)          │
    └──────┬───────────────┘
           │
       ┌───┴─────────────────────┐
       │                         │
    ┌──▼──┐            ┌───────▼──────┐
    │VUES │            │ COMPARAISONS  │
    │     │            │               │
    │-Rec │            │ (Groupes de   │
    │entes│            │  biens)       │
    │-Type│            │               │
    │-Vil │            └───────────────┘
    │le   │
    └─────┘
```

## Clés étrangères et contraintes

```
UTILISATEURS (utilisateur_id)
    ↓
    ├──► BIENS.utilisateur_id (ON DELETE CASCADE)
    └──► COMPARAISONS.utilisateur_id (ON DELETE CASCADE)

SOURCES (source_id)
    ↓
    ├──► ESTIMATIONS.source_id (ON DELETE RESTRICT)
    ├──► ERREURS.source_id (ON DELETE RESTRICT)
    └──► DONNEES_MARCHE.source_id (ON DELETE RESTRICT)

BIENS (bien_id)
    ↓
    ├──► ESTIMATIONS.bien_id (ON DELETE CASCADE)
    ├──► ERREURS.bien_id (ON DELETE SET NULL)
    └──► COMPARAISONS_BIENS.bien_id (ON DELETE CASCADE)

ESTIMATIONS (estimation_id)
    ↓
    └──► COMPARAISONS_BIENS.estimation_id (ON DELETE SET NULL)

COMPARAISONS (comparaison_id)
    ↓
    └──► COMPARAISONS_BIENS.comparaison_id (ON DELETE CASCADE)
```

## Chemins de requête typiques

### 1. Estimation d'un bien

```
UTILISATEURS
    ↓ [créateur]
BIENS
    ↓ [a pour]
ESTIMATIONS
    ↓ [fournit]
SOURCES (Melo)
    ↓ [données]
DONNEES_MARCHE
```

### 2. Comparaison de biens

```
UTILISATEURS
    ↓ [crée]
COMPARAISONS
    ↓ [contient]
COMPARAISONS_BIENS
    ↓ [liens vers]
BIENS + ESTIMATIONS
```

### 3. Audit des erreurs

```
SOURCES
    ↓ [cause]
ERREURS
    ↓ [pour]
BIENS (si bien identifié)
```

---

**Version** : 1.0
**Créé** : 2026-05-04
