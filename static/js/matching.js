/**
 * matching.js - Logique du Matching
 */

document.addEventListener('DOMContentLoaded', () => {
    const filterForm = document.getElementById('filterForm');

    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            performSearch();
        });
    }
});

/**
 * Effectue la recherche avec les filtres
 */
async function performSearch() {
    const currentUser = getCurrentUser();

    // Si l'utilisateur n'est pas connecté, afficher un message
    if (!currentUser) {
        showErrorMessage('Vous devez être connecté pour effectuer une recherche');
        return;
    }

    const filters = {
        acheteur_id: currentUser.id,
        city: document.getElementById('city').value,
        budget_max: document.getElementById('budgetMax').value ? parseInt(document.getElementById('budgetMax').value) : null,
        surface_min: document.getElementById('surfaceMin').value ? parseInt(document.getElementById('surfaceMin').value) : null,
        property_type: document.getElementById('propertyType').value || null
    };

    showLoadingSpinner();

    try {
        const response = await axios.post('/matching', filters);

        displayResults(response.data.annonces || []);
        hideLoadingSpinner();
    } catch (error) {
        hideLoadingSpinner();
        console.error('Erreur lors de la recherche:', error);

        let errorMessage = 'Erreur lors de la recherche des biens';
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        }

        showErrorMessage(errorMessage);
    }
}

/**
 * Affiche les résultats de la recherche
 */
