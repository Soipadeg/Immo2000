# 🚀 Phase 4 - Plan d'Implémentation | Immo2000

## 📋 État Actuel

**Complétude**: 44% (4/9 pages)

### ✅ Complété
- Service API complet (transactions, paiements, notaires)
- 4 pages principales (Répondre offre, Transactions, Select Notaire, Payment)
- Routes intégrées dans App.jsx
- Architecture et patterns définis
- Documentation complète

### ⏳ En Cours / À Faire
- 5 pages manquantes (ValidateFeesPage, SignCompromisPage, etc.)
- Intégration Stripe Elements
- Intégration DocuSign
- Zustand store pour state global
- Tests unitaires
- Tests E2E

---

## 📝 Checklist Phase 4.2 (Prochaine)

### Pages à Créer (5)

- [ ] **ValidateFeesPage** (`/transactions/:id/validate-fees`)
  - Afficher montant frais notaire
  - Calculer commission 2%
  - Boutons: Valider / Refuser
  - Appel API: `transactionsApi.validateFees()`
  - Temps estimé: 2h

- [ ] **SignCompromisPage** (`/transactions/:id/sign-compromis`)
  - Intégration DocuSign
  - Afficher lien signature
  - Redirection vers DocuSign
  - Webhook callback handling
  - Temps estimé: 3h

- [ ] **SignActePage** (`/transactions/:id/sign-acte`)
  - Similaire à SignCompromisPage
  - Archivage final dans S3
  - Affichage confirmation finale
  - Temps estimé: 3h

- [ ] **TransactionDetailsPage** (`/transactions/:id`)
  - Affiche tous les détails
  - Historique et timeline
  - Boutons contextuels dynamiques
  - Affichage documents signés
  - Temps estimé: 3h

- [ ] **Améliorer OffresPage** (`/offres`)
  - Ajouter boutons "Répondre"
  - Afficher état de chaque offre
  - Filtres (envoyées/reçues)
  - Temps estimé: 2h

### Intégrations Stripe (3h)

- [ ] Installer packages Stripe
  ```bash
  npm install @stripe/react-stripe-js @stripe/js
  ```

- [ ] Charger Stripe.js dans index.html
  ```html
  <script src="https://js.stripe.com/v3/"></script>
  ```

- [ ] Implémenter Stripe Elements dans PaymentPage
  - CardElement
  - handlePaymentMethod
  - Webhook signatures

- [ ] Tester avec test cards Stripe
  - 4242 4242 4242 4242 (succès)
  - 4000 0000 0000 0002 (declined)

### Intégrations DocuSign (4h)

- [ ] Récupérer Integration Key
- [ ] Configurer OAuth callback URL
- [ ] Implémenter DocuSign redirect flow
- [ ] Ajouter webhook pour signature completion
- [ ] Afficher PDF signé après récupération

### State Management Zustand (2h)

- [ ] Créer `store/transactionStore.js`
  - Transactions state
  - Selected transaction
  - Loading/error states

- [ ] Créer `store/paymentStore.js`
  - Payment state
  - Stripe config

- [ ] Utiliser dans composants
  - Éviter prop drilling
  - Centraliser logic

### Formulaires React Hook Form (2h)

- [ ] Installer: `npm install react-hook-form @hookform/resolvers`
- [ ] Formulaires ValidateFeesPage
- [ ] Formulaires SignCompromisPage
- [ ] Validation Zod/Yup

### Tests (5h)

- [ ] Tests unitaires Vitest
  - API services
  - Composants simples

- [ ] Tests E2E Cypress
  - Créer offre
  - Répondre offre
  - Paiement
  - Signatures

### Notifications Toast (1h)

- [ ] Installer: `npm install notistack`
- [ ] Wrapper dans App.jsx
- [ ] Afficher messages (succès/erreur)

---

## 🎯 Priorité & Ordre d'Exécution

### Semaine 1 (P1)

