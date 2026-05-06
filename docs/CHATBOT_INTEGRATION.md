# Intégration du Chatbot Immo2000

## 📋 Vue d'ensemble

Le chatbot Immo2000 est un assistant conversationnel flottant qui offre une expérience utilisateur interactive sur toutes les pages du site. Il permet aux utilisateurs de poser des questions et de recevoir des réponses en temps réel via l'API backend.

## 🎯 Caractéristiques principales

### Interface utilisateur
- **Bouton flottant** : Bouton circulaire avec icône chat (coin inférieur droit)
- **Fenêtre expandable** : Affiche en plein écran sur mobile, 380x550px sur desktop
- **Messages en temps réel** : Affichage instantané des messages utilisateur et bot
- **Actions interactives** : Boutons navigables pour les appels à l'action
- **Indicateur de saisie** : Animation pendant la réponse du bot

### Caractéristiques techniques
- **Session unique** : ID de session généré automatiquement par session
- **API intégrée** : Communication avec `/api/v1/chat`
- **Gestion des états** : Chargement, erreurs, succès
- **Responsive** : Adaptation complète mobile/desktop
- **Accessibilité** : Support keyboard, focus management

## 📁 Structure des fichiers

```
/static/
├── js/
│   ├── chatbot.js (350+ lines)      # Logique du chatbot
│   ├── app.js                        # Utilitaires globaux
│   ├── dashboard.js                  # Page tableau de bord
│   ├── matching.js                   # Page recherche
│   └── simulateur_pret.js            # Page simulateur
├── css/
│   ├── chatbot.css (700+ lines)     # Styling complet
│   └── style.css                     # Styles globaux
└── [7 HTML pages with chatbot]
```

## 🔧 API Endpoint

### POST `/api/v1/chat`

**Request:**
```json
{
    "message": "Bonjour, comment fonctionnne le matching ?",
    "session_id": "session-1234567890-5678",
    "user_id": null  // optionnel, si utilisateur connecté
}
```

**Response:**
```json
{
    "reponse": "Le matching est une fonctionnalité...",
    "intent": "feature_info",
    "actions": [
        {
            "type": "link",
            "text": "Essayer maintenant",
            "url": "/matching.html"
        },
        {
            "type": "action",
            "text": "Annuler",
            "action": "close"
        }
    ]
}
```

**Codes d'erreur:**
- `401`: Non autorisé (authentification requise)
- `400`: Requête invalide
- `500`: Erreur serveur

## 🚀 Utilisation

### Initialisation automatique

Le chatbot s'initialise automatiquement au chargement de la page:

```javascript
// Exécuté au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chatbotToggle')) {
        window.chatbot = new ChatbotManager();
    }
});
```

### Fonctions utilitaires globales

**Envoyer un message programmatiquement:**
```javascript
sendToChatbot("Quelle est votre politique de confidentialité ?");
```

**Ouvrir le chatbot:**
```javascript
openChatbot();
```

**Fermer le chatbot:**
```javascript
closeChatbot();
```

### Accès à l'instance chatbot

```javascript
if (window.chatbot) {
    // Ajouter un message utilisateur
    window.chatbot.addUserMessage("Mon message");

    // Ajouter un message bot avec actions
    window.chatbot.addBotMessage("Réponse", [
        { text: "Action 1", url: "/path" },
        { text: "Action 2", url: "/path" }
    ]);

    // Ouvrir/fermer la fenêtre
    window.chatbot.openWindow();
    window.chatbot.closeWindow();

    // Accéder à l'ID de session
    console.log(window.chatbot.sessionId);
}
```

## 🎨 Personnalisation

### Couleurs et thème

Modifier dans `/static/css/chatbot.css`:

```css
/* Couleur primaire (bouton, messages bot) */
.chatbot-toggle {
    background: linear-gradient(135deg, #2E86C1, #1A4C7A);
}

/* Couleur messages utilisateur */
.chatbot-message.user {
    background-color: #2E86C1;
}

/* Couleur messages bot */
.chatbot-message.bot {
    background-color: #e9ecef;
}
```

### Messages de bienvenue

Modifier dans `/static/js/chatbot.js`:

```javascript
showWelcomeMessage() {
    setTimeout(() => {
        if (this.messagesContainer.children.length === 0) {
            this.addBotMessage("Votre message de bienvenue personnalisé");
        }
    }, 500);
}
```

### Texte du placeholder

Modifier dans les fichiers HTML (tous les 7 fichiers):

```html
<input type="text" id="chatbotInput"
       placeholder="Posez votre question..."
       autocomplete="off">
```

## 🧪 Tests

### Test manuel
1. Ouvrir n'importe quelle page du site
2. Cliquer sur le bouton chat (coin bas-droit)
3. Taper un message
4. Vérifier la réponse du bot
5. Tester les boutons d'action

### Test des erreurs API
```javascript
// Vérifier que les erreurs 401 affichent le bon message
// Vérifier que les erreurs 500 affichent un message d'erreur
// Vérifier que les timeouts affichent un message approprié
```

