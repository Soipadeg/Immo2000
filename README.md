# Immo2000 - Plateforme Immobilière

Plateforme complète de gestion immobilière avec authentification JWT, gestion d'annonces et administration.

---

## 🚀 Quick Start

### Développement (5 min)
```bash
# Backend
cd backend && pip install -r requirements.txt && python -m pytest

# Frontend
cd frontend && npm install && npm run dev
```

### Déploiement (15 min)
👉 **[Voir docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

---

## 📚 Documentation

**Tout est documenté dans [docs/](docs/)** - Voici les points d'entrée:

| Besoin | Lien |
|--------|------|
| Vue générale | [docs/INDEX.md](docs/INDEX.md) |
| Déploiement | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Audit & Validation | [docs/AUDIT.md](docs/AUDIT.md) |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Authentification JWT | [docs/auth/](docs/auth/) |
| Setup complet | [docs/setup/](docs/setup/) |

---

## Configuration

### 1. Clé API Melo

Copiez le fichier `.env.example` en `.env` et complétez votre clé API :

```bash
cp .env.example .env
```

Puis éditez `.env` :

```env
MELO_API_KEY=votre_cle_api_ici
```

Obtenir votre clé : https://www.melo.io/api

### 2. Dépendances

```bash
cd backend
pip install -r requirements.txt
```

---

## Utilisation Melo API

### Mode 1 : Estimation unique

```bash
python melo_api.py single \
  --adresse "123 Rue de Paris, 75000 Paris" \
  --surface 50 \
  --type appartement
```

### Mode 2 : Comparaison de biens

```bash
python melo_api.py compare biens_exemple.json --output output
```

### Mode 3 : Utilisation dans du code Python

```python
from melo_api import get_estimation_melo, compare_biens

result = get_estimation_melo(
    adresse="123 Rue de Paris, 75000 Paris",
    surface=50,
    type_bien="appartement"
)
```

---

## Structure du Projet

```
Immo2000/
├── README.md (vous êtes ici)
├── STRUCTURE.md
├── docs/                          <- DOCUMENTATION RÉORGANISÉE
│   ├── INDEX.md                  <- Point d'entrée principal
│   ├── ARCHITECTURE.md
│   ├── auth/                     <- Authentification JWT
│   │   ├── INDEX.md
│   │   ├── QUICKSTART_AUTH.md
│   │   ├── INTEGRATION.md
│   │   ├── JWT_REFERENCE.md
│   │   ├── APP_CONFIGURATION.md
│   │   ├── DIAGRAMS.md
│   │   ├── RATE_LIMITING_GUIDE.md
│   │   ├── SUMMARY.md
│   │   ├── FINAL_SUMMARY.md
│   │   └── VERIFICATION_COMPLETE.sh
│   └── setup/
│       └── FULL_INTEGRATION_TEST.sh
├── backend/
│   ├── src/
│   │   ├── auth/                <- JWT authentication
│   │   ├── routes/              <- Protected routes
│   │   ├── app.py
│   │   └── config.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── database/
├── frontend/
└── devops/
```

---

## Status

- [x] Authentification JWT complète
- [x] Documentation exhaustive (9 guides)
- [x] Tests (20+ cas)
- [ ] Modèles Bien & Estimation
- [ ] Rate limiting (optionnel)

---

## Notes de Réorganisation (2026-05-04)

La documentation a été réorganisée pour une meilleure maintenabilité :

**Avant** : 9 fichiers `.md` à la racine (trop de désordre)
**Après** : Tous les guides dans `docs/auth/` avec navigation claire

Les fichiers suivants ont été déplacés :
- `QUICKSTART_AUTH.md` → `docs/auth/QUICKSTART_AUTH.md`
- `AUTHENTICATION.md` → `docs/auth/JWT_REFERENCE.md`
- `AUTHENTICATION_DIAGRAMS.md` → `docs/auth/DIAGRAMS.md`
- `AUTH_SUMMARY.md` → `docs/auth/SUMMARY.md`
- `INTEGRATION_CHECKLIST_AUTH.md` → `docs/auth/INTEGRATION.md`
- `INTEGRATION_APP_FACTORY.md` → `docs/auth/APP_CONFIGURATION.md`
- `RATE_LIMITING_GUIDE.md` → `docs/auth/RATE_LIMITING_GUIDE.md`
- `FINAL_INTEGRATION_SUMMARY.md` → `docs/auth/FINAL_SUMMARY.md`
- `VERIFICATION_COMPLETE.sh` → `docs/auth/VERIFICATION_COMPLETE.sh`
- `FULL_INTEGRATION_TEST.sh` → `docs/setup/FULL_INTEGRATION_TEST.sh`

Les anciens fichiers à la racine peuvent être supprimés (voir MIGRATION_NOTES.md)

---

**Pour commencer** : [Lire docs/auth/QUICKSTART_AUTH.md](docs/auth/QUICKSTART_AUTH.md)
