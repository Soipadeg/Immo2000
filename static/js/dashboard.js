/**
 * dashboard.js - Logique du Tableau de Bord
 */

document.addEventListener('DOMContentLoaded', () => {
    // Vérifier l'authentification
    if (!checkAuth()) {
        return;
    }

    const currentUser = getCurrentUser();

    // Charger les données au chargement de la page
    loadBuyerData();
    loadSellerData();

    // Écouter les changements d'onglet
    const buyerTab = document.getElementById('buyerTab');
    const sellerTab = document.getElementById('sellerTab');

    if (buyerTab) {
        buyerTab.addEventListener('click', () => {
            loadBuyerData();
        });
    }

    if (sellerTab) {
        sellerTab.addEventListener('click', () => {
            loadSellerData();
        });
    }
});

/**
 * Charge les données de l'onglet Acheteur
 */
async function loadBuyerData() {
    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser.id) {
        showErrorMessage('Erreur : Utilisateur non trouvé');
        return;
    }

    showLoadingSpinner();

    try {
        // Charger les annonces matchées
        const response = await axios.post('/matching', {
            acheteur_id: currentUser.id
        });

        displayMatchingResults(response.data.annonces || []);
        hideLoadingSpinner();
    } catch (error) {
        hideLoadingSpinner();
        console.error('Erreur lors du chargement des annonces matchées:', error);
        showErrorMessage('Impossible de charger les annonces matchées');
    }
}

/**
 * Affiche les résultats du matching
 */
