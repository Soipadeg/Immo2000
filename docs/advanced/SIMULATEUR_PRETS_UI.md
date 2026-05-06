# 🏠 Interface Utilisateur du Simulateur de Prêt Immobilier

**Projet :** Immo2000
**Statut :** ✅ Complet et Prêt à l'Utilisation
**Date de Création :** Mai 2026
**Version :** 1.0

---

## 📌 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Fonctionnalités](#fonctionnalités)
4. [Guide d'intégration](#guide-dintégration)
5. [Guide utilisateur](#guide-utilisateur)
6. [Guide développeur](#guide-développeur)
7. [Tests](#tests)
8. [FAQ](#faq)
9. [Versions alternatives](#versions-alternatives)

---

## 🎯 Vue d'ensemble

### Objectif
Créer une interface intuitive permettant aux acheteurs de :
- 💰 Calculer leur **capacité d'emprunt** en fonction de leurs revenus et apport
- 📅 Obtenir une estimation de leur **mensualité** (avec intérêts + assurance)
- 💵 Visualiser le **coût total du crédit**
- 📋 Consulter le **tableau d'amortissement** (12 premiers mois ou plus)

### Contexte Technique
- **Framework :** React 18.2.0 avec Vite
- **UI Library :** Material-UI v5.14.0
- **HTTP Client :** Axios 1.4.0
- **Style :** CSS3 + Material-UI (responsive, dark mode)
- **Authentification :** JWT (Bearer token)

### Backend Existant
**Endpoint :** `POST /api/v1/simulateur-pret`

**Request :**
```json
{
  "revenu_mensuel_net": 3000,     // € (obligatoire)
  "apport": 50000,                // € (optionnel, défaut: 0)
  "taux_interet": 3.5,            // % (optionnel, défaut: 3.5)
  "duree_ans": 20,                // ans (optionnel, défaut: 20)
  "taux_assurance": 0.3           // % (optionnel, défaut: 0.3)
}
```

**Response :**
```json
{
  "capacite_emprunt": 250000,     // € - Montant maximum empruntable
  "mensualite": 1450,             // € - Montant mensuel (capital + intérêts + assurance)
  "cout_total_credit": 348000,    // € - Montant total payé (capital + intérêts + assurance)
  "tableau_amortissement": [
    {
      "mois": 1,
      "capital_restant": 248550,  // € - Capital restant après paiement
      "interets": 729,            // € - Intérêts payés ce mois
      "assurance": 62.5,          // € - Assurance payée ce mois
      "mensualite": 1450          // € - Montant total payé ce mois
    },
    // ... 11 autres mois
  ]
}
```

---

## 🏗️ Architecture

### Structure des fichiers
```
frontend/src/
├── pages/
│   ├── SimulateurPret.jsx        (280 lignes) - Composant React principal
│   └── SimulateurPret.css        (250+ lignes) - Styles responsive + dark mode
├── App.jsx                        (modifié) - Route + import + navigation
├── services/
│   └── api.js                     (inchangé) - Configuration axios (JWT)
└── index.jsx                      (inchangé)
```

### Flux de données
```
Formulaire (input)
  ↓
handleInputChange() → state update
  ↓
useEffect (debounce 500ms)
  ↓
fetchResults() → POST /api/v1/simulateur-pret
  ↓
Réponse API
  ↓
Affichage des résultats (cards + tableau)
```

### Composants Material-UI utilisés
- `Container` - Wrapper avec max-width
- `Paper` - Container avec ombre (formulaire)
- `TextField` - Champs de saisie (revenu, apport, etc.)
- `Button` - Boutons (réinitialiser)
- `Box` - Conteneurs génériques
- `Typography` - Textes (titres, labels)
- `Alert` - Messages d'erreur/succès
- `Card` - Cartes pour les résultats
- `CardContent` - Contenu des cartes
- `Grid` - Mise en page responsive
- `CircularProgress` - Spinner de chargement
- `Table` / `TableHead` / `TableBody` / `TableCell` / `TableRow` - Tableau d'amortissement
- `TableContainer` - Container du tableau

---

## ✨ Fonctionnalités

### 1. Formulaire de saisie
**Champs disponibles :**

| Champ | Type | Défaut | Validation |
|-------|------|--------|-----------|
| Revenu mensuel net | Number | - | > 0 (obligatoire) |
| Apport | Number | - | ≥ 0 (optionnel) |
| Taux d'intérêt (%) | Number | 3.5 | 0-15 |
| Durée (ans) | Number | 20 | 1-30 |
| Taux assurance (%) | Number | 0.3 | 0-1 |

**Comportement :**
- Calcul **automatique** à chaque changement (debounce 500ms)
- Champs formatés avec `inputProps` pour contrôler min/max/step
- Placeholder avec exemples (ex: "Ex: 3000")

### 2. Calcul en temps réel
- Appel API **automatique** lors du changement de champs
- **Debounce** de 500ms pour éviter les appels massifs
- Affichage d'un spinner pendant le chargement
- Gestion des erreurs avec messages clairs

### 3. Affichage des résultats
**3 cartes principales :**

1. **Capacité d'emprunt** (💰)
   - Montant maximum que l'acheteur peut emprunter
   - Formule : 35% du revenu mensuel net * 12 * durée (approx.)

2. **Mensualité** (📅)
   - Montant mensuel fixe à payer
   - Comprend : capital + intérêts + assurance

3. **Coût total du crédit** (💵)
   - Montant total payé au cours de la durée du prêt
   - = Capacité d'emprunt + (mensualité × durée - capital emprunté)

**Design :**
- Cards avec gradient background
- Emoji pour meilleure compréhension
- Effet hover (translateY -4px)
- Valeurs formatées en euros (locale FR)

### 4. Tableau d'amortissement
**Colonnes :**
- **Mois** - Numéro du mois (1-12 par défaut, ou tous si cliqué)
- **Capital restant** - Montant restant à emprunter
- **Intérêts** - Intérêts payés ce mois
- **Assurance** - Assurance emprunteur payée ce mois
- **Mensualité** - Montant total payé ce mois

**Options :**
- Affiche 12 premiers mois par défaut
- Bouton "Voir tout le tableau" pour afficher tous les mois
- Lignes alternées (gris/blanc) pour meilleure lisibilité
- Effet hover sur les lignes

### 5. Gestion des erreurs
**Cas gérés :**
- Revenu mensuel net ≤ 0 → Message d'erreur
- Taux invalide → Message d'erreur
- Problème connexion API → Message d'erreur
- Session expirée (401) → Redirection vers /login

**Design des erreurs :**
- Alert Material-UI rouge
- Message clair et actionnable
- Bouton de fermeture (X)

### 6. Réinitialisation
**Bouton "Réinitialiser" :**
- Remet tous les champs aux valeurs par défaut
- Vide les résultats
- Efface les messages d'erreur/succès

---

## 🔗 Guide d'intégration

### 1. Imports
Les imports nécessaires sont déjà dans `SimulateurPret.jsx` :

```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, TextField, Button, Box, Typography,
  Alert, Card, CardContent, Grid, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import axios from 'axios';
import './SimulateurPret.css';
```

### 2. Configuration API
Récupère la **base URL** depuis :
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
```

Ajoute le **JWT token** aux headers :
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
}
```

### 3. Authentification
Le composant utilise le **JWT stocké dans localStorage** :
```javascript
const token = localStorage.getItem('auth_token');
```

Si le token n'existe pas ou est expiré :
- L'API retourne 401
- Le composant affiche un message d'erreur
- Redirection vers `/login`

### 4. Ajout dans le Router
**Déjà fait dans `App.jsx` :**

```javascript
// Import
import SimulateurPret from './pages/SimulateurPret';

// Route
<Route path="/simulateur-pret" element={<SimulateurPret />} />

// Navigation
<Button color="inherit" href="/simulateur-pret">
  Simulateur de prêt
</Button>
```

### 5. Variables d'environnement (.env)
Assurez-vous d'avoir dans le `.env.local` du frontend :

```
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 👤 Guide utilisateur

### Accès au simulateur
1. Connectez-vous sur Immo2000 (email/mot de passe)
2. Cliquez sur le bouton **"Simulateur de prêt"** dans la barre de navigation
3. Vous arrivez à l'interface du simulateur

### Utilisation basique (2 minutes)

#### Étape 1 : Saisir vos informations
- **Revenu mensuel net (€)** : Votre salaire mensuel net après impôts
  - Ex: 3000€
- **Apport (€)** : Montant de votre épargne pour le premier achat (optionnel)
  - Ex: 50000€
- **Taux d'intérêt (%)** : Défaut 3.5% (changez si vous avez une meilleure offre)
- **Durée (ans)** : Défaut 20 ans (15, 20, 25, 30 ans selon vos préférences)
- **Taux assurance (%)** : Défaut 0.3% (assurance emprunteur obligatoire)

#### Étape 2 : Voir les résultats
Les résultats s'affichent **automatiquement** une fois que vous entrez votre revenu :

1. **Capacité d'emprunt** 💰 : Le montant maximum que vous pouvez emprunter
   - Exemple: 250 000€

2. **Mensualité** 📅 : Ce que vous payerez chaque mois
   - Exemple: 1 450€/mois

3. **Coût total du crédit** 💵 : Le total que vous paierez jusqu'à fin du prêt
   - Exemple: 348 000€ (sur 20 ans)

#### Étape 3 : Consulter le tableau d'amortissement (optionnel)
- Affiche les 12 premiers mois par défaut
- Cliquez sur **"Voir tout le tableau"** pour voir tous les mois
- Colonnes : Mois | Capital restant | Intérêts | Assurance | Mensualité

### Exemples d'utilisation

**Exemple 1 : Acheteur simple**
```
Revenu: 3000€ → Capacité: 250 000€, Mensualité: 1 450€, Coût total: 348 000€
```

**Exemple 2 : Avec apport important**
```
Revenu: 3000€ + Apport 100 000€ → Mensualité plus basse (ex: 900€ au lieu de 1 450€)
```

**Exemple 3 : Durée plus courte**
```
Revenu: 3000€ + Durée 15 ans au lieu de 20 → Mensualité plus haute (ex: 1 850€)
```

### Conseils pratiques
- 🔄 **Testez plusieurs scénarios** pour trouver le meilleur équilibre
- 📋 **Conservez le tableau d'amortissement** pour discuter avec votre banque
- 📧 **Partagez vos résultats** avec votre conseiller immobilier
- ✅ **Validez avec votre banque** : Ce simulateur est un outil d'estimation

---

## 👨‍💻 Guide développeur

### Structure du composant

```javascript
const SimulateurPret = () => {
  // 1. État local
  const [formData, setFormData] = useState({...});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showFullTable, setShowFullTable] = useState(false);

  // 2. Récupérer le token
  const token = localStorage.getItem('auth_token');

  // 3. Appel API
  const fetchResults = async (data) => { ... }

  // 4. Debounce (useEffect)
  useEffect(() => { ... }, [formData, token]);

  // 5. Handlers
  const handleInputChange = (e) => { ... }
  const handleReset = () => { ... }
  const formatCurrency = (value) => { ... }
  const renderAmortissementTable = () => { ... }

  // 6. JSX
  return (<div>...</div>);
};
```

### Personnalisation

#### Changer les couleurs
Modifiez dans `SimulateurPret.css` :
```css
.page-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* Vos couleurs */
}
```

#### Changer les valeurs par défaut
Dans `SimulateurPret.jsx` :
```javascript
const [formData, setFormData] = useState({
  revenu_mensuel_net: '',
  apport: '',
  taux_interet: 3.5,    // ← Changez ici
  duree_ans: 20,        // ← Ou ici
  taux_assurance: 0.3,  // ← Ou ici
});
```

#### Ajouter le calcul du ratio d'endettement
```javascript
// Dans renderAmortissementTable(), ajouter:
const ratioEndettement = (results.mensualite / formData.revenu_mensuel_net) * 100;
```

#### Exporter en PDF (bonus)
Installez `jspdf` et `html2canvas` :
```bash
npm install jspdf html2canvas
```

Puis créez une fonction :
```javascript
const handleExportPDF = async () => {
  const element = document.getElementById('results');
  const canvas = await html2canvas(element);
  const pdf = new jsPDF('p', 'mm', 'a4');
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10);
  pdf.save('simulateur-pret.pdf');
};
```

### Debugging

#### Vérifier les appels API
Ouvrez **DevTools → Network** et cherchez les requêtes `simulateur-pret`.

#### Vérifier le token JWT
Dans **Console** :
```javascript
console.log(localStorage.getItem('auth_token'));
```

#### Vérifier la réponse API
Dans **Network**, cliquez sur la requête et consultez l'onglet **Response**.

---

## 🧪 Tests

### Tests manuels

#### Test 1 : Calcul de base
```
Revenu: 3000€
Taux: 3.5%
Durée: 20 ans
Assurance: 0.3%
Apport: 0€

Résultat attendu:
- Capacité: 250 000€ (approx.)
- Mensualité: 1 200-1 500€
- Coût total: 300 000-360 000€ (approx.)
```

#### Test 2 : Avec apport
```
Revenu: 3000€
Apport: 50 000€
Durée: 20 ans

Résultat attendu:
- Mensualité basse: 900-1 200€ (vs 1 200-1 500€ sans apport)
```

#### Test 3 : Durée courte
```
Revenu: 3000€
Durée: 15 ans (vs 20 ans)

Résultat attendu:
- Mensualité haute: 1 500-1 800€ (vs 1 200-1 500€ pour 20 ans)
```

#### Test 4 : Messages d'erreur
```
Revenu: -100 ou 0

Résultat attendu:
- Message d'erreur affiché
- Pas d'appel API
```

#### Test 5 : Responsive
- Ouvrir le simulateur sur :
  - 💻 Desktop (1920px)
  - 📱 Mobile (375px)
  - 📱 Tablet (768px)
- Vérifier que le layout s'ajuste correctement

#### Test 6 : Dark mode
- Sur Windows 11 : Paramètres → Couleurs → Défaut sombre
- Sur macOS : Préférences Système → Général → Sombre
- Vérifier que les couleurs sont lisibles

### Tests avec Postman (API)

```
POST http://localhost:5000/api/v1/simulateur-pret

Headers:
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json

Body (JSON):
{
  "revenu_mensuel_net": 3000,
  "apport": 50000,
  "taux_interet": 3.5,
  "duree_ans": 20,
  "taux_assurance": 0.3
}
```

---

## ❓ FAQ

### Q1 : Pourquoi les résultats changent quand je modifie un champ ?
**R :** Le composant utilise un **debounce de 500ms**. Les résultats se mettent à jour automatiquement pour offrir une meilleure UX.

### Q2 : Comment fonctionne le calcul du tableau d'amortissement ?
**R :** Le backend calcule mois par mois le capital restant, les intérêts, et l'assurance. C'est un **tableau d'amortissement linéaire** standard (capital = constant, intérêts = décroissants).

### Q3 : Peut-on ajouter l'export PDF ?
**R :** Oui ! Voir la section **Personnalisation** → "Exporter en PDF (bonus)".

### Q4 : Peut-on ajouter des calculs supplémentaires (ratio d'endettement, etc.) ?
**R :** Oui ! Modifiez le backend `/api/v1/simulateur-pret` pour retourner plus de données, puis affichez-les dans le composant.

### Q5 : Comment gérer l'authentification ?
**R :** Le JWT est automatiquement inclus dans les headers. Si la session expire (401), l'utilisateur est redirigé vers `/login`.

### Q6 : C'est compatible avec mobile ?
**R :** Oui ! Les styles CSS utilisent **CSS Grid** et des breakpoints responsifs pour mobile (375px), tablet (768px), et desktop (1920px).

### Q7 : Peut-on personnaliser les valeurs par défaut ?
**R :** Oui ! Modifiez l'état initial dans `SimulateurPret.jsx` aux lignes 20-28.

### Q8 : Comment tester avec des données en français (virgule comme séparateur) ?
**R :** Le composant utilise `parseFloat()` qui accepte les formats de saisie standards (points). Les affichages sont formatés en français avec `Intl.NumberFormat('fr-FR')`.

---

## 📋 Checklist de déploiement

- [x] Composant `SimulateurPret.jsx` créé (280 lignes)
- [x] Styles `SimulateurPret.css` créés (responsive + dark mode)
- [x] Route `/simulateur-pret` ajoutée dans `App.jsx`
- [x] Bouton de navigation ajouté dans la navbar
- [x] Authentification JWT intégrée
- [x] Gestion des erreurs complète
- [x] Responsive design (mobile/tablet/desktop)
- [x] Dark mode supporté
- [x] Tableau d'amortissement fonctionnel
- [x] Tests manuels validés
- [x] Documentation complète rédigée

---

## 📚 Ressources

- **Material-UI Docs :** https://mui.com/
- **React Hooks :** https://react.dev/reference/react/hooks
- **Axios Docs :** https://axios-http.com/docs/intro
- **Date-fns (pour les dates) :** https://date-fns.org/

---

---

## 🆚 Versions alternatives

### Version HTML/JS Pure
**Fichiers :** `frontend/public/simulateur_pret.html/js/css`

**Avantages :**
- ✅ Zéro dépendances complexes
- ✅ Testable directement dans le navigateur (double-clic)
- ✅ Léger (~5KB total)
- ✅ Pas de build step (Vite ou Webpack)
- ✅ Bootstrap 5 (responsive)

**Idéal pour :**
- 🚀 Prototypage rapide
- 🧪 Tests utilisateurs
- 📄 Pages statiques
- 📱 Démo mobile/tablet

**Lire la suite :** [Guide HTML/JS Pure](./SIMULATEUR_HTML_PURE_COMPLET.md)

### Comparaison : React vs HTML/JS

| Critère | React | HTML/JS |
|---------|-------|---------|
| **Bundle size** | ~40KB | ~5KB |
| **Build step** | Oui (Vite) | Non |
| **Learning curve** | Moyenne | Faible |
| **État complexe** | Excellent | Limité |
| **Intégration app** | Native | Iframe/CDP |
| **Performance** | Optimale | Excellente |
| **Test local** | Dev server | Double-clic |

---

## 📞 Support

Pour toute question ou amélioration, consultez la **FAQ** ci-dessus ou ouvrez une issue sur le repo.

**Autres ressources :**
- [Guide HTML/JS Pure](./SIMULATEUR_HTML_PURE_COMPLET.md) - Version sans React
- [Quick Integration](../start/QUICK_INTEGRATION_SIMULATEUR.md) - Guide rapide

---

**Créé avec ❤️ pour Immo2000 | v1.0 | Mai 2026**
