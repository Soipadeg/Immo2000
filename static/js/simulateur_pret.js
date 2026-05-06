/**
 * simulateur_pret.js - Logique du Simulateur de Prêt
 */

let debounceTimer;
let fullTableData = [];

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('simulatorForm');
    const showFullTableBtn = document.getElementById('showFullTableBtn');

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
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            performSimulation();
        });
    }

    // Bouton pour afficher le tableau complet
    if (showFullTableBtn) {
        showFullTableBtn.addEventListener('click', () => {
            displayFullTable();
        });
    }
});

/**
 * Effectue la simulation de prêt
 */
async function performSimulation() {
    const form = document.getElementById('simulatorForm');
    const revenu = parseFloat(document.getElementById('revenuMensuel').value);
    const apport = parseFloat(document.getElementById('apport').value) || 0;
    const tauxInteret = parseFloat(document.getElementById('tauxInteret').value) || 3.5;
    const duree = parseInt(document.getElementById('duree').value) || 20;
    const tauxAssurance = parseFloat(document.getElementById('tauxAssurance').value) || 0.3;

    // Validation
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

    showLoadingSpinner();
    document.getElementById('errorMessage').innerHTML = '';

    try {
        const response = await axios.post('/simulateur-pret', {
            revenu_mensuel_net: revenu,
            apport: apport,
            taux_interet: tauxInteret,
            duree_ans: duree,
            taux_assurance: tauxAssurance
        });

        displayResults(response.data);
        hideLoadingSpinner();
    } catch (error) {
        hideLoadingSpinner();
        console.error('Erreur lors de la simulation:', error);

        let errorMessage = 'Erreur lors de la simulation du prêt. Veuillez réessayer.';
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        }

        showErrorMessage(errorMessage);
    }
}

/**
 * Affiche les résultats de la simulation
 */
function displayResults(data) {
    const resultsSection = document.getElementById('resultsSection');

    if (!resultsSection) return;

    // Affiche la section des résultats
    resultsSection.style.display = 'block';

    // Remplit les valeurs des résultats
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

    // Affiche les 12 premiers mois du tableau d'amortissement
    displayAmortissementPreview(data.tableau_amortissement || []);

    // Stocke le tableau complet pour affichage ultérieur
    fullTableData = data.tableau_amortissement || [];
}

/**
 * Affiche un aperçu du tableau d'amortissement (12 premiers mois)
 */
function displayAmortissementPreview(tableau) {
    const tbody = document.getElementById('amortissementBody');

    if (!tbody) return;

    // Affiche les 12 premiers mois
    const first12Months = tableau.slice(0, 12);

    tbody.innerHTML = first12Months.map((row, index) => `
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

    // Affiche la modale
    const fullTableModal = new bootstrap.Modal(document.getElementById('fullTableModal'));
    fullTableModal.show();
}

/**
 * Réinitialise le formulaire
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('simulatorForm');
    if (form) {
        const resetBtn = form.querySelector('button[type="reset"]');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                setTimeout(() => {
                    const resultsSection = document.getElementById('resultsSection');
                    if (resultsSection) {
                        resultsSection.style.display = 'none';
                    }
                    document.getElementById('errorMessage').innerHTML = '';
                    fullTableData = [];
                }, 100);
            });
        }
    }
});
