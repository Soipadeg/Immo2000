<!-- Création: 2026-05-06 -->
# 🏦 Simulateur de Prêt - API Reference

*Documentation technique pour développeurs*

---

## 📍 Endpoint Principal

### POST /api/v1/simulateur-pret

Simule un prêt immobilier et retourne la capacité d'emprunt, mensualité et tableau d'amortissement.

#### 🔐 Authentification

**Obligatoire:** JWT Bearer Token

```bash
curl -X POST http://localhost:5000/api/v1/simulateur-pret \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Retour 401 Unauthorized** si token manquant ou invalide.

---

## 📥 Request Body

```json
{
  "revenu_mensuel_net": 3000,
  "apport": 50000,
  "taux_interet": 3.5,
  "duree_ans": 20,
  "taux_assurance": 0.3
}
```

### Paramètres

| Paramètre | Type | Obligatoire | Défaut | Min-Max | Description |
|-----------|------|-------------|--------|---------|-------------|
| `revenu_mensuel_net` | float | ✅ Oui | - | > 0 | Revenu mensuel net en € |
| `apport` | float | ❌ Non | 0 | ≥ 0 | Apport personnel en € |
| `taux_interet` | float | ❌ Non | 3.5 | 0-15 | Taux annuel en % |
| `duree_ans` | int | ❌ Non | 20 | 1-30 | Durée du prêt en années |
| `taux_assurance` | float | ❌ Non | 0.3 | ≥ 0 | Taux assurance annuel en % |

### Validation

- **revenu_mensuel_net** > 0 → `422 Unprocessable Entity` si ≤ 0
- **apport** ≥ 0 → `422` si négatif
- **taux_interet** 0 ≤ x ≤ 15 → `422` sinon
- **duree_ans** 1 ≤ x ≤ 30 → `422` sinon
- **taux_assurance** ≥ 0 → `400` si négatif

---

## 📤 Response Body (200 OK)

```json
{
  "status": "success",
  "message": "Simulation effectuée avec succès",
  "data": {
    "capacite_emprunt": 181047.06,
    "mensualite": 1095.26,
    "cout_total_credit": 262862.82,
    "tableau_amortissement": [
      {
        "mois": 1,
        "capital_restant": 180525.11,
        "interets": 528.05,
        "assurance": 45.26,
        "mensualite": 1095.26
      },
      {
        "mois": 2,
        "capital_restant": 180001.64,
        "interets": 526.53,
        "assurance": 45.26,
        "mensualite": 1095.26
      },
      ...12 lignes total
    ]
  }
}
```

### Champs Response

| Champ | Type | Description |
|-------|------|-------------|
| `capacite_emprunt` | float | Capital max empruntable (€) - 2 décimales |
| `mensualite` | float | Mensualité constante (€) - 2 décimales |
| `cout_total_credit` | float | Coût total = mensualité × mois (€) |
| `tableau_amortissement` | array | 12 premières lignes du plan d'amortissement |
| `tableau_amortissement[].mois` | int | Numéro du mois (1-12) |
| `tableau_amortissement[].capital_restant` | float | Capital non remboursé après ce mois (€) |
| `tableau_amortissement[].interets` | float | Intérêts payés ce mois (€) |
| `tableau_amortissement[].assurance` | float | Assurance payée ce mois (€) |
| `tableau_amortissement[].mensualite` | float | Mensualité payée ce mois (€) |

---

## 📊 Exemples cURL

### Exemple 1: Standard (valeurs par défaut)

```bash
curl -X POST http://localhost:5000/api/v1/simulateur-pret \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "revenu_mensuel_net": 3000,
    "apport": 50000
  }'
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "capacite_emprunt": 181047.06,
    "mensualite": 1095.26,
    "cout_total_credit": 262862.82,
    "tableau_amortissement": [...]
  }
}
```

### Exemple 2: Tous les paramètres

```bash
curl -X POST http://localhost:5000/api/v1/simulateur-pret \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "revenu_mensuel_net": 4500,
    "apport": 100000,
    "taux_interet": 3.0,
    "duree_ans": 25,
    "taux_assurance": 0.35
  }'
```

### Exemple 3: Revenu bas

```bash
curl -X POST http://localhost:5000/api/v1/simulateur-pret \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "revenu_mensuel_net": 1500,
    "apport": 20000,
    "taux_interet": 4.5,
    "duree_ans": 15
  }'
