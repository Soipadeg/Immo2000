# Architecture Utilisateur Unifiée

> **Date**: Mai 2026
> **Status**: ✅ Implémentée
> **Impact**: Simplifie modèle de données, élimine la duplication, améliore performance

---

## 📖 Vue d'ensemble

### Avant (Séparé)
```
User (authentification)
├── utilisateur_id
├── email
├── mot_de_passe_hash
├── nom, prenom
└── role

Acheteur (critères de recherche)
├── acheteur_id → FK utilisateur_id
├── budget_max
├── ville_recherchee
├── surface_min
└── ...
```

**Problèmes** ❌:
- 2 tables, 2 PKs, joins obligatoires
- Relations N:N potentielles complexes
- Duplication de logique
- Performance : JOIN systématique pour critères

---

### Après (Unifié) ✨
```
User (une seule source de vérité)
├── utilisateur_id
├── email, mot_de_passe_hash
├── nom, prenom, role
├── Buyer Criteria (optionnels)
│   ├── budget_max
│   ├── ville_recherchee
│   ├── surface_min
│   ├── type_bien_recherche
│   ├── nombre_pieces_min
│   └── dpe_ideale
├── OAuth & Auth
│   ├── google_id, facebook_id, apple_id
│   ├── email_verified, verification_token
│   └── requires_2fa, two_fa_code
└── Métadonnées
    ├── date_inscription
    ├── date_derniere_connexion
    └── updated_at
```

**Avantages** ✅:
- 1 table, 1 PK, pas de JOIN
- Tous les critères nullable → flexibilité
- Utilisateur peut être vendeur ET acheteur
- Évolutif : ajouter critères = 1 colonne
- Performance : accès direct sans JOIN

---

## 🗂️ Schéma de la Table

### Colonnes de la Table `utilisateurs`

#### 🔐 Authentification
```sql
utilisateur_id         SERIAL PRIMARY KEY
email                  VARCHAR(255) UNIQUE NOT NULL
mot_de_passe_hash      VARCHAR(255) NOT NULL
auth_method            ENUM ('email', 'google', 'facebook', 'apple')
```

#### 👤 Profil Utilisateur
```sql
nom                    VARCHAR(100) NOT NULL
prenom                 VARCHAR(100) NOT NULL
telephone              VARCHAR(20)
adresse_contact        VARCHAR(255)
photo_url              VARCHAR(500)
role                   VARCHAR(50) DEFAULT 'user'
actif                  BOOLEAN DEFAULT true
```

#### 🏠 Critères d'Achat (Tous NULL par défaut)
```sql
budget_max             INTEGER  -- € maximum
ville_recherchee       VARCHAR(100)  -- Localisation préférée
surface_min            INTEGER  -- m² minimum
type_bien_recherche    VARCHAR(50)  -- appartement|maison|terrain|commercial
nombre_pieces_min      INTEGER  -- Nombre minimum de pièces
dpe_ideale             VARCHAR(10)  -- A, B, C, D, E, F, G
```

#### 🔑 Vérification Email & 2FA
```sql
email_verified         BOOLEAN DEFAULT false
verification_token     TEXT
verification_token_expires TIMESTAMPTZ

requires_2fa           BOOLEAN DEFAULT false
two_fa_code            VARCHAR(10)
two_fa_code_expires    TIMESTAMPTZ
```

#### 🔄 Reset de Mot de Passe
```sql
reset_token            TEXT
reset_token_expires    TIMESTAMPTZ
```

#### 🌐 OAuth Integration
```sql
google_id              VARCHAR(255) UNIQUE
facebook_id            VARCHAR(255) UNIQUE
apple_id               VARCHAR(255) UNIQUE
```

#### ⏰ Audit Trail
```sql
date_inscription       TIMESTAMPTZ DEFAULT NOW()
date_derniere_connexion TIMESTAMPTZ
updated_at             TIMESTAMPTZ DEFAULT NOW()
```

---

## 🔄 Migration depuis l'Ancien Modèle

### Étapes d'Migration Exécutées

1. **Migration 020** : Ajout colonnes buyer criteria
```sql
ALTER TABLE utilisateurs ADD COLUMN budget_max INTEGER;
ALTER TABLE utilisateurs ADD COLUMN ville_recherchee VARCHAR(100);
ALTER TABLE utilisateurs ADD COLUMN surface_min INTEGER;
ALTER TABLE utilisateurs ADD COLUMN type_bien_recherche VARCHAR(50);
ALTER TABLE utilisateurs ADD COLUMN nombre_pieces_min INTEGER;
ALTER TABLE utilisateurs ADD COLUMN dpe_ideale VARCHAR(10);
```

2. **Migration 021** : Ajout colonnes auth manquantes
```sql
ALTER TABLE utilisateurs ADD COLUMN google_id VARCHAR(255);
ALTER TABLE utilisateurs ADD COLUMN facebook_id VARCHAR(255);
ALTER TABLE utilisateurs ADD COLUMN apple_id VARCHAR(255);
-- ... email_verified, verification_token, etc.
```

3. **Code Refactoring** :
   - ✅ Suppression de `acheteurs.py` model
   - ✅ Mise à jour des routes (matching, visites)
   - ✅ Refactorisation des services (VisitesService, etc.)
   - ✅ Correction des FK dans Visite et Feedback

### Migration des Données (Production)

