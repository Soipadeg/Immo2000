# Design System Refactorization Plan - Phase 1 to Phase 3

## Status Overview

**Total Pages:** 45
**Completed:** 1 (ForgotPasswordPage ✅)
**In Progress:** 0
**Planned:** 44

---

## Phase 1: Authentication & Public Pages (7 pages)

### Completed ✅
- [x] ForgotPasswordPage - Refactored with FormContainer, Input, Button, Alert

### In Progress / To Do
- [ ] ResetPasswordPage - Password strength indicator, Form validation
- [ ] VerifyEmailPage - Code verification form
- [ ] Verify2FAPage - 2FA code verification
- [ ] AnnoncePage - Property listing detail view (Card, Image, Button)
- [ ] SearchPage - Search results with listings grid
- [ ] SimulateurPret - Loan simulator with forms

---

## Phase 2: User Dashboard Pages (6 pages)

- [ ] UserDashboardPage - Main user dashboard
- [ ] ProfilePage - User profile edit
- [ ] FavoritesPage - Saved properties
- [ ] CreateAnnoncePage - Property listing creation
- [ ] AlertesPage - Saved alerts
- [ ] HistoryPage - Browsing history

---

## Phase 3: Admin & Notaire Dashboards (10+ pages)

- [ ] AdminDashboardPage
- [ ] AdminUsersPageNew
- [ ] AdminListingsPage
- [ ] AdminTransactionsPage
- [ ] AdminSettingsPage
- [ ] AdminAnalyticsPage
- [ ] AdminAuditPage
- [ ] AdminSecurityPage
- [ ] NotaireDashboardPage
- [ ] AdminHomePage
- [ ] AdminPage
- [ ] ModerationPage

---

## Other Pages (16+ pages)

- [ ] FAQPage
- [ ] MatchingPage
- [ ] BiensPage
- [ ] AlertesPage
- [ ] ModelesPage
- [ ] PolitiqueConfidentialitePage
- [ ] SimulateurBudget
- [ ] AdminUsersPage
- [ ] AdminListingsPage
- [ ] AdminTransactionsPage
- [ ] AdminSettingsPage
- [ ] AdminSecurityPage
- [ ] AdminAnalyticsPage
- [ ] AdminAuditPage
- [ ] CGUPage
- [ ] CreateAnnoncePage
- [ ] DevTransitionPage
- [ ] DevAccessPage
- [ ] GuidesPage
- [ ] NotificationsPage
- [ ] ModelesPage

---

## Refactorization Pattern

Each page follows this pattern:

```javascript
// 1. Import design system components
import { Button, Input, Card, Alert, FormContainer } from '@/components';
import './PageName.css';

// 2. Use FormContainer for layout
<FormContainer title="Page Title" subtitle="Subtitle">
  {/* Content with design system components */}
</FormContainer>

// 3. Style with page-specific CSS
// - Use CSS variables for colors from tokens
// - Follow responsive design pattern
```

---

## Component Usage Checklist

When refactorizing a page, use these components:

- [ ] **FormContainer** - For form pages (auth, settings)
- [ ] **Button** - Replace MUI Button
- [ ] **Input** - Replace MUI TextField
- [ ] **Textarea** - For multi-line inputs
- [ ] **Select** - For dropdowns
- [ ] **Card** - For content containers
- [ ] **Alert** - For notifications
- [ ] **Modal** - For dialogs
- [ ] **SearchBar** - For search pages

---

## Current Design System

### Components Available (11 total)
1. Button ✅ - Variants: primary, secondary, ghost, danger
2. Card ✅ - Variants: flat, elevated, outlined, interactive
3. Input ✅ - With label, error, icon, hint
4. Textarea ✅ - With max-length, character counter
5. Select ✅ - With optgroups support
6. Navbar ✅ - Sticky, responsive mobile menu
7. Footer ✅ - With newsletter signup
8. SearchBar ✅ - With filters
9. Modal ✅ - Accessible, with sizing
10. Alert ✅ - With auto-dismiss, types
11. FormContainer ✅ - Standard form layout

### Tokens Available
- Colors (30+ shades)
- Typography (10 scales)
- Spacing (8 sizes)
- Border radius (5 variants)
- Shadows (5 levels)
- Transitions (3 durations)
- Breakpoints (6 sizes)

---

## Strategy to Complete

### Fast Track (Recommended)
1. Batch similar pages together
   - All auth pages (3-4 pages per batch)
   - All dashboard pages (2-3 pages per batch)
   - All admin pages (3-4 pages per batch)

2. Use consistent CSS patterns
   - Dashboard page CSS template
   - Form page CSS template
   - Listing page CSS template

3. Priority Order
   - Phase 1: Auth pages (most visible)
   - Phase 2: Public pages (AnnoncePage, SearchPage)
   - Phase 3: Dashboards (internal only)

### Estimated Effort
- Phase 1 (7 pages): ~3-4 hours
- Phase 2 (6 pages): ~2-3 hours
- Phase 3 (10+ pages): ~4-5 hours
- Other (16+ pages): ~6-8 hours
- **Total: ~15-20 hours**

---

## Notes

- All components have dark mode support
- All components are responsive
- WCAG AA accessibility compliance
- PropTypes validation on all components
- Smooth transitions and animations

---

**Last Updated:** May 19, 2026
**Status:** Phase 1 In Progress (1/7 complete)
