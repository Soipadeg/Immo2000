/**
 * chatbot.js - Logique du Chatbot Immo2000
 *
 * Gère l'interface utilisateur du chatbot flottant et communique avec l'API backend.
 */

class ChatbotManager {
    constructor() {
        // Éléments DOM
        this.toggleBtn = document.getElementById('chatbotToggle');
        this.window = document.getElementById('chatbotWindow');
        this.closeBtn = document.getElementById('chatbotClose');
        this.messagesContainer = document.getElementById('chatbotMessages');
        this.input = document.getElementById('chatbotInput');
        this.sendBtn = document.getElementById('chatbotSend');

        // État du chatbot
        this.isOpen = false;
        this.isLoading = false;
        this.sessionId = this.generateSessionId();

        // Initialiser les écouteurs d'événements
        this.initEventListeners();

        // Message de bienvenue après un délai
        this.showWelcomeMessage();
    }

    /**
     * Générer un ID de session unique
     */
    generateSessionId() {
        return `session-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }

    /**
     * Initialiser les écouteurs d'événements
     */
    initEventListeners() {
        // Bouton pour ouvrir/fermer
        this.toggleBtn.addEventListener('click', () => this.toggleWindow());

        // Bouton pour fermer
        this.closeBtn.addEventListener('click', () => this.closeWindow());

        // Envoyer le message au clic du bouton
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // Envoyer le message avec Entrée
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Focus automatique quand la fenêtre s'ouvre
        this.window.addEventListener('transitionend', () => {
            if (this.isOpen) {
                this.input.focus();
            }
        });
    }

    /**
     * Basculer l'affichage de la fenêtre
     */
    toggleWindow() {
        if (this.isOpen) {
            this.closeWindow();
        } else {
            this.openWindow();
        }
    }

    /**
     * Ouvrir la fenêtre
     */
    openWindow() {
        this.isOpen = true;
        this.window.classList.add('show');
        this.toggleBtn.classList.add('hide');
        this.input.focus();
    }

    /**
     * Fermer la fenêtre
     */
    closeWindow() {
        this.isOpen = false;
        this.window.classList.remove('show');
        this.window.classList.add('hide');
        setTimeout(() => {
            this.window.classList.remove('hide');
            this.toggleBtn.classList.remove('hide');
        }, 300);
    }

    /**
     * Afficher le message de bienvenue
     */
    showWelcomeMessage() {
        setTimeout(() => {
            if (this.messagesContainer.children.length === 0) {
                this.addBotMessage(
                    "Bonjour ! 👋 Comment puis-je vous aider aujourd'hui ?\n\nVous pouvez me poser des questions sur :\n• Estimation de biens\n• Simulateur de prêt\n• Recherche d'annonces\n• Et bien d'autres..."
                );
            }
        }, 500);
    }

    /**
     * Ajouter un message utilisateur
     */
    addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message user';

        const p = document.createElement('p');
        p.textContent = text;

        messageDiv.appendChild(p);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Ajouter un message du bot avec actions optionnelles
     */
    addBotMessage(text, actions = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message bot';

        const p = document.createElement('p');
        p.textContent = text;

        messageDiv.appendChild(p);

        // Ajouter les boutons d'action si présents
        if (actions.length > 0) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'chatbot-actions';

            actions.forEach(action => {
                const button = document.createElement('button');
                button.textContent = action.text;
                button.title = action.text;

                if (action.url) {
                    button.addEventListener('click', () => {
                        // Ouvrir le lien dans la même fenêtre
                        window.location.href = action.url;
                    });
                } else if (action.action) {
                    // Action personnalisée (callback)
                    button.addEventListener('click', action.action);
                }

                actionsDiv.appendChild(button);
            });

            messageDiv.appendChild(actionsDiv);
        }

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Afficher l'indicateur de saisie
     */
    showTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message bot';
        messageDiv.id = 'typing-indicator';

        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot-typing';

        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'chatbot-typing-dot';
            typingDiv.appendChild(dot);
        }

        messageDiv.appendChild(typingDiv);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Retirer l'indicateur de saisie
     */
    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    /**
     * Scroller vers le bas de la zone des messages
     */
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 0);
    }

    /**
     * Envoyer un message
     */
    async sendMessage() {
        const message = this.input.value.trim();

        if (!message || this.isLoading) return;

        // Vider le champ de saisie
        this.input.value = '';

        // Ajouter le message utilisateur
        this.addUserMessage(message);

        // Désactiver le bouton d'envoi
        this.isLoading = true;
        this.sendBtn.disabled = true;

        // Afficher l'indicateur de saisie
        this.showTypingIndicator();

        try {
            // Appel à l'API
            const response = await axios.post('/api/v1/chat', {
                message: message,
                session_id: this.sessionId,
                user_id: this.getUserId() // Optionnel
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Retirer l'indicateur de saisie
            this.removeTypingIndicator();

            const data = response.data;

            // Afficher la réponse du bot
            if (data.reponse) {
                const actions = data.actions ? this.parseActions(data.actions) : [];
                this.addBotMessage(data.reponse, actions);

                // Gestion des intents spécifiques
                if (data.intent === 'not_implemented') {
                    this.addBotMessage('À faire : Cette fonctionnalité sera disponible prochainement. 🚀');
                }
            } else {
                this.addBotMessage('Désolé, je n\'ai pas bien compris votre question. Pouvez-vous reformuler ?');
            }
        } catch (error) {
            console.error('Erreur lors de l\'appel à l\'API:', error);

            // Retirer l'indicateur de saisie
            this.removeTypingIndicator();

            // Afficher un message d'erreur
            if (error.response?.status === 401) {
                this.addBotMessage('Vous devez être connecté pour continuer. Veuillez vous connecter.');
            } else {
                this.addBotMessage('Désolé, une erreur est survenue. Veuillez réessayer plus tard.');
            }
        } finally {
            // Réactiver le bouton d'envoi
            this.isLoading = false;
            this.sendBtn.disabled = false;
            this.input.focus();
        }
    }

    /**
     * Récupérer l'ID utilisateur s'il est connecté
     */
    getUserId() {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                return userData.id || userData.utilisateur_id;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Parser les actions de la réponse API
     */
    parseActions(actionsData) {
        if (!Array.isArray(actionsData)) {
            return [];
        }

        return actionsData.map(action => {
            if (action.type === 'link') {
                return {
                    text: action.text,
                    url: action.url
                };
            } else if (action.type === 'action') {
                return {
                    text: action.text,
                    action: () => console.log(`Action: ${action.action}`)
                };
            }
            return action;
        });
    }
}

/**
 * Initialiser le chatbot au chargement du DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier que les éléments du chatbot existent
    if (document.getElementById('chatbotToggle')) {
        window.chatbot = new ChatbotManager();
    }
});

/**
 * Fonction utilitaire pour envoyer un message au chatbot depuis d'autres scripts
 */
function sendToChatbot(message) {
    if (window.chatbot) {
        window.chatbot.addUserMessage(message);
        // Simuler l'envoi
        window.chatbot.input.value = message;
        window.chatbot.sendMessage();
    }
}

/**
 * Fonction utilitaire pour ouvrir le chatbot
 */
function openChatbot() {
    if (window.chatbot) {
        window.chatbot.openWindow();
    }
}

/**
 * Fonction utilitaire pour fermer le chatbot
 */
function closeChatbot() {
    if (window.chatbot) {
        window.chatbot.closeWindow();
    }
}
