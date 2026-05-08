/**
 * simulateur_pret.js - Logique du Simulateur de Prêt
 * Disponible pour tous les utilisateurs (authentifiés ou non)
 */

let debounceTimer;
let fullTableData = [];

/**
 * Initialisation au chargement de la page
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('simulatorForm');
    const showFullTableBtn = document.getElementById('showFullTableBtn');

    if (!form) return;

    // Ajouter les écouteurs d'événement sur les champs du formulaire
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                performSimulation();
            }, 500);
        });

        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                performSimulation();
            }, 500);
        });
    });

    // Soumission du formulaire
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        performSimulation();
    });

    // Bouton pour afficher le tableau complet
    if (showFullTableBtn) {
        showFullTableBtn.addEventListener('click', () => {
            displayFullTable();
        });
    }

    // Bouton réinitialiser
    const resetBtn = form.querySelector('button[type="reset"]');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            setTimeout(() => {
                const resultsSection = document.getElementById('resultsSection');
                if (resultsSection) {
                    resultsSection.style.display = 'none';
                    // Nettoyer aussi le prompt auth
                    const authPrompt = resultsSection.querySelector('.auth-prompt-box');
                    if (authPrompt) {
                        authPrompt.remove();
                    }
                }
                document.getElementById('errorMessage').innerHTML = '';
                fullTableData = [];
            }, 100);
        });
    }
});

/**
 * Effectue la simulation de prêt (accessible à tous)
 */
async function performSimulation() {
    const revenu = parseFloat(document.getElementById('revenuMensuel')?.value || 0);
    const apport = parseFloat(document.getElementById('apport')?.value || 0);
    const tauxInteret = parseFloat(document.getElementById('tauxInteret')?.value || 3.5);
    const duree = parseInt(document.getElementById('duree')?.value || 20);
    const tauxAssurance = parseFloat(document.getElementById('tauxAssurance')?.value || 0.3);

    // Validation des entrées
    if (!revenu || revenu <= 0) {
        showErrorMessage('Veuillez entrer un revenu mensuel valide (> 0)');
        return;
    }

    if (apport < 0) {
        showErrorMessage('L\'apport ne peut pas être négatif');
        return;
    }

    if (tauxInteret < 0 || tauxInteret > 15) {
        showErrorMessage('Le taux d\'intérêt doit être entre 0% et 15%');
        return;
    }

    if (duree < 1 || duree > 30) {
        showErrorMessage('La durée doit être entre 1 et 30 ans');
        return;
    }

    if (tauxAssurance < 0 || tauxAssurance > 1) {
        showErrorMessage('Le taux d\'assurance doit être entre 0% et 1%');
        return;
    }

    // Afficher le spinner de chargement
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.style.display = 'block';
    }

    document.getElementById('errorMessage').innerHTML = '';

    try {
        // Récupérer le token d'authentification (optionnel)
        const token = localStorage.getItem('token');

        // Préparer les headers (avec ou sans token)
        const config = {};
        if (token) {
            config.headers = { 'Authorization': `Bearer ${token}` };
        }

        // Appel à l'API pour la simulation
        const response = await axios.post('/simulateur-pret', {
            revenu_mensuel_net: revenu,
            apport: apport,
            taux_interet: tauxInteret,
            duree_ans: duree,
            taux_assurance: tauxAssurance
        }, config);

        // Extraire les données de la réponse
        const data = response.data.data || response.data;
        displayResults(data);

    } catch (error) {
        console.error('Erreur lors de la simulation:', error);

        let errorMessage = 'Erreur lors de la simulation du prêt. Veuillez réessayer.';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        showErrorMessage(errorMessage);

    } finally {
        // Cacher le spinner
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
    }
}

/**
 * Affiche les résultats de la simulation
 */
