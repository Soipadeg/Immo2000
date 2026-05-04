# 📋 Annonces API - Schémas Pydantic

Documentation des modèles de validation Pydantic pour l'API Annonces.

---

## Vue d'Ensemble

Les schémas Pydantic assurent la validation des données lors de la création/modification des annonces. Tous les champs suivent les contraintes spécifiées.

---

## CreateAnnonce

**Utilisé pour :** POST /api/v1/annonces (création)

### Champs Obligatoires

| Champ | Type | Constraints | Description |
|-------|------|-----------|-------------|
| **titre** | string | 1-100 chars | Titre de l'annonce |
| **description** | string | 1-2000 chars | Description détaillée |
| **prix** | float | > 0 | Prix en euros |
| **surface** | float | > 0 | Surface en m² |
| **adresse** | string | 1-255 chars | Adresse complète |
| **code_postal** | string | regex ^[0-9]{5}$ | Code postal (5 chiffres) |
| **ville** | string | 1-100 chars | Ville |
| **type_bien** | enum | maison, appartement, terrain, local commercial | Type de bien |
| **nombre_pieces** | int | >= 1 | Nombre de pièces |

### Champs Optionnels

| Champ | Type | Default | Constraints | Description |
|-------|------|---------|-----------|-------------|
| **photos** | list[string] | [] | - | URLs des photos |
| **etage** | int | null | - | Numéro d'étage |
| **ascenseur** | bool | false | - | Présence ascenseur |
| **balcon** | bool | false | - | Présence balcon |
| **terrasse** | bool | false | - | Présence terrasse |
| **jardin** | bool | false | - | Présence jardin |
| **piscine** | bool | false | - | Présence piscine |
| **parking** | bool | false | - | Présence parking |
| **dpe** | enum | null | A-G | Classe énergétique |
| **annee_construction** | int | null | 1800-2100 | Année de construction |

### Validateurs

```python
# Code postal : doit être 5 chiffres
code_postal: "75002" ✓
code_postal: "ABCDE" ✗ (ValueError)
code_postal: "750" ✗ (ValueError)

# Photos : liste d'URLs nettoyée
photos: ["url1", "url2"] ✓
photos: "url1" ✗ (ValueError)
photos: ["url1", None, "url2"] → ["url1", "url2"] ✓
```

### Exemple JSON

```json
{
  "titre": "Maison 4 pièces à Paris",
  "description": "Belle maison lumineuse avec jardin",
  "prix": 500000.0,
  "surface": 120.5,
  "adresse": "12 rue de la Paix",
  "code_postal": "75002",
  "ville": "Paris",
  "type_bien": "maison",
  "nombre_pieces": 4,
  "photos": ["url1", "url2"],
  "etage": null,
  "ascenseur": false,
  "terrasse": true,
  "jardin": true,
  "dpe": "C",
  "annee_construction": 2010
}
```

---

## UpdateAnnonce

**Utilisé pour :** PUT /api/v1/annonces/{id} (mise à jour)

### Tous les Champs Optionnels

Tous les champs sont optionnels. Seuls les champs fournis sont mis à jour.

| Champ | Type | Constraints |
|-------|------|-----------|
| **titre** | string | 1-100 chars |
| **description** | string | 1-2000 chars |
| **prix** | float | > 0 |
| **surface** | float | > 0 |
| **adresse** | string | 1-255 chars |
| **code_postal** | string | regex ^[0-9]{5}$ |
| **ville** | string | 1-100 chars |
| **type_bien** | enum | maison, appartement, terrain, local commercial |
| **nombre_pieces** | int | >= 1 |
| **photos** | list[string] | - |
| **etage** | int | - |
| **ascenseur** | bool | - |
| **balcon** | bool | - |
| **terrasse** | bool | - |
| **jardin** | bool | - |
| **piscine** | bool | - |
| **parking** | bool | - |
| **dpe** | enum | A-G |
| **annee_construction** | int | 1800-2100 |
| **statut** | enum | brouillon, publiée, vendue, archivée |

### Exemple JSON

```json
{
  "prix": 480000.0,
  "description": "Maison rénovée avec piscine"
}
```

---

## AnnoncesResponse

**Utilisé pour :** Réponses GET, POST, PUT (single annonce)

### Champs Retournés

Tous les champs de CreateAnnonce + champs métadonnées.

| Champ | Type | Description |
|-------|------|-------------|
| **annonce_id** | int | ID unique (PK) |
| **titre** | string | Titre |
| **description** | string | Description |
| **prix** | float | Prix en euros |
| **surface** | float | Surface en m² |
| **adresse** | string | Adresse |
| **code_postal** | string | Code postal |
| **ville** | string | Ville |
| **type_bien** | string | Type de bien |
| **nombre_pieces** | int | Nombre de pièces |
| **utilisateur_id** | int | ID du créateur |
| **photos** | list[string] | URLs des photos |
| **etage** | int | Numéro d'étage |
| **ascenseur** | bool | Présence ascenseur |
| **balcon** | bool | Présence balcon |
| **terrasse** | bool | Présence terrasse |
| **jardin** | bool | Présence jardin |
| **piscine** | bool | Présence piscine |
| **parking** | bool | Présence parking |
| **dpe** | string | Classe énergétique |
| **annee_construction** | int | Année de construction |
| **statut** | string | Statut (brouillon, publiée, etc.) |
| **date_creation** | datetime | ISO 8601 format |
| **date_modification** | datetime | ISO 8601 format |

