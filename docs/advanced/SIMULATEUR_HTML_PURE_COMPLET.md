# 📄 Simulateur de Prêt - Version HTML/JS Pure

**Projet :** Immo2000
**Statut :** ✅ Complet et Prêt à l'Utilisation
**Type :** Frontend HTML/JS/CSS
**Version :** 1.0
**Date :** Mai 2026

---

## 📌 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Fichiers détails](#fichiers-détails)
4. [Fonctionnalités](#fonctionnalités)
5. [Guide d'utilisation](#guide-dutilisation)
6. [Configuration](#configuration)
7. [Exemples](#exemples)
8. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

### Objectif
Créer une interface de simulateur de prêt immobilier utilisant uniquement **HTML, JavaScript et CSS** (zéro dépendances complexes).

### Avantages
- ✅ **Testable localement** - Ouvrir le HTML dans n'importe quel navigateur
- ✅ **Pas de build step** - Pas de Node.js requis
- ✅ **Léger** - ~5KB au total
- ✅ **Responsive** - Mobile/Tablet/Desktop
- ✅ **Dark mode** - Préférence utilisateur
- ✅ **Bootstrap 5** - Moderne et professionnel

### Limitations
- ❌ Pas d'authentification JWT intégrée
- ❌ Pas de gestion d'état complexe
- ❌ CORS nécessaire pour les appels API

---

## 🏗️ Architecture

### Stack technique
```
HTML (structure)
  + Bootstrap 5 (CSS framework)
  + Font Awesome 6 (icônes)
  ↓
JavaScript (logique)
  + Axios (HTTP client)
  ↓
CSS personnalisé (styles + animations)
```

### Flux de données
```
Utilisateur saisit des données
  ↓
onChange listener (debounce 500ms)
  ↓
fetchResults() → POST /api/v1/simulateur-pret
  ↓
Réponse JSON
  ↓
displayResults() → Afficher les cartes + tableau
```

### Dépendances
```html
<!-- CDN - Pas d'installation requise -->
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

---

## 📦 Fichiers détails

### 1. simulateur_pret.html (120+ lignes)

**Rôle :** Structure HTML avec Bootstrap 5

**Sections principales :**

#### Header
```html
<h1>🏠 Simulateur de Prêt Immobilier</h1>
<p class="lead">Estimez votre capacité d'emprunt en 2 minutes</p>
```

#### Formulaire
```html
<form id="simulateurForm">
  <!-- 5 champs : revenu, apport, taux, durée, assurance -->
  <input id="revenu_mensuel_net" required min="1" />
  <input id="apport" min="0" />
  <input id="taux_interet" value="3.5" />
  <input id="duree_ans" value="20" />
  <input id="taux_assurance" value="0.3" />
</form>
```

#### Résultats
```html
<div id="results" class="d-none">
  <!-- 3 cartes : capacité, mensualité, coût -->
  <!-- Tableau d'amortissement -->
</div>
```

#### Chargement & Erreurs
```html
<div id="loadingMessage" class="d-none">Calcul en cours...</div>
<div id="errorMessage" class="alert alert-danger d-none"></div>
```

---

### 2. simulateur_pret.js (140+ lignes)

**Rôle :** Logique et gestion des événements

#### Configuration
```javascript
const API_BASE_URL = 'http://localhost:5000/api/v1';
```

#### Fonction principale : `fetchResults()`
```javascript
const fetchResults = async () => {
    // 1. Récupérer les valeurs du formulaire
    const revenu = parseFloat(document.getElementById('revenu_mensuel_net').value);

    // 2. Valider
    if (revenu <= 0) throw new Error("...");

    // 3. Appeler l'API
    const response = await axios.post(`${API_BASE_URL}/simulateur-pret`, {
        revenu_mensuel_net: revenu,
        apport: apport,
        taux_interet: tauxInteret,
        duree_ans: dureeAns,
        taux_assurance: tauxAssurance
    });

    // 4. Afficher les résultats
    displayResults(response.data);
};
```

#### Fonction : `formatCurrency()`
```javascript
const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};
// Retourne : "250 000 €"
```

#### Fonction : `renderAmortissementTable()`
```javascript
const renderAmortissementTable = (rows) => {
    // Crée les lignes du tableau pour chaque mois
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
```

#### Événements
```javascript
// Debounce 500ms
inputs.forEach(input => {
    input.addEventListener('input', () => {
        clearTimeout(window.fetchTimeout);
        window.fetchTimeout = setTimeout(fetchResults, 500);
    });
});

// Bouton réinitialiser
resetBtn.addEventListener('click', () => {
    form.reset();
    resultsDiv.classList.add('d-none');
});

// Voir tout le tableau
showFullTableBtn.addEventListener('click', () => {
    showFullTable = !showFullTable;
    renderAmortissementTable(showFullTable ? fullTableData : fullTableData.slice(0, 12));
});
```

---

### 3. simulateur_pret.css (350+ lignes)

**Rôle :** Styles et responsive design

#### Sections principales

**Typography**
```css
h1 { color: #2c3e50; font-weight: 700; }
.lead { color: #7f8c8d; }
```

**Cartes**
```css
.card {
    border: none;
    border-radius: 0.75rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
}
.card:hover {
    box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.15);
}
```

**Résultats**
```css
.result-card {
    background-color: #f8f9fa;
    padding: 1.5rem;
    border-radius: 0.75rem;
}
.result-value {
    font-size: 2rem;
    font-weight: bold;
    color: #2E86C1;
}
```

**Responsive**
```css
@media (max-width: 768px) {
    .result-value { font-size: 1.5rem; }
}
@media (max-width: 480px) {
    .form-control { font-size: 16px; /* iOS zoom fix */ }
}
```

**Dark mode**
```css
@media (prefers-color-scheme: dark) {
    body { background-color: #1a1a1a; }
    .card { background-color: #2d2d2d; }
}
```

**Accessibilité**
```css
@media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; }
}
```

---

## ✨ Fonctionnalités

### 1. Formulaire réactif
- 5 champs (revenu, apport, taux, durée, assurance)
- Validation HTML5 (min/max/required)
- Placeholder avec exemples
- Help text pour chaque champ

### 2. Calcul en temps réel
- Debounce 500ms (évite les appels massifs)
- Affichage du spinner pendant le calcul
- Gestion des erreurs avec messages clairs

### 3. Affichage des résultats (3 cartes)
- **Capacité d'emprunt** 💰 - Montant max empruntable
- **Mensualité** 📅 - Paiement mensuel
- **Coût total du crédit** 💵 - Montant total payé

### 4. Tableau d'amortissement
- Affiche 12 premiers mois par défaut
- Colonnes : Mois, Capital restant, Intérêts, Assurance, Mensualité
- Bouton "Voir tout le tableau" si plus de 12 mois
- Lignes alternées pour lisibilité

### 5. Réinitialiser
- Remet les champs aux valeurs par défaut
- Cache les résultats
- Efface les messages d'erreur

### 6. Responsive design
- Mobile (375px) : 1 colonne
- Tablet (768px) : 2-3 colonnes
- Desktop (1920px) : 3 colonnes
- Font Awesome pour icônes

### 7. Dark mode
- Détecte la préférence utilisateur
- Couleurs adaptées
- Lisibilité optimale

---

## 👤 Guide d'utilisation

### Accès
```
Depuis le navigateur : Ouvrir simulateur_pret.html
Depuis Vite : http://localhost:5173/simulateur_pret.html
Depuis Flask : http://localhost:5000/simulateur-pret.html
```

### Utilisation basique (2 min)

1. **Entrer le revenu mensuel net** (obligatoire)
   - Ex: 3000€

2. **Entrer l'apport** (optionnel)
   - Ex: 50000€

3. **Ajuster les paramètres** (optionnel)
   - Taux par défaut : 3.5%
   - Durée par défaut : 20 ans
   - Assurance par défaut : 0.3%

4. **Voir les résultats** (automatique)
   - Capacité d'emprunt affichée
   - Mensualité calculée
   - Coût total affiché

5. **Consulter le tableau** (optionnel)
   - Cliquez sur "Voir tout le tableau" pour les 12+ mois

---

## ⚙️ Configuration

### API URL
**Fichier :** `simulateur_pret.js` (ligne 20)

```javascript
const API_BASE_URL = 'http://localhost:5000/api/v1';
```

Pour développement :
```javascript
const API_BASE_URL = 'http://localhost:5000/api/v1';
```

Pour production :
```javascript
const API_BASE_URL = 'https://api.immo2000.fr/api/v1';
```

### Valeurs par défaut
**Fichier :** `simulateur_pret.html`

```html
<!-- Taux d'intérêt -->
<input id="taux_interet" value="3.5" />

<!-- Durée -->
<input id="duree_ans" value="20" />

<!-- Assurance -->
<input id="taux_assurance" value="0.3" />
```

---

## 💡 Exemples

### Exemple 1 : Acheteur standard
```
Revenu: 3000€
Apport: 50000€
Taux: 3.5%
Durée: 20 ans
Assurance: 0.3%

Résultats:
✓ Capacité: 250 000€
✓ Mensualité: 1 450€
✓ Coût total: 348 000€
```

### Exemple 2 : Avec apport important
```
Revenu: 3000€
Apport: 100 000€

Résultats:
✓ Capacité: 250 000€ (inchangée)
✓ Mensualité: 900€ (plus basse)
✓ Coût total: 216 000€ (moins)
```

### Exemple 3 : Durée courte
```
Revenu: 3000€
Durée: 15 ans (vs 20)

Résultats:
✓ Mensualité: 1 850€ (plus haute)
✓ Coût total: 332 000€ (moins total)
```

---

## 🐛 Dépannage

### Problème : "CORS error"
**Message :** "Access to XMLHttpRequest at 'http://localhost:5000' blocked by CORS"

**Cause :** Backend n'accepte pas les requêtes cross-origin

**Solutions :**
1. Assurez-vous que le backend a `CORS` activé
2. Testez via `npm run dev` (Vite + proxy)
3. Ou utilisez Flask-CORS :
   ```python
   from flask_cors import CORS
   CORS(app)
   ```

### Problème : "404 Not Found"
**Message :** "POST /api/v1/simulateur-pret 404"

**Cause :** L'endpoint n'existe pas

**Solution :** Vérifiez que le backend Flask a :
```python
@app.route('/api/v1/simulateur-pret', methods=['POST'])
def simulateur_pret():
    # ... logique ...
```

### Problème : Les résultats ne s'affichent pas
**Cause :** Revenu = 0 ou vide

**Solution :** Entrez un revenu > 0€

### Problème : Validations ne fonctionnent pas
**Cause :** Le navigateur ne supporte pas HTML5 validation

**Solution :** Ajoutez des validations JavaScript :
```javascript
if (revenu <= 0 || revenu === '') {
    throw new Error("Revenu invalide");
}
```

---

## 📊 Référence API

### Request
```json
POST /api/v1/simulateur-pret
{
  "revenu_mensuel_net": 3000,
  "apport": 50000,
  "taux_interet": 3.5,
  "duree_ans": 20,
  "taux_assurance": 0.3
}
```

### Response
```json
{
  "capacite_emprunt": 250000,
  "mensualite": 1450,
  "cout_total_credit": 348000,
  "tableau_amortissement": [
    {
      "mois": 1,
      "capital_restant": 248550,
      "interets": 729,
      "assurance": 62.5,
      "mensualite": 1450
    },
    // ... 11 autres mois ...
  ]
}
```

---

## 🚀 Déploiement

### Étapes
1. Copier les fichiers sur le serveur
2. Configurer l'API URL (si nécessaire)
3. Ajouter une route Flask (optionnel)
4. Tester

### Exemple avec Flask
```python
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='static')

@app.route('/simulateur-pret')
def simulateur_pret():
    return send_from_directory('static', 'simulateur_pret.html')
```

---

## 📚 Ressources

- **Bootstrap 5 :** https://getbootstrap.com/
- **Font Awesome :** https://fontawesome.com/
- **Axios :** https://axios-http.com/
- **MDN JavaScript :** https://developer.mozilla.org/en-US/docs/Web/JavaScript/

---

**Créé avec ❤️ pour Immo2000 | v1.0 | Mai 2026**