function displayResults(data) {
    const resultsSection = document.getElementById('resultsSection');

    if (!resultsSection) {
        showErrorMessage('Section des résultats non trouvée');
        return;
    }

    // Affiche la section des résultats
    resultsSection.style.display = 'block';

    // Remplir les valeurs des résultats
    const capaciteEmprunt = document.getElementById('capaciteEmprunt');
    const mensualite = document.getElementById('mensualite');
    const coutTotal = document.getElementById('coutTotal');

    if (capaciteEmprunt) {
        capaciteEmprunt.textContent = formatCurrency(data.capacite_emprunt);
    }
    if (mensualite) {
        mensualite.textContent = formatCurrency(data.mensualite);
    }
    if (coutTotal) {
        coutTotal.textContent = formatCurrency(data.cout_total_credit);
    }

    // Afficher le tableau d'amortissement
    const tableau = data.tableau_amortissement || [];
    displayAmortissementPreview(tableau);

    // Stocker le tableau complet
    fullTableData = tableau;

    // Afficher le prompt login/inscription si l'utilisateur n'est pas connecté
    const token = localStorage.getItem('token');
    if (!token) {
        displayAuthPrompt();
    }
}

/**
 * Affiche un aperçu du tableau d'amortissement (12 premiers mois)
 */
function displayAmortissementPreview(tableau) {
    const tbody = document.getElementById('amortissementBody');

    if (!tbody) return;

    if (!tableau || tableau.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Aucun amortissement disponible</td></tr>';
        return;
    }

    // Afficher les 12 premiers mois
    const first12Months = tableau.slice(0, 12);

    tbody.innerHTML = first12Months.map((row) => `
        <tr>
            <td>${row.mois}</td>
            <td>${formatCurrency(row.capital_restant)}</td>
            <td>${formatCurrency(row.interets)}</td>
            <td>${formatCurrency(row.assurance)}</td>
            <td><strong>${formatCurrency(row.mensualite)}</strong></td>
        </tr>
    `).join('');
}

/**
 * Affiche le tableau d'amortissement complet dans une modale
 */
function displayFullTable() {
    if (fullTableData.length === 0) {
        showErrorMessage('Aucun tableau d\'amortissement disponible');
        return;
    }

    const tbody = document.getElementById('fullAmortissementBody');

    if (!tbody) return;

    tbody.innerHTML = fullTableData.map(row => `
        <tr>
            <td>${row.mois}</td>
            <td>${formatCurrency(row.capital_restant)}</td>
            <td>${formatCurrency(row.interets)}</td>
            <td>${formatCurrency(row.assurance)}</td>
            <td><strong>${formatCurrency(row.mensualite)}</strong></td>
        </tr>
    `).join('');

    // Afficher la modale Bootstrap
    const fullTableModal = new bootstrap.Modal(document.getElementById('fullTableModal'));
    fullTableModal.show();
}

/**
 * Affiche un prompt pour inviter l'utilisateur à se connecter/inscrire
 */
function displayAuthPrompt() {
    const resultsSection = document.getElementById('resultsSection');

    if (!resultsSection) return;

    // Supprimer un prompt existant s'il y en a un
    const existingPrompt = resultsSection.querySelector('.auth-prompt-box');
    if (existingPrompt) {
        existingPrompt.remove();
    }

    // Créer le HTML du prompt
    const authPrompt = document.createElement('div');
    authPrompt.className = 'auth-prompt-box alert alert-info mt-5 p-4';
    authPrompt.innerHTML = `
        <div class="row align-items-center">
            <div class="col-md-8">
                <h5 class="mb-2"><i class="fas fa-lock-open"></i> Prochaine étape</h5>
                <p class="mb-0 text-dark">
                    Créez un compte ou connectez-vous pour finaliser votre demande de prêt et recevoir
                    les offres adaptées à votre profil auprès de nos partenaires bancaires.
                </p>
            </div>
            <div class="col-md-4">
                <div class="d-grid gap-2">
                    <a href="/static/login.html" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i> Se connecter
                    </a>
                    <a href="/static/register.html" class="btn btn-success">
                        <i class="fas fa-user-plus"></i> S'inscrire
                    </a>
                </div>
            </div>
        </div>
    `;

    // Ajouter le prompt à la fin de resultsSection
    resultsSection.appendChild(authPrompt);
}
