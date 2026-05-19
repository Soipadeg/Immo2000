# 📋 Setup Instructions - Phase 5.2.4 Zustand Store Integration

## Status: ✅ COMPLETE

Phase 5.2.4 implements a centralized state management system using Zustand to eliminate prop drilling and improve code maintainability.

## 1. What Was Implemented

### Zustand Store Created

**File**: `frontend/src/store/transactionStore.js`

The store manages:
- Transaction data
- Payment information
- Selected notaire
- Loading/error/success UI states

### Custom Hooks

5 custom hooks for easy access to store data:
1. `useTransactionStore()` - Full store access
2. `useTransaction()` - Transaction data only
3. `usePayment()` - Payment data only
4. `useSelectedNotaire()` - Notaire selection only
5. `useUIState()` - Loading/error/success states

## 2. Store Structure

### State Properties

```javascript
{
  transaction: null,           // Current transaction object
  paiement: null,             // Payment info from backend
  selectedNotaire: null,       // Selected notaire object
  loading: false,             // Loading state
  error: null,                // Error message
  successMessage: null        // Success notification
}
```

### Actions Available

```javascript
// Transaction
setTransaction(transaction)
clearTransaction()
loadTransaction(transactionId)  // Async

// Payment
setPayment(paiement)
clearPayment()

// Notaire
setSelectedNotaire(notaire)
clearSelectedNotaire()

// UI
setLoading(boolean)
setError(error)
clearError()
setSuccessMessage(message)
clearSuccessMessage()

// Complete
resetStore()  // Reset everything to initial state
```

### Selector Methods

```javascript
getTransactionId()      // Get transaction ID
hasTransaction()        // Check if transaction exists
hasPayment()           // Check if payment exists
hasSelectedNotaire()   // Check if notaire selected
```

## 3. How to Use in Components

### Example 1: Access Transaction Data

**Before (using useState)**:
```javascript
const [transaction, setTransaction] = useState(null);

useEffect(() => {
  const loadTransaction = async () => {
    const res = await transactionsApi.getById(transactionId);
    setTransaction(res.data);
  };
  loadTransaction();
}, [transactionId]);

return <Typography>{transaction?.titre}</Typography>;
```

**After (using Zustand)**:
```javascript
import { useTransaction } from '../store/transactionStore';

export default function MyComponent() {
  const { transaction } = useTransaction();

  return <Typography>{transaction?.titre}</Typography>;
}
```

### Example 2: Update Multiple States

**Before (multiple useState)**:
```javascript
const [transaction, setTransaction] = useState(null);
const [paiement, setPaiement] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

**After (one Zustand hook)**:
```javascript
import { useTransactionStore } from '../store/transactionStore';

export default function MyComponent() {
  const transaction = useTransactionStore((state) => state.transaction);
  const paiement = useTransactionStore((state) => state.paiement);
  const loading = useTransactionStore((state) => state.loading);
  const error = useTransactionStore((state) => state.error);

  // Or simpler:
  const { transaction, paiement, loading, error } = useTransactionStore();
}
```

### Example 3: Dispatch Actions

```javascript
import { useTransactionStore, useUIState } from '../store/transactionStore';