function displayMatchingResults(annonces) {
    const matchingList = document.getElementById('matchingListBuyer');

    if (!matchingList) return;

    if (annonces.length === 0) {
        matchingList.innerHTML = `
            <div class="col-12">
                <div class="no-results">
                    <i class="fas fa-inbox"></i>
                    <p class="mt-2">Aucune annonce matchée pour le moment.</p>
                    <a href="matching.html" class="btn btn-primary btn-sm">
                        <i class="fas fa-search"></i> Lancer une recherche
                    </a>
                </div>
            </div>
        `;
        return;
    }

    matchingList.innerHTML = annonces.map(annonce => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card h-100">
                <img src="${annonce.image || '/static/images/default-house.jpg'}"
                     class="card-img-top" alt="${annonce.titre}" style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${annonce.titre}</h5>
                    <p class="card-text text-muted">${annonce.adresse}</p>
                    <div class="mb-3">
                        <p class="mb-1"><strong>${formatCurrency(annonce.prix)}</strong></p>
                        <small class="text-muted">${annonce.surface}m² • ${annonce.pieces} pièce(s)</small>
                    </div>
                    <div class="d-grid gap-2">
                        <a href="matching.html?annonce_id=${annonce.id}" class="btn btn-primary btn-sm">
                            <i class="fas fa-eye"></i> Voir l'annonce
                        </a>
                        <button class="btn btn-outline-secondary btn-sm" data-feature="Prise de RDV">
                            <i class="fas fa-calendar"></i> Prendre RDV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Charge les données de l'onglet Vendeur
 */
async function loadSellerData() {
    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser.id) {
        showErrorMessage('Erreur : Utilisateur non trouvé');
        return;
    }

    showLoadingSpinner();

    try {
        // Charger les visites
        await loadVisites(currentUser.id);

        // Charger les feedbacks
        await loadFeedbacks(currentUser.id);

        hideLoadingSpinner();
    } catch (error) {
        hideLoadingSpinner();
        console.error('Erreur lors du chargement des données vendeur:', error);
        showErrorMessage('Impossible de charger les données vendeur');
    }
}

/**
 * Charge les visites du vendeur
 */
async function loadVisites(vendeurId) {
    try {
        const response = await axios.get('/visites', {
            params: { vendeur_id: vendeurId }
        });

        displayVisites(response.data.visites || []);
    } catch (error) {
        console.error('Erreur lors du chargement des visites:', error);
        const visitsList = document.getElementById('visitsList');
        if (visitsList) {
            visitsList.innerHTML = '<p class="text-muted">Erreur lors du chargement des visites.</p>';
        }
    }
}

/**
 * Affiche les visites du vendeur
 */
function displayVisites(visites) {
    const visitsList = document.getElementById('visitsList');

    if (!visitsList) return;

    if (visites.length === 0) {
        visitsList.innerHTML = '<p class="text-muted">Aucune visite planifiée.</p>';
        return;
    }

    const tableHTML = `
        <table class="table table-striped table-hover">
            <thead>
                <tr>
                    <th>Bien</th>
                    <th>Acheteur</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${visites.map(visite => `
                    <tr>
                        <td>${visite.bien_titre || 'N/A'}</td>
                        <td>${visite.acheteur_nom || 'N/A'}</td>
                        <td>${formatDate(visite.date)}</td>
                        <td>${visite.heure || 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="confirmVisite(${visite.id})">
                                <i class="fas fa-check"></i> Confirmer
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    visitsList.innerHTML = tableHTML;
}

/**
 * Charge les feedbacks du vendeur
 */
async function loadFeedbacks(vendeurId) {
    try {
        const response = await axios.get('/vendeur/feedbacks', {
            params: { vendeur_id: vendeurId }
        });

        displayFeedbacks(response.data.feedbacks || []);
    } catch (error) {
        console.error('Erreur lors du chargement des feedbacks:', error);
        const feedbacksList = document.getElementById('feedbacksList');
        if (feedbacksList) {
            feedbacksList.innerHTML = '<p class="text-muted">Erreur lors du chargement des feedbacks.</p>';
        }
    }
}

/**
 * Affiche les feedbacks du vendeur
 */
function displayFeedbacks(feedbacks) {
    const feedbacksList = document.getElementById('feedbacksList');

    if (!feedbacksList) return;

    if (feedbacks.length === 0) {
        feedbacksList.innerHTML = '<p class="text-muted">Aucun feedback pour le moment.</p>';
        return;
    }

    feedbacksList.innerHTML = feedbacks.map(feedback => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">${feedback.acheteur_nom || 'Anonyme'}</h5>
                        <p class="card-text text-muted">${formatDate(feedback.date)}</p>
                        <p class="card-text">${feedback.contenu}</p>
                        ${feedback.note ? `<p class="card-text"><strong>Note :</strong> ${feedback.note}/5 ⭐</p>` : ''}
                    </div>
                    ${!feedback.reponse ? `
                        <button class="btn btn-sm btn-primary" onclick="repondreAuFeedback(${feedback.id}, '${feedback.acheteur_nom}')">
                            <i class="fas fa-reply"></i> Répondre
                        </button>
                    ` : `
                        <span class="badge bg-success">Répondu</span>
                    `}
                </div>
                ${feedback.reponse ? `
                    <div class="mt-3 p-3 bg-light border-start border-primary">
                        <strong>Votre réponse :</strong>
                        <p class="mb-0">${feedback.reponse}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * Confirme une visite
 */
async function confirmVisite(visiteId) {
    if (!confirm('Confirmer cette visite ?')) {
        return;
    }

    try {
        await axios.put(`/visites/${visiteId}`, {
            status: 'confirmed'
        });

        showSuccessMessage('Visite confirmée avec succès');
        loadSellerData();
    } catch (error) {
        console.error('Erreur lors de la confirmation de la visite:', error);
        showErrorMessage('Erreur lors de la confirmation de la visite');
    }
}

/**
 * Répond à un feedback
 */
function repondreAuFeedback(feedbackId, acheteurNom) {
    const reponse = prompt(`Répondre au feedback de ${acheteurNom}:`);

    if (!reponse || reponse.trim() === '') {
        return;
    }

    submitFeedbackResponse(feedbackId, reponse);
}

/**
 * Soumet la réponse à un feedback
 */
async function submitFeedbackResponse(feedbackId, reponse) {
    try {
        await axios.put(`/feedbacks/${feedbackId}/reponse`, {
            reponse: reponse
        });

        showSuccessMessage('Réponse envoyée avec succès');
        loadSellerData();
    } catch (error) {
        console.error('Erreur lors de l\'envoi de la réponse:', error);
        showErrorMessage('Erreur lors de l\'envoi de la réponse');
    }
}
