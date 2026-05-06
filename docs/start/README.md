# 🎯 Immo2000 Documentation - Démarrage

Bienvenue dans la documentation du projet Immo2000!

---

## 📍 Vous êtes où?

Lisez ce fichier si vous cherchez à **comprendre l'organisation de la documentation**.

---

## 🗂️ Structure de la documentation

La documentation est organisée en **6 sections principales** + **dossiers spécialisés**:

### 📍 **START/** (vous êtes ici)
- **PHASES.md** - Vue d'ensemble des Phases A, B, C

### 🔐 **CORE/**
Documentation des 5 fonctionnalités essentielles:
- **AUTH.md** - Authentification JWT
- **ANNONCES.md** - Gestion annonces
- **BIENS.md** - Gestion biens
- **VISITES.md** - Gestion visites & calendrier
- **FEEDBACK.md** - Feedback & Dashboard vendeur

### ⚡ **ADVANCED/**
Features avancées optionnelles:
- **ESTIMATION.md** - Estimations MELO
- **MATCHING.md** - Algorithme matching
- **CHATBOT.md** - Chatbot FAQ

### 📡 **PHASES/**
Documentation détaillée des Phases A, B, C:
- **EMAIL.md** - Phase A: SMTP emails
- **SCHEDULER.md** - Phase B: APScheduler
- **IMPLEMENTATION_A_B_C_COMPLETE.md** - Détails complets

### 🔧 **REFERENCE/**
Documentation technique:
- **ARCHITECTURE.md** - Architecture globale
- **MVP_PHASE1_API.md** - Tous les endpoints
- **AUDIT.md** - Sécurité & audit
- + autres références techniques

### 🚀 **DEPLOY/**
Déploiement & configuration:
- **DEPLOYMENT.md** - Guide déploiement
- **MVP_PHASE1_SETUP.md** - Setup développement

### 👥 **GUIDES/** (dossier existant)
Guides pour utilisateurs finaux:
- guide_acheteur.md
- guide_vendre.md
- etc.

### ⚖️ **LEGAL/** (dossier existant)
Documents légaux:
- cgu.md
- politique_confidentialite.md
- etc.

---

## 🎯 Par cas d'usage

### 👤 Je suis acheteur
1. Lire: [../guides/guide_acheteur.md](../guides/guide_acheteur.md)
2. Pour question technique: Voir [../core/AUTH.md](../core/AUTH.md), [../core/ANNONCES.md](../core/ANNONCES.md), etc.

### 💼 Je suis vendeur
1. Lire: [../guides/guide_vendre.md](../guides/guide_vendre.md)
2. Pour dashboard: Voir [../core/FEEDBACK.md](../core/FEEDBACK.md)
3. Pour estimations: Voir [../advanced/ESTIMATION.md](../advanced/ESTIMATION.md)

### 👨‍💻 Je suis développeur
1. **Commencer**: Lire [../reference/ARCHITECTURE.md](../reference/ARCHITECTURE.md)
2. **Features essentielles**: Lire [../core/AUTH.md](../core/AUTH.md) → [../core/ANNONCES.md](../core/ANNONCES.md) → ...
3. **Setup dev**: Voir [../deploy/MVP_PHASE1_SETUP.md](../deploy/MVP_PHASE1_SETUP.md)
4. **Endpoints**: Voir [../reference/MVP_PHASE1_API.md](../reference/MVP_PHASE1_API.md)
5. **Phases A/B/C**: Lire [PHASES.md](PHASES.md)
6. **Déployer**: Voir [../deploy/DEPLOYMENT.md](../deploy/DEPLOYMENT.md)

### 🚀 Je suis DevOps
1. [../deploy/DEPLOYMENT.md](../deploy/DEPLOYMENT.md) - Guide complet
2. [../deploy/MVP_PHASE1_SETUP.md](../deploy/MVP_PHASE1_SETUP.md) - Configuraiton
3. [../reference/ARCHITECTURE.md](../reference/ARCHITECTURE.md) - Infrastructure

---

## 🌍 Navigation rapide

| Besoin | Chemin |
|--------|--------|
| Accès principal | 📍 [../../INDEX.md](../../INDEX.md) |
| Phases A/B/C | [PHASES.md](PHASES.md) |
| Authentification | [../core/AUTH.md](../core/AUTH.md) |
| Annonces | [../core/ANNONCES.md](../core/ANNONCES.md) |
| Visites | [../core/VISITES.md](../core/VISITES.md) |
| Feedback | [../core/FEEDBACK.md](../core/FEEDBACK.md) |
| Biens | [../core/BIENS.md](../core/BIENS.md) |
| Estimations | [../advanced/ESTIMATION.md](../advanced/ESTIMATION.md) |
| Matching | [../advanced/MATCHING.md](../advanced/MATCHING.md) |
| Chatbot | [../advanced/CHATBOT.md](../advanced/CHATBOT.md) |
| Email (Phase A) | [../phases/EMAIL.md](../phases/EMAIL.md) |
| Scheduler (Phase B) | [../phases/SCHEDULER.md](../phases/SCHEDULER.md) |
| Architecture | [../reference/ARCHITECTURE.md](../reference/ARCHITECTURE.md) |
| API Endpoints | [../reference/MVP_PHASE1_API.md](../reference/MVP_PHASE1_API.md) |
| Déploiement | [../deploy/DEPLOYMENT.md](../deploy/DEPLOYMENT.md) |

---

## 💡 Tips de navigation

- **Page d'accueil**: Retour à [../../INDEX.md](../../INDEX.md)
- **Liens croisés**: Chaque `.md` a des liens vers les docs associées
- **Code**: Consultez les commentaires dans `backend/src/`
- **Tests**: `backend/tests/` pour comprendre les fonctionnalités

---

## ✨ Quoi de neuf dans cette structure?

Avant, la documentation était dispersée dans 27 fichiers à la racine de `docs/`.
Maintenant, elle est **organisée logiquement** en 6 sections:

```
Avant:  27 fichiers .md à la racine = confus 😕
Après:  6 dossiers logiques + dossiers spécialisés = clair! 🎯
```

---

## 🚀 Prochaines étapes

1. Lire [../../INDEX.md](../../INDEX.md) pour la **navigation principale**
2. Choisir votre **rôle** (acheteur/vendeur/dev)
3. Lire la **doc appropriée**
4. Commencer à **coder/utiliser**!

---

**Besoin d'aide?** Consultez [../../INDEX.md](../../INDEX.md) ou cherchez dans le dossier approprié!
