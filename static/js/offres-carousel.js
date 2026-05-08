/**
 * Script de gestion du carousel des offres
 * Charge et affiche les dernières offres immobilières
 */

// Initialiser le carousel au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initializeOffresCarousel();
});

/**
 * Initialise le carousel des offres
 */
async function initializeOffresCarousel() {
    try {
        // Charger les offres depuis l'API
        const offres = await loadOffres();

        if (offres && offres.length > 0) {
            populateCarousel(offres);
            showCarouselControls(true);

            // Optimiser les images avec WebP/lazy loading
            optimizeCarouselImages();
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Erreur chargement offres:', error);
        showEmptyState();
    }
}

/**
 * Optimise les images du carousel pour WebP et lazy loading.
 */
function optimizeCarouselImages() {
    // Charger WebP si support existe
    if (typeof WebPLoader !== 'undefined') {
        WebPLoader.enhanceImages();
    }

    // Initier le lazy loading
    if (typeof observeLazyImages !== 'undefined') {
        observeLazyImages(document.getElementById('offresCarousel'));
    }
}

/**
 * Charge les offres depuis l'API
 * @returns {Promise<Array>} Liste des offres
 */
async function loadOffres() {
    try {
        const response = await fetch('/api/v1/annonces?limit=10&sort=-date_creation');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.items || data.offres || data.data || data.annonces || [];
    } catch (error) {
        console.warn('Impossible de charger les offres:', error);
        return [];
    }
}

/**
 * Rempli le carousel avec les offres
 * @param {Array} offres - Liste des offres
 */
function populateCarousel(offres) {
    const carouselContent = document.getElementById('carouselContent');
    const carouselIndicators = document.getElementById('carouselIndicators');

    // Vider le contenu existant
    carouselContent.innerHTML = '';
    carouselIndicators.innerHTML = '';

    // Créer les slides
    offres.forEach((offre, index) => {
        const isActive = index === 0 ? 'active' : '';

        // Créer l'item du carousel
        const carouselItem = document.createElement('div');
        carouselItem.className = `carousel-item ${isActive}`;
        carouselItem.innerHTML = createOffreCard(offre);
        carouselContent.appendChild(carouselItem);

        // Créer l'indicateur
        const indicator = document.createElement('button');
        indicator.type = 'button';
        indicator.className = isActive;
        indicator.setAttribute('data-bs-target', '#offresCarousel');
        indicator.setAttribute('data-bs-slide-to', index);
        indicator.setAttribute('aria-label', `Offre ${index + 1}`);
        if (isActive) {
            indicator.setAttribute('aria-current', 'true');
        }
        carouselIndicators.appendChild(indicator);
    });
}

/**
 * Crée une carte d'offre HTML
 * @param {Object} offre - Données de l'offre
 * @returns {string} HTML de la carte
 */
function createOffreCard(offre) {
    const imageUrl = (offre.photos && offre.photos.length > 0) ? offre.photos[0] : '/static/images/placeholder.jpg';
    const prix = formatPrix(offre.prix || 0);
    const surface = offre.surface || 'N/A';
    const pieces = offre.nombre_pieces || 'N/A';
    const ville = offre.ville || 'Localisation inconnue';
    const description = offre.description || 'Pas de description disponible';

    return `
        <div class="d-flex justify-content-center py-4">
            <div class="offre-card" style="max-width: 600px; width: 100%;">
                <div class="offre-image">
                    <img src="/static/images/default-house.jpg" data-src="${imageUrl}" alt="${offre.titre || 'Offre immobilière'}" class="lazy" onerror="this.src='/static/images/placeholder.jpg'">
                </div>
                <div class="offre-content">
                    <div class="offre-price">${prix}</div>
                    <h3 class="offre-title">${offre.titre || 'Sans titre'}</h3>
                    <p class="text-muted" style="font-size: 0.95rem;">
                        <i class="fas fa-map-marker-alt"></i> ${ville}
                    </p>

                    <div class="offre-details">
                        <div class="offre-detail">
                            <div class="offre-detail-icon">
                                <i class="fas fa-ruler-combined"></i>
                            </div>
                            <div class="offre-detail-value">${surface}</div>
                            <div class="offre-detail-label">m²</div>
                        </div>
                        <div class="offre-detail">
                            <div class="offre-detail-icon">
                                <i class="fas fa-door-open"></i>
                            </div>
                            <div class="offre-detail-value">${pieces}</div>
                            <div class="offre-detail-label">Pièce(s)</div>
                        </div>
                        <div class="offre-detail">
                            <div class="offre-detail-icon">
                                <i class="fas fa-calendar"></i>
                            </div>
                            <div class="offre-detail-value">${formatDate(offre.date_creation)}</div>
                            <div class="offre-detail-label">Publication</div>
                        </div>
                    </div>

                    <p class="offre-description">${description.substring(0, 150)}...</p>

                    <div class="offre-footer">
                        <button class="btn btn-outline-secondary btn-sm" onclick="viewOffre(${offre.annonce_id})">
                            <i class="fas fa-eye"></i> Voir plus
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="viewOffre(${offre.annonce_id})">
                            <i class="fas fa-arrow-right"></i> Détails
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Affiche l'état vide du carousel
 */
function showEmptyState() {
    const carouselContent = document.getElementById('carouselContent');
    carouselContent.innerHTML = `
        <div class="carousel-item active">
            <div class="d-flex justify-content-center align-items-center" style="height: 400px;">
                <div class="text-center empty-state-container">
                    <div class="empty-state-icon">
                        <i class="fas fa-inbox"></i>
                    </div>
                    <h4 class="empty-state-title">Aucune offre actuellement</h4>
                    <p class="empty-state-text">Les offres immobilières seront affichées ici dès leur publication</p>
                    <a href="matching.html" class="btn btn-primary">
                        <i class="fas fa-search"></i> Parcourir tous les biens
                    </a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Affiche ou cache les contrôles du carousel
 * @param {boolean} show - Afficher les contrôles
 */
function showCarouselControls(show) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const indicators = document.getElementById('carouselIndicators');

    if (show) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        if (indicators.children.length > 1) {
            indicators.style.display = 'flex';
        }
    } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        indicators.style.display = 'none';
    }
}

/**
 * Formate un prix au format EUR
 * @param {number} prix - Prix à formater
 * @returns {string} Prix formaté
 */
function formatPrix(prix) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
    }).format(prix);
}

// formatDate is already defined in app.js

/**
 * Affiche les détails d'une offre
 * @param {number} offerId - ID de l'offre
 */
function viewOffre(offerId) {
    // Rediriger vers la page de détails ou ouvrir un modal
    window.location.href = `/matching.html?offre=${offerId}`;
}

/**
 * Rafraîchit le carousel des offres
 */
function refreshOffresCarousel() {
    initializeOffresCarousel();
}

// Exporter les fonctions pour utilisation externe
window.offresCarousel = {
    refresh: refreshOffresCarousel,
    loadOffres: loadOffres
};
