# 🤖 Chatbot API - Documentation Technique

## 📋 Vue d'ensemble

Le chatbot Immo2000 est un assistant IA qui répond aux questions fréquentes (FAQ) avec un système de matching simple basé sur les mots-clés. Il guide les utilisateurs vers les fonctionnalités principales (matching, simulateur de prêt, gestion des visites).

### Caractéristiques
- ✅ Matching intelligent basé sur la similarité textuelle
- ✅ 8+ intents couvrant les cas d'usage courants
- ✅ Actions/liens suggérées (navigation guidée)
- ✅ Gestion des sessions pour suivi du contexte
- ✅ API REST simple et extensible
- ✅ Support optionnel de la personnalisation (user_id)

---

## 🔌 Endpoints

### POST /api/v1/chat - Envoyer un message

Endpoint principal pour communiquer avec le chatbot.

**Request:**
```bash
curl -X POST http://localhost:5000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Comment estimer mon bien ?",
    "session_id": "session-abc123",
    "user_id": 1
  }'
```

**Request Body:**
```json
{
  "message": "Comment estimer mon bien ?",           // [REQUIRED] Question utilisateur
  "session_id": "session-abc123",                   // [OPTIONAL] ID de session pour suivi du contexte
  "user_id": 1                                      // [OPTIONAL] ID utilisateur pour personnalisation
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "reponse": "Vous pouvez estimer votre bien en utilisant notre outil dédié...",
    "intent": "estimation_prix",
    "actions": [
      {
        "type": "link",
        "text": "Estimer mon bien",
        "url": "/simulateur-pret"
      },
      {
        "type": "link",
        "text": "Voir les annonces similaires",
        "url": "/matching"
      }
    ],
    "session_id": "session-abc123",
    "confidence": 0.85,
    "timestamp": "2026-05-06T10:30:00.000000"
  }
}
```

**Response Fields:**
- `reponse`: Réponse textuelle du chatbot
- `intent`: Tag de l'intent détecté (ex: "estimation_prix", "documents_obligatoires")
- `actions`: Tableau des actions/liens suggérés
  - `type`: Type d'action (toujours "link" pour MVP)
  - `text`: Label du bouton/lien
  - `url`: URL cible
- `session_id`: ID de session (peut être utilisé pour persistence)
- `confidence`: Score de confiance de la réponse (0.0 à 1.0)
  - \> 0.7: Haute confiance
  - 0.3-0.7: Confiance modérée
  - < 0.3: Faible confiance (intent "default")
- `timestamp`: ISO timestamp de la réponse

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "error": "Le champ 'message' est requis."
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "error": "Erreur interne: [détail]"
}
```

---

### GET /api/v1/chat/health - Health Check

Vérifier que le chatbot est opérationnel et que le dataset est chargé.

**Request:**
```bash
curl http://localhost:5000/api/v1/chat/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "message": "Chatbot is running",
  "intents_loaded": 8
}
```

---

## 🧠 Système d'Intents

Les intents sont les catégories de questions que le chatbot peut traiter.

### Intents Supportés

| Intent | Patterns d'exemple | Actions |
|--------|-------------------|---------|
| `estimation_prix` | "estimer mon bien", "quel est le prix de ma maison" | Lien vers simulateur |
| `documents_obligatoires` | "quels documents pour vendre", "DPE obligatoire" | Lien vers FAQ |
| `organiser_visite` | "comment organiser une visite", "prendre RDV" | Lien vers visites |
| `delai_retractation` | "délai de rétractation", "annuler un achat" | Aucune action |
| `pret_hypothecaire` | "comment obtenir un prêt", "financement immobilier" | Lien vers simulateur |
| `frais_agence` | "combien coute une agence", "commission agence" | Aucune action |
| `matching` | "trouver un bien", "annonces similaires" | Lien vers matching |
| `support` | "besoin d'aide", "contacter support" | Lien vers contact |
| `confidentialite` | "protection données", "RGPD" | Lien vers politique |
| `default` | (patterns vides = fallback) | Liens vers features principales |

### Logique de Matching

1. **Prétraitement**: Conversion en minuscules, suppression des accents et ponctuation
2. **Similarity Score**: Calcul basé sur le nombre de mots du pattern trouvés dans le message
3. **Seuil**: Score minimum de 0.3 (30% des mots du meilleur pattern)
4. **Fallback**: Si score < 0.3, utilisation de l'intent "default"

**Exemple:**
```
Message utilisateur: "Comment je peux estimer ma maison rapidement?"
Pattern matching: "estimer mon bien"

