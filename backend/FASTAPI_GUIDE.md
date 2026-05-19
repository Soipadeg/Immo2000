# 🚀 FastAPI Migration - Guide d'Utilisation

## Structure du Projet

```
backend/
├── app_fastapi/
│   ├── __init__.py
│   ├── config.py          # Settings (env vars, database, JWT, etc.)
│   ├── main.py            # FastAPI app + middlewares + routes
│   ├── models.py          # Pydantic validation models
│   ├── routes/
│   │   ├── health.py      # Health check
│   │   ├── offres.py      # Offers (+ JWT auth + DB query)
│   │   ├── transactions.py
│   │   ├── notaires.py
│   │   ├── paiements.py
│   │   └── documents.py
│   └── utils/
│       ├── auth.py        # JWT creation + verification + dependencies
│       ├── errors.py      # Custom exceptions + error responses
│       └── __init__.py
│
├── shared/
│   ├── __init__.py
│   └── database.py        # SQLAlchemy engine + SessionLocal + get_db()
│
├── src/
│   ├── models/            # SQLAlchemy models (Flask + FastAPI)
│   │   ├── offres.py      # Offre (ORM model)
│   │   ├── transactions.py
│   │   └── ...
│   └── ...
│
├── .env                   # Configuration (DATABASE_URL, SECRET_KEY, etc.)
└── requirements.txt       # Python dependencies (Flask + FastAPI)
```

---

## Démarrage de FastAPI

### En développement (avec reload):

```bash
cd backend
uvicorn app_fastapi.main:app --reload --port 8001
```

Puis accédez à:
- 📚 Swagger UI: http://localhost:8001/api/v1/docs
- 📚 ReDoc: http://localhost:8001/api/v1/redoc
- ✅ Health: http://localhost:8001/health

### En production:

```bash
cd backend
uvicorn app_fastapi.main:app --host 0.0.0.0 --port 8001 --workers 4
```

---

## Comment Utiliser les Dépendances

### 1️⃣ Récupérer la Base de Données

```python
from fastapi import Depends
from sqlalchemy.orm import Session
from shared.database import get_db

@router.get("/items")
async def get_items(db: Session = Depends(get_db)):
    items = db.query(Item).all()
    return items
```

### 2️⃣ Authentifier un Utilisateur

```python
from app_fastapi.utils.auth import get_current_user

@router.get("/me")
async def get_current_user_info(
    user: dict = Depends(get_current_user)
):
    # user = {"user_id": 123, "payload": {...}}
    return {
        "user_id": user["user_id"],
        "authenticated": True
    }
```

### 3️⃣ Vérifier un Rôle Spécifique

```python
from app_fastapi.utils.auth import get_current_notaire

@router.get("/dashboard")
async def notaire_dashboard(
    user: dict = Depends(get_current_notaire)
):
    # Seulement les notaires peuvent accéder
    return {"notaire_id": user["user_id"]}
```

### 4️⃣ Combiner les Dépendances

```python
from app_fastapi.utils.auth import get_current_user
from shared.database import get_db

@router.post("/offres")
async def create_offer(
    offer: OffreCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    # Créer une offre
    new_offer = Offre(
        acheteur_id=user["user_id"],
        montant=offer.montant,
        ...
    )
    db.add(new_offer)
    db.commit()
    return new_offer
```

---

## Pattern: Requête + Validation + Réponse

### Flux Complet

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app_fastapi.models import OffreCreate, OffreResponse  # Pydantic
from app_fastapi.utils.auth import get_current_user
from app_fastapi.utils.errors import NotFoundError
from shared.database import get_db
from src.models.offres import Offre  # SQLAlchemy

router = APIRouter()

@router.post("/offres", response_model=OffreResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer: OffreCreate,  # ✅ Pydantic validation automatique
    db: Session = Depends(get_db),  # ✅ Injection BD
    user: dict = Depends(get_current_user)  # ✅ Injection auth
):
    """
    1. OffreCreate valide le JSON entrant
    2. L'utilisateur est authentifié (JWT)
    3. On crée une ligne Offre en BD
    4. On retourne OffreResponse (conversion ORM → Pydantic)
    """

    # Créer l'offre
    new_offer = Offre(
        acheteur_id=user["user_id"],
        montant=float(offer.montant),
        message=offer.message,
        ...
    )

    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)  # Récupérer l'ID généré

    return new_offer  # ✅ Pydantic convertit automatiquement l'ORM
```

---

## Gestion des Erreurs

### Utiliser les Exceptions Personnalisées

```python
from app_fastapi.utils.errors import NotFoundError, ForbiddenError, ValidationError

# 404
if not offre:
    raise NotFoundError("Offre", offre_id)

# 403
if offre.acheteur_id != user["user_id"]:
    raise ForbiddenError("Vous n'êtes pas l'acheteur")

# 422
if offer.montant < 0:
    raise ValidationError(
        "Le montant doit être positif",
        details={"field": "montant", "value": offer.montant}
    )
```

### Réponse d'Erreur Standardisée

```json
{
  "status": "error",
  "error": "NOT_FOUND",
  "message": "Offre avec l'ID 999 non trouvé(e)"
}
```

---

## Configuration via .env

```bash
# App
DEBUG=True
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/immo2000

# FastAPI
FASTAPI_PORT=8001
FASTAPI_HOST=0.0.0.0

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Services
STRIPE_SECRET_KEY=sk_test_...
DOCUSIGN_CLIENT_ID=...
SENDGRID_API_KEY=...
```

---

## Tests avec curl

### Créer un token

```bash
curl -X POST http://localhost:8001/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"user@example.com","password":"password"}'
```

### Utiliser le token

```bash
curl http://localhost:8001/api/v1/offres/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Créer une offre

```bash
curl -X POST http://localhost:8001/api/v1/offres \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "annonce_id": 1,
    "montant": 300000.0,
    "message": "Offre sérieuse avec dossier complet"
  }'
```

---

## Performance & Optimisation

### SQLAlchemy Best Practices

1. **Eager Loading** (éviter N+1 queries):
```python
offres = db.query(Offre).options(
    joinedload(Offre.acheteur),
    joinedload(Offre.vendeur)
).all()
```

2. **Pagination**:
```python
skip = 0
limit = 10
offres = db.query(Offre).offset(skip).limit(limit).all()
```

3. **Filtrer**:
```python
offres = db.query(Offre).filter(
    Offre.statut == "proposee"
).all()
```

### Caching (TODO: à implémenter avec Redis)

```python
# @cached(ttl=300)  # Cache 5 minutes
@router.get("/offres/{offre_id}")
async def get_offre(offre_id: int):
    ...
```

---

## Prochaines Étapes

1. ✅ Config + DB + Auth
2. 🔄 **Implémenter les routes** (POST/PUT avec ORM)
3. ⏳ Webhooks (Stripe, DocuSign)
4. ⏳ Tests FastAPI (pytest)
5. ⏳ Déploiement (Docker + Nginx)

---

**Questions?** Vérifiez:
- [FastAPI docs](https://fastapi.tiangolo.com)
- [SQLAlchemy docs](https://docs.sqlalchemy.org)
- [PyJWT docs](https://pyjwt.readthedocs.io)
