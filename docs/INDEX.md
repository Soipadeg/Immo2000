# 📚 Documentation Immo2000

Bienvenue dans la documentation du projet Immo2000 ! Cette page aide à naviguer entre les différents guides.

---

## 🚀 Démarrage Rapide

**Nouvelle au projet ?** Commencez ici :

1. **[Authentification JWT (5 min)](auth/QUICKSTART_AUTH.md)** - Vue d'ensemble rapide
2. **[Checklist d'intégration (30 min)](auth/INTEGRATION.md)** - Étapes détaillées
3. **[Tests complets](../docs/setup/FULL_INTEGRATION_TEST.sh)** - Vérifier que tout fonctionne

---

## 📖 Documentation par Sujet

### 🔐 Authentification JWT

| Document | Durée | Objectif |
|----------|-------|----------|
| **[QUICKSTART_AUTH.md](auth/QUICKSTART_AUTH.md)** | 5 min | Vue rapide du JWT |
| **[JWT_REFERENCE.md](auth/JWT_REFERENCE.md)** | 30 min | Référence complète (endpoints, erreurs) |
| **[INTEGRATION.md](auth/INTEGRATION.md)** | 30 min | Guide d'intégration étape par étape |
| **[APP_CONFIGURATION.md](auth/APP_CONFIGURATION.md)** | 15 min | Configurer app.py avec les blueprints |
| **[RATE_LIMITING.md](auth/RATE_LIMITING_GUIDE.md)** | 20 min | Rate limiting (optionnel, protection) |
| **[DIAGRAMS.md](auth/DIAGRAMS.md)** | 10 min | Diagrammes visuels des flows |
| **[SUMMARY.md](auth/SUMMARY.md)** | 10 min | Résumé technique |
| **[FINAL_SUMMARY.md](auth/FINAL_SUMMARY.md)** | 20 min | État complet & checklist finale |

### ✅ Vérification

| Document | Objectif |
|----------|----------|
| **[VERIFICATION_COMPLETE.sh](auth/VERIFICATION_COMPLETE.sh)** | Réponses aux 5 points clés |

### 🧪 Tests

| Script | Objectif |
|--------|----------|
| **[FULL_INTEGRATION_TEST.sh](setup/FULL_INTEGRATION_TEST.sh)** | Tests complets (8 phases) |

### 🚀 Déploiement

| Document | Durée | Objectif |
|----------|-------|----------|
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | 15 min | Guide rapide de déploiement (Docker + Vercel) |
| **[DOCKER_GUIDE.md](DOCKER_GUIDE.md)** | 30 min | Déploiement détaillé backend (Docker) |
| **[VERCEL_GUIDE.md](VERCEL_GUIDE.md)** | 15 min | Déploiement frontend (Vercel) |

### 📊 Audit & Validation

| Document | Objectif |
|----------|----------|
| **[AUDIT.md](AUDIT.md)** | Rapports d'audit technique et validation |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Architecture globale du système |

---

## 📁 Structure de la Documentation

```
docs/
├── INDEX.md                   ← Vous êtes ici
├── ARCHITECTURE.md            ← Architecture globale du projet
├── DEPLOYMENT.md              ← 🆕 Guides de déploiement
├── AUDIT.md                   ← 🆕 Rapports d'audit
├── DOCKER_GUIDE.md            ← Guide Docker détaillé
├── VERCEL_GUIDE.md            ← Guide Vercel détaillé
│
├── auth/                      ← Authentification JWT
│   ├── INDEX.md
│   ├── QUICKSTART_AUTH.md
│   ├── JWT_REFERENCE.md
│   ├── INTEGRATION.md
│   ├── APP_CONFIGURATION.md
│   ├── RATE_LIMITING_GUIDE.md
│   ├── DIAGRAMS.md
│   ├── SUMMARY.md
│   ├── FINAL_SUMMARY.md
│   └── VERIFICATION_COMPLETE.sh
│
└── setup/                     ← Installation & tests
    └── FULL_INTEGRATION_TEST.sh
```

---

## 🎯 Par Cas d'Usage

### 📌 "Je dois juste démarrer rapidement"
1. [QUICKSTART_AUTH.md](auth/QUICKSTART_AUTH.md) (5 min)
2. [INTEGRATION.md](auth/INTEGRATION.md) Phases 0-2 (15 min)
3. Lancer les tests

### 📌 "Je dois comprendre le JWT en profondeur"
1. [QUICKSTART_AUTH.md](auth/QUICKSTART_AUTH.md) (5 min)
2. [JWT_REFERENCE.md](auth/JWT_REFERENCE.md) (30 min)
3. [DIAGRAMS.md](auth/DIAGRAMS.md) (10 min)
4. [INTEGRATION.md](auth/INTEGRATION.md) (30 min)

### 📌 "Je dois intégrer en production"
1. [APP_CONFIGURATION.md](auth/APP_CONFIGURATION.md) (15 min)
2. [RATE_LIMITING.md](auth/RATE_LIMITING_GUIDE.md) (20 min)
3. [FINAL_SUMMARY.md](auth/FINAL_SUMMARY.md) Phases 9-10 (15 min)

### 📌 "J'ai une erreur, je dois dépanner"
1. Lancer [FULL_INTEGRATION_TEST.sh](setup/FULL_INTEGRATION_TEST.sh)
2. Consulter [JWT_REFERENCE.md](auth/JWT_REFERENCE.md) "Error Codes"
3. Vérifier [FINAL_SUMMARY.md](auth/FINAL_SUMMARY.md) "Assistance"

### 📌 "Je dois déployer en production"
1. [DEPLOYMENT.md](DEPLOYMENT.md) (15 min) - Quick start
2. [DOCKER_GUIDE.md](DOCKER_GUIDE.md) (30 min) - Backend détaillé
3. [VERCEL_GUIDE.md](VERCEL_GUIDE.md) (15 min) - Frontend détaillé

### 📌 "Je veux vérifier la qualité du code"
1. [AUDIT.md](AUDIT.md) - Rapports complets
2. [ARCHITECTURE.md](ARCHITECTURE.md) - Vue d'ensemble
3. Lancer [FULL_INTEGRATION_TEST.sh](setup/FULL_INTEGRATION_TEST.sh) - Tests complets

---

## 🔍 Index par Mot-Clé

### Endpoints

- **GET /auth/me** → [JWT_REFERENCE.md](auth/JWT_REFERENCE.md#4-get-authme)
- **POST /auth/login** → [JWT_REFERENCE.md](auth/JWT_REFERENCE.md#2-post-authlogin)
- **POST /auth/register** → [JWT_REFERENCE.md](auth/JWT_REFERENCE.md#1-post-authregister)
- **POST /auth/refresh** → [JWT_REFERENCE.md](auth/JWT_REFERENCE.md#3-post-authrefresh)
- **GET /api/biens** → [INTEGRATION.md](auth/INTEGRATION.md#3-gestion-des-rôles)
- **POST /api/estimations** → [INTEGRATION.md](auth/INTEGRATION.md#2-intégration-avec-melo-api)

### Topics

- **Codes d'erreur** → [JWT_REFERENCE.md](auth/JWT_REFERENCE.md)
- **Validation de mot de passe** → [QUICKSTART_AUTH.md](auth/QUICKSTART_AUTH.md)
- **Configuration .env** → [APP_CONFIGURATION.md](auth/APP_CONFIGURATION.md)
- **Décorateurs @token_required** → [QUICKSTART_AUTH.md](auth/QUICKSTART_AUTH.md)
- **Rôles (vendeur, acheteur, agent)** → [INTEGRATION.md](auth/INTEGRATION.md)
- **Rate limiting** → [RATE_LIMITING.md](auth/RATE_LIMITING_GUIDE.md)
- **Tests** → [FULL_INTEGRATION_TEST.sh](setup/FULL_INTEGRATION_TEST.sh)

---

## 📞 Support

### ❓ Question Fréquente

| Question | Réponse |
|----------|---------|
| "Où lire en premier ?" | → [QUICKSTART_AUTH.md](auth/QUICKSTART_AUTH.md) |
| "Comment configurer JWT_SECRET_KEY ?" | → [FINAL_SUMMARY.md](auth/FINAL_SUMMARY.md#phase-2--configuration) |
| "Qu'est-ce qu'un access_token ?" | → [JWT_REFERENCE.md](auth/JWT_REFERENCE.md#structure-jwt) |
| "Comment protéger une route ?" | → [QUICKSTART_AUTH.md](auth/QUICKSTART_AUTH.md#protéger-une-route) |
| "Code d'erreur 401 ?" | → [JWT_REFERENCE.md](auth/JWT_REFERENCE.md#erreurs) |

---

## 🎉 État du Projet

✅ **Authentification JWT** - Complète et testée
✅ **Documentation** - Exhaustive (9 guides)
✅ **Tests** - 20+ cas de test
⏳ **Modèles Bien & Estimation** - À créer
⏳ **Rate limiting** - Optionnel

---

**Dernière mise à jour** : 2026-05-04

👉 **[Commencez ici →](auth/QUICKSTART_AUTH.md)**
