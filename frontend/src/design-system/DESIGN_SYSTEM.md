# Design System - Immo2000

## 🎨 Système de Design Professionnel pour Plateforme Immobilière Moderne

Ce design system fournit un ensemble cohérent de composants, tokens de design et directives pour maintenir la consistance visuelle et fonctionnelle de Immo2000.

---

## 📊 Palette de Couleurs

### Couleurs Primaires
- **Primary Blue**: `#2563EB` - Action principale, CTA, accents
- **Primary Green**: `#10B981` - Alternative (succès, vérification)
- **Primary Orange**: `#F59E0B` - Highlights, urgence

### Couleurs Neutres
- **White**: `#FFFFFF` - Fond principal, cartes
- **Light Gray**: `#F9FAFB` - Fond alternatif, hover
- **Medium Gray**: `#6B7280` - Texte secondaire, désactivé
- **Dark Gray**: `#1F2937` - Texte principal, titres
- **Charcoal**: `#111827` - Dark mode

### Couleurs Sémantiques
- **Success**: `#10B981` - Actions réussies, vérification
- **Warning**: `#F59E0B` - Avertissements, urgence
- **Error**: `#EF4444` - Erreurs, dangers
- **Info**: `#3B82F6` - Informations, notifications

### Couleurs Supplémentaires
- **Borders**: `#D1D5DB` - Bordures, séparateurs
- **Disabled**: `#9CA3AF` - Éléments désactivés
- **Shadow**: `rgba(0, 0, 0, 0.1)` - Ombres subtiles

---

## 🔤 Typographie

### Font Stack
```
Font Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
Font Secondary: 'Poppins', sans-serif (fallback)
```

### Échelle Typographique

#### Headings (Bold - 700)
| Niveau | Taille | Line Height | Letter Spacing |
|--------|--------|-------------|-----------------|
| **H1** | 2.5rem (40px) | 1.2 | -1px |
| **H2** | 2rem (32px) | 1.3 | -0.5px |
| **H3** | 1.5rem (24px) | 1.4 | 0 |
| **H4** | 1.25rem (20px) | 1.5 | 0 |
| **H5** | 1.125rem (18px) | 1.5 | 0 |
| **H6** | 1rem (16px) | 1.5 | 0 |

#### Body Text (Regular - 400)
| Type | Taille | Line Height | Usage |
|------|--------|-------------|-------|
| **Large** | 1.125rem (18px) | 1.75 | Lead, intro |
| **Regular** | 1rem (16px) | 1.5 | Body text, descriptions |
| **Small** | 0.875rem (14px) | 1.5 | Labels, captions |
| **Tiny** | 0.75rem (12px) | 1.5 | Metadata, timestamps |

#### Fonts Weights
- **Light**: 300 - Non utilisé généralement
- **Regular**: 400 - Body, descriptions
- **Medium**: 500 - Accents, labels
- **Semi-Bold**: 600 - Sub-headings
- **Bold**: 700 - Headings, CTAs
- **Extra-Bold**: 800 - Rare, impacts majeurs

---

## 🧩 Composants

### Button (Bouton)

#### Variantes
1. **Primary** - Action principale
   - Background: #2563EB
   - Color: #FFFFFF
   - Border-radius: 8px
   - Padding: Dépend de la taille
   - Shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`
   - Hover: Darken background by 10%, shadow boost
   - Active: Scale 0.98

2. **Secondary** - Action secondaire
   - Background: Transparent
   - Border: 2px solid #2563EB
   - Color: #2563EB
   - Hover: Background #F0F9FF (light blue)

3. **Ghost** - Minimal
   - Background: Transparent
   - Color: #2563EB
   - Hover: Background #F9FAFB

4. **Danger** - Actions destructrices
   - Background: #EF4444
   - Color: #FFFFFF
   - Hover: Darken

#### Tailles
- **Small**: Padding 8px 16px, Font 14px
- **Medium**: Padding 12px 24px, Font 16px (default)
- **Large**: Padding 16px 32px, Font 16px
- **Full-width**: 100% width

#### États
- **Default** - Disponible
- **Hover** - Fond plus sombre, shadow boost
- **Active** - Scale réduit
- **Disabled** - Opacity 50%, cursor not-allowed
- **Loading** - Spinner + disabled

---

### Card (Carte)

#### Specs
- Background: #FFFFFF
- Border-radius: 12px
- Shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- Padding: 24px (inner content)
- Border: 1px solid #D1D5DB (optional)

#### Hover Effect
```css
Transform: translateY(-4px);
Shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
Transition: all 0.3s ease;
```

#### Variantes
1. **Flat** - Pas de shadow
2. **Elevated** - Shadow par défaut
3. **Outlined** - Border visible
4. **Interactive** - Hover effect + cursor pointer

---

### Input (Champ de Saisie)

#### Specs
- Height: 44px (desktop), 40px (mobile)
- Border: 1px solid #D1D5DB
- Border-radius: 8px
- Padding: 12px 16px
- Font: 16px / Regular
- Background: #FFFFFF

#### États
- **Default**: Border #D1D5DB
- **Focus**: Border #2563EB, Shadow `0 0 0 3px rgba(37, 99, 235, 0.1)`
- **Filled**: Background #F9FAFB
- **Error**: Border #EF4444, Error text below
- **Disabled**: Background #F9FAFB, Color #9CA3AF, Cursor not-allowed
- **Placeholder**: Color #9CA3AF

#### Variantes
- **Text**, **Email**, **Password**, **Number**, **Date**
- **With Label** - Above input
- **With Icon** - Inside input (left/right)
- **With Hint Text** - Below input

---

### Navbar (Navigation)

#### Specs
- Position: Fixed at top (sticky)
- Height: 64px (desktop), 56px (mobile)
- Background: #FFFFFF
- Shadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
- Z-index: 1000
- Padding: 0 1rem

#### Éléments
- **Logo** (left)
- **Nav Links** (center, hidden on mobile)
- **CTA/User Menu** (right)
- **Mobile Menu Icon** (right, visible on mobile)

#### Comportement
- Sticky scroll (reste visible)
- Mobile menu overlay
- Active link indicator

---

### Footer (Pied de Page)

#### Specs
- Background: #1F2937 (Dark gray)
- Color: #FFFFFF
- Padding: 48px 1rem
- Border-top: 1px solid #E5E7EB

#### Sections
1. **Company Info** - Logo, description, social links
2. **Quick Links** - 3-4 colonnes de liens
3. **Legal** - Privacy, Terms, Contact
4. **Newsletter** - Email subscription

#### Links Hover Effect
- Underline appear
- Color change to #F59E0B (accent)
- Transition smooth

---

### Search Bar (Barre de Recherche)

#### Specs
- Flex container (Input + Button)
- Input: Full width, padding 12px 16px
- Button: Primary style, padding 12px 32px
- Border-radius: 8px
- Shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`