1. **ValidateFeesPage** (Day 1)
   - Dépend de: SelectNotairePage ✅
   - Bloque: SignCompromisPage

2. **Améliorer OffresPage** (Day 1)
   - Dépend de: RepondreOffrePage ✅
   - Critique pour UX

3. **SignCompromisPage** (Day 2)
   - Dépend de: ValidateFeesPage
   - Requiert DocuSign setup

4. **Zustand Store** (Day 3)
   - Refactoriser les pages existantes
   - Facilite tests

### Semaine 2 (P2)

5. **SignActePage** (Day 4)
   - Dépend de: SignCompromisPage
   - Très similaire

6. **TransactionDetailsPage** (Day 5)
   - Affichage uniquement
   - Peut être fait en parallèle

7. **Intégrations Stripe** (Day 5-6)
   - Tests avec cards de test
   - Webhooks

8. **Intégrations DocuSign** (Day 6)
   - OAuth flow
   - Callbacks

### Semaine 3 (P3)

9. **Tests** (Day 7-8)
   - Unitaires + E2E
   - Code coverage

10. **Notifications** (Day 8)
    - Toast messages
    - Global alerts

11. **Polish & Optimisations** (Day 9)
    - Performance
    - Accessibility
    - Mobile UX

---

## 🏗️ Architecture Détaillée

### Dossiers à Créer

```
frontend/src/
├── components/
│   ├── Stripe/
│   │   ├── StripePaymentForm.jsx
│   │   └── StripeProvider.jsx
│   ├── DocuSign/
│   │   ├── DocuSignButton.jsx
│   │   └── DocuSignRedirect.jsx
│   └── Transaction/
│       ├── TransactionTimeline.jsx
│       └── TransactionStepper.jsx
│
├── store/
│   ├── transactionStore.js
│   ├── paymentStore.js
│   └── notaireStore.js
│
├── hooks/
│   ├── useTransaction.js
│   ├── usePayment.js
│   └── useStripe.js
│
├── utils/
│   ├── stripeFunctions.js
│   ├── docusignFunctions.js
│   └── formatters.js
│
├── __tests__/
│   ├── TransactionsPage.test.jsx
│   ├── PaymentPage.test.jsx
│   └── services.test.js
│
└── pages/
    ├── ValidateFeesPage.jsx        ⏳
    ├── SignCompromisPage.jsx       ⏳
    ├── SignActePage.jsx            ⏳
    ├── TransactionDetailsPage.jsx  ⏳
    └── (existantes)
```

### Patterns à Utiliser

```javascript
// 1. Zustand Store
import { create } from 'zustand';

export const useTransactionStore = create((set) => ({
  transaction: null,
  loading: false,
  error: null,
  setTransaction: (tx) => set({ transaction: tx }),
  setLoading: (loading) => set({ loading }),
}));

// 2. Custom Hook
export const useTransaction = (id) => {
  const { setTransaction, setLoading } = useTransactionStore();

  useEffect(() => {
    loadTransaction(id);
  }, [id]);
};

// 3. React Hook Form
import { useForm } from 'react-hook-form';

const { register, handleSubmit } = useForm({
  defaultValues: { montant_frais: 8000 }
});

const onSubmit = async (data) => {
  await transactionsApi.validateFees(id, data);
};
```

---

## 🔌 Intégrations Détaillées

### Stripe Elements

```javascript
// Charger Stripe
import { loadStripe } from '@stripe/js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(REACT_APP_STRIPE_PUBLIC_KEY);

// Dans composant
<Elements stripe={stripePromise}>
  <PaymentForm clientSecret={clientSecret} />
</Elements>

// Confirmer paiement
const handlePayment = async () => {
  const { paymentIntent } = await stripe.confirmCardPayment(clientSecret);
  if (paymentIntent.status === 'succeeded') {
    // Succès
  }
};
```

### DocuSign OAuth