export default function PaymentPage() {
  const { setTransaction, setPayment, setError } = useTransactionStore();
  const { setLoading, setSuccessMessage } = useUIState();

  const handlePayment = async () => {
    setLoading(true);
    try {
      const paiement = await paymentsApi.create(transactionId, amount);
      setPayment(paiement);
      setSuccessMessage('Paiement créé');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
}
```

## 4. Refactoring Pages to Use Store

### Page-by-Page Guide

#### TransactionDetailsPage

```javascript
// BEFORE
const [transaction, setTransaction] = useState(null);
const [tabValue, setTabValue] = useState(0);
const [loading, setLoading] = useState(true);

// AFTER
import { useTransaction, useUIState } from '../store/transactionStore';

const { transaction, setTransaction } = useTransaction();
const { loading, setLoading } = useUIState();
const [tabValue, setTabValue] = useState(0);  // Keep local state for UI
```

#### SelectNotairePage

```javascript
// BEFORE
const [selectedNotaire, setSelectedNotaire] = useState(null);

// AFTER
import { useSelectedNotaire } from '../store/transactionStore';

const { selectedNotaire, setSelectedNotaire } = useSelectedNotaire();
```

#### PaymentPage

```javascript
// BEFORE
const [paiement, setPaiement] = useState(null);
const [transaction, setTransaction] = useState(null);

// AFTER
import { usePayment, useTransaction, useUIState } from '../store/transactionStore';

const { paiement, setPaiement } = usePayment();
const { transaction, setTransaction } = useTransaction();
const { loading, error, setLoading, setError } = useUIState();
```

#### SignCompromisPage & SignActePage

```javascript
// BEFORE
const [transaction, setTransaction] = useState(null);
const [error, setError] = useState('');

// AFTER
import { useTransaction, useUIState } from '../store/transactionStore';

const { transaction, setTransaction } = useTransaction();
const { error, setError } = useUIState();
```

## 5. Benefits of Zustand Store

1. **No Prop Drilling**: Data available directly where needed
2. **Cleaner Code**: Less useState hooks per component
3. **Easy Debugging**: Centralized state in one place
4. **Performance**: Components only re-render when their subscribed state changes
5. **Reusability**: Multiple components can subscribe to same data
6. **Testing**: Easy to mock store in tests

## 6. Usage Pattern Recommendations

### ✅ Store in Zustand

- Transaction data (shared across multiple pages)
- Payment information
- Selected notaire
- Global UI state (loading, errors, success)
- User selection/preferences

### ❌ Keep in useState

- Local form state (controlled inputs)
- Tab/accordion state
- Dialog open/close state
- Temporary UI state specific to one component
- Search filters in lists

## 7. Example Complete Component Refactoring

### Before: SelectNotairePage (lots of useState)

```javascript
import React, { useState, useEffect } from 'react';
import { notairesApi, transactionsApi } from '../services/api';

export default function SelectNotairePage() {
  const [transaction, setTransaction] = useState(null);
  const [notaires, setNotaires] = useState([]);
  const [selectedNotaire, setSelectedNotaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const tx = await transactionsApi.getById(transactionId);
        setTransaction(tx.data);
        const list = await notairesApi.list();
        setNotaires(list.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, []);

  const handleSelect = async (notaire) => {
    try {
      setLoading(true);
      await transactionsApi.selectNotaire(transactionId, notaire.id);
      setSelectedNotaire(notaire);
      setSuccess('Notaire sélectionné');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // JSX...
  );
}
```

### After: SelectNotairePage (using Zustand)

```javascript
import React, { useState, useEffect } from 'react';
import { notairesApi, transactionsApi } from '../services/api';
import { useTransaction, useSelectedNotaire, useUIState } from '../store/transactionStore';

export default function SelectNotairePage() {
  const { transaction, setTransaction } = useTransaction();
  const { selectedNotaire, setSelectedNotaire } = useSelectedNotaire();
  const { loading, error, success, setLoading, setError, setSuccessMessage } = useUIState();
  const [notaires, setNotaires] = useState([]); // Local: API list only

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const tx = await transactionsApi.getById(transactionId);
        setTransaction(tx.data);  // Update global store
        const list = await notairesApi.list();
        setNotaires(list.data);   // Keep as local (not shared)
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelect = async (notaire) => {
    try {
      setLoading(true);
      await transactionsApi.selectNotaire(transactionId, notaire.id);
      setSelectedNotaire(notaire);  // Update global store
      setSuccessMessage('Notaire sélectionné');  // Update global success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Same JSX - but cleaner with fewer state variables!
  );
}
```

## 8. Testing with Zustand Store

Mock the store in tests:

```javascript
import { useTransactionStore } from '../store/transactionStore';
import { render, screen } from '@testing-library/react';

// Mock the store
jest.mock('../store/transactionStore');

test('renders transaction title', () => {
  useTransactionStore.mockReturnValue({
    transaction: { titre: 'Test Property' },
    setTransaction: jest.fn(),
  });

  render(<TransactionDetailsPage />);
  expect(screen.getByText('Test Property')).toBeInTheDocument();
});
```

## 9. Zustand DevTools (Optional)

For debugging, integrate with Redux DevTools:

```javascript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useTransactionStore = create(
  devtools((set) => ({
    // store logic...
  }), { name: 'TransactionStore' })
);
```

Then use Redux DevTools browser extension to inspect state changes.

## 10. Migration Path

### Phase 1: Create Store (✅ DONE)
- Created Zustand store
- Created custom hooks
- Documented usage

### Phase 2: Optional Refactoring (Not Required)
If wanted, refactor pages to use store:
1. Start with `SelectNotairePage` (simplest)
2. Then `TransactionDetailsPage`
3. Then `PaymentPage`
4. Finally `SignCompromisPage` and `SignActePage`

## 11. Checklist

- [ ] Zustand package installed (already in package.json)
- [ ] transactionStore.js created in `frontend/src/store/`
- [ ] Custom hooks created and exported
- [ ] Documentation complete
- [ ] Example usage tested
- [ ] Optional: Pages refactored to use store
- [ ] Optional: Redux DevTools integrated for debugging

## 12. Next Steps

- ✅ **5.2.1**: Stripe Elements intégré
- ✅ **5.2.2**: DocuSign OAuth intégré
- ✅ **5.2.4**: Zustand Store créé
- ⏳ **5.2.5**: React Hook Form validation

---

**Created**: 19 mai 2026 | **Phase**: 5.2.4 Zustand State Management