Mots pattern: ["estimer", "mon", "bien"]
Mots trouvés: ["estimer", "bien"] (2/3 = 0.67)

Score: 0.67 > 0.3 ✅ Intent = "estimation_prix"
```

---

## 📊 Dataset (chatbot_data.json)

Structure du fichier de dataset:

```json
{
  "intents": [
    {
      "tag": "estimation_prix",
      "patterns": [
        "estimer mon bien",
        "quel est le prix de ma maison",
        "évaluation immobilière"
      ],
      "responses": [
        "Vous pouvez estimer votre bien en utilisant notre outil...",
        "Pour une estimation précise, utilisez notre simulateur..."
      ],
      "actions": [
        {
          "type": "link",
          "text": "Estimer mon bien",
          "url": "/simulateur-pret"
        }
      ]
    }
  ]
}
```

**Champs:**
- `tag`: Identifiant unique de l'intent
- `patterns`: Liste de patterns (phrases clés) pour matcher le message
- `responses`: Tableau de réponses (une sera choisie aléatoirement)
- `actions`: Actions/boutons suggérés (optionnel)

**Localisation:** `/docs/chatbot/chatbot_data.json`

---

## 🔄 Flux de Conversation

```
1. Client envoie un message
   POST /api/v1/chat
   { "message": "Comment estimer mon bien ?" }

2. Serveur traite le message
   - Prétraitement (minuscules, accents)
   - Recherche du meilleur intent
   - Sélection d'une réponse aléatoire

3. Serveur retourne réponse + actions
   {
     "reponse": "Vous pouvez estimer...",
     "intent": "estimation_prix",
     "actions": [...]
   }

4. Frontend affiche réponse
   - Message du bot
   - Boutons d'actions cliquables

5. Utilisateur clique sur une action
   → Navigation vers URL suggérée
```

---

## 🛠️ Intégration Backend

### Initialisation au démarrage

Dans `backend/src/app.py`:

```python
from src.services.chatbot import init_chatbot

def create_app():
    app = Flask(__name__)

    # ... autres configurations

    # Initialiser le chatbot
    init_chatbot()

    # Enregistrer les blueprints
    from src.routes.chatbot import chatbot_bp
    app.register_blueprint(chatbot_bp)

    return app
```

### Utilisation du service

```python
from src.services.chatbot import get_chatbot_service

# Récupérer l'instance singleton
chatbot = get_chatbot_service()

# Générer une réponse
response = chatbot.generate_response(
    user_message="Comment estimer mon bien ?",
    session_id="session-123",
    user_id=1
)

print(response['reponse'])      # Texte réponse
print(response['intent'])        # Tag intent détecté
print(response['actions'])       # Actions suggérées
print(response['confidence'])    # Score de confiance
```

---

## 🧪 Tests

### Lancer les tests

```bash
cd backend

# Tous les tests
python -m pytest tests/test_chatbot.py -v

# Tests spécifiques
python -m pytest tests/test_chatbot.py::TestChatbotService::test_find_best_intent_estimation -v

