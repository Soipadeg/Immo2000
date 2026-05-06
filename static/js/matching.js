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
                        <button class="btn btn-outline-secondary btn-sm" data-feature="Prise de RDV">
                            <i class="fas fa-calendar-check"></i> Prendre RDV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Déclencher les événements des boutons "À faire"
    initializeFeatureButtons();
}

/**
 * Initialise les boutons "À faire"
 */
function initializeFeatureButtons() {
    const featureButtons = document.querySelectorAll('[data-feature]');
    featureButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const featureName = btn.dataset.feature;
            showComingSoon(featureName);
        });
    });
}

/**
 * Charge les détails d'une annonce si passée en paramètre
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
        const response = await axios.get(`/annonces/${annonceId}`);

        // Affiche une modale avec les détails
        const annonce = response.data.annonce;
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

            <button class="btn btn-primary w-100" data-feature="Prise de RDV">
                <i class="fas fa-calendar-check"></i> Prendre RDV
            </button>
        `;

        showModal(annonce.titre, detailsHTML);
        initializeFeatureButtons();
    } catch (error) {
        console.error('Erreur lors du chargement des détails de l\'annonce:', error);
    }
}
