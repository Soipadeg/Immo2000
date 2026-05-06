# Immo2000 - Navigation complète

Plateforme immobilière production-ready avec API Flask, authentification JWT, gestion complète des biens et intégrations avancées.

---

## 🎯 Démarrer rapidement

### Pour développeurs
```bash
cd backend
nano .env              # Configurer SMTP
pip install APScheduler
python3 quickstart.py  # Démarrer avec diags
```

👉 **Lire**: [docs/start/README.md](docs/start/README.md) (guide de navigation) → [README.md](README.md) (vue d'ensemble) → docs (détails techniques)

---

## 📚 Documentation par fonctionnalité

### 🔐 Core Features
| Feature | Doc | API | Status |
|---------|-----|-----|--------|
| **Authentification** | [AUTH.md](docs/core/AUTH.md) | `/auth/*` | ✅ Prod |
| **Annonces** | [ANNONCES.md](docs/core/ANNONCES.md) | `/api/v1/annonces` | ✅ Prod |
| **Biens** | [BIENS.md](docs/core/BIENS.md) | `/api/v1/biens` | ✅ Prod |
| **Visites** | [VISITES.md](docs/core/VISITES.md) | `/api/v1/visites` | ✅ Prod |
| **Feedback** | [FEEDBACK.md](docs/core/FEEDBACK.md) | `/api/v1/feedbacks` | ✅ Prod |

### ⚡ Advanced Features
| Feature | Doc | API | Status |
|---------|-----|-----|--------|
| **Estimations** | [ESTIMATION.md](docs/advanced/ESTIMATION.md) | `/api/v1/estimations` | ✅ MELO API |
| **Matching** | [MATCHING.md](docs/advanced/MATCHING.md) | `/api/v1/matching` | ✅ Intelligent |
| **Chatbot FAQ** | [CHATBOT.md](docs/advanced/CHATBOT.md) | `/api/v1/chatbot` | ✅ Live |

### 📡 Phases (A, B, C)
| Phase | Doc | Components | Status |
|-------|-----|------------|--------|
| **A: Email SMTP** | [EMAIL.md](docs/phases/EMAIL.md) | `email_service.py` | ✅ Complete |
| **B: APScheduler** | [SCHEDULER.md](docs/phases/SCHEDULER.md) | `scheduler.py` | ✅ Complete |
| **C: Dashboard Vendeur** | [FEEDBACK.md](docs/core/FEEDBACK.md) | Endpoint `/vendeur/feedbacks` | ✅ Complete |

---

## 📖 Documentation Architecture

### Pour commencer
1. **[README.md](README.md)** - Vue d'ensemble projet (3 min)
2. **[docs/reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md)** - Architecture système (10 min)
3. **Choisir votre rôle:**
   - 🔵 Acheteur → Lire: [docs/guides/guide_acheteur.md](docs/guides/guide_acheteur.md)
   - 🔴 Vendeur → Lire: [docs/guides/guide_vendre.md](docs/guides/guide_vendre.md)
   - ⚙️ Dev → Lire: [docs/core/AUTH.md](docs/core/AUTH.md) puis [docs/reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md)

### Pour les détails techniques
Sélectionner le fichier `.md` correspondant à votre besoin dans `docs/`:

```
docs/
├── start/               ← NOUVELLE: Démarrage
│   ├── INDEX.md         ← Navigation
│   └── PHASES.md        ← Phases A/B/C overview
├── core/                ← NOUVELLE: Features essentielles
│   ├── AUTH.md
│   ├── ANNONCES.md
│   ├── BIENS.md
│   ├── VISITES.md
│   └── FEEDBACK.md
├── advanced/            ← NOUVELLE: Features avancées
│   ├── ESTIMATION.md
│   ├── MATCHING.md
│   └── CHATBOT.md
├── phases/              ← NOUVELLE: Phases A, B, C
│   ├── EMAIL.md         ← Phase A: SMTP emails
│   ├── SCHEDULER.md     ← Phase B: APScheduler
│   └── IMPLEMENTATION_A_B_C_COMPLETE.md
├── reference/           ← NOUVELLE: Référence technique
│   ├── ARCHITECTURE.md
│   ├── MVP_PHASE1_API.md
│   ├── AUDIT.md
│   └── ...
├── deploy/              ← NOUVELLE: Déploiement
│   ├── DEPLOYMENT.md
│   └── MVP_PHASE1_SETUP.md
├── guides/              ← Guides utilisateurs
├── legal/               ← Légal & CGU
├── faq/                 ← FAQs
├── auth/                ← Guides détaillés auth
├── annonces/            ← Guides détaillés annonces
├── chatbot/             ← Datasets
├── modeles/             ← Templates
├── outils/              ← Tools
└── setup/               ← Installation
```

---

## 🚀 Déploiement

### Mode développement
```bash
cd backend
python3 quickstart.py   # Avec diags
# ou
python3 run_server.py   # Classique
```

### Mode production
```bash
# Voir: docs/deploy/DEPLOYMENT.md
```

---

## 🧪 Tests

### Tests intégration (Phases A-B-C)
```bash
cd backend
python3 test_email_integration.py
```

### Tests unitaires
```bash
cd backend
pytest tests/ -v
```

---

## 🔍 Navigation rapide

### Par rôle utilisateur

**Je suis acheteur** →
- [docs/guides/guide_acheteur.md](docs/guides/guide_acheteur.md) - Guide complet
- [docs/core/AUTH.md](docs/core/AUTH.md) - Créer compte
- [docs/core/ANNONCES.md](docs/core/ANNONCES.md) - Rechercher biens
- [docs/core/VISITES.md](docs/core/VISITES.md) - Programmer visite
- [docs/core/FEEDBACK.md](docs/core/FEEDBACK.md) - Donner avis

**Je suis vendeur** →
- [docs/guides/guide_vendre.md](docs/guides/guide_vendre.md) - Guide complet
- [docs/core/ANNONCES.md](docs/core/ANNONCES.md) - Créer annonce
- [docs/core/BIENS.md](docs/core/BIENS.md) - Estimer bien
- [docs/core/VISITES.md](docs/core/VISITES.md) - Gérer visites
- [docs/core/FEEDBACK.md](docs/core/FEEDBACK.md) - Voir avis reçus

**Je suis développeur** →
- [docs/reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md) - Architecture
- [docs/reference/MVP_PHASE1_API.md](docs/reference/MVP_PHASE1_API.md) - Endpoints complets
- [docs/deploy/MVP_PHASE1_SETUP.md](docs/deploy/MVP_PHASE1_SETUP.md) - Setup dev
- [docs/deploy/DEPLOYMENT.md](docs/deploy/DEPLOYMENT.md) - Déployer
- Docs spécifiques: [docs/core/AUTH.md](docs/core/AUTH.md) → [docs/core/ANNONCES.md](docs/core/ANNONCES.md) → etc.

---

## 📋 Listes des endpoints

### Voir tous les endpoints
→ [docs/reference/MVP_PHASE1_API.md](docs/reference/MVP_PHASE1_API.md) - Référence API complète

### Groupés par module
- Authentification: [docs/core/AUTH.md](docs/core/AUTH.md#endpoints)
- Annonces: [docs/core/ANNONCES.md](docs/core/ANNONCES.md#endpoints-principaux)
- Biens: [docs/core/BIENS.md](docs/core/BIENS.md#endpoints)
- Visites: [docs/core/VISITES.md](docs/core/VISITES.md#endpoints)
- Feedback: [docs/core/FEEDBACK.md](docs/core/FEEDBACK.md#endpoints)

---

## 🛠️ Configuration

### Variables d'environnement
Copier `.env.example` → `.env` et configurer:
```bash
# Authentification
JWT_SECRET_KEY=your_secret_min_32_chars

# Email (Phase A)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=noreply@immo2000.fr
EMAIL_PASSWORD=app_password_16_chars

# Database
DATABASE_URL=sqlite:///immo2000.db

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 📚 Guides spécialisés

| Guide | Contenu |
|-------|---------|
| [docs/guides/guide_acheteur.md](docs/guides/guide_acheteur.md) | Tout pour acheteur |
| [docs/guides/guide_vendre.md](docs/guides/guide_vendre.md) | Tout pour vendeur |
| [docs/legal/cgu.md](docs/legal/cgu.md) | Conditions générales |
| [docs/legal/politique_confidentialite.md](docs/legal/politique_confidentialite.md) | GDPR & privacy |
| [docs/outils/checklist_achat.md](docs/outils/checklist_achat.md) | Checklist achat |

---

## 🔒 Sécurité

| Aspect | Doc | Status |
|--------|-----|--------|
| JWT Authentication | [AUTH.md](docs/AUTH.md) | ✅ Secure |
| SMTP STARTTLS | [EMAIL.md](docs/EMAIL.md) | ✅ Encrypted |
| Password hashing | [AUTH.md](docs/AUTH.md) | ✅ bcrypt |
| SQL Injection | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | ✅ SQLAlchemy ORM |
| GDPR compliance | [docs/legal/](docs/legal/) | ✅ Compliant |

---

## 📊 Statistiques

```
Backend:
  - Flask 3.0.0 avec 15+ endpoints
  - SQLAlchemy ORM avec 8+ models
  - Services: email, scheduler, matching
  - Tests: 15+ unitaires

Frontend:
  - React/Vite
  - Components: auth, annonces, visites, feedback

Phases récentes:
  - Phase A: SMTP email integration (250 lignes)
  - Phase B: APScheduler (300 lignes)
  - Phase C: Dashboard vendeur (200 lignes)
```

---

## 🆘 Support & Troubleshooting

### Problèmes courants
- **"SMTP not configured"** → [EMAIL.md](docs/EMAIL.md)
- **"Token expired"** → [AUTH.md](docs/AUTH.md)
- **"Scheduler not running"** → [SCHEDULER.md](docs/SCHEDULER.md)
- **"APScheduler not found"** → [SCHEDULER.md](docs/SCHEDULER.md)

---

**Version**: 2.0.0
**Last Updated**: May 6, 2026
**Status**: 🟢 Production Ready