```

---

## ❌ Codes d'Erreur

### 400 Bad Request

**Cause:** Données métier invalides (revenu négatif, etc.)

```json
{
  "status": "error",
  "message": "Revenu mensuel net doit être > 0 (reçu: -100)",
  "code": "INVALID_PARAMETERS"
}
```

### 401 Unauthorized

**Cause:** Token JWT manquant ou expiré

```json
{
  "status": "error",
  "message": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

### 422 Unprocessable Entity

**Cause:** Validation Pydantic échouée (type invalide, limite dépassée)

```json
{
  "status": "error",
  "message": "Validation échouée: ...",
  "code": "VALIDATION_ERROR"
}
```

Causes courantes:
- `revenu_mensuel_net` non fourni ou ≤ 0
- `apport` < 0
- `taux_interet` < 0 ou > 15
- `duree_ans` < 1 ou > 30
- Type incorrect (string au lieu de float, etc.)

### 500 Internal Server Error

**Cause:** Erreur serveur interne

```json
{
  "status": "error",
  "message": "Erreur serveur: ...",
  "code": "SERVER_ERROR"
}
```

---

## 🔧 Endpoint Complémentaire

### GET /api/v1/simulateur-pret/info

Retourne les paramètres par défaut et les limites. **Pas besoin d'authentification.**

#### Response (200 OK)

```json
{
  "status": "success",
  "defauts": {
    "taux_interet": 3.5,
    "duree_ans": 20,
    "taux_assurance": 0.3
  },
  "limites": {
    "taux_interet": {
      "min": 0,
      "max": 15
    },
    "duree_ans": {
      "min": 1,
      "max": 30
    },
    "taux_assurance": {
      "min": 0
    },
    "revenu_mensuel_net": {
      "min": 1
    },
    "apport": {
      "min": 0
    }
  },
  "ratio_capacite": 0.35,
  "message": "Utilise ces valeurs pour valider les inputs côté frontend"
}
```

#### Usage (cURL)

```bash
curl http://localhost:5000/api/v1/simulateur-pret/info
```

---

## 🔐 Sécurité

### Authentification JWT

Chaque requête `POST` doit inclure un bearer token valide:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Headers requis:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

### Rate Limiting

Pas de rate limiting implémenté pour MVP. À ajouter si besoin.

### CORS

Frontend sur `localhost:3000` peut appeler l'API via CORS.

---

## 📐 Formules Mathématiques

### 1. Capacité d'Emprunt

```
revenu_max_mensualite = revenu_mensuel_net × 0.35

taux_mensuel = taux_annuel / 100 / 12
nombre_mois = duree_ans × 12

capacite = revenu_max_mensualite × (1 - (1 + taux_mensuel)^(-nombre_mois)) / taux_mensuel
```

### 2. Mensualité

La mensualité est **constante** pendant toute la durée:

```
mensualite = revenu_mensuel_net × 0.35
```

(Ou moins si le capital emprunté le permet)

### 3. Assurance

L'assurance se calcule sur le capital initial:

```
assurance_annuelle = capital_emprunte × (taux_assurance / 100)
assurance_mensuelle = assurance_annuelle / 12
```

### 4. Coût Total du Crédit

```
cout_total = mensualite × nombre_mois
```

---

## 💾 Intégration Backend

### Service: `CalculatricePret`

La logique est dans `backend/src/services/simulateur_pret.py`:

```python
from src.services.simulateur_pret import CalculatricePret

result = CalculatricePret.calculer_pret(
    revenu_mensuel_net=3000,
    apport=50000,
    taux_interet=3.5,
    duree_ans=20,
    taux_assurance=0.3,
)

print(result["capacite_emprunt"])  # 181047.06
print(result["mensualite"])        # 1095.26
```

### Route: `backend/src/routes/simulateur_pret.py`

Blueprint Flask avec Pydantic validation et error handling.

### Tests: `backend/tests/test_simulateur_endpoint.py`

Tests d'intégration complets:
- 6 cas valides
- 8 cas invalides
- Endpoint info

---

## 🚀 Déploiement

### Variables d'Environnement

Aucune variable spécifique. Utilise la configuration Flask standard.

### Dépendances

```
pydantic>=2.11.2
flask
flask-jwt-extended
```

### Activation

1. Le blueprint est enregistré automatiquement dans `src/app.py`
2. Aucune configuration supplémentaire requise

---

## 📈 Performance

- **Temps de réponse:** < 50ms
- **Calcul:** Pur Python (pas d'appel DB)
- **Tableau:** 12 lignes max (léger)

---

## 🔄 Changelog

| Version | Date | Changements |
|---------|------|-------------|
| 1.0.0 | 2026-05-06 | Version initiale MVP - Pas de frais de dossier, arrondi 2 décimales |

---

## 📚 Ressources

- [Documentation simple (Gilbert)](./SIMULATEUR_PRETS.md)
- [Code source: simulateur_pret.py](../backend/src/services/simulateur_pret.py)
- [Tests: test_simulateur_pret.py](../backend/tests/test_simulateur_pret.py)
- [Tests endpoint: test_simulateur_endpoint.py](../backend/tests/test_simulateur_endpoint.py)

---

**Dernière mise à jour:** 2026-05-06
**Maintenance:** Immo2000 Team