### Test responsive
- **Desktop** (1200px+) : Fenêtre 380x550px
- **Tablette** (768px-1199px) : Fenêtre légèrement réduite
- **Mobile** (<768px) : Fenêtre plein écran

## 🔌 Intégration avec le backend

### Attentes du backend

Le backend doit implémenter `POST /api/v1/chat` avec:

1. **Parsing du message**
   - Détection d'intent (feature_info, help, estimation, etc.)
   - Génération de réponse appropriée

2. **Actions associées**
   - Liens de navigation (matching, simulateur, etc.)
   - Actions d'appel (close, minimize, etc.)

3. **Gestion de session**
   - Persister le contexte de conversation (optionnel)
   - Tracker les intents utilisateur pour amélioration

### Exemple d'implémentation Flask

```python
@app.route('/api/v1/chat', methods=['POST'])
@handle_errors
def chat():
    data = request.json
    message = data.get('message', '')
    session_id = data.get('session_id')
    user_id = data.get('user_id')

    # Traiter le message
    intent = detect_intent(message)
    response = generate_response(intent, message, user_id)
    actions = get_actions_for_intent(intent)

    return jsonify({
        'reponse': response,
        'intent': intent,
        'actions': actions
    })
```

## ⚙️ Configuration

### Variables d'environnement

Aucune variable d'environnement requise. Le chatbot utilise:
- URL API relative : `/api/v1/chat`
- Port défaut : Flask 5000
- Adaptable via `axios.post()` dans chatbot.js

### CORS

Assurez-vous que CORS est configuré pour accepter:
- **Origin**: `http://localhost:5000` (dev), domaine en production
- **Methods**: `POST`
- **Headers**: `Content-Type`

## 📝 Logs et débogage

### Console logs
Le chatbot log les informations de débogage:

```javascript
console.error('Erreur lors de l\'appel à l\'API:', error);
// Logs lors de chaque message envoyé
// Logs des intents détectés
```

### Inspection de l'état
```javascript
console.log(window.chatbot.sessionId);  // ID de session
console.log(window.chatbot.isOpen);      // État fenêtre
console.log(window.chatbot.isLoading);   // État requête API
```

## 🐛 Troubleshooting

### Le chatbot ne s'affiche pas
- Vérifier que `chatbot.css` est chargé (F12 > Network)
- Vérifier que `chatbot.js` est chargé (F12 > Console)
- Vérifier les erreurs JavaScript (F12 > Console)

### Les messages n'arrivent pas
- Vérifier la réponse API (F12 > Network > chat)
- Vérifier que `/api/v1/chat` existe et répond
- Vérifier CORS headers

### Styling cassé
- Vérifier le navigateur (Chrome, Firefox, Safari)
- Vérifier les conflits CSS avec `style.css`
- Utiliser les media queries (mobile breakpoints)

### Performance
- Le chatbot utilise querySelector (efficace)
- Pas de problème de memory leak (listeners gérés)
- Scroll performance optimisé

## 📚 Références

### MDN Documentation
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Event Listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventListener)
- [CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/transition)

### Axios Documentation
- [POST requests](https://axios-http.com/docs/requests)
- [Error handling](https://axios-http.com/docs/handling_errors)

## ✅ Checklist de déploiement

- [ ] ChatbotManager classe instantiée
- [ ] HTML ajouté aux 7 pages
- [ ] CSS chargé correctement
- [ ] JS loaded en dernier
- [ ] API endpoint implémentée
- [ ] CORS configuré
- [ ] Messages de bienvenue apparaissent
- [ ] Messages d'erreur affichés correctement
- [ ] Actions navigables fonctionnent
- [ ] Mobile responsive
- [ ] Animations fluides
- [ ] Pas d'erreurs JavaScript
- [ ] Session ID généré uniquement

## 🎓 Exemple d'intégration personnalisée

Pour envoyer un message au chatbot depuis une autre page:

```javascript
// Dans matching.js ou autre page
document.addEventListener('DOMContentLoaded', () => {
    // Après que le chatbot est initialisé
    setTimeout(() => {
        sendToChatbot("Je cherche un appartement à Paris");
    }, 1000);
});
```

Pour ajouter des actions au chatbot après réception:

```javascript
// Modifier chatbot.js parseActions()
parseActions(actionsData) {
    return actionsData.map(action => {
        if (action.type === 'custom_action') {
            return {
                text: action.text,
                action: () => {
                    // Logique personnalisée
                    myCustomFunction(action.data);
                }
            };
        }
        // ... autres types
    });
}
```

## 📞 Support

Pour toute question ou problème:
1. Vérifier les logs JavaScript (F12)
2. Vérifier les réponses API (F12 Network)
3. Consulter cette documentation
4. Lancer les tests de débogage

---

**Version**: 1.0
**Dernier update**: 2024
**Status**: Production Ready ✅
