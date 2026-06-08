# **🧹 Phase 2 - Dependencies Cleanup & Optimization**

*Date: 08 Juin 2026*
*Duration: ~2 hours*
*Status: Ready to start 🚀*

---

## **📋 Phase 2 Overview**

Après les corrections critiques de sécurité (Phase 1), nous nettoyons et optimisons les dépendances.

### **Objectifs Phase 2**

```
✅ Supprimer les packages dupliqués
✅ Supprimer les packages inutilisés
✅ Mettre à jour les packages obsolètes
✅ Optimiser la taille de l'image Docker
✅ Tester toutes les modifications
```

### **Temps estimé: 2 heures**

| Tâche | Durée | Status |
|-------|-------|--------|
| Analyser requirements.txt | 30m | ⬜ |
| Nettoyer doublons | 30m | ⬜ |
| Supprimer inutilisés | 30m | ⬜ |
| Tester + validation | 30m | ⬜ |

---

## **🔍 Analyse Actuelle**

### **Backend Requirements Issues**

**Doublons détectés:**
```
❌ pytest             (lignes 29, 78)
❌ pydantic           (lignes 21, 75)
❌ cryptography       (lignes 31, 79)
❌ bcrypt             (lignes ?)
```

**Packages inutilisés (à vérifier):**
```
❌ elasticsearch==8.11.0
❌ elasticsearch-dsl==8.11.0
❌ Flask-SocketIO==5.3.5    (SocketIO configuré mais peut être inutilisé)
❌ python-socketio==5.10.0
❌ python-engineio==4.8.0
❌ kombu==5.3.4
❌ firebase-admin==6.2.0
```

**Packages à upgrader:**
```
⚠️  bcrypt==4.1.2            → 4.1.3
⚠️  fastapi==0.104.1         → 0.110.2
⚠️  uvicorn==0.24.0          → 0.29.0
⚠️  stripe==7.0.0            → 8.0.0
⚠️  sendgrid==6.9.7          → 6.12.2
⚠️  boto3==1.34.0            → 1.34.160
⚠️  cryptography==41.0.7     → 42.0.7
```

---

## **📝 Plan d'Action Détaillé**

### **Étape 1: Analyser les dépendances (15 minutes)**

```bash
cd backend

# Voir toutes les dépendances installées
pip list | wc -l  # Nombre total

# Vérifier les doublons
cat requirements.txt | sort | uniq -d

# Vérifier les vulnérabilités
pip-audit  # Nécessite: pip install pip-audit

# Vérifier les packages non utilisés
pip show pytest | grep Location
```

### **Étape 2: Supprimer les doublons (15 minutes)**

**Créer un nouveau requirements.txt nettoyé:**

```bash
# Lire le fichier actuel
cat requirements.txt | grep -v "^#" | grep -v "^$" | sort | uniq > requirements.txt.tmp

# Vérifier manuellement les doublons
cat requirements.txt.tmp | sort | uniq -c | sort -rn

# Garder le fichier nettoyé
mv requirements.txt.tmp requirements.txt
```

### **Étape 3: Supprimer les packages inutilisés (20 minutes)**

**Vérifier l'usage dans le code:**

```bash
# Vérifier si elasticsearch est utilisé
grep -r "elasticsearch" backend/src/ backend/app_fastapi/
# Si rien: on peut le supprimer

# Vérifier si firebase-admin est utilisé
grep -r "firebase" backend/src/ backend/app_fastapi/
# Si rien: on peut le supprimer

# Vérifier si Flask-SocketIO est utilisé
grep -r "socketio\|SocketIO" backend/src/ | grep -v ".pyc"
# Si utilisé: le garder
```

**Packages à supprimer si non utilisés:**
```bash
# Éditer requirements.txt et supprimer:
# elasticsearch
# elasticsearch-dsl
# firebase-admin
# kombu (sauf si Celery l'utilise)
```

### **Étape 4: Mettre à jour les packages obsolètes (15 minutes)**

```bash
# Mettre à jour pip d'abord
pip install --upgrade pip

# Mettre à jour les packages sélectionnés
pip install --upgrade \
  bcrypt==4.1.3 \
  fastapi==0.110.2 \
  uvicorn==0.29.0 \
  stripe==8.0.0 \
  sendgrid==6.12.2 \
  boto3==1.34.160 \
  cryptography==42.0.7

# Générer le nouveau requirements.txt
pip freeze > requirements.txt
```

### **Étape 5: Tester (30 minutes)**

```bash
# Installer les dépendances
pip install -r requirements.txt

# Vérifier les vulnérabilités
pip-audit
safety check

# Tester le backend
pytest tests/ -v

# Tester l'application
python run_server.py
# → Vérifier que le serveur démarre sans erreurs
# → Ctrl+C pour arrêter

# Tests frontend
cd ../frontend
npm install
npm test

# Build frontend
npm run build
```

### **Étape 6: Optimiser Docker (10 minutes)**

**Vérifier la taille de l'image avant:**
```bash
docker build -t immo2000-test . -f Dockerfile.backend
docker image ls immo2000-test
```

**Après cleanup, le build devrait être plus rapide et l'image plus petite.**

---

## **🎯 Checklist Phase 2**

- [ ] **Doublons supprimés:**
  - [ ] pytest (garder une seule version)
  - [ ] pydantic (garder une seule version)
  - [ ] cryptography (garder une seule version)

- [ ] **Packages inutilisés supprimés:**
  - [ ] elasticsearch
  - [ ] elasticsearch-dsl
  - [ ] firebase-admin
  - [ ] (kombu si Celery ne l'utilise pas)

- [ ] **Packages à upgrader:**
  - [ ] bcrypt
  - [ ] fastapi
  - [ ] uvicorn
  - [ ] stripe
  - [ ] sendgrid
  - [ ] boto3
  - [ ] cryptography

- [ ] **Tests passent:**
  - [ ] pytest tests/ -v ✅
  - [ ] npm test ✅
  - [ ] npm run build ✅

- [ ] **Git commit:**
  - [ ] Message clair
  - [ ] Tous les fichiers stagés
  - [ ] Push vers la branche

---

## **⚠️ Points d'Attention**

### **À faire avec attention:**

1. **Ne pas supprimer:**
   - SQLAlchemy
   - pydantic
   - fastapi/Flask
   - redis
   - psycopg2-binary
   - celery (si utilisé)

2. **Vérifier avant de supprimer:**
   - elasticsearch (utilisé nulle part?)
   - firebase-admin (utilisé nulle part?)
   - kombu (dépendance de Celery?)

3. **Après upgrade:**
   - Tester toutes les routes API
   - Vérifier les websockets (socketio)
   - Vérifier les paiements Stripe

---

## **📞 En cas de problème**

**Erreur:** "ModuleNotFoundError: No module named 'X'"
```bash
# Solution:
pip install -r requirements.txt
# ou
pip install <package-name>
```

**Erreur:** "Incompatible versions"
```bash
# Solution:
pip install pipdeptree
pipdeptree | grep <package>  # Voir les dépendances
# Ou réinstaller tout:
pip install --force-reinstall -r requirements.txt
```

**Docker build fails:**
```bash
# Nettoyer et relancer
docker system prune -a
docker build --no-cache -t immo2000 .
```

---

## **📊 Expected Results**

### **Before Phase 2:**
```
requirements.txt: ~121 lignes
Total packages: ~85+
Vulnerabilities: 1 (Flask-Login removed in Phase 1)
Image size: Large
Build time: Long
```

### **After Phase 2:**
```
requirements.txt: ~100 lignes (nettoyé)
Total packages: ~70-75
Vulnerabilities: 0
Image size: Reduced ~15-20%
Build time: Faster
```

---

## **🚀 Next Phase (Phase 3)**

Après Phase 2 complétée:

### **Phase 3: Deploy to Staging (2 hours)**
- Build Docker image
- Run integration tests
- Validate security headers
- Smoke tests on staging
- Performance baseline

---

## **📝 Documentation Links**

- [Phase 1 - Security Fixes](MIGRATION_SECURITY_FIXES.md)
- [Audit Révisé](audit/AUDIT08_REVISED.md)
- [Production Checklist](audit/AUDIT08_REVISED.md#-checklist-pré-déploiement)

---

**Phase 2 Ready:** 08 Juin 2026
**Estimé:** 2 hours
**Status:** 🟢 **Ready to execute**

Ready to proceed? Run Phase 2 or continue with other tasks? 🚀
