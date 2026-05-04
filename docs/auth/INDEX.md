# 🔐 Authentification JWT - Guide de Navigation

Bienvenue dans la documentation d'authentification JWT pour Immo2000 !

---

## 🚀 Où Commencer ?

### ⏱️ "Je n'ai que 5 minutes"
→ **[QUICKSTART_AUTH.md](QUICKSTART_AUTH.md)** - Vue d'ensemble rapide du JWT

### ⏱️ "J'ai 30 minutes pour comprendre"
1. [QUICKSTART_AUTH.md](QUICKSTART_AUTH.md) (5 min)
2. [JWT_REFERENCE.md](JWT_REFERENCE.md) (25 min)

### ⏱️ "Je dois implémenter l'intégration (1-2h)"
1. [QUICKSTART_AUTH.md](QUICKSTART_AUTH.md) (5 min)
2. [INTEGRATION.md](INTEGRATION.md) (45 min)
3. [FULL_INTEGRATION_TEST.sh](FULL_INTEGRATION_TEST.sh) (10 min)

### ⏱️ "Je dois déployer en production (2-3h)"
1. [APP_CONFIGURATION.md](APP_CONFIGURATION.md) (15 min)
2. [RATE_LIMITING.md](RATE_LIMITING_GUIDE.md) (20 min)
3. [FINAL_SUMMARY.md](FINAL_SUMMARY.md) (30 min)
4. [JWT_REFERENCE.md](JWT_REFERENCE.md) pour dépanner (30 min+)

---

## 📚 Guide Complet des Fichiers

### 🟢 OBLIGATOIRE (Lisez d'abord)

| Fichier | Durée | Contenu |
|---------|-------|---------|
| **[QUICKSTART_AUTH.md](QUICKSTART_AUTH.md)** | 5 min | Introduction rapide au JWT, configuration basique, endpoints |
| **[INTEGRATION.md](INTEGRATION.md)** | 45 min | Checklist complète d'intégration, 10 phases détaillées |

### 🟡 RECOMMANDÉ (Lisez avant intégration)

| Fichier | Durée | Contenu |
|---------|-------|---------|
| **[JWT_REFERENCE.md](JWT_REFERENCE.md)** | 45 min | Référence exhaustive : tous les endpoints, codes d'erreur, exemples curl |
| **[APP_CONFIGURATION.md](APP_CONFIGURATION.md)** | 15 min | Comment configurer app.py, enregistrer blueprints, initialiser limiter |
| **[DIAGRAMS.md](DIAGRAMS.md)** | 10 min | 8 diagrammes visuels des flows (registration, login, token refresh, etc.) |

### 🔵 OPTIONNEL (Consultez au besoin)

| Fichier | Durée | Contenu |
|---------|-------|---------|
| **[RATE_LIMITING.md](RATE_LIMITING_GUIDE.md)** | 20 min | Protection contre les attaques par force brute (optionnel) |
| **[SUMMARY.md](SUMMARY.md)** | 10 min | Résumé technique, statistiques du projet |
| **[FINAL_SUMMARY.md](FINAL_SUMMARY.md)** | 20 min | État global du système, checklist finale, dépannage |
| **[VERIFICATION_COMPLETE.sh](VERIFICATION_COMPLETE.sh)** | 10 min | Réponses aux 5 points de vérification clés |

### 🧪 TESTS

| Script | Contenu |
|--------|---------|
| **[FULL_INTEGRATION_TEST.sh](../setup/FULL_INTEGRATION_TEST.sh)** | 8 phases : register, login, create bien, create estimation, compare, etc. |

---

## 🎯 Par Objectif

### Comprendre le JWT

1. [QUICKSTART_AUTH.md](QUICKSTART_AUTH.md) - Concepts de base
2. [DIAGRAMS.md](DIAGRAMS.md) - Visualisations
3. [JWT_REFERENCE.md](JWT_REFERENCE.md) Section "JWT Structure"

### Implémenter l'authentification

1. [INTEGRATION.md](INTEGRATION.md) - Phase 0-6
2. [APP_CONFIGURATION.md](APP_CONFIGURATION.md) - Configuration app.py
3. [FULL_INTEGRATION_TEST.sh](../setup/FULL_INTEGRATION_TEST.sh) - Vérifier

### Protéger une route

1. [QUICKSTART_AUTH.md](QUICKSTART_AUTH.md) Section "Protéger une route"
2. [INTEGRATION.md](INTEGRATION.md) Section "Gestion des rôles"
3. [JWT_REFERENCE.md](JWT_REFERENCE.md) Section "@token_required decorator"

### Gérer les rôles

1. [INTEGRATION.md](INTEGRATION.md) Section "Gestion des rôles"
2. [QUICKSTART_AUTH.md](QUICKSTART_AUTH.md) Section "Exemple avec restriction"

### Ajouter le rate limiting

1. [RATE_LIMITING.md](RATE_LIMITING_GUIDE.md) - Guide complet
2. [APP_CONFIGURATION.md](APP_CONFIGURATION.md) - Intégration dans app.py

### Déboguer une erreur

1. [JWT_REFERENCE.md](JWT_REFERENCE.md) Section "Codes d'erreur"
2. [FINAL_SUMMARY.md](FINAL_SUMMARY.md) Section "Assistance"
3. [FULL_INTEGRATION_TEST.sh](../setup/FULL_INTEGRATION_TEST.sh) - Tester chaque phase

### Déployer en production

1. [APP_CONFIGURATION.md](APP_CONFIGURATION.md)
2. [RATE_LIMITING.md](RATE_LIMITING_GUIDE.md)
3. [FINAL_SUMMARY.md](FINAL_SUMMARY.md) Phases 9-10

---

## 🔍 Index Rapide par Topic

### Configuration

- **Générer JWT_SECRET_KEY** → [QUICKSTART_AUTH.md](QUICKSTART_AUTH.md)
- **Configurer .env** → [INTEGRATION.md](INTEGRATION.md) Phase 4
- **Configurer app.py** → [APP_CONFIGURATION.md](APP_CONFIGURATION.md)

### Endpoints

- **POST /auth/register** → [JWT_REFERENCE.md](JWT_REFERENCE.md)
- **POST /auth/login** → [JWT_REFERENCE.md](JWT_REFERENCE.md)
- **POST /auth/refresh** → [JWT_REFERENCE.md](JWT_REFERENCE.md)
- **GET /auth/me** → [JWT_REFERENCE.md](JWT_REFERENCE.md)

### Décorateurs

- **@token_required** → [QUICKSTART_AUTH.md](QUICKSTART_AUTH.md)
- **@role_required** → [INTEGRATION.md](INTEGRATION.md)

### Codes d'Erreur

- **401 Unauthorized** → [JWT_REFERENCE.md](JWT_REFERENCE.md)
- **403 Forbidden** → [JWT_REFERENCE.md](JWT_REFERENCE.md)
- **429 Too Many Requests** → [RATE_LIMITING.md](RATE_LIMITING_GUIDE.md)

### Sécurité

- **Password validation** → [QUICKSTART_AUTH.md](QUICKSTART_AUTH.md)
- **JWT security** → [JWT_REFERENCE.md](JWT_REFERENCE.md) "Security section"
- **Rate limiting** → [RATE_LIMITING.md](RATE_LIMITING_GUIDE.md)

---

## ❓ FAQ

| Question | Réponse |
|----------|---------|
| "Qu'est-ce que JWT ?" | → [QUICKSTART_AUTH.md](QUICKSTART_AUTH.md) |
| "Combien de temps ça prend ?" | → Voir "Où commencer ?" section |
| "C'est compatible avec PostgreSQL ?" | → [INTEGRATION.md](INTEGRATION.md) Section 1 |
| "Où se trouvent les fichiers de code ?" | → [../../../backend/src/auth/](../../../backend/src/auth/) |
| "Comment tester ?" | → [FULL_INTEGRATION_TEST.sh](../setup/FULL_INTEGRATION_TEST.sh) |
| "Comment déboguer ?" | → [FINAL_SUMMARY.md](FINAL_SUMMARY.md) "Assistance" |

---

## 🗺️ Relationner avec d'autres docs

Vous trouverez aussi :

- **Architecture globale** → [../ARCHITECTURE.md](../ARCHITECTURE.md)
- **Integration Melo API** → [../../database/INTEGRATION_MELO.md](../../database/INTEGRATION_MELO.md)
- **Schéma base de données** → [../../database/README.md](../../database/README.md)

---

## ✅ Checklist de Lecture

Marquez ce que vous avez lu :

**Essentiels :**
- [ ] QUICKSTART_AUTH.md
- [ ] INTEGRATION.md

**Avant d'intégrer :**
- [ ] JWT_REFERENCE.md
- [ ] APP_CONFIGURATION.md

**Avant production :**
- [ ] RATE_LIMITING.md
- [ ] FINAL_SUMMARY.md

**Optionnel mais utile :**
- [ ] DIAGRAMS.md
- [ ] SUMMARY.md

---

## 🚀 Prêt à Commencer ?

👉 **[QUICKSTART_AUTH.md](QUICKSTART_AUTH.md)** ← Commencez ici !

---

**Dernière mise à jour** : 2026-05-04