```javascript
// Redirection OAuth
const handleSignDocument = () => {
  const oauthUrl = `https://account-d.docusign.com/oauth/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
  window.location.href = oauthUrl;
};

// Callback page
useEffect(() => {
  const code = getUrlParam('code');
  if (code) {
    // Échanger code pour access token
    // Créer envelope et envoyer pour signature
  }
}, []);
```

---

## 📊 Test Strategy

### Unit Tests (Vitest)

```javascript
describe('transactionsApi', () => {
  it('should validate fees', async () => {
    const result = await transactionsApi.validateFees(1, {
      montant_frais: 8000
    });
    expect(result.commission).toBe(5900); // 2% de 295k
  });
});
```

### E2E Tests (Cypress)

```javascript
describe('Transaction Flow', () => {
  it('should complete full transaction', () => {
    cy.visit('/transactions');
    cy.click('[data-testid="select-notaire"]');
    cy.selectNotaire('Paris Notaire');
    cy.click('[data-testid="validate-fees"]');
    cy.validateFees();
    cy.signComromis();
    cy.payment();
    cy.signActe();
    cy.contains('Vente finalisée');
  });
});
```

---

## 📈 Performance Targets

| Métrique | Target | Current |
|----------|--------|---------|
| Page load | < 2s | - |
| API response | < 500ms | - |
| LCP | < 1.5s | - |
| CLS | < 0.05 | - |

---

## 🎨 Design Checklist

- [ ] Couleurs cohérentes avec brand
- [ ] Typography consistante
- [ ] Spacing uniform (8px grid)
- [ ] Icons Material Design
- [ ] Responsive pour mobile/tablet
- [ ] Dark mode support
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Loading states
- [ ] Error states
- [ ] Empty states

---

## 🚀 Déploiement

### Staging
```bash
# Build
npm run build

# Servir localement pour tester
npm run preview

# Vérifier:
- Routing fonctionne
- API appels corrects
- Stripe test cards
- DocuSign sandbox
```

### Production
```bash
# Vérifier:
- REACT_APP_STRIPE_PUBLIC_KEY (production key)
- REACT_APP_API_URL (https://...)
- Dotenv variables
- CORS headers corrects
- Webhooks Stripe/DocuSign configurés

# Deploy
npm run build
# Push vers Vercel/Netlify/etc
```

---

## 📞 Support & Debugging

### Common Issues

**Q: Stripe form ne charge pas**
- A: Vérifier REACT_APP_STRIPE_PUBLIC_KEY, charger script dans HTML

**Q: DocuSign redirect échoue**
- A: Vérifier redirect URI, OAuth secret, network tab pour erreur

**Q: API retourne 401**
- A: Vérifier token dans localStorage, authentification header

**Q: Pages blanches**
- A: Vérifier console pour erreurs, import des composants, routes

---

## 📚 Documentation Requise

- [ ] README pour chaque page
- [ ] Swagger/OpenAPI pour API
- [ ] Stripe webhook docs
- [ ] DocuSign callback docs
- [ ] Zustand store usage guide
- [ ] Testing guide
- [ ] Deployment guide

---

## 🎯 Success Criteria

✅ Toutes les pages créées
✅ Stripe integration fonctionne
✅ DocuSign integration fonctionne
✅ Tests > 80% coverage
✅ Performance metrics OK
✅ Accessible (WCAG AA)
✅ Mobile responsive
✅ Production ready

---

## 📅 Timeline

**Estimation**: 3 semaines (15 jours)

| Semaine | Tâches | Statut |
|---------|--------|--------|
| 1 | 5 pages + Zustand + FormikValidateFeesPage | ⏳ À démarrer |
| 2 | Stripe + DocuSign + SignPages | ⏳ À démarrer |
| 3 | Tests + Polish + Deploy | ⏳ À démarrer |

---

**Créé**: 19 mai 2026
**Version**: 1.0 - Plan Phase 4
**Prochaine**: Phase 4.2 - Implémentation Pages
