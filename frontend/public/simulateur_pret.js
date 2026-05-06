document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM
    const form = document.getElementById('simulateurForm');
    const errorMessage = document.getElementById('errorMessage');
    const loadingMessage = document.getElementById('loadingMessage');
    const resultsDiv = document.getElementById('results');
    const capaciteEmpruntEl = document.getElementById('capaciteEmprunt');
    const mensualiteEl = document.getElementById('mensualite');
    const coutTotalEl = document.getElementById('coutTotal');
    const amortissementTableBody = document.getElementById('amortissementTableBody');
    const showFullTableBtn = document.getElementById('showFullTableBtn');
    const resetBtn = document.getElementById('resetBtn');

    // Variables globales
    let fullTableData = [];
    let showFullTable = false;
    let fetchTimeout = null;

    // Configuration de l'API
    // Modifiez cette URL selon votre configuration
    const API_BASE_URL = 'http://localhost:5000/api/v1';

    // Formater un nombre en euros
    const formatCurrency = (value) => {
        if (value === undefined || value === null) return '-';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Afficher les résultats
    const displayResults = (data) => {
        capaciteEmpruntEl.textContent = formatCurrency(data.capacite_emprunt);
        mensualiteEl.textContent = formatCurrency(data.mensualite);
        coutTotalEl.textContent = formatCurrency(data.cout_total_credit);

        // Stocker les données complètes du tableau
        fullTableData = data.tableau_amortissement || [];

        // Afficher les 12 premiers mois par défaut
        renderAmortissementTable(fullTableData.slice(0, 12));

        // Afficher le bouton "Voir tout" si plus de 12 mois
        showFullTableBtn.classList.toggle('d-none', fullTableData.length <= 12);

        // Afficher les résultats
        resultsDiv.classList.remove('d-none');
    };

    // Rendre le tableau d'amortissement
    const renderAmortissementTable = (rows) => {
        if (rows.length === 0) {
            amortissementTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Aucune donnée disponible</td></tr>';
            return;
        }

        amortissementTableBody.innerHTML = rows.map(row => `
            <tr>
                <td>${row.mois}</td>
                <td>${formatCurrency(row.capital_restant)}</td>
                <td>${formatCurrency(row.interets)}</td>
                <td>${formatCurrency(row.assurance)}</td>
                <td>${formatCurrency(row.mensualite)}</td>
            </tr>
        `).join('');
    };

    // Récupérer les résultats depuis l'API
    const fetchResults = async () => {
        errorMessage.classList.add('d-none');
        loadingMessage.classList.remove('d-none');
        resultsDiv.classList.add('d-none');

        try {
            // Récupérer les valeurs du formulaire
            const revenu = parseFloat(document.getElementById('revenu_mensuel_net').value) || 0;
            const apport = parseFloat(document.getElementById('apport').value) || 0;
            const tauxInteret = parseFloat(document.getElementById('taux_interet').value);
            const dureeAns = parseInt(document.getElementById('duree_ans').value);
            const tauxAssurance = parseFloat(document.getElementById('taux_assurance').value);

            // Validation basique
            if (revenu <= 0) {
                throw new Error("Le revenu mensuel net doit être supérieur à 0.");
            }

            // Appel à l'API
            const response = await axios.post(`${API_BASE_URL}/simulateur-pret`, {
                revenu_mensuel_net: revenu,
                apport: apport,
                taux_interet: tauxInteret,
                duree_ans: dureeAns,
                taux_assurance: tauxAssurance
            });

            displayResults(response.data);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message;
            errorMessage.textContent = `Erreur: ${errorMsg}`;
            errorMessage.classList.remove('d-none');
        } finally {
            loadingMessage.classList.add('d-none');
        }
    };

    // Écouter les changements dans le formulaire
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            // Attendre 500ms après la dernière saisie pour éviter les appels API trop fréquents
            if (fetchTimeout) {
                clearTimeout(fetchTimeout);
            }
            fetchTimeout = setTimeout(fetchResults, 500);
        });
    });

    // Réinitialiser le formulaire
    resetBtn.addEventListener('click', () => {
        form.reset();
        // Restaurer les valeurs par défaut
        document.getElementById('taux_interet').value = '3.5';
        document.getElementById('duree_ans').value = '20';
        document.getElementById('taux_assurance').value = '0.3';
        resultsDiv.classList.add('d-none');
        errorMessage.classList.add('d-none');
        showFullTable = false;
    });

    // Afficher tout le tableau
    showFullTableBtn.addEventListener('click', () => {
        showFullTable = !showFullTable;
        renderAmortissementTable(showFullTable ? fullTableData : fullTableData.slice(0, 12));
        showFullTableBtn.innerHTML = showFullTable
            ? '<i class="fas fa-chevron-up me-1"></i>Voir moins'
            : '<i class="fas fa-chevron-down me-1"></i>Voir tout le tableau';
    });
});
