# 🚀 Guide de Démarrage - Immo2000 (MVP Matching)

## 1️⃣ **Installation des Dépendances**

### Upgrader Pydantic (pour corriger le conflit mistralai)

```bash
cd /home/djali/code/Soipadeg/Immo2000
pip install --upgrade 'pydantic>=2.11.2'
```

**Vérification:**
```bash
pip show pydantic | grep Version
# Doit afficher: Version: 2.11.2 ou plus
```

---

## 2️⃣ **Démarrer le Serveur Flask**

### Option A: Commande directe (simple)

```bash
cd /home/djali/code/Soipadeg/Immo2000/backend

# Variables d'environnement requises
export PYTHONPATH=.
export FLASK_APP=src.app:create_app
export FLASK_ENV=development
export FLASK_DEBUG=1

# Lancer le serveur
python -m flask run --host=127.0.0.1 --port=5000
```

### Option B: Utiliser le script (recommandé)

```bash
cd /home/djali/code/Soipadeg/Immo2000
chmod +x run.sh
./run.sh
```

### Option C: Une ligne

```bash
cd /home/djali/code/Soipadeg/Immo2000/backend && \
  PYTHONPATH=. FLASK_APP=src.app:create_app FLASK_ENV=development \
  python -m flask run
```

**Attendu:**
```
 * Serving Flask app 'src.app:create_app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

---

## 3️⃣ **Tester l'API (dans un autre terminal)**

### Health Check

```bash
curl http://localhost:5000/health
```

**Réponse attendue:**
```json
{"status": "ok", "service": "immo2000-backend"}
```

### Endpoint Matching (avec JWT)

```bash
# 1. Obtenir un token (simul)
# (À faire via /auth/login en production)

# 2. Tester le endpoint
curl -X POST http://localhost:5000/api/v1/matching \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"acheteur_id": 1}'
```

---

## 4️⃣ **Exécuter les Tests**

### Tests du Scoring

```bash
cd /home/djali/code/Soipadeg/Immo2000/backend
pytest tests/test_matching.py -v
```

**Attendu:**
```
6 passed in 0.02s ✅
```

### Tests du Seuil (Threshold)

```bash
python tests/test_threshold.py
```

**Attendu:**
```
✅ TEST RÉUSSI: Le seuil MIN_SCORE_THRESHOLD = 5 fonctionne correctement!
```

---

## 🐛 **Troubleshooting**

### Erreur: "Could not locate a Flask application"

**Cause:** Variable `FLASK_APP` manquante ou incorrecte

**Solution:**
```bash
# Assurez-vous d'être dans le répertoire backend/
cd /home/djali/code/Soipadeg/Immo2000/backend

# Exporter les variables correctement
export PYTHONPATH=.
export FLASK_APP=src.app:create_app

# Puis lancer Flask
python -m flask run
```

### Erreur: "ModuleNotFoundError: No module named 'src'"

**Cause:** `PYTHONPATH` n'est pas défini correctement

**Solution:**
```bash
# S'assurer qu'on est dans le répertoire backend
cd /home/djali/code/Soipadeg/Immo2000/backend

# Ajouter . au PYTHONPATH
export PYTHONPATH=.

# Vérifier
echo $PYTHONPATH  # Doit afficher: .
```

### Erreur: "Pydantic version conflict"

**Cause:** `mistralai` nécessite `pydantic>=2.11.2` mais une version inférieure est installée

**Solution:**
```bash
pip install --upgrade 'pydantic>=2.11.2'
pip show pydantic  # Vérifier
```

---

## ✅ **Checklist Démarrage**

- [ ] Pydantic upgraded à 2.11.2+
- [ ] Variable `PYTHONPATH=.` définie
- [ ] Variable `FLASK_APP=src.app:create_app` définie
- [ ] Répertoire courant: `backend/`
- [ ] Serveur lancé avec `python -m flask run`
- [ ] Health check répond (curl http://localhost:5000/health)
- [ ] Tests passent (`pytest tests/test_matching.py -v`)

---

## 📊 **Architecture du Matching MVP**

```
backend/
├── src/
│   ├── services/
│   │   └── matching.py          ← Logique de scoring
│   ├── routes/
│   │   └── matching.py          ← Endpoint /matching
│   ├── models/
│   │   ├── acheteurs.py        ← Modèle Acheteur
│   │   └── annonces.py         ← Modèle Annonce
│   └── app.py                  ← Application Flask
├── tests/
│   ├── test_matching.py        ← Tests unitaires (6 tests)
│   └── test_threshold.py       ← Tests du seuil
└── requirements.txt            ← Dépendances
```

---

## 🎯 **Configuration Active**

```python
# src/routes/matching.py

MAX_RESULTS = 10              # Max 10 annonces
MIN_SCORE_THRESHOLD = 5       # Score minimum pour recommander
```

**Règles de scoring:**
- ✅ +10 pts si prix <= budget
- ✅ +5 pts si ville == ville recherchée
- ✅ +3 pts si surface >= surface min
- ✅ +2 pts si type == type recherché
- ✅ +1 pt par 10% de marge (bonus)
- ❌ -5 pts si ville ou type différents (pénalité)

**Score minimum:** 5 points

---

## 📝 **Notes de Développement**

### Pour déboguer le matching
```python
from src.services.matching import MatchingCalculator

score, details = MatchingCalculator.calculate_score_with_details(annonce, acheteur)
print(f"Score: {score}, Détails: {details}")
```

### Pour modifier le seuil
```python
# Dans src/routes/matching.py
MIN_SCORE_THRESHOLD = 3   # Plus permissif
MIN_SCORE_THRESHOLD = 10  # Plus strict
```

---

**Créé par:** Claude
**Date:** 6 Mai 2026
**Statut:** ✅ MVP Phase 1
