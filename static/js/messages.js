/**
 * messages.js - Gestion de la page des messages (boîte de réception)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Vérifier que l'utilisateur est connecté
    if (!isLoggedIn()) {
        window.location.href = 'login.html?redirect=messages.html';
        return;
    }

    // Initialiser l'interface
    initializeMessages();

    // Charger les messages quand on clique sur les onglets
    document.getElementById('inboxTab').addEventListener('click', () => {
        loadMessages('inbox');
    });

    document.getElementById('sentTab').addEventListener('click', () => {
        loadMessages('sent');
    });

    // Charger les messages de la boîte de réception par défaut
    loadMessages('inbox');
});

/**
 * Initialise l'interface des messages
 */
function initializeMessages() {
    const currentUser = getCurrentUser();

    // Afficher le nom de l'utilisateur
    if (currentUser && currentUser.prenom) {
        document.getElementById('userName').textContent = currentUser.prenom;
    }

    // Ajouter l'événement pour le bouton de déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

/**
 * Charge les messages (inbox ou sent)
 */
async function loadMessages(folder) {
    showLoadingSpinner();

    try {
        const token = getAuthToken();
        const response = await axios.get(`/api/v1/messages?folder=${folder}&limit=50`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const messages = response.data.messages || [];
        displayMessages(messages, folder);
        hideLoadingSpinner();

    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        hideLoadingSpinner();

        let errorMessage = 'Erreur lors du chargement des messages';
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error;
        }

        showErrorMessage(errorMessage);
    }
}

/**
 * Affiche les messages
 */
function displayMessages(messages, folder) {
    const containerId = folder === 'inbox' ? 'inboxContainer' : 'sentContainer';
    const container = document.getElementById(containerId);

    if (!container) return;

    // Si aucun message
    if (messages.length === 0) {
        const emptyIcon = folder === 'inbox' ? 'inbox' : 'paper-plane';
        const emptyText = folder === 'inbox' ? 'Aucun message reçu' : 'Aucun message envoyé';

        container.innerHTML = `
            <div class="col-12">
                <div class="text-center text-muted py-5">
                    <i class="fas fa-${emptyIcon}" style="font-size: 48px; margin-bottom: 1rem;"></i>
                    <p>${emptyText} pour le moment</p>
                </div>
            </div>
        `;
        return;
    }

    // Afficher les messages
    container.innerHTML = messages.map(msg => `
        <div class="col-12 mb-3">
            <div class="card message-card" style="cursor: pointer;">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h6 class="card-title mb-2">
                                ${folder === 'inbox' ?
                                    `<strong>De :</strong> ${msg.sender_name || 'Utilisateur inconnu'}` :
                                    `<strong>À :</strong> ${msg.receiver_name || 'Utilisateur inconnu'}`
                                }
                            </h6>
                            <p class="card-text mb-2">
                                <strong>Annonce :</strong> ${msg.annonce_titre || 'Annonce supprimée'}
                            </p>
                            <p class="card-text text-muted mb-0">
                                ${msg.contenu.substring(0, 100)}${msg.contenu.length > 100 ? '...' : ''}
                            </p>
                        </div>
                        <div class="col-md-4 text-end">
                            <small class="text-muted d-block mb-2">
                                ${formatDateRelative(msg.date_creation)}
                            </small>
                            ${folder === 'inbox' && !msg.lu ?
                                `<span class="badge bg-primary">Nouveau</span>` :
                                ''
                            }
                            <button class="btn btn-sm btn-outline-primary mt-2 message-detail-btn"
                                    data-message-id="${msg.message_id}"
                                    data-folder="${folder}">
                                <i class="fas fa-eye"></i> Lire
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Ajouter les événements pour voir les détails
    document.querySelectorAll('.message-detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const messageId = btn.dataset.messageId;
            const folderType = btn.dataset.folder;
            viewMessageDetail(messageId, folderType);
        });
    });
}

/**
 * Affiche les détails d'un message
 */
async function viewMessageDetail(messageId, folder) {
    try {
        const token = getAuthToken();
        const response = await axios.get(`/api/v1/messages/${messageId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const msg = response.data;

        // Marquer comme lu si c'est un message reçu
        if (folder === 'inbox' && !msg.lu) {
            await markMessageAsRead(messageId, token);
        }

        // Afficher le contenu dans la modale
        const detailHTML = `
            <div>
                <p class="mb-3">
                    <strong>${folder === 'inbox' ? 'De :' : 'À :'}</strong>
                    ${folder === 'inbox' ? msg.sender_name : msg.receiver_name}
                </p>
                <p class="mb-3">
                    <strong>Annonce :</strong>
                    <a href="matching.html?annonce_id=${msg.annonce_id}" target="_blank">
                        ${msg.annonce_titre}
                    </a>
                </p>
                <p class="mb-3">
                    <strong>Date :</strong>
                    ${formatDate(msg.date_creation)}
                </p>
                <hr>
                <div class="bg-light p-3 rounded mb-3">
                    <p class="mb-0" style="white-space: pre-wrap;">${msg.contenu}</p>
                </div>
                <div class="d-grid gap-2">
                    <button class="btn btn-primary" id="replyBtn" data-message-id="${msg.message_id}" data-sender-id="${msg.sender_id}" data-receiver-id="${msg.receiver_id}" data-annonce-id="${msg.annonce_id}">
                        <i class="fas fa-reply"></i> Répondre
                    </button>
                    <button class="btn btn-outline-danger" id="deleteBtn" data-message-id="${msg.message_id}">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('messageDetailModal'));
        document.getElementById('messageDetailBody').innerHTML = detailHTML;
        modal.show();

        // Ajouter les événements
        document.getElementById('replyBtn').addEventListener('click', (e) => {
            e.preventDefault();
            const senderId = parseInt(e.target.dataset.senderId);
            const receiverId = parseInt(e.target.dataset.receiverId);
            const annonceId = parseInt(e.target.dataset.annonceId);
            const currentUser = getCurrentUser();

            // Déterminer qui est le destinataire de la réponse
            const replySenderId = currentUser.utilisateur_id;
            const replyReceiverId = folder === 'inbox' ? senderId : receiverId;

            // Fermer la modale et ouvrir la modale de réponse
            modal.hide();
            openReplyModal(annonceId, replyReceiverId);
        });

        document.getElementById('deleteBtn').addEventListener('click', async (e) => {
            e.preventDefault();
            const msgId = parseInt(e.target.dataset.messageId);
            await deleteMessage(msgId, token);
        });

    } catch (error) {
        console.error('Erreur lors du chargement du message:', error);
        showErrorMessage('Erreur lors du chargement du message');
    }
}

/**
 * Marquer un message comme lu
 */
async function markMessageAsRead(messageId, token) {
    try {
        await axios.put(`/api/v1/messages/${messageId}/read`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Erreur lors du marquage du message:', error);
    }
}

/**
 * Ouvre la modale de réponse
 */
function openReplyModal(annonceId, receiverId) {
    const replyHTML = `
        <div>
            <div id="replyErrorMessage"></div>

            <form id="replyForm">
                <div class="form-group mb-3">
                    <label for="replyMessage" class="form-label">Votre réponse</label>
                    <textarea class="form-control" id="replyMessage" name="message" rows="5" placeholder="Écrivez votre réponse..." required></textarea>
                    <small class="form-text text-muted">Max 2000 caractères</small>
                </div>

                <div class="d-grid gap-2">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Envoyer la réponse
                    </button>
                </div>
            </form>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('messageDetailModal'));
    document.getElementById('messageDetailBody').innerHTML = replyHTML;
    modal.show();

    document.getElementById('replyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = document.getElementById('replyMessage').value.trim();

        if (!message) {
            showErrorMessage('Le message ne peut pas être vide', 'replyErrorMessage');
            return;
        }

        await sendReplyMessage(annonceId, receiverId, message);
        modal.hide();
        loadMessages('sent');
    });
}

/**
 * Envoie une réponse
 */
async function sendReplyMessage(annonceId, receiverId, message) {
    try {
        const token = getAuthToken();

        await axios.post('/api/v1/messages', {
            receiver_id: receiverId,
            annonce_id: annonceId,
            contenu: message
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        showModal('Succès', `
            <div class="text-center">
                <i class="fas fa-check-circle text-success" style="font-size: 48px; margin-bottom: 1rem;"></i>
                <h5>Réponse envoyée !</h5>
                <p class="text-muted">Votre réponse a été envoyée avec succès.</p>
            </div>
        `);

    } catch (error) {
        console.error('Erreur lors de l\'envoi de la réponse:', error);
        showErrorMessage('Erreur lors de l\'envoi de la réponse');
    }
}

/**
 * Supprime un message
 */
async function deleteMessage(messageId, token) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        return;
    }

    try {
        await axios.delete(`/api/v1/messages/${messageId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        showModal('Message supprimé', `
            <div class="text-center">
                <i class="fas fa-check-circle text-success" style="font-size: 48px; margin-bottom: 1rem;"></i>
                <h5>Message supprimé</h5>
                <p class="text-muted">Le message a été supprimé avec succès.</p>
            </div>
        `);

        // Fermer la modale et recharger les messages
        setTimeout(() => {
            bootstrap.Modal.getInstance(document.getElementById('messageDetailModal')).hide();
            const activeTab = document.querySelector('.nav-link.active').id;
            const folder = activeTab === 'inboxTab' ? 'inbox' : 'sent';
            loadMessages(folder);
        }, 1500);

    } catch (error) {
        console.error('Erreur lors de la suppression du message:', error);
        showErrorMessage('Erreur lors de la suppression du message');
    }
}

/**
 * Formate une date relative (ex: "il y a 2 heures")
 */
function formatDateRelative(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) {
        return 'À l\'instant';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `il y a ${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `il y a ${hours}h`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `il y a ${days}j`;
    }

    // Sinon afficher la date formatée
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}
