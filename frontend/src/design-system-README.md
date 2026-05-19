# Design System - Immo2000

Complete design system implementation for Immo2000 real estate platform with production-ready React components and design tokens.

## Overview

This design system provides:
- **Design Tokens**: Centralized colors, typography, spacing, shadows, and transitions
- **Reusable Components**: Button, Card, Input, Navbar, Footer, SearchBar
- **Example Page**: HomePage demonstrating all components working together
- **Responsive Design**: Mobile-first approach with breakpoints for all devices
- **Accessibility**: WCAG AA compliance with ARIA labels and keyboard navigation
- **Dark Mode**: Full dark mode support via CSS media queries

## Project Structure

```
frontend/src/
├── design-system/
│   ├── DESIGN_SYSTEM.md       # Design documentation (colors, typography, components)
│   └── tokens.js               # Centralized design tokens (colors, spacing, etc.)
├── components/
│   ├── Button/
│   │   ├── Button.jsx          # Button component
│   │   └── Button.css          # Button styles
│   ├── Card/
│   │   ├── Card.jsx            # Card component
│   │   └── Card.css            # Card styles
│   ├── Input/
│   │   ├── Input.jsx           # Input component
│   │   └── Input.css           # Input styles
│   ├── Navbar/
│   │   ├── Navbar.jsx          # Navbar component with mobile menu
│   │   └── Navbar.css          # Navbar styles
│   ├── Footer/
│   │   ├── Footer.jsx          # Footer component
│   │   └── Footer.css          # Footer styles
│   ├── SearchBar/
│   │   ├── SearchBar.jsx       # SearchBar component
│   │   └── SearchBar.css       # SearchBar styles
│   └── index.js                # Component exports
├── pages/
│   ├── HomePage.jsx            # Full page example
│   ├── HomePage.css            # HomePage styles
│   └── index.js                # Page exports
└── design-system-README.md     # This file
```

## Getting Started

### Using Design Tokens

Import tokens for consistent styling across components:

```javascript
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  buttonTokens,
  inputTokens
} from '@/design-system/tokens';
```

