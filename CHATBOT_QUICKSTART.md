# 🚀 Chatbot - Démarrage Rapide

## 5 minutes pour avoir le chatbot en marche!

### Étape 1: Vérifier les fichiers

```bash
# Backend
✅ backend/src/services/chatbot.py          (Service principal)
✅ backend/src/routes/chatbot.py            (Endpoints Flask)
✅ backend/tests/test_chatbot.py            (Tests)
✅ docs/chatbot/chatbot_data.json           (Dataset Q/R)

# Frontend
✅ frontend/src/components/Chatbot.jsx      (Composant React)
✅ frontend/src/components/Chatbot.css      (Styles)

# Documentation
✅ docs/CHATBOT_API.md                      (API Reference)
✅ docs/CHATBOT_GUIDE.md                    (Guide Utilisateur)
✅ CHATBOT_IMPLEMENTATION.md                (Ce document)
```

### Étape 2: Démarrer le Backend

```bash
cd backend

# Installer les dépendances (si besoin)
pip install flask flask-cors python-dotenv

# Démarrer le serveur Flask
PYTHONPATH=. FLASK_APP=src.app:create_app FLASK_ENV=development python -m flask run

# Expected output:
# ✅ Dataset chatbot chargé: 8 intents
# ✅ Running on http://127.0.0.1:5000
```

### Étape 3: Tester l'API (Terminal)

```bash
# Health check
curl http://localhost:5000/api/v1/chat/health

# Tester une question
curl -X POST http://localhost:5000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Comment estimer mon bien?"}'

# Expected response:
{
  "status": "success",
  "data": {
    "reponse": "Vous pouvez estimer votre bien...",
    "intent": "estimation_prix",
    "actions": [{"type": "link", "text": "Estimer mon bien", "url": "/simulateur-pret"}],
    "confidence": 0.85,
    "timestamp": "..."
  }
}
```

### Étape 4: Démarrer le Frontend

```bash
cd frontend

# Installer/vérifier les dépendances
npm install

# Démarrer le dev server
npm start

# Accédez à http://localhost:3000
```

### Étape 5: Tester le Chatbot en UI

1. Connectez-vous ou créez un compte
2. Cherchez le bouton 💬 **en bas à droite**
3. Cliquez pour ouvrir le chatbot
4. Posez une question:
   - "Comment estimer mon bien?"
   - "Quels documents pour vendre?"
   - "Comment organiser une visite?"

5. Cliquez sur un bouton d'action pour naviguer

---

## ✅ Checklist de Validation

### Backend
- [ ] Service chatbot charge sans erreur
- [ ] `GET /api/v1/chat/health` retourne 200 OK
- [ ] `POST /api/v1/chat` retourne une réponse
- [ ] Tests passent: `pytest tests/test_chatbot.py`

### Frontend
- [ ] Composant Chatbot s'importe sans erreur
- [ ] Bouton 💬 visible en bas à droite
- [ ] Cliquer sur le bouton ouvre le chat
- [ ] Messages s'affichent correctement
- [ ] Boutons d'action sont cliquables

### Documentation
- [ ] [API Reference](docs/CHATBOT_API.md) lisible
- [ ] [User Guide](docs/CHATBOT_GUIDE.md) lisible
- [ ] Exemples curl fonctionnent

---

## 🎯 Questions à Tester

Essayez ces questions pour valider:

| Question | Intent Attendu |
|----------|----------------|
| "estimer mon bien" | `estimation_prix` |
| "DPE obligatoire" | `documents_obligatoires` |
| "comment visiter" | `organiser_visite` |
| "délai de rétractation" | `delai_retractation` |
| "comment obtenir un prêt" | `pret_hypothecaire` |
| "frais agence" | `frais_agence` |
| "trouver un bien" | `matching` |
| "besoin d'aide" | `support` |
| "confidentialité" | `confidentialite` |
| "blablabla xyz" | `default` |

---

## 📊 Structure des Fichiers

```
Immo2000/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── chatbot.py          ← Service principal
│   │   └── routes/
│   │       └── chatbot.py          ← Endpoints Flask
│   └── tests/
│       └── test_chatbot.py         ← Tests (20+ cases)
├── frontend/
│   └── src/
│       └── components/
│           ├── Chatbot.jsx         ← Composant React
│           └── Chatbot.css         ← Styles
├── docs/
│   ├── chatbot/
│   │   └── chatbot_data.json       ← Dataset Q/R
│   ├── CHATBOT_API.md              ← API Reference
│   └── CHATBOT_GUIDE.md            ← User Guide
└── CHATBOT_IMPLEMENTATION.md       ← Vue d'ensemble
```

