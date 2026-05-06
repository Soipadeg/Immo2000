# 🚀 Guide HTML/JS Pur - Simulateur de Prêt

**Statut :** ✅ Complet et Prêt à l'Utilisation
**Durée de lecture :** 3 minutes
**Version :** 1.0

---

## 📌 Vue d'ensemble

Cette version utilise **HTML/JS/CSS pur** avec :
- ✅ Bootstrap 5 (mise en page responsive)
- ✅ Font Awesome (icônes)
- ✅ Axios (requêtes API)
- ✅ Pas de dépendances complexes (zero build step)

**Avantage :** Testable directement dans le navigateur, sans serveur Node.js ni compilation.

---

## 📦 Fichiers créés

### Emplacement : `/frontend/public/`

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `simulateur_pret.html` | 120+ | Structure HTML + Bootstrap 5 |
| `simulateur_pret.js` | 140+ | Logique (calculs, appels API, tableau) |
| `simulateur_pret.css` | 350+ | Styles + responsive + dark mode |

---

## 🎯 Test Rapide (1 minute)

### Option 1 : Tester directement (sans serveur)
```bash
# Ouvrir le fichier dans le navigateur
cd /home/djali/code/Soipadeg/Immo2000/frontend/public/
# Double-cliquez sur simulateur_pret.html
```

⚠️ **Note :** L'API ne fonctionnera pas localement sans CORS. Utilisez l'Option 2.

### Option 2 : Via Vite dev server (recommandé)
```bash
cd /home/djali/code/Soipadeg/Immo2000/frontend
npm run dev
# Ouvrez http://localhost:5173/simulateur_pret.html
```

### Option 3 : Via Flask backend
```bash
# En development
cd /home/djali/code/Soipadeg/Immo2000/backend
PYTHONPATH=. FLASK_APP=src.app:create_app FLASK_ENV=development python -m flask run

# Ouvrez http://localhost:5000/simulateur-pret.html
```

---

## 🔧 Configuration API

**Fichier :** `frontend/public/simulateur_pret.js` (ligne 20)

```javascript
const API_BASE_URL = 'http://localhost:5000/api/v1';
```

### Pour développement local :
```javascript
const API_BASE_URL = 'http://localhost:5000/api/v1';
```

### Pour production (exemple) :
```javascript
const API_BASE_URL = 'https://api.immo2000.fr/api/v1';
```

---

## ✨ Fonctionnalités

| Fonctionnalité | Détails | Status |
|---|---|---|
| **Formulaire** | 5 champs (revenu, apport, taux, durée, assurance) | ✅ |
| **Calcul temps réel** | Debounce 500ms | ✅ |
| **3 Cartes de résultats** | Capacité / Mensualité / Coût total | ✅ |
| **Tableau d'amortissement** | 12 mois + "Voir tout" | ✅ |
| **Responsive** | Mobile / Tablet / Desktop | ✅ |
| **Dark mode** | Préférence utilisateur | ✅ |
| **Gestion erreurs** | Messages clairs | ✅ |

---

## 📋 Checklist d'utilisation

- [ ] Fichiers créés dans `/frontend/public/`
- [ ] Backend `/api/v1/simulateur-pret` accessible
- [ ] Configuration API mise à jour (si nécessaire)
- [ ] Tester en entrant un revenu > 0
- [ ] Vérifier que les résultats s'affichent
- [ ] Tester le tableau d'amortissement

---

## 🧪 Tests manuels

### Test 1 : Calcul de base
```
Revenu: 3000€
Apport: 50000€
Résultat attendu:
✅ Capacité: ~250 000€
✅ Mensualité: ~1 450€
✅ Coût total: ~348 000€
```

### Test 2 : Erreur (revenu = 0)
```
Revenu: 0€
Résultat attendu:
✅ Message d'erreur affiché
✅ Pas d'appel API
```

### Test 3 : Responsive
```
Ouvrir sur:
💻 Desktop (1920px) → Layout 3 colonnes
📱 Mobile (375px) → Layout 1 colonne
📱 Tablet (768px) → Layout 2 colonnes
```

### Test 4 : Dark mode
```
Windows 11: Paramètres → Couleurs → Sombre
macOS: Préférences Système → Général → Sombre
Firefox: about:preferences → Apparence → Forcé sombre
```

---

## 🐛 Dépannage