```sql
-- Migrate existing acheteurs to utilisateurs
INSERT INTO utilisateurs (
    email, nom, prenom, role,
    budget_max, ville_recherchee, surface_min,
    type_bien_recherche, nombre_pieces_min, dpe_ideale
)
SELECT
    a.email, a.nom, a.prenom, 'user',
    a.budget_max, a.ville_recherchee, a.surface_min,
    a.type_bien_recherche, a.nombre_pieces_min, a.dpe_ideale
FROM acheteurs a
LEFT JOIN utilisateurs u ON u.email = a.email
WHERE u.utilisateur_id IS NULL;  -- Don't duplicate
```

---

## 💻 Utilisation dans le Code

### Modèle Python (SQLAlchemy)

```python
from src.auth.models import User

# Créer un utilisateur acheteur
buyer = User(
    email="marie@example.com",
    nom="Dupont",
    prenom="Marie",
    role="user"  # Tous les utilisateurs ont le rôle 'user'
)
buyer.set_password("SecurePass123!")

# Définir critères d'achat
buyer.budget_max = 350000
buyer.ville_recherchee = "Paris"
buyer.surface_min = 60
buyer.type_bien_recherche = "appartement"
buyer.nombre_pieces_min = 2
buyer.dpe_ideale = "B"

db.session.add(buyer)
db.session.commit()

# Accéder aux critères
print(f"Budget max: {buyer.budget_max}")
print(f"Ville: {buyer.ville_recherchee}")
```

### Endpoint d'Inscription

```python
# POST /auth/register
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Tous les champs sauf email/password sont optionnels
    user = User(
        email=data['email'],
        nom=data.get('nom', ''),
        prenom=data.get('prenom', ''),
        role="user"  # Always 'user' on registration
    )
    user.set_password(data['password'])

    # Critères optionnels (peuvent être mis à jour plus tard)
    if 'budget_max' in data:
        user.budget_max = data['budget_max']
    if 'ville_recherchee' in data:
        user.ville_recherchee = data['ville_recherchee']
    # ... etc.

    db.session.add(user)
    db.session.commit()
    return {"user_id": user.utilisateur_id}, 201
```

### Matching Query (Simplifié)

```python
# Avant : JOIN obligatoire
# Après : Requête directe sur User

from src.auth.models import User
from src.models.annonces import Annonce

# Obtenir users avec critères pour Paris
buyers_paris = User.query.filter(
    User.ville_recherchee == "Paris",
    User.budget_max > 200000
).all()

# Matcher chaque buyer avec annonces
for buyer in buyers_paris:
    matching_annonces = Annonce.query.filter(
        Annonce.ville == buyer.ville_recherchee,
        Annonce.prix <= buyer.budget_max,
        Annonce.type_bien == buyer.type_bien_recherche  # or type_bien_recherche is None
    ).all()

    # Calculate scores...
```

---

## 📊 Sérialisation JSON

### to_dict() avec Buyer Criteria

```python
user_data = user.to_dict()
# Retourne :
{
    "utilisateur_id": 1,
    "email": "marie@example.com",
    "nom": "Dupont",
    "prenom": "Marie",
    "role": "user",
    # Buyer criteria (null si non définis)
    "budget_max": 350000,
    "ville_recherchee": "Paris",
    "surface_min": 60,
    "type_bien_recherche": "appartement",
    "nombre_pieces_min": 2,
    "dpe_ideale": "B",
    # ...other fields
}
```

---

## 🔗 Impacts sur les Relations

### Foreign Keys Mises à Jour

```python
# Visite model
class Visite(db.Model):
    visite_id = db.Column(db.Integer, primary_key=True)

    # ✅ Updated: acheteur_id → utilisateurs.utilisateur_id
    acheteur_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False
    )

    # ... other fields

# Feedback model
class Feedback(db.Model):
    feedback_id = db.Column(db.Integer, primary_key=True)

    # ✅ Updated: acheteur_id → utilisateurs.utilisateur_id
    acheteur_id = db.Column(
        db.Integer,
        ForeignKey("utilisateurs.utilisateur_id", ondelete="CASCADE"),
        nullable=False
    )
```

---

## ✅ Avantages de l'Architecture Unifiée

### Performance 🚀
- Pas de JOIN systématique
- Requêtes plus simples et rapides
- Cache-friendly (1 table au lieu de 2)

### Flexibilité 🎯
- Tous les champs optionnels (nullable)
- Utilisateur peut être acheteur ET vendeur
- Facile d'ajouter nouveaux critères

### Maintenabilité 🔧
- Une seule table à gérer
- Logique consolidée
- Moins de duplications
- Plus facile à auditer

### Scalabilité 📈
- Structure extensible
- Pas de limitation théorique
- Évolutif pour 100k+ users

---

## 🚀 Améliorations Futures

1. **Indexation** : Ajouter indexes sur critères fréquent
```sql
CREATE INDEX idx_user_ville_budget
ON utilisateurs(ville_recherchee, budget_max);
```

2. **Search Avancée** : Full-text search sur ville
```python
from sqlalchemy import or_
users = User.query.filter(
    or_(
        User.ville_recherchee.ilike(f"%{search_term}%"),
        User.type_bien_recherche.ilike(f"%{search_term}%")
    )
).all()
```

3. **Sauvegarde Récent Critères** : JSON field pour historique
```python
recent_searches = db.Column(db.JSON)  # [{date, criteria}, ...]
```

4. **Préférences Secondaires** : Champs optionnels supplémentaires
```python
ascenseur_souhaite = db.Column(db.Boolean)
jardin_souhaite = db.Column(db.Boolean)
piscine_souhaitee = db.Column(db.Boolean)
# ... etc
```

---

## 📚 Références

- [Schema Diagram](../database/SCHEMA_DIAGRAM.md)
- [Matching Algorithm](./MATCHING.md)
- [User Model Tests](../../backend/tests/test_auth.py)
- [Migrations](../../backend/src/migrations/)
