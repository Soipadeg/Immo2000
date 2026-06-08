# ✅ Checklist de Consistance Visuelle - Immo2000

## Objectif
Assurer que chaque page de la navbar suit la **même charte de design** avec une expérience utilisateur cohérente.

---

## 📋 Checklist pour Chaque Page

Utilisez cette checklist pour mettre à jour chaque page navbar:

### ✅ Partie A: Imports et Structure
- [ ] Import de `PageLayout` depuis `../layouts/PageLayout`
- [ ] Import des composants nécessaires: `Card`, `Button`, `Input`, `Alert`
- [ ] Import du fichier CSS: `import '../styles/PageName.css'`
- [ ] Fonction component définie et exportée
- [ ] Utilisation de hooks React si nécessaire (useState, useEffect)

### ✅ Partie B: Layout Principal
- [ ] Page wrapped avec `<PageLayout>`
  - [ ] Prop `icon`: Emoji approprié (ex: 📊, 💰, 📚)
  - [ ] Prop `title`: Titre principal clair
  - [ ] Prop `subtitle`: Sous-titre descriptif
  - [ ] Prop `actionButton`: Bouton principal d'action (si nécessaire)
  - [ ] Prop `stats`: Array de KPIs (optionnel mais recommandé)

### ✅ Partie C: Contenu Principal
- [ ] Contenu structuré en sections logiques
- [ ] Utilisation de composants standard:
  - [ ] `<Card>` pour conteneurs
  - [ ] `<Button>` pour actions
  - [ ] `<Input>` pour formulaires
  - [ ] `<Alert>` pour messages
- [ ] Texte visible avec couleur foncée (not white)
- [ ] Espacement cohérent (1rem, 2rem gaps)

### ✅ Partie D: Design & Styling
- [ ] Fichier CSS créé: `src/styles/PageName.css`
- [ ] Pas de `color: white` ou `color: #fff` hors contexte (dark mode)
- [ ] Responsive design pour mobile/tablet/desktop
- [ ] Classes CSS suivent convention: `.page-container`, `.section-title`, etc.
- [ ] Couleurs respectent le design system:
  - [ ] Texte principal: `#1a1a1a` ou `#333`
  - [ ] Texte secondaire: `#666`
  - [ ] Background: `#fff` ou `#f5f5f5`
  - [ ] Accents: palette gradient/primaire

### ✅ Partie E: Responsive & Accessibility
- [ ] Media queries pour mobile (< 768px)
- [ ] Padding adapté: `2rem` desktop, `1rem` mobile
- [ ] Textes lisibles (font-size >= 16px)
- [ ] Contraste correct (WCAG AA minimum)
- [ ] Navigation au clavier (tabindex, focus states)

### ✅ Partie F: Navigation & Routing
- [ ] Route configurée dans `App.jsx`
- [ ] Route linkée depuis `DynamicNavbar.jsx` avec bon émoji/label
- [ ] Link utilise `<Link to="/page-path">`
- [ ] Redirection après action (si applicable)

### ✅ Partie G: Données & API
- [ ] État local géré avec `useState`
- [ ] Données mock ou API intégrées
- [ ] Loading state affiché
- [ ] Error state affiché
- [ ] Empty state affiché

### ✅ Partie H: Testable
- [ ] Page s'affiche sans erreurs console
- [ ] Texte visible avec bon contraste
- [ ] Boutons cliquables et fonctionnels
- [ ] Responsive sur tous les breakpoints
- [ ] Compatible navigateur (Chrome, Firefox, Safari)

---

## 📝 Format Type pour une Page

```jsx
import '../styles/PageName.css';
import React, { useState } from 'react';
import { Button, Card, Input, Alert } from '@/components';
import PageLayout from '../layouts/PageLayout';

const PageName = () => {
  const [data, setData] = useState([]);

  const stats = [
    { label: 'Métrique 1', value: '123', trend: '+10%', trendUp: true },
    { label: 'Métrique 2', value: '456' },
  ];

  const sections = [
    {
      title: 'Section 1',
      content: <div>Contenu...</div>,
    },
  ];

  return (
    <PageLayout
      icon="📊"
      title="Titre Page"
      subtitle="Sous-titre descriptif"
      actionButton={<Button>Ajouter</Button>}
      stats={stats}
      sections={sections}
    >
      <Card>
        {/* Contenu principal */}
      </Card>
    </PageLayout>
  );
};

export default PageName;
```