### Erreur CORS
**Message :** "Access to XMLHttpRequest blocked by CORS policy"
**Cause :** Backend n'accepte pas les requêtes cross-origin
**Solution :**
- Assurez-vous que le backend a `CORS` activé
- Testez via `npm run dev` (proxy Vite)
- Ou lancez le backend avec `--cors`

### Erreur 404 sur l'API
**Message :** "404 Not Found"
**Cause :** L'endpoint `/api/v1/simulateur-pret` n'existe pas
**Solution :** Vérifiez que le backend Flask a l'endpoint implémenté

### Les résultats ne s'affichent pas
**Cause :** Revenu = 0 ou vide
**Solution :** Entrez un revenu > 0€

### Console JavaScript vide
**Vérifier :**
```javascript
// Ouvrez DevTools (F12) → Console
console.log(document.getElementById('simulateurForm')); // Doit retourner l'élément
```

---

## 📁 Structure complète du projet

```
immo2000/
├── frontend/
│   ├── public/
│   │   ├── simulateur_pret.html    ← HTML pur
│   │   ├── simulateur_pret.js      ← JavaScript
│   │   └── simulateur_pret.css     ← Styles
│   ├── src/
│   │   ├── pages/
│   │   │   ├── SimulateurPret.jsx  (React version)
│   │   │   └── SimulateurPret.css
│   │   └── App.jsx
│   └── package.json
├── backend/
│   └── src/
│       └── app.py (avec endpoint /api/v1/simulateur-pret)
└── ...
```

---

## 🎨 Personnalisation

### Changer la couleur primaire
**Fichier :** `simulateur_pret.css`

```css
/* Ligne ~80 */
.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    /* Vos couleurs ici */
}
```

### Changer les valeurs par défaut
**Fichier :** `simulateur_pret.html`

```html
<!-- Taux d'intérêt (ligne 60) -->
<input ... value="3.5">  <!-- Changez 3.5 ici -->

<!-- Durée (ligne 66) -->
<input ... value="20">   <!-- Changez 20 ici -->

<!-- Assurance (ligne 72) -->
<input ... value="0.3">  <!-- Changez 0.3 ici -->
```

### Ajouter une validation personnalisée
**Fichier :** `simulateur_pret.js` (ligne 85)

```javascript
// Ajouter avant l'appel API
if (apport > 1000000) {
    throw new Error("L'apport ne peut pas dépasser 1 million d'euros.");
}
```

---

## 📊 API Response Structure

L'API retourne :

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
    // ... autres mois
  ]
}
```

---

## 🔌 Intégration avec le backend Flask

### Route Flask recommandée

```python
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='static')

@app.route('/simulateur-pret')
def simulateur_pret():
    return send_from_directory('static', 'simulateur_pret.html')
```

### Ou avec Vite (dev)

Le serveur Vite sert automatiquement les fichiers de `public/`.

---

## 🚀 Déploiement

### En production

1. **Copier les fichiers vers le serveur :**
   ```bash
   cp -r frontend/public/simulateur_pret.* /var/www/immo2000/static/
   ```

2. **Configurer l'API URL :**
   ```javascript
   // Dans simulateur_pret.js
   const API_BASE_URL = 'https://api.immo2000.fr/api/v1';
   ```

3. **Ajouter une route Flask :**
   ```python
   @app.route('/simulateur-pret')
   def simulateur_pret():
       return send_from_directory('static', 'simulateur_pret.html')
   ```

---

## 📚 Ressources

- **Bootstrap 5 Docs :** https://getbootstrap.com/
- **Font Awesome :** https://fontawesome.com/
- **Axios Docs :** https://axios-http.com/
- **MDN JS :** https://developer.mozilla.org/en-US/docs/Web/JavaScript/

---

## 🆚 Comparaison : React vs HTML/JS

| Critère | React | HTML/JS |
|---------|-------|---------|
| **Taille bundle** | ~40KB | ~5KB |
| **Complexité** | Moyenne | Faible |
| **Build step** | Oui (Vite) | Non |
| **Learning curve** | Moyenne | Faible |
| **Extensibilité** | Haute | Moyenne |
| **Performance** | Excellente | Excellente |

→ **HTML/JS** est idéal pour des pages simples et testables localement.

---

**Créé avec ❤️ pour Immo2000 | v1.0 | Mai 2026**
