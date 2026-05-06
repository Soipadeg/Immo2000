/**
 * OAuth 2.0 Authentication Handler
 * Gère les callbacks OAuth pour Google, Facebook et Apple
 */

const API_BASE_URL = 'http://localhost:5000/api/v1';
const AUTH_BASE_URL = 'http://localhost:5000/auth/oauth';

/**
 * Initialise Google Sign-In
 */
function initGoogleSignIn() {
    if (window.google && google.accounts) {
        google.accounts.id.initialize({
            client_id: 'YOUR_GOOGLE_CLIENT_ID',
            callback: handleGoogleSignIn,
            ux_mode: 'popup'
        });
    }
}

/**
 * Gère la réponse du Sign-In Google
 */
async function handleGoogleSignIn(response) {
    if (!response.credential) {
        showErrorMessage('Erreur: Token Google non reçu');
        return;
    }

    try {
        showLoadingSpinner(true);

        // Envoyer le token au backend
        const result = await axios.post(`${AUTH_BASE_URL}/google/callback`, {
            id_token: response.credential
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Stocker les tokens
        localStorage.setItem('access_token', result.data.access_token);
        localStorage.setItem('refresh_token', result.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        showSuccessMessage('Connexion réussie via Google!');

        // Rediriger après 1.5s
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1500);
    } catch (error) {
        console.error('Google OAuth error:', error);
        showErrorMessage(error.response?.data?.error || 'Erreur lors de la connexion Google');
    } finally {
        showLoadingSpinner(false);
    }
}

/**
 * Lance la connexion Facebook
 */
async function handleFacebookSignIn() {
    if (!window.FB) {
        showErrorMessage('SDK Facebook non chargé');
        return;
    }

    FB.login(function(response) {
        if (response.authResponse) {
            processFacebookLogin(response.authResponse.accessToken);
        } else {
            showErrorMessage('Connexion Facebook annulée');
        }
    }, { scope: 'public_profile,email' });
}

/**
 * Traite la réponse de connexion Facebook
 */
async function processFacebookLogin(accessToken) {
    try {
        showLoadingSpinner(true);

        // Envoyer le token au backend
        const result = await axios.post(`${AUTH_BASE_URL}/facebook/callback`, {
            access_token: accessToken
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Stocker les tokens
        localStorage.setItem('access_token', result.data.access_token);
        localStorage.setItem('refresh_token', result.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        showSuccessMessage('Connexion réussie via Facebook!');

        // Rediriger après 1.5s
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1500);
    } catch (error) {
        console.error('Facebook OAuth error:', error);
        showErrorMessage(error.response?.data?.error || 'Erreur lors de la connexion Facebook');
    } finally {
        showLoadingSpinner(false);
    }
}

/**
 * Lance la connexion Apple
 */
function handleAppleSignIn() {
    if (!window.AppleID) {
        showErrorMessage('SDK Apple non chargé');
        return;
    }

    AppleID.auth.init({
        clientId: 'YOUR_APPLE_CLIENT_ID',
        teamId: 'YOUR_APPLE_TEAM_ID',
        keyId: 'YOUR_APPLE_KEY_ID',
        usePopup: true
    });

    AppleID.auth.signIn().then(response => {
        if (response && response.authorization && response.authorization.id_token) {
            processAppleLogin(response.authorization.id_token);
        } else {
            showErrorMessage('Réponse Apple invalide');
        }
    }).catch(error => {
        console.error('Apple Sign In error:', error);
        showErrorMessage('Erreur lors de la connexion Apple');
    });
}

/**
 * Traite la réponse de connexion Apple
 */
async function processAppleLogin(idToken) {
    try {
        showLoadingSpinner(true);

        // Envoyer le token au backend
        const result = await axios.post(`${AUTH_BASE_URL}/apple/callback`, {
            id_token: idToken
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Stocker les tokens
        localStorage.setItem('access_token', result.data.access_token);
        localStorage.setItem('refresh_token', result.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        showSuccessMessage('Connexion réussie via Apple!');

        // Rediriger après 1.5s
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1500);
    } catch (error) {
        console.error('Apple OAuth error:', error);
        showErrorMessage(error.response?.data?.error || 'Erreur lors de la connexion Apple');
    } finally {
        showLoadingSpinner(false);
    }
}

/**
 * Affiche un message d'erreur
 */
function showErrorMessage(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.innerHTML = `<div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    }
}

/**
 * Affiche un message de succès
 */
function showSuccessMessage(message) {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.innerHTML = `<div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fas fa-check-circle"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    }
}

/**
 * Affiche/cache le spinner de chargement
 */
function showLoadingSpinner(show) {
    const loadingDiv = document.getElementById('loadingMessage');
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'block' : 'none';
    }
}

/**
 * Initialise les événements des boutons OAuth
 */
function initOAuthButtons() {
    // Bouton Google
    const googleBtn = document.getElementById('googleSignInBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            if (window.google && google.accounts) {
                google.accounts.id.prompt();
            }
        });
    }

    // Bouton Facebook
    const facebookBtn = document.getElementById('facebookSignInBtn');
    if (facebookBtn) {
        facebookBtn.addEventListener('click', handleFacebookSignIn);
    }

    // Bouton Apple
    const appleBtn = document.getElementById('appleSignInBtn');
    if (appleBtn) {
        appleBtn.addEventListener('click', handleAppleSignIn);
    }
}

// Initialiser au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    initGoogleSignIn();
    initOAuthButtons();
});