#### Responsive
- Desktop: Large, horizontal
- Mobile: Stacked or horizontal responsive

---

## 📐 Layout & Grid

### Container
```
Max-width: 1200px
Centered with margin-left: auto; margin-right: auto;
Padding: 0 1rem (mobile), 0 1.5rem (desktop)
```

### Grid System
```
12 columns (Tailwind default)
Gap: 1rem (mobile), 1.5rem (desktop)
Responsive breakpoints:
- Mobile: 1 column
- Tablet (md): 2-3 columns
- Desktop (lg): 3-4 columns
```

### Spacing Scale
```
4px (0.25rem) - xs
8px (0.5rem) - sm
12px (0.75rem) - md
16px (1rem) - lg
24px (1.5rem) - xl
32px (2rem) - 2xl
48px (3rem) - 3xl
64px (4rem) - 4xl
```

---

## 🎬 Animations & Transitions

### Easing Functions
```
ease-in: cubic-bezier(0.4, 0, 1, 1)
ease-out: cubic-bezier(0, 0, 0.2, 1)
ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

### Durations
```
Fast: 150ms - Subtle interactions
Normal: 300ms - Hover, focus states
Slow: 500ms - Page transitions
```

### Animations Commune
1. **Fade In** - Opacity 0 → 1
2. **Slide Up** - Translate Y (+20px) → 0
3. **Scale** - Scale 0.95 → 1 (on hover)
4. **Color Transition** - Color smooth change

---

## ♿ Accessibilité

### Contraste
- WCAG AA (4.5:1) minimum pour texte
- WCAG AAA (7:1) pour priorité

### Keyboard Navigation
- Tab order logique
- Focus states visibles (outline 2px #2563EB)
- Esc pour fermer modals

### ARIA Labels
- Images: `alt` text
- Buttons: `aria-label` si nécessaire
- Forms: Labels associés via `for` attribute
- Live regions: `aria-live="polite"`

### Mobile Accessibility
- Touch targets: Min 44px × 44px
- Font min 16px (avoid auto zoom on iOS)
- Color: Ne pas dépendre UNIQUEMENT de la couleur

---

## 📱 Breakpoints Responsive

```
Mobile:    < 640px   (sm)
Tablet:    640-1024px (md/lg)
Desktop:   > 1024px  (xl/2xl)
```

### Mobile-First Approach
1. Styles base (mobile)
2. @media (min-width: 640px) { /* tablet */ }
3. @media (min-width: 1024px) { /* desktop */ }

---

## 🎯 Utilisation

### Import de Tokens
```javascript
import { colors, typography, spacing } from '@/design-system/tokens';
```

### Composants Réutilisables
```jsx
import { Button, Card, Input, Navbar, Footer } from '@/components';

// Utilisation
<Button variant="primary" size="medium">
  Chercher
</Button>
```

### Tailwind Classes
```jsx
<div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
  <h1 className="text-4xl font-bold text-gray-900">Titre</h1>
</div>
```

---

## 🔄 Version & Updates

- **Version**: 1.0.0
- **Last Updated**: May 2024
- **Maintainers**: Frontend Team

---

## 📚 Ressources

- **Design Tokens**: `/src/design-system/tokens.js`
- **Components**: `/src/components/`
- **Tailwind Config**: `/tailwind.config.js`
- **Theme MUI**: `/src/theme.js`
