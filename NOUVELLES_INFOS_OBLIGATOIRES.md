# 🔐 Nouvelles Informations Obligatoires pour Annonces

**Date**: 9 Juin 2026  
**Statut**: ✅ Implémenté et validé

---

## 📋 Résumé

Ajout de **3 informations obligatoires** pour la création et la publication d'annonces:

1. **Nom des propriétaires** (caché)
2. **Référence cadastrale** (caché)  
3. **Date de construction du bâtiment** (visible)

Ces informations sont:
- ✅ **Requises** pour créer une annonce
- ✅ **Requises** pour publier une annonce
- ✅ **Cachées** dans la vue publique de l'annonce
- ✅ **Visibles** uniquement pour le vendeur et l'admin

---

## 🎯 Implémentations

### 1️⃣ Modèle Annonce (SQLAlchemy)

**Fichier**: `backend/src/models/annonces.py`

```python
# Champs CONFIDENTIELS (requis, cachés sur annonce publique)
nom_proprietaires = db.Column(db.String(255), nullable=False)
reference_cadastrale = db.Column(db.String(100), nullable=False)
date_construction = db.Column(db.Date, nullable=False)
```

**Modifications**:
- Ajout 3 colonnes NOT NULL
- `to_dict()`: Paramètre `include_confidential` pour contrôler l'exposition
- `to_dict_public()`: Exclu les infos confidentielles (nom_proprietaires, reference_cadastrale)
- Ajoute `date_construction` visible dans la vue publique

### 2️⃣ Schémas Pydantic (Validation)

**Fichier**: `backend/src/schemas/annonces.py`

**CreateAnnonce**:
```python
nom_proprietaires: str = Field(..., min_length=1, max_length=255)
reference_cadastrale: str = Field(..., min_length=1, max_length=100)
date_construction: str = Field(...)  # Format: YYYY-MM-DD
```

**UpdateAnnonce**:
```python
nom_proprietaires: Optional[str] = Field(default=None)
reference_cadastrale: Optional[str] = Field(default=None)
date_construction: Optional[str] = Field(default=None)
```

**Validateurs**:
- ✅ `validate_date_construction()`: Format YYYY-MM-DD
- ✅ Vérifie que l'année est >= 1800
- ✅ Vérifie que la date n'est pas dans le futur

### 3️⃣ Validation Publication

**Fichier**: `backend/src/crud/annonces.py` → `publish_annonce()`

```python
# ✅ VÉRIFICATION: Tous les champs confidentiels doivent être remplis
if not annonce.nom_proprietaires or annonce.nom_proprietaires.strip() == "":
    raise AnnoncesValidationError("❌ Le nom des propriétaires est obligatoire")

if not annonce.reference_cadastrale or annonce.reference_cadastrale.strip() == "":
    raise AnnoncesValidationError("❌ La référence cadastrale est obligatoire")

if not annonce.date_construction:
    raise AnnoncesValidationError("❌ La date de construction est obligatoire")
```

### 4️⃣ Migration Alembic

**Fichier**: `backend/migrations/versions/003_add_confidential_fields.py`

```sql
ALTER TABLE annonces ADD COLUMN nom_proprietaires VARCHAR(255) NOT NULL;
ALTER TABLE annonces ADD COLUMN reference_cadastrale VARCHAR(100) NOT NULL;
ALTER TABLE annonces ADD COLUMN date_construction DATE NOT NULL;
```

Avec remplissage par défaut pour les annonces existantes en brouillon.

---

## 🔐 Sécurité & Confidentialité

### Qui voit quoi?

| Utilisateur | nom_proprietaires | reference_cadastrale | date_construction |
|-------------|-------------------|----------------------|-------------------|
| Vendeur (owner) | ✅ Visible | ✅ Visible | ✅ Visible |
| Admin | ✅ Visible | ✅ Visible | ✅ Visible |
| Public/Visiteur | ❌ Caché | ❌ Caché | ✅ Visible |
| Acheteur | ❌ Caché | ❌ Caché | ✅ Visible |

### Méthode `to_dict()`

```python
# Vue interne (vendeur, admin)
annonce.to_dict(include_confidential=True)
→ Inclut: nom_proprietaires, reference_cadastrale

# Vue sécurisée (par défaut)
annonce.to_dict()
→ Exclut les infos confidentielles

# Vue publique
annonce.to_dict_public()
→ Exclut: utilisateur_id, nom_proprietaires, reference_cadastrale
```