---

## 🔧 Configuration

### Backend (.env)

Aucune configuration spéciale requise pour le chatbot! Il fonctionne out-of-the-box.

```env
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///immo2000.db
```

### Frontend

Assurez-vous que l'API backend est accessible:

```javascript
// Par défaut: http://localhost:5000
// À adapter dans Chatbot.jsx si nécessaire
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

---

## 🆘 Dépannage

### Le chatbot ne se charge pas

**Vérifier:**
```bash
# 1. Backend tourne?
curl http://localhost:5000/api/v1/chat/health

# 2. Dataset chargé?
# Vérifier les logs du backend pour:
# ✅ Dataset chatbot chargé: X intents

# 3. Frontend a les imports?
grep -n "import Chatbot" frontend/src/App.jsx
```

### Les réponses sont vides

**Vérifier:**
```bash
# Dataset JSON est-il valide?
python -c "import json; json.load(open('docs/chatbot/chatbot_data.json'))"

# Fichier existe?
ls -la docs/chatbot/chatbot_data.json

# Contient des intents?
grep '"tag"' docs/chatbot/chatbot_data.json | wc -l
```

### Erreur "Cannot fetch from /api/v1/chat"

**Vérifier:**
- CORS est configuré dans `app.py`
- Backend tourne sur le bon port
- Pas de firewall qui bloque
- Essayer depuis curl d'abord

---

## 📚 Documentation

Lire la doc dans cet ordre:

1. **Ce fichier** (5 min) - Vue d'ensemble rapide
2. **[docs/CHATBOT_GUIDE.md](docs/CHATBOT_GUIDE.md)** (10 min) - Guide utilisateur
3. **[docs/CHATBOT_API.md](docs/CHATBOT_API.md)** (20 min) - Référence API
4. **[CHATBOT_IMPLEMENTATION.md](CHATBOT_IMPLEMENTATION.md)** (30 min) - Vue d'ensemble technique

---

## 🚀 Déploiement en Production

### Backend

```bash
# 1. Tester
cd backend
pytest tests/test_chatbot.py

# 2. Déployer
# (Même processus que le reste de l'app Flask)
gunicorn -w 4 -b 0.0.0.0:5000 'src.app:create_app()'
```

### Frontend

```bash
# 1. Build
cd frontend
npm run build

# 2. Déployer (Vercel/Netlify/...)
# (Même processus que le reste de React)
```

### Docker

```bash
# Si vous utilisez Docker:
docker-compose up

# Le chatbot fonctionnera automatiquement
```

---

## 💡 Tips

### Ajouter un nouvel intent

1. Éditer `docs/chatbot/chatbot_data.json`
2. Ajouter un objet dans `intents[]`:
   ```json
   {
     "tag": "mon_intent",
     "patterns": ["pattern1", "pattern2"],
     "responses": ["response1", "response2"],
     "actions": [{"type": "link", "text": "Lien", "url": "/page"}]
   }
   ```
3. Relancer le backend (recharge automatique)

### Tester localement sans frontend

```python
# test_chatbot.py
from src.services.chatbot import ChatbotService

chatbot = ChatbotService()
response = chatbot.generate_response("Comment estimer mon bien?")
print(response['reponse'])
print(response['intent'])
print(response['actions'])
```

### Voir les logs du chatbot

```bash
# Le chatbot log au démarrage:
FLASK_APP=src.app:create_app python -m flask run

# Output:
# ✅ Dataset chatbot chargé: 8 intents
```

---

## 📞 Support

### Bugs ou Problèmes

1. Vérifier les logs (backend + frontend)
2. Lire [CHATBOT_IMPLEMENTATION.md](CHATBOT_IMPLEMENTATION.md)
3. Vérifier [FAQ dans User Guide](docs/CHATBOT_GUIDE.md#-problèmes-courants)
4. Lancer les tests: `pytest tests/test_chatbot.py -v`

### Questions sur l'API

Consulter: [docs/CHATBOT_API.md](docs/CHATBOT_API.md)

### Questions Utilisateur

Consulter: [docs/CHATBOT_GUIDE.md](docs/CHATBOT_GUIDE.md)

---

## 🎉 C'est tout!

Vous avez un chatbot intelligent et production-ready!

**Prochaines étapes:**
- [ ] Tester les intents fournis
- [ ] Ajouter vos propres patterns
- [ ] Intégrer avec votre CRM (optionnel)
- [ ] Monitorer les conversations (optionnel)

---

**Status:** ✅ Production-Ready
**Version:** 1.0
**Support:** 24/7 (chatbot lui-même!)

Enjoy! 🚀