# Avec couverture
python -m pytest tests/test_chatbot.py --cov=src.services.chatbot
```

### Categories de tests

1. **Tests unitaires (Service)**
   - Prétraitement de texte
   - Calcul de similarité
   - Matching d'intents
   - Génération de réponses

2. **Tests d'intégration (API)**
   - Endpoint POST /api/v1/chat
   - Endpoint GET /api/v1/chat/health
   - Gestion des erreurs
   - Validation de structures

3. **Tests de couverture**
   - Tous les intents ont des réponses
   - Tous les intents sont atteignables

---

## 📝 Exemples d'Utilisation

### Exemple 1: Question simple

```bash
curl -X POST http://localhost:5000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Comment estimer mon bien?"}'

# Response:
{
  "status": "success",
  "data": {
    "reponse": "Vous pouvez estimer votre bien...",
    "intent": "estimation_prix",
    "actions": [
      {"type": "link", "text": "Estimer mon bien", "url": "/simulateur-pret"}
    ],
    "session_id": null,
    "confidence": 0.85,
    "timestamp": "2026-05-06T10:30:00.000000"
  }
}
```

### Exemple 2: Question avec session

```bash
curl -X POST http://localhost:5000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "quels documents pour vendre?",
    "session_id": "user-session-123"
  }'

# Response:
{
  "status": "success",
  "data": {
    "reponse": "Pour vendre un bien en France...",
    "intent": "documents_obligatoires",
    "actions": [{"type": "link", "text": "Voir la FAQ", "url": "/faq"}],
    "session_id": "user-session-123",
    "confidence": 0.90,
    "timestamp": "2026-05-06T10:31:00.000000"
  }
}
```

### Exemple 3: Question incomprise (fallback)

```bash
curl -X POST http://localhost:5000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "blablabla xyz"}'

# Response (intent = "default"):
{
  "status": "success",
  "data": {
    "reponse": "Je peux vous aider avec l'estimation de bien...",
    "intent": "default",
    "actions": [
      {"type": "link", "text": "Estimer mon bien", "url": "/simulateur-pret"},
      {"type": "link", "text": "Trouver des annonces", "url": "/matching"},
      {"type": "link", "text": "Organiser une visite", "url": "/visites"}
    ],
    "session_id": null,
    "confidence": 0.0,
    "timestamp": "2026-05-06T10:32:00.000000"
  }
}
```

---

## 🔒 Sécurité & Validation

### Validations

- Message non-vide (400 si vide)
- JSON valide (400 sinon)
- Longueur maximum du message: 5000 caractères (optionnel)

### Limitations (Rate Limiting - optionnel pour future)

Recommandé d'ajouter rate limiting:
```python
# Max 100 requests par minute par IP
limiter.limit("100/minute")(chat_endpoint)
```

---

## 📈 Métriques & Monitoring

### Métriques suggérées à tracker

- Nombre de requêtes par jour
- Intents les plus fréquents
- Score de confiance moyen
- Taux de fallback ("default" intent)
- Actions cliquées (via analytics frontend)

### Logs

Le chatbot log les opérations:
```
✅ Dataset chatbot chargé: 8 intents
✅ Chatbot chargé avec 8 intents
```

---

## 🚀 Améliorations Futures

### MVP Complet
- [ ] Persistence des sessions en base de données
- [ ] Analytics (intents les plus demandés)
- [ ] Dashboard admin pour éditer les intents
- [ ] Rate limiting

### Phase 2
- [ ] Intégration NLP (spaCy, NLTK)
- [ ] Reconnaissance d'entités (ex: "3 pièces" → surface)
- [ ] Machine Learning (amélioration du matching)
- [ ] Support multilingue (EN, ES, etc.)

### Phase 3
- [ ] Dialogue multi-tour (mémoriser le contexte)
- [ ] Intégration avec CRM (création de leads)
- [ ] Chatbot vocal (TTS/STT)

---

## 📞 Support

Pour questions ou problèmes:
- Consultez la [documentation utilisateur](CHATBOT_GUIDE.md)
- Vérifiez les [tests](../../backend/tests/test_chatbot.py)
- Contactez l'équipe support via `/contact`

---

**Dernière mise à jour:** Mai 6, 2026
**Version API:** 1.0
**Status:** Production-Ready ✅
