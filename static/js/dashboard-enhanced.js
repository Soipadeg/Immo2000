/**
 * dashboard-enhanced.js - Tableau de bord amélioré pour les vendeurs
 *
 * Fonctionnalités:
 * - Gestion complète des annonces
 * - Suivi des visites et offres
 * - Documents partagés
 * - Analytics des vues
 * - Historique de contact
 */

document.addEventListener('DOMContentLoaded', () => {
    // Vérifier l'authentification
    if (!isLoggedIn()) {
        window.location.href = 'login.html?redirect=dashboard.html';
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
        showErrorMessage('Erreur: Utilisateur non trouvé');
        return;
    }

    // Initialiser le dashboard
    initializeDashboard();
});

/**
 * Initialise le dashboard
 */
async function initializeDashboard() {
    try {
        // Charger les données principales
        await loadAnnonces();
        await loadStatsGlobales();
        await loadVisites();
        await loadOffres();
        await loadMessages();

        // Initialiser les événements
        initializeEvents();

    } catch (error) {
        console.error('Erreur lors de l\'initialisation du dashboard:', error);
        showErrorMessage('Erreur lors du chargement du dashboard');
    }
}

/**
 * Charge les annonces du vendeur
 */
async function loadAnnonces() {
    try {
        const token = getAuthToken();
        const response = await axios.get('/api/v1/annonces?limit=100', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const annonces = response.data.items || [];
        displayAnnonces(annonces);

        return annonces;
    } catch (error) {
        console.error('Erreur lors du chargement des annonces:', error);
        return [];
    }
}

/**
 * Affiche les annonces dans le tableau
 */
function displayAnnonces(annonces) {
    const container = document.getElementById('annoncesListContainer');
    if (!container) return;

    if (annonces.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox" style="font-size: 48px; color: #ccc;"></i>
                <p class="text-muted mt-2">Vous n'avez pas encore créé d'annonce</p>
                <button class="btn btn-primary mt-3" id="createFirstAnnonce">
                    <i class="fas fa-plus"></i> Créer ma première annonce
                </button>
            </div>
        `;

        document.getElementById('createFirstAnnonce')?.addEventListener('click', () => {
            window.location.href = '/create-annonce.html';
        });
        return;
    }

    container.innerHTML = annonces.map(annonce => `
        <div class="annonce-item">
            <div class="annonce-item-header">
                <div class="annonce-title-section">
                    <h6 class="mb-2">${annonce.titre}</h6>
                    <small class="text-muted">
                        <i class="fas fa-map-marker-alt"></i> ${annonce.adresse}
                    </small>
                </div>
                <span class="annonce-status-badge status-${annonce.statut || 'publiee'}">
                    ${getStatusLabel(annonce.statut)}
                </span>
            </div>

            <div class="annonce-stats-row">
                <div class="annonce-stat">
                    <span class="annonce-stat-icon"><i class="fas fa-eye"></i></span>
                    <div>
                        <div class="annonce-stat-value" id="vues-${annonce.annonce_id}">0</div>
                        <div class="annonce-stat-label">Vues</div>
                    </div>
                </div>
                <div class="annonce-stat">
                    <span class="annonce-stat-icon"><i class="fas fa-envelope"></i></span>
                    <div>
                        <div class="annonce-stat-value" id="messages-${annonce.annonce_id}">0</div>
                        <div class="annonce-stat-label">Messages</div>
                    </div>
                </div>
                <div class="annonce-stat">
                    <span class="annonce-stat-icon"><i class="fas fa-heart"></i></span>
                    <div>
                        <div class="annonce-stat-value" id="favoris-${annonce.annonce_id}">0</div>
                        <div class="annonce-stat-label">Favoris</div>
                    </div>
                </div>
                <div class="annonce-stat">
                    <span class="annonce-stat-icon"><i class="fas fa-calendar"></i></span>
                    <div>
                        <div class="annonce-stat-value" id="visites-${annonce.annonce_id}">0</div>
                        <div class="annonce-stat-label">Visites</div>
                    </div>
                </div>
                <div class="annonce-stat">
                    <span class="annonce-stat-icon"><i class="fas fa-tag"></i></span>
                    <div>
                        <div class="annonce-stat-value">${formatCurrency(annonce.prix)}</div>
                        <div class="annonce-stat-label">Prix</div>
                    </div>
                </div>
            </div>

            <div class="annonce-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="viewAnnonce(${annonce.annonce_id})">
                    <i class="fas fa-eye"></i> Voir
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="editAnnonce(${annonce.annonce_id})">
                    <i class="fas fa-edit"></i> Éditer
                </button>
                <button class="btn btn-sm btn-outline-info" onclick="viewAnnounceStats(${annonce.annonce_id})">
                    <i class="fas fa-chart-bar"></i> Stats
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAnnonce(${annonce.annonce_id})">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `).join('');

    // Charger les stats pour chaque annonce
    annonces.forEach(annonce => {
        loadAnnounceStats(annonce.annonce_id);
    });
}

/**
 * Charge les stats globales
 */
async function loadStatsGlobales() {
    try {
        const token = getAuthToken();
        const currentUser = getCurrentUser();

        // Charger les statistiques via API
        const statsResponse = await axios.get(`/api/v1/vendeur/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const stats = statsResponse.data;

        // Mettre à jour les cartes de stats
        document.getElementById('statsActiveAnnonces').textContent = stats.active_annonces || 0;
        document.getElementById('statsTotalVues').textContent = stats.total_vues || 0;
        document.getElementById('statsMessagesNonLus').textContent = stats.messages_non_lus || 0;
        document.getElementById('statsVisitesAVenir').textContent = stats.visites_a_venir || 0;
        document.getElementById('statsOffres').textContent = stats.offres_en_attente || 0;
        document.getElementById('statsBiennexProche').textContent = stats.biens_vendus || 0;

    } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
        // Les stats restent à 0 (valeur par défaut)
    }
}

/**
 * Charge les stats pour une annonce spécifique
 */
async function loadAnnounceStats(annonceId) {
    try {
        const token = getAuthToken();
        const response = await axios.get(`/api/v1/annonces/${annonceId}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const stats = response.data;
        document.getElementById(`vues-${annonceId}`).textContent = stats.vues || 0;
        document.getElementById(`messages-${annonceId}`).textContent = stats.messages || 0;
        document.getElementById(`favoris-${annonceId}`).textContent = stats.favoris || 0;
        document.getElementById(`visites-${annonceId}`).textContent = stats.visites || 0;

    } catch (error) {
        console.error(`Erreur lors du chargement des stats pour annonce ${annonceId}:`, error);
    }
}

/**
 * Charge les visites planifiées
 */
async function loadVisites() {
    try {
        const token = getAuthToken();
        const response = await axios.get('/api/v1/visites?statut=confirmee&limit=10', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const visites = response.data.items || [];
        displayVisites(visites);

    } catch (error) {
        console.error('Erreur lors du chargement des visites:', error);
    }
}

/**
 * Affiche les visites planifiées
 */
function displayVisites(visites) {
    const container = document.getElementById('visitesCalendar');
    if (!container) return;

    if (visites.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-calendar-alt" style="font-size: 48px; color: #ccc;"></i>
                <p class="text-muted mt-2">Aucune visite prévue</p>
            </div>
        `;
        return;
    }

    container.innerHTML = visites.map(visite => `
        <div class="visite-item upcoming">
            <div class="visite-title">${visite.bien_titre}</div>
            <div class="visite-date">
                <i class="fas fa-calendar"></i> ${formatDate(visite.date_visite)}
            </div>
            <div class="visite-visiteur">
                <i class="fas fa-user"></i> ${visite.visiteur_name}
            </div>
            <small class="text-muted">${visite.email_visiteur}</small>
        </div>
    `).join('');
}

/**
 * Charge les offres reçues
 */
async function loadOffres() {
    try {
        const token = getAuthToken();
        const response = await axios.get('/api/v1/offres?limit=10', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const offres = response.data.items || [];
        displayOffres(offres);

    } catch (error) {
        console.error('Erreur lors du chargement des offres:', error);
    }
}

/**
 * Affiche les offres reçues
 */
function displayOffres(offres) {
    const container = document.getElementById('offresContainer');
    if (!container) return;

    if (offres.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-envelope" style="font-size: 48px; color: #ccc;"></i>
                <p class="text-muted mt-2">Aucune offre pour le moment</p>
            </div>
        `;
        return;
    }

    container.innerHTML = offres.map(offre => `
        <div class="offre-item ${offre.statut}">
            <div class="offre-header">
                <div class="offre-title">${offre.bien_titre}</div>
                <span class="badge bg-${getOffresStatusColor(offre.statut)}">
                    ${getOffresStatusLabel(offre.statut)}
                </span>
            </div>
            <div class="offre-acheteur">
                <i class="fas fa-user"></i> ${offre.acheteur_name}
            </div>
            <div class="offre-date">
                <strong>${formatCurrency(offre.prix_propose)}</strong> - ${formatDate(offre.date_offre)}
            </div>
            <small class="text-muted">${offre.message ? offre.message.substring(0, 100) + '...' : ''}</small>
        </div>
    `).join('');
}

/**
 * Charge les messages récents
 */
async function loadMessages() {
    try {
        const token = getAuthToken();
        const response = await axios.get('/api/v1/messages?folder=inbox&limit=5', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const messages = response.data.messages || [];
        displayMessages(messages);

    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
    }
}

/**
 * Affiche les messages récents
 */
function displayMessages(messages) {
    const container = document.getElementById('messagesRecentContainer');
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-comments" style="font-size: 48px; color: #ccc;"></i>
                <p class="text-muted mt-2">Aucun message</p>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(msg => `
        <div class="message-item">
            <div class="message-sender">${msg.sender_name}</div>
            <div class="message-preview">${msg.contenu.substring(0, 80)}...</div>
            <div class="message-meta">
                <span><i class="fas fa-building"></i> ${msg.annonce_titre}</span>
                <span>${formatDateRelative(msg.date_creation)}</span>
                ${!msg.lu ? '<span class="badge bg-danger">Nouveau</span>' : ''}
            </div>
        </div>
    `).join('');
}

/**
 * Initialise les événements
 */
function initializeEvents() {
    // Bouton créer annonce
    document.getElementById('createAnnonceBtn')?.addEventListener('click', () => {
        window.location.href = '/create-annonce.html';
    });

    // Bouton upload document
    document.getElementById('uploadDocBtn')?.addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('uploadDocModal'));
        modal.show();
    });

    // Appliquer les filtres
    document.getElementById('applyFilters')?.addEventListener('click', () => {
        applyFilters();
    });

    // Soumettre le document
    document.getElementById('submitDocBtn')?.addEventListener('click', () => {
        submitDocument();
    });
}

/**
 * Applique les filtres de recherche
 */
async function applyFilters() {
    const status = document.getElementById('filterStatus').value;
    const sortBy = document.getElementById('sortBy').value;
    const search = document.getElementById('searchAnnonce').value;

    // Recharger les annonces avec les filtres
    const annonces = await loadAnnonces();

    let filtered = annonces;

    // Filtre par statut
    if (status) {
        filtered = filtered.filter(a => a.statut === status);
    }

    // Filtre par recherche
    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(a =>
            a.titre.toLowerCase().includes(searchLower) ||
            a.adresse.toLowerCase().includes(searchLower)
        );
    }

    // Tri
    if (sortBy === 'vues') {
        // Serait nécessaire d'avoir les vues en cache
    } else if (sortBy === 'prix') {
        filtered.sort((a, b) => a.prix - b.prix);
    }

    displayAnnonces(filtered);
}

/**
 * Soumet un document
 */
async function submitDocument() {
    const annonceId = document.getElementById('selectAnnonce').value;
    const docType = document.getElementById('documentType').value;
    const fileInput = document.getElementById('fileInput');

    if (!annonceId || !fileInput.files.length) {
        showErrorMessage('Veuillez sélectionner une annonce et un fichier');
        return;
    }

    // Upload du fichier
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('type', docType);
    formData.append('annonce_id', annonceId);

    try {
        const token = getAuthToken();
        await axios.post('/api/v1/documents', formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        showSuccessMessage('Document uploadé avec succès');
        bootstrap.Modal.getInstance(document.getElementById('uploadDocModal')).hide();

        // Recharger les documents
        loadDocuments();

    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        showErrorMessage('Erreur lors de l\'upload du document');
    }
}

/**
 * Charge les documents partagés
 */
async function loadDocuments() {
    try {
        const token = getAuthToken();
        const response = await axios.get('/api/v1/documents?limit=20', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const documents = response.data.items || [];
        displayDocuments(documents);

    } catch (error) {
        console.error('Erreur lors du chargement des documents:', error);
    }
}

/**
 * Affiche les documents partagés
 */
function displayDocuments(documents) {
    const container = document.getElementById('documentsContainer');
    if (!container) return;

    if (documents.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-file" style="font-size: 48px; color: #ccc;"></i>
                <p class="text-muted mt-2">Aucun document partagé</p>
            </div>
        `;
        return;
    }

    container.innerHTML = documents.map(doc => `
        <div class="document-item">
            <div class="document-info">
                <div class="document-icon">
                    ${getDocumentIcon(doc.type)}
                </div>
                <div class="document-details">
                    <div class="document-name">${doc.nom}</div>
                    <div class="document-meta">
                        <span class="document-type">${getDocumentTypeLabel(doc.type)}</span>
                        <span class="document-size">${formatFileSize(doc.taille)}</span>
                        <span class="text-muted">${formatDate(doc.date_upload)}</span>
                    </div>
                </div>
            </div>
            <div class="document-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="downloadDocument(${doc.document_id})">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteDocument(${doc.document_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

/* ===== HELPER FUNCTIONS ===== */

function getStatusLabel(status) {
    const labels = {
        'publiee': '✓ Publiée',
        'brouillon': '✏ Brouillon',
        'vendue': '✓ Vendue',
        'archivee': '📦 Archivée'
    };
    return labels[status] || status;
}

function getOffresStatusColor(status) {
    const colors = {
        'proposee': 'warning',
        'acceptee': 'success',
        'refusee': 'danger',
        'negociation': 'info',
        'retiree': 'secondary',
        'finalisee': 'success'
    };
    return colors[status] || 'secondary';
}

function getOffresStatusLabel(status) {
    const labels = {
        'proposee': 'En attente',
        'acceptee': 'Acceptée',
        'refusee': 'Refusée',
        'negociation': 'Négociation',
        'retiree': 'Retirée',
        'finalisee': 'Finalisée'
    };
    return labels[status] || status;
}

function getDocumentIcon(type) {
    const icons = {
        'compromis': '<i class="fas fa-file-signature"></i>',
        'diagnostic_dpe': '<i class="fas fa-leaf"></i>',
        'photos': '<i class="fas fa-images"></i>',
        'video': '<i class="fas fa-video"></i>',
        'plan_etage': '<i class="fas fa-map"></i>',
        'autres': '<i class="fas fa-file"></i>'
    };
    return icons[type] || icons['autres'];
}

function getDocumentTypeLabel(type) {
    const labels = {
        'compromis': 'Compromis',
        'diagnostic_dpe': 'DPE',
        'diagnostic_amiante': 'Amiante',
        'diagnostic_electrique': 'Électrique',
        'diagnostic_gaz': 'Gaz',
        'diagnostic_plomb': 'Plomb',
        'attestation_assurance': 'Assurance',
        'certification_travaux': 'Travaux',
        'plan_etage': 'Plan',
        'photos': 'Photos',
        'video': 'Vidéo',
        'autres': 'Autres'
    };
    return labels[type] || type;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDateRelative(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'À l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days}j`;

    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// Stubs pour les fonctions non implémentées
function viewAnnonce(id) { window.location.href = `/annonce/${id}`; }
function editAnnonce(id) { window.location.href = `/edit-annonce/${id}`; }
function deleteAnnonce(id) { if (confirm('Supprimer cette annonce?')) console.log('Deleting annonce', id); }
function viewAnnounceStats(id) { console.log('Viewing stats for annonce', id); }
function downloadDocument(id) { console.log('Downloading document', id); }
function deleteDocument(id) { if (confirm('Supprimer ce document?')) console.log('Deleting document', id); }