function displayResults(annonces) {
    const resultsList = document.getElementById('resultsList');
    const resultCount = document.getElementById('resultCount');

    if (!resultsList) return;

    // Mise à jour du compteur
    if (resultCount) {
        resultCount.textContent = annonces.length;
    }

    // Si aucun résultat
    if (annonces.length === 0) {
        resultsList.innerHTML = `
            <div class="col-12">
                <div class="no-results">
                    <i class="fas fa-inbox"></i>
                    <p class="mt-2">Aucun bien ne correspond à vos critères.</p>
                    <p class="text-muted">Essayez d'élargir vos filtres ou réessayez plus tard.</p>
                </div>
            </div>
        `;
        return;
    }

    // Affiche les résultats
    resultsList.innerHTML = annonces.map(annonce => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
                <!-- Image de la propriété -->
                <div style="position: relative; height: 250px; overflow: hidden;">
                    <img src="${annonce.image || '/static/images/default-house.jpg'}"
                         class="card-img-top"
                         alt="${annonce.titre}"
                         style="width: 100%; height: 100%; object-fit: cover;">
                    ${annonce.score ? `
                        <span class="badge bg-primary" style="position: absolute; top: 10px; right: 10px;">
                            Score: ${(annonce.score * 100).toFixed(0)}%
                        </span>
                    ` : ''}
                </div>

                <!-- Contenu de la carte -->
                <div class="card-body">
                    <h5 class="card-title">${annonce.titre}</h5>

                    <!-- Adresse -->
                    <p class="card-text text-muted mb-2">
                        <i class="fas fa-map-marker-alt"></i> ${annonce.adresse}
                    </p>

                    <!-- Informations principales -->
                    <div class="mb-3">
                        <h4 class="text-primary mb-2">${formatCurrency(annonce.prix)}</h4>
                        <small class="text-muted d-block mb-1">
                            <i class="fas fa-ruler-combined"></i> ${annonce.surface}m²
                        </small>
                        <small class="text-muted d-block">
                            <i class="fas fa-door-open"></i> ${annonce.pieces} pièce(s)
                        </small>
                    </div>

                    <!-- Description -->
                    ${annonce.description ? `
                        <p class="card-text small">${annonce.description.substring(0, 100)}...</p>
                    ` : ''}

                    <!-- Caractéristiques additionnelles -->
                    <div class="mb-3">
                        ${annonce.etage !== undefined ? `
                            <small class="text-muted d-block">
                                <i class="fas fa-building"></i> Étage ${annonce.etage}
                            </small>
                        ` : ''}
                        ${annonce.annee_construction ? `
                            <small class="text-muted d-block">
                                <i class="fas fa-calendar"></i> Construit en ${annonce.annee_construction}
                            </small>
                        ` : ''}
                    </div>
                </div>

                <!-- Actions -->
                <div class="card-footer bg-white border-top">
                    <div class="d-grid gap-2">
                        <a href="matching.html?annonce_id=${annonce.id}" class="btn btn-primary btn-sm">
                            <i class="fas fa-eye"></i> Voir l'annonce
                        </a>
                        <button class="btn btn-outline-secondary btn-sm contact-btn" data-annonce-id="${annonce.id}" data-annonce-titre="${annonce.titre}" data-seller-id="${annonce.utilisateur_id}">
                            <i class="fas fa-envelope"></i> Prise de contact
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Déclencher les événements des boutons de contact
    initializeContactButtons();
}

/**
 * Initialise les boutons de prise de contact
 */
function initializeContactButtons() {
    const contactButtons = document.querySelectorAll('.contact-btn');
    contactButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const annonceId = btn.dataset.annonceId;
            const annonceTitre = btn.dataset.annonceTitre;
            const sellerId = btn.dataset.sellerId;
 */
document.addEventListener('DOMContentLoaded', () => {
    const annonceId = getQueryParam('annonce_id');

    if (annonceId) {
        loadAnnonceDetails(annonceId);
    }
});

/**
 * Charge les détails d'une annonce
 */
async function loadAnnonceDetails(annonceId) {
    try {
        const response = await axios.get(`/api/v1/annonces/${annonceId}`);

        // Affiche une modale avec les détails
        const annonce = response.data;
        const detailsHTML = `
            <div style="text-align: center;">
                <img src="${annonce.image || '/static/images/default-house.jpg'}"
                     style="width: 100%; max-width: 400px; border-radius: 8px; margin-bottom: 1rem;">
            </div>
            <h4>${annonce.titre}</h4>
            <p><i class="fas fa-map-marker-alt"></i> ${annonce.adresse}</p>
            <h5 class="text-primary mb-3">${formatCurrency(annonce.prix)}</h5>

            <div class="row mb-3">
                <div class="col-md-6">
                    <p><strong>Surface :</strong> ${annonce.surface}m²</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Pièces :</strong> ${annonce.pieces}</p>
                </div>
            </div>

            <p><strong>Description :</strong></p>
            <p>${annonce.description}</p>

            <button class="btn btn-primary w-100 contact-btn" data-annonce-id="${annonce.annonce_id}" data-annonce-titre="${annonce.titre}" data-seller-id="${annonce.utilisateur_id}">
                <i class="fas fa-envelope"></i> Prise de contact
            </button>
        `;

        showModal(annonce.titre, detailsHTML);
        initializeContactButtons();
    } catch (error) {
        console.error('Erreur lors du chargement des détails de l\'annonce:', error);
    }
}

/**
 * Ouvre la modale de prise de contact
 */
function openContactModal(annonceId, annonceTitre, sellerId) {
    // Vérifier si l'utilisateur est connecté
    if (!isLoggedIn()) {
        // Rediriger vers la page de connexion
        window.location.href = 'login.html?redirect=matching.html';
        return;
    }

    // Obtenir l'utilisateur actuel
    const currentUser = getCurrentUser();

    // Vérifier que l'utilisateur n'envoie pas un message à lui-même
    if (currentUser && currentUser.utilisateur_id === parseInt(sellerId)) {
        showErrorMessage("Vous ne pouvez pas envoyer un message à vous-même");
        return;
    }

    // Créer la modale de contact
    const contactHTML = `
        <div>
            <h5>${annonceTitre}</h5>
            <div id="contactErrorMessage"></div>

            <form id="contactForm">
                <div class="form-group mb-3">
                    <label for="contactMessage" class="form-label">Votre message</label>
                    <textarea class="form-control" id="contactMessage" name="message" rows="5" placeholder="Décrivez votre intérêt pour ce bien..." required></textarea>
                    <small class="form-text text-muted">Max 2000 caractères</small>
                </div>

                <div class="d-grid gap-2">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Envoyer le message
                    </button>
                </div>
            </form>
        </div>
    `;

    showModal("Prise de contact", contactHTML);

    // Ajouter l'événement submit du formulaire
    setTimeout(() => {
        const form = document.getElementById('contactForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const message = document.getElementById('contactMessage').value.trim();

                if (!message) {
                    showErrorMessage("Le message ne peut pas être vide", 'contactErrorMessage');
                    return;
                }

                // Envoyer le message
                await sendContactMessage(annonceId, sellerId, message);
            });
        }
    }, 100);
}

/**
 * Envoie le message de contact à l'API
 */
async function sendContactMessage(annonceId, sellerId, message) {
    try {
        const token = getAuthToken();
        const currentUser = getCurrentUser();

        const response = await axios.post('/api/v1/messages', {
            receiver_id: parseInt(sellerId),
            annonce_id: parseInt(annonceId),
            contenu: message
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Afficher un message de succès
        showModal("Succès", `
            <div class="text-center">
                <i class="fas fa-check-circle text-success" style="font-size: 48px; margin-bottom: 1rem;"></i>
                <h5>Message envoyé avec succès !</h5>
                <p class="text-muted">Le propriétaire de l'annonce recevra votre message et vous répondra bientôt.</p>
                <a href="dashboard.html" class="btn btn-primary">
                    <i class="fas fa-envelope"></i> Voir mes messages
                </a>
            </div>
        `);
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);

        let errorMessage = 'Erreur lors de l\'envoi du message';
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error;
        }

        showErrorMessage(errorMessage, 'contactErrorMessage');
    }
}
