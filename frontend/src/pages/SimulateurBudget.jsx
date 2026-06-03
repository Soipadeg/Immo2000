<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simulateur de Budget - immo2000</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #2c3e50;
            text-align: center;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #2980b9;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 4px;
            display: none;
        }
        .result h2 {
            margin-top: 0;
            color: #2c3e50;
        }
        .result-item {
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div>💰 Simulateur de Budget Immobilier</div>
    <div>Estimez votre budget global pour l'achat d'un bien immobilier.</div>

    <form id="budgetForm">
        <div class="form-group">
            <label for="prixBien">Prix du bien (€) :</label>
            <input type="number" id="prixBien" placeholder="Ex: 300000" required>
        </div>

        <div class="form-group">
            <label for="fraisNotaire">Frais de notaire (estimés à 2-8%) :</label>
            <select id="fraisNotaire">
                <option value="0.02">2% (bien neuf)</option>
                <option value="0.05" selected>5% (bien ancien)</option>
                <option value="0.08">8% (bien très ancien)</option>
            </select>
        </div>

        <div class="form-group">
            <label for="commission">Commission (immo2000) :</label>
            <input type="number" id="commission" value="1.5" step="0.1" readonly> %
        </div>

        <div class="form-group">
            <label for="travaux">Budget travaux (€) :</label>
            <input type="number" id="travaux" placeholder="Ex: 10000" value="0">
        </div>

        <div class="form-group">
            <label for="apport">Apport personnel (€) :</label>
            <input type="number" id="apport" placeholder="Ex: 50000" required>
        </div>

        <div class="form-group">
            <label for="tauxEmprunt">Taux d'emprunt (%) :</label>
            <input type="number" id="tauxEmprunt" placeholder="Ex: 3.5" step="0.01" value="3.5" required>
        </div>

        <div class="form-group">
            <label for="dureeEmprunt">Durée de l'emprunt (années) :</label>
            <input type="number" id="dureeEmprunt" placeholder="Ex: 20" value="20" required>
        </div>

        <button type="submit">Calculer mon budget</button>
    </form>

    <div class="result" id="result">
        <div>📊 Résultat</div>
        <div class="result-item">
            <strong>Prix du bien :</strong> <div id="resultPrixBien">0</div> €
        </div>
        <div class="result-item">
            <strong>Frais de notaire :</strong> <div id="resultFraisNotaire">0</div> €
        </div>
        <div class="result-item">
            <strong>Commission (1,5%) :</strong> <div id="resultCommission">0</div> €
        </div>
        <div class="result-item">
            <strong>Budget travaux :</strong> <div id="resultTravaux">0</div> €
        </div>
        <div class="result-item">
            <strong>Coût total :</strong> <div id="resultCoutTotal">0</div> €
        </div>
        <div class="result-item">
            <strong>Apport personnel :</strong> <div id="resultApport">0</div> €
        </div>
        <div class="result-item">
            <strong>Montant à emprunter :</strong> <div id="resultMontantEmprunt">0</div> €
        </div>
        <div class="result-item">
            <strong>Mensualité estimée :</strong> <div id="resultMensualite">0</div> €/mois
        </div>
        <div class="result-item">
            <strong>Coût total du crédit :</strong> <div id="resultCoutCredit">0</div> €
        </div>
    </div>

    <script>
        document.getElementById('budgetForm').addEventListener('submit', function(e) {
            e.preventDefault();

            // Récupérer les valeurs
            const prixBien = parseFloat(document.getElementById('prixBien').value) || 0;
            const fraisNotaireRate = parseFloat(document.getElementById('fraisNotaire').value) || 0;
            const commissionRate = parseFloat(document.getElementById('commission').value) || 1.5;
            const travaux = parseFloat(document.getElementById('travaux').value) || 0;
            const apport = parseFloat(document.getElementById('apport').value) || 0;
            const tauxEmprunt = parseFloat(document.getElementById('tauxEmprunt').value) || 0;
            const dureeEmprunt = parseInt(document.getElementById('dureeEmprunt').value) || 0;

            // Calculs
            const fraisNotaire = prixBien * fraisNotaireRate;
            const commission = prixBien * (commissionRate / 100);
            const coutTotal = prixBien + fraisNotaire + commission + travaux;
            const montantEmprunt = coutTotal - apport;

            // Calcul mensualité (formule simplifiée)
            const tauxMensuel = tauxEmprunt / 100 / 12;
            const nombreMois = dureeEmprunt * 12;
            const mensualite = montantEmprunt * tauxMensuel / (1 - Math.pow(1 + tauxMensuel, -nombreMois));
            const coutCredit = (mensualite * nombreMois) - montantEmprunt;

            // Afficher les résultats
            document.getElementById('resultPrixBien').textContent = prixBien.toFixed(2);
            document.getElementById('resultFraisNotaire').textContent = fraisNotaire.toFixed(2);
            document.getElementById('resultCommission').textContent = commission.toFixed(2);
            document.getElementById('resultTravaux').textContent = travaux.toFixed(2);
            document.getElementById('resultCoutTotal').textContent = coutTotal.toFixed(2);
            document.getElementById('resultApport').textContent = apport.toFixed(2);
            document.getElementById('resultMontantEmprunt').textContent = montantEmprunt.toFixed(2);
            document.getElementById('resultMensualite').textContent = mensualite.toFixed(2);
            document.getElementById('resultCoutCredit').textContent = coutCredit.toFixed(2);

            // Afficher le résultat
            document.getElementById('result').style.display = 'block';
        });
    </script>
</body>
</html>