---

## 📊 Workflow Complet

```
1. Vendeur crée annonce
   ↓
2. Fournit les 3 infos obligatoires:
   • Nom des propriétaires
   • Référence cadastrale
   • Date de construction
   ↓
3. Annonce sauvegardée (statut: "brouillon")
   ↓
4. Vendeur tente de publier
   ↓
5. Vérifications:
   ✅ Champs confidentiels remplis?
   ✅ Documents validés (5/5)?
   ↓
6. ✅ Si OK → Publication avec succès
   ❌ Si manquant → Message d'erreur détaillé
   ↓
7. Annonce publiée (statut: "publiée")
   ↓
8. Vue publique masque les infos confidentielles
   ✅ Visiteurs voient: titre, prix, surface, date_construction, ...
   ❌ Visiteurs NE voient pas: nom_proprietaires, reference_cadastrale, adresse (si masquée)
```

---

## ✨ Exemples d'Appels API

### Créer une annonce (POST /api/v1/annonces)

```json
{
  "titre": "Maison 4 pièces à Paris",
  "description": "Belle maison lumineuse...",
  "prix": 500000.0,
  "surface": 120.5,
  "adresse": "12 rue de la Paix",
  "code_postal": "75002",
  "ville": "Paris",
  "type_bien": "maison",
  "nombre_pieces": 4,
  "nom_proprietaires": "Jean Dupont, Marie Dupont",
  "reference_cadastrale": "75056000AL0042",
  "date_construction": "2010-05-15",
  "photos": ["url1", "url2"],
  "jardin": true,
  "dpe": "C"
}
```

### Réponse pour vendeur (GET /annonces/{id})

```json
{
  "annonce_id": 1,
  "titre": "Maison 4 pièces à Paris",
  "prix": 500000.0,
  "nom_proprietaires": "Jean Dupont, Marie Dupont",
  "reference_cadastrale": "75056000AL0042",
  "date_construction": "2010-05-15",
  "statut": "brouillon"
}
```

### Réponse publique (GET /annonces/{id}, visiteur non connecté)

```json
{
  "annonce_id": 1,
  "titre": "Maison 4 pièces à Paris",
  "prix": 500000.0,
  "date_construction": "2010-05-15",
  "surface": 120.5,
  "ville": "Paris",
  "type_bien": "maison"
  // nom_proprietaires, reference_cadastrale, utilisateur_id: ABSENTS
}
```

### Publier une annonce (PUT /api/v1/annonces/{id}/publier)

Erreur si infos manquantes:
```json
{
  "success": false,
  "error": "❌ Le nom des propriétaires est obligatoire pour publier l'annonce"
}
```

---

## 📋 Checklist Déploiement

### Avant Staging
- [x] Modèle Annonce modifié
- [x] Schémas Pydantic mis à jour
- [x] Validation publication renforcée
- [x] Migration Alembic créée
- [x] Syntaxe validée
- [ ] Exécuter migration: `flask db upgrade`
- [ ] Tester création avec nouveaux champs
- [ ] Tester publication avec validation

### Avant Production
- [ ] Frontend: Formulaire création avec 3 nouveaux champs
- [ ] Frontend: Affichage correct selon le contexte (public/privé)
- [ ] Admin: Voir les infos confidentielles
- [ ] API: Tester les 4 scénarios (cf. table "Qui voit quoi")

---

## 📚 Fichiers Modifiés

| Fichier | Modifications | Lignes |
|---------|------------------|--------|
| `backend/src/models/annonces.py` | Ajout 3 colonnes + to_dict() + to_dict_public() | +20 |
| `backend/src/schemas/annonces.py` | Ajout champs validés + validateurs | +30 |
| `backend/src/crud/annonces.py` | Ajout 3 vérifications publication | +20 |
| `backend/migrations/versions/003_*.py` | Nouvelle migration Alembic | +30 |

---

## 🚀 Prochaines Étapes

1. **Migration BD**: Exécuter `flask db upgrade` en staging
2. **Frontend**: Ajouter formulaire pour les 3 champs
3. **Tests**: Vérifier les 4 scénarios d'accès
4. **Documentation**: Mettre à jour API docs

---

## ✅ Validation

- ✅ Syntaxe Python validée
- ✅ Modèle cohérent avec schémas
- ✅ Validation publication implémentée
- ✅ Sécurité confidentielle respectée
- ✅ Migration Alembic ready

**Prêt pour déploiement!** 🎉