### Exemple JSON

```json
{
  "annonce_id": 1,
  "titre": "Maison 4 pièces à Paris",
  "description": "Belle maison lumineuse avec jardin",
  "prix": 500000.0,
  "surface": 120.5,
  "adresse": "12 rue de la Paix",
  "code_postal": "75002",
  "ville": "Paris",
  "type_bien": "maison",
  "nombre_pieces": 4,
  "utilisateur_id": 123,
  "photos": ["url1", "url2"],
  "etage": null,
  "ascenseur": false,
  "balcon": false,
  "terrasse": true,
  "jardin": true,
  "piscine": false,
  "parking": true,
  "dpe": "C",
  "annee_construction": 2010,
  "statut": "publiée",
  "date_creation": "2026-05-04T10:00:00",
  "date_modification": "2026-05-04T10:15:30"
}
```

---

## AnnoncesListResponse

**Utilisé pour :** GET /api/v1/annonces (list paginated)

### Champs

| Champ | Type | Description |
|-------|------|-------------|
| **items** | list[AnnoncesResponse] | Liste paginated |
| **total** | int | Nombre total de résultats |
| **skip** | int | Nombre ignorés (offset) |
| **limit** | int | Limite appliquée |

### Exemple JSON

```json
{
  "items": [
    {
      "annonce_id": 1,
      "titre": "Maison à Paris",
      ...
    },
    {
      "annonce_id": 2,
      "titre": "Appartement à Lyon",
      ...
    }
  ],
  "total": 42,
  "skip": 0,
  "limit": 20
}
```

---

## Énumérations

### TypeBienEnum

```python
"maison"           # Maison individuelle
"appartement"      # Appartement
"terrain"          # Terrain brut
"local commercial" # Usine, bureau, etc.
```

### StatutEnum

```python
"brouillon"   # Créée, non publiée
"publiée"     # Visible publiquement
"vendue"      # Transaction conclue
"archivée"    # Archivée par propriétaire
```

### DPEEnum

```python
"A"  # Très performant (< 50 kWh/m²/an)
"B"  # Performant (50-90)
"C"  # Normal (90-150)
"D"  # Moyen (150-210)
"E"  # Faible (210-290)
"F"  # Très faible (290-400)
"G"  # Extrêmement faible (> 400)
```

---

## Validations

### Validateurs Pydantic

#### code_postal

```python
@validator("code_postal")
def validate_code_postal(cls, v):
    if not re.match(r"^\d{5}$", v):
        raise ValueError("Code postal invalide (doit être 5 chiffres)")
    return v
```

Exemples :
- ✓ `"75002"` → Valid
- ✗ `"ABCDE"` → ValueError
- ✗ `"750"` → ValueError
- ✗ `"75 002"` → ValueError

#### prix & surface

```python
prix: float = Field(..., gt=0)      # > 0
surface: float = Field(..., gt=0)   # > 0
```

#### nombre_pieces

```python
nombre_pieces: int = Field(..., ge=1)  # >= 1
```

#### photos

```python
@validator("photos", pre=True, always=True)
def validate_photos(cls, v):
    if v is None:
        return []
    if not isinstance(v, list):
        raise ValueError("photos doit être une liste d'URLs")
    return [str(url) for url in v if url]
```

---

## Contraintes de Base de Données

### CheckConstraints (PostgreSQL)

```sql
CHECK (prix > 0)
CHECK (surface > 0)
CHECK (nombre_pieces >= 1)
CHECK (statut IN ('brouillon', 'publiée', 'vendue', 'archivée'))
CHECK (type_bien IN ('maison', 'appartement', 'terrain', 'local commercial'))
CHECK (dpe IS NULL OR dpe IN ('A', 'B', 'C', 'D', 'E', 'F', 'G'))
```

### Indexes

```sql
INDEX idx_ville (ville)
INDEX idx_code_postal (code_postal)
INDEX idx_type_bien (type_bien)
INDEX idx_utilisateur_id (utilisateur_id)
INDEX idx_ville_type_bien (ville, type_bien)
INDEX idx_utilisateur_statut (utilisateur_id, statut)
INDEX idx_code_postal_ville (code_postal, ville)
```

---

## ErrorResponse

**Format des réponses d'erreur.**

```json
{
  "error": "Validation error",
  "code": 400,
  "details": [
    {
      "loc": ["prix"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ]
}
```

---

**Pour les exemples d'utilisation**, voir [EXAMPLES.md](EXAMPLES.md) 💻