**Available Tokens:**
- `colors`: Primary (#2563EB), gray scale (50-900), semantic (success, warning, error, info)
- `typography`: Font families, sizes (xs-4xl), weights (400-700), line heights
- `spacing`: xs, sm, md, lg, xl, 2xl, 3xl, 4xl (4px to 96px)
- `borderRadius`: sm (4px), md (8px), lg (12px), xl (16px), full (9999px)
- `shadows`: sm, md, lg, xl, focus (0 0 0 3px blue-10%)
- `transitions`: fast (150ms), normal (300ms), slow (500ms) with easing functions
- `breakpoints`: 320px, 640px, 768px, 1024px, 1280px, 1536px

### Using Components

#### Button

```javascript
import { Button } from '@/components';

<Button
  variant="primary"        // 'primary' | 'secondary' | 'ghost' | 'danger'
  size="medium"            // 'small' | 'medium' | 'large'
  disabled={false}
  loading={false}
  onClick={handleClick}
>
  Click me
</Button>
```

#### Card

```javascript
import { Card } from '@/components';

<Card
  variant="elevated"       // 'flat' | 'elevated' | 'outlined' | 'interactive'
  interactive={false}
>
  Card content here
</Card>
```

#### Input

```javascript
import { Input } from '@/components';
import SearchIcon from '@mui/icons-material/Search';

<Input
  label="Search"
  type="text"
  placeholder="Enter text..."
  value={value}
  onChange={handleChange}
  error={false}
  errorMessage="Error message"
  hint="Help text"
  icon={SearchIcon}
  iconPosition="left"
/>
```

#### Navbar

```javascript
import { Navbar } from '@/components';

<Navbar
  logo="Immo2000"
  navLinks={[
    { href: '/', label: 'Home', active: true },
    { href: '/about', label: 'About' }
  ]}
  rightContent={<Button>Login</Button>}
  sticky={true}
/>
```

#### Footer

```javascript
import { Footer } from '@/components';

<Footer
  companyName="Immo2000"
  companyDescription="Real estate platform"
  linkSections={[
    {
      title: 'About',
      links: [
        { href: '/', label: 'Home' }
      ]
    }
  ]}
  onNewsletterSubmit={(email) => console.log(email)}
/>
```

#### SearchBar

```javascript
import { SearchBar } from '@/components';

<SearchBar
  onSearch={(params) => console.log(params)}
  placeholder="Search properties..."
  showFilters={true}
/>
```

## Design Specifications

### Color Palette

**Primary Colors:**
- Blue: `#2563EB` - Main brand color
- Green: `#10B981` - Success/positive actions
- Orange: `#F59E0B` - Warnings

**Neutral Colors:**
- White: `#FFFFFF`
- Light Gray: `#F9FAFB`
- Gray: `#6B7280`
- Dark Gray: `#1F2937`
- Charcoal: `#111827`

**Semantic Colors:**
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Info: `#3B82F6`

### Typography

**Font Family:** Inter (primary), Poppins (fallback)

**Heading Styles:**
- H1: 2.5rem / 700 weight
- H2: 2rem / 700 weight
- H3: 1.5rem / 700 weight
- H4: 1.25rem / 700 weight
- H5: 1.125rem / 700 weight
- H6: 1rem / 700 weight

**Body Styles:**
- Large: 1.125rem
- Regular: 1rem (default)
- Small: 0.875rem
- Tiny: 0.75rem

### Spacing Scale

- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- 3xl: 48px
- 4xl: 96px

### Responsive Breakpoints

```css
/* Mobile-first approach */
320px   /* Mobile */
640px   /* sm - Landscape phones */
768px   /* md - Tablets */
1024px  /* lg - Desktop */
1280px  /* xl - Large desktop */
1536px  /* 2xl - Extra large */
```

### Component Heights

- **Button:** 44px (desktop), 40px (mobile)
- **Input:** 44px (desktop), 40px (mobile)
- **Navbar:** 64px (desktop), 56px (mobile)

## Accessibility

All components follow WCAG AA standards:

- ✅ Semantic HTML elements
- ✅ ARIA labels and descriptions
- ✅ Keyboard navigation support
- ✅ Focus visible states (2px outline with 2px offset)
- ✅ Color contrast ratios ≥ 4.5:1
- ✅ Alt text for images
- ✅ Form labels with required indicators
- ✅ Error messages linked via aria-describedby

## Example Page

A complete HomePage example is provided at `frontend/src/pages/HomePage.jsx` demonstrating:

1. **Navbar** with responsive mobile menu
2. **Hero Section** with SearchBar
3. **Featured Listings** grid using Card components
4. **CTA Section** with multiple buttons
5. **Footer** with newsletter signup

Run the app and navigate to the home page to see all components in action.

## Customization

### Adding New Components

Follow the established pattern:

```javascript
// components/ComponentName/ComponentName.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { componentTokens } from '@/design-system/tokens';
import './ComponentName.css';

const ComponentName = ({ children, ...props }) => {
  return (
    <div className="component-name" style={{ ...componentTokens }}>
      {children}
    </div>
  );
};

ComponentName.propTypes = {
  children: PropTypes.node,
};

export default ComponentName;
```

```css
/* components/ComponentName/ComponentName.css */
.component-name {
  /* Base styles */
}

/* Responsive */
@media (max-width: 768px) {
  /* Mobile adjustments */
}
```

### Extending Design Tokens

Add new tokens to `frontend/src/design-system/tokens.js`:

```javascript
export const customTokens = {
  background: '#FFFFFF',
  padding: '16px',
  // ... more tokens
};
```

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari 14+
- Mobile browsers (iOS Safari 12+, Chrome Android 90+)

## Performance

- ✅ Optimized CSS with minimal redundancy
- ✅ Component-scoped styles via CSS modules/files
- ✅ Token-based design for consistency
- ✅ Minimal dependencies (React, PropTypes, Material-UI icons)
- ✅ Tree-shakeable exports

## Dependencies

- `react@18.2.0` - UI library
- `prop-types@15.8.1` - Runtime prop validation
- `@mui/icons-material@5.14.0` - Icon library
- `vite@4.x` - Build tool (for dev)
- `vitest@^0.34.0` - Testing framework (for dev)

## Future Enhancements

- [ ] Storybook setup for component documentation
- [ ] Unit tests with Vitest
- [ ] Form components (Select, Checkbox, Radio, Textarea)
- [ ] Modal/Dialog components
- [ ] Toast/Alert notifications
- [ ] Loading skeleton components
- [ ] Data table component
- [ ] Pagination component
- [ ] Breadcrumb component
- [ ] Tabs component

## Questions & Support

For questions or issues with the design system, please refer to:
- `frontend/src/design-system/DESIGN_SYSTEM.md` - Detailed specifications
- Component files for implementation examples
- HomePage.jsx for usage patterns

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready
