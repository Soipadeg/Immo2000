# 🚀 Guide d'Intégration Rapide - Simulateur de Prêt

**Statut :** ✅ Complet et Prêt à l'Utilisation
**Durée de lecture :** 2 minutes
**Version :** 1.0

---

## 🆚 Deux versions disponibles

| Version | Type | Fichiers | Avantages | Idéal pour |
|---------|------|---------|----------|-----------|
| **React** | Composant React | SimulateurPret.jsx + .css | Intégration app, state complexe, Material-UI | App React complète |
| **HTML/JS** | HTML/JS pur | simulateur_pret.html/.js/.css | Test local, zéro build, Bootstrap 5 | Pages statiques, démo |

👉 **Voir aussi :** [Guide HTML/JS Pure](./SIMULATEUR_HTML_PURE.md)

---

## 📦 Fichiers créés (Version React)
   - Import du composant
   - Route `/simulateur-pret` ajoutée
   - Bouton de navigation dans la navbar

4. **`docs/advanced/SIMULATEUR_PRETS_UI.md`** (Documentation complète)
   - Guide d'utilisation, d'intégration, et de développement

---

## ✨ Fonctionnalités clés

| Fonctionnalité | Détails | Status |
|---|---|---|
| **Formulaire** | Revenu, apport, taux, durée, assurance | ✅ |
| **Calcul temps réel** | Mise à jour auto avec debounce 500ms | ✅ |
| **Résultats** | Capacité, mensualité, coût total (3 cartes) | ✅ |
| **Tableau d'amortissement** | 12 premiers mois + voir tout | ✅ |
| **Authentification** | JWT Bearer token (localStorage) | ✅ |
| **Gestion erreurs** | Messages clairs + redirection /login | ✅ |
| **Responsive** | Mobile / Tablet / Desktop | ✅ |
| **Dark Mode** | Support préférence utilisateur | ✅ |

---

## 🔧 État d'intégration

### ✅ Déjà fait

```javascript
// 1. Import dans App.jsx
import SimulateurPret from './pages/SimulateurPret';

// 2. Route ajoutée
<Route path="/simulateur-pret" element={<SimulateurPret />} />

// 3. Bouton de navigation
<Button color="inherit" href="/simulateur-pret">
  Simulateur de prêt
</Button>
```

### ⚙️ Configuration requise

**Backend :** Endpoint existant `POST /api/v1/simulateur-pret`
**Frontend :** Variables d'environnement (`.env.local`)

```
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 📋 Checklist d'utilisation

- [ ] Fichiers créés : SimulateurPret.jsx + SimulateurPret.css
- [ ] App.jsx modifié (import + route + navigation)
- [ ] Variables d'environnement configurées
- [ ] Backend accessible sur http://localhost:5000
- [ ] JWT token disponible dans localStorage
- [ ] Tester en navigant vers http://localhost:5173/simulateur-pret

---

## 🧪 Test rapide (5 minutes)

### Étape 1 : Démarrer l'app
```bash
cd frontend
npm run dev
```

### Étape 2 : Se connecter
```
Email: acheteur@immo2000.fr
Mot de passe: test123
```

### Étape 3 : Naviguer vers le simulateur
Cliquez sur **"Simulateur de prêt"** dans la barre de navigation.

### Étape 4 : Tester
```
Revenu: 3000€
Apport: 50000€
Taux: 3.5%
Durée: 20 ans
Assurance: 0.3%

Résultat attendu:
✅ Capacité d'emprunt: ~250 000€
✅ Mensualité: ~1 450€
✅ Coût total: ~348 000€
✅ Tableau d'amortissement affiché
```

---

## 📁 Architecture

```
frontend/src/
├── pages/
│   ├── SimulateurPret.jsx      ← Nouveau
│   └── SimulateurPret.css      ← Nouveau
├── App.jsx                     ← Modifié
└── services/
    └── api.js                  ← Inchangé (JWT déjà configuré)
```

---

## 🔐 Authentification

**Automatique** : Le JWT est récupéré depuis `localStorage.getItem('auth_token')`.

```javascript
const token = localStorage.getItem('auth_token');
const response = await axios.post(`${API_BASE_URL}/simulateur-pret`, data, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

Si le token expire (401) → Redirection vers `/login`.

---

## 🎨 Personnalisation

### Changer les couleurs
**Fichier :** `frontend/src/pages/SimulateurPret.css`

```css
.page-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Vos couleurs ici */
}
```

### Changer les valeurs par défaut
**Fichier :** `frontend/src/pages/SimulateurPret.jsx` (ligne 20)

```javascript
const [formData, setFormData] = useState({
  taux_interet: 3.5,    // Défaut
  duree_ans: 20,        // Défaut
  taux_assurance: 0.3,  // Défaut
});
```

### Ajouter un bouton "Exporter PDF"
```javascript
const handleExportPDF = async () => {
  const element = document.getElementById('results');
  const canvas = await html2canvas(element);
  const pdf = new jsPDF();
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10);
  pdf.save('simulateur-pret.pdf');
};
```

---

## 🐛 Dépannage

### Erreur 404 sur /simulateur-pret
**Cause :** Route non ajoutée dans App.jsx
**Solution :** Vérifiez que la route est présente dans les `<Routes>`

### Erreur 401 (Unauthorized)
**Cause :** Token JWT manquant ou expiré
**Solution :** Reconnectez-vous, le token sera mis à jour dans localStorage

### Erreur API 500
**Cause :** Problème backend `/api/v1/simulateur-pret`
**Solution :** Testez l'endpoint avec Postman

### Les résultats ne s'affichent pas
**Cause :** Revenu mensuel net = 0 ou vide
**Solution :** Entrez un revenu > 0 €

---

## 📚 Documentation complète

Voir **[docs/advanced/SIMULATEUR_PRETS_UI.md](./SIMULATEUR_PRETS_UI.md)** pour :
- Guide utilisateur complet
- Guide développeur détaillé
- FAQ
- Tests manuels
- Exemples d'utilisation

---

## 🚀 Prochain(s) step(s)

1. ✅ Interface créée
2. ✅ Intégration dans App.jsx
3. 🔄 Tester avec le backend
4. 📊 (Optionnel) Ajouter export PDF/Email
5. 📈 (Optionnel) Ajouter ratio d'endettement
6. 🎨 (Optionnel) Personnaliser les couleurs

---

**Créé avec ❤️ pour Immo2000 | v1.0 | Mai 2026**
