// ===== API BASE URL =====
const API_BASE_URL = 'http://localhost:5000/api/v1';

// ===== AUTHENTICATION FUNCTIONS =====

/**
 * Récupère l'utilisateur actuel depuis localStorage
 */
const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

/**
 * Récupère le token JWT depuis localStorage
 */
const getAuthToken = () => {
    return localStorage.getItem('token');
};

/**
 * Vérifie si l'utilisateur est connecté
 */
const isLoggedIn = () => {
    return !!getAuthToken();
};

/**
 * Redirige vers la page de connexion si l'utilisateur n'est pas connecté
 */
const checkAuth = () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
};

/**
 * Déconnecte l'utilisateur
 */
const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

/**
 * Stocke l'utilisateur et le token dans localStorage
 */
const setUser = (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
};

// ===== AXIOS CONFIGURATION =====
// Configure les en-têtes par défaut pour Axios
if (typeof axios !== 'undefined') {
    axios.defaults.baseURL = API_BASE_URL;

    // Ajoute le token JWT à chaque requête si disponible
    axios.interceptors.request.use(
        (config) => {
            const token = getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Gère les erreurs d'authentification (token expiré, etc.)
    axios.interceptors.response.use(
        (response) => {
            return response;
        },
        (error) => {
            if (error.response && error.response.status === 401) {
                // Token expiré ou invalide
                logout();
            }
            return Promise.reject(error);
        }
    );
}

// ===== UTILITY FUNCTIONS =====

/**
 * Formate un nombre en devise EUR (format français)
 */
const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
};

/**
 * Formate une date au format français
 */
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
};

/**
 * Affiche un message de succès
 */
const showSuccessMessage = (message, containerId = 'successMessage') => {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle"></i> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        container.style.display = 'block';
    }
};

/**
 * Affiche un message d'erreur
 */
const showErrorMessage = (message, containerId = 'errorMessage') => {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-circle"></i> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        container.style.display = 'block';
    }
};

/**
 * Affiche un spinner de chargement
 */
const showLoadingSpinner = (containerId = 'loadingMessage') => {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.add('show');
    }
};

/**
 * Cache le spinner de chargement
 */
const hideLoadingSpinner = (containerId = 'loadingMessage') => {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.remove('show');
    }
};

/**
 * Affiche une modale de message
 */
const showModal = (title, message, modalId = 'messageModal') => {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
        const modalTitle = modalElement.querySelector('.modal-title');
        const modalBody = modalElement.querySelector('.modal-body');

        if (modalTitle) {
            modalTitle.textContent = title;
        }
        if (modalBody) {
            modalBody.innerHTML = message;
        }

        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
};

/**
 * Affiche la modale "Lier à Melo/Keyzia"
 */
const showMeloKeyziaMissing = () => {
    showModal(
        'Lier à Melo/Keyzia',
        '<p>Pour accéder aux données API de Melo et Keyzia, vous devez lier votre compte.</p><p><strong>Cette fonctionnalité sera disponible prochainement.</strong></p>'
    );
};

/**
 * Affiche la modale "Fonctionnalité à venir"
 */
const showComingSoon = (featureName) => {
    showModal(
        'Fonctionnalité à venir',
        `<p>Fonctionnalité à venir : ${featureName}. Nous travaillons dessus !</p>`
    );
};

/**
 * Valide un email
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Valide un mot de passe
 */
const validatePassword = (password) => {
    // Critères de sécurité: min 8 chars, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*()_+\-=\[\]{};:'"<>?/\\|`~]/.test(password)) return false;
    return true;
};

/**
 * Récupère les paramètres de l'URL
 */
const getQueryParam = (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
};

// ===== INITIALIZATION =====

/**
 * Initialise les éléments communs au chargement de la page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Met à jour la barre de navigation avec les infos utilisateur
    const userNameElement = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');
    const authLinksContainer = document.getElementById('authLinks');
    const userMenuContainer = document.getElementById('userMenu');
    const currentUser = getCurrentUser();

    if (currentUser && userNameElement) {
        userNameElement.textContent = currentUser.name || currentUser.email;
        if (authLinksContainer) authLinksContainer.style.display = 'none';
        if (userMenuContainer) userMenuContainer.style.display = 'block';
    } else {
        if (authLinksContainer) authLinksContainer.style.display = 'block';
        if (userMenuContainer) userMenuContainer.style.display = 'none';
    }

    // Gère la déconnexion
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Gère le bouton "Lier à Melo/Keyzia"
    const meloKeyzia = document.getElementById('meloKeyziaBtns');
    if (meloKeyzia) {
        meloKeyzia.forEach(btn => {
            btn.addEventListener('click', () => {
                showMeloKeyziaMissing();
            });
        });
    }

    // Gère les boutons "À faire"
    const toDoButtons = document.querySelectorAll('[data-feature]');
    if (toDoButtons) {
        toDoButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const featureName = btn.dataset.feature;
                showComingSoon(featureName);
            });
        });
    }

    // Bootstrap pour les tooltips et popovers
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

// ===== MODAL TEMPLATE =====
// Ajoute une modale cachée par défaut pour les messages génériques
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('messageModal')) {
        const modalHTML = `
            <div class="modal fade" id="messageModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body"></div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
});

// Affiche les images par défaut pour les images cassées
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[data-fallback]');
    images.forEach(img => {
        img.addEventListener('error', () => {
            img.src = img.dataset.fallback || '/static/images/default-house.jpg';
        });
    });
});