---

## 📄 Fichier CSS Minimum

```css
/* src/styles/PageName.css */

.page-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.section-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .page-container {
    gap: 1.5rem;
  }

  .section-content {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
```

---

## 🎨 Design Tokens (Palette Couleurs)

```javascript
// Design System Colors
const COLORS = {
  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  light_gray: '#f5f5f5',
  medium_gray: '#999999',
  dark_gray: '#333333',

  // Text
  text_primary: '#1a1a1a',
  text_secondary: '#666666',
  text_light: '#999999',

  // Semantic
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',

  // Backgrounds
  bg_light: '#ffffff',
  bg_lighter: '#f5f5f5',
  bg_dark: '#1a1a1a',
};
```

---

## 🔍 Pages à Vérifier & Mettre à Jour

| Page | Route | Statut | Priorité |
|------|-------|--------|----------|
| Dashboard | `/dashboard` | ✅ Fait | - |
| Search (Acheter) | `/search` | 🔄 À vérifier | Haute |
| Simulateur Prêt | `/simulateur-pret` | 🔄 À vérifier | Haute |
| Matching | `/matching` | 🔄 À vérifier | Haute |
| Alertes | `/alertes` | 🔄 À vérifier | Haute |
| Guides | `/guides` | 🔄 À vérifier | Moyenne |
| Modèles | `/modeles` | 🔄 À vérifier | Moyenne |
| Admin | `/admin` | 🔄 À vérifier | Moyenne |
| Notaire | `/notaire` | 🔄 À vérifier | Basse |

---

## 🚀 Process de Mise à Jour d'une Page

1. **Ouvrir le fichier** `src/pages/PageName.jsx`
2. **Ajouter imports**: `PageLayout`, CSS
3. **Vérifier structure**: Utiliser template format
4. **Vérifier CSS**: Pas de couleur blanche sur fond blanc
5. **Tester responsive**: F12 → Device Toggle
6. **Tester contraste**: Vérifier lisibilité texte
7. **Valider routing**: Clic navbar → page chargée
8. **Cocher checklist**: Marquer comme ✅

---

## 💡 Tips & Tricks

### Vérifier la couleur du texte (DevTools)
1. F12 → Inspector
2. Clic droit sur texte → "Inspect Element"
3. Vérifier "color:" dans Styles
4. Si `#fff` ou `rgb(255,255,255)` → problème!
5. Ajouter `color: #333 !important;` au CSS

### Tester responsive
1. F12 → Ctrl+Shift+M (Toggle device toolbar)
2. Sélectionner "iPhone 12" ou "iPad"
3. Vérifier que layout s'adapte
4. Vérifier que texte reste lisible

### Valider contraste (WCAG)
1. Outils: WebAIM Contrast Checker
2. Entrer couleur texte + couleur background
3. Vérifier ratio >= 4.5:1 (AA) ou 7:1 (AAA)

---

## ❓ Questions Fréquentes

**Q: Pourquoi le texte est blanc même avec `color: #333`?**
A: Vérifier que CSS est importé et que pas de `!important` en conflit. Utiliser `color: #333 !important;`.

**Q: Comment ajouter des stats/KPIs?**
A: Utiliser prop `stats` de PageLayout avec array d'objets: `{ label, value, trend, trendUp }`.

**Q: Dois-je refaire toutes les pages?**
A: Non, seulement vérifier consistance et corriger si besoin (texte blanc, spacing, etc.).

**Q: Où mettre les CSS globales vs page-spécifiques?**
A: Globales: `src/styles/index.css`. Page-spécifiques: `src/styles/PageName.css`.
