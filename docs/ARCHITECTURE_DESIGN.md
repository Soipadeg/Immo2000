# Architecture & Design Documentation - Immo2000

**Version**: 1.0
**Status**: ✅ Production Ready
**Last Updated**: Phase 4 Documentation
**Architecture Pattern**: Microservices with Clean Architecture

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Code Organization](#code-organization)
4. [Database Schema](#database-schema)
5. [API Design Patterns](#api-design-patterns)
6. [State Management](#state-management)
7. [Security Architecture](#security-architecture)
8. [Performance Optimization](#performance-optimization)
9. [Design Patterns & Best Practices](#design-patterns--best-practices)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                      │
│              (React 18.2 + Vite + Material-UI)              │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Pages     │  │  Components  │  │  Custom Hooks   │   │
│  │  (7 total)  │  │  (Reusable)  │  │  (useAuth, etc) │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└───────────────────────────┬──────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼──────┐   ┌────────▼────────┐   ┌─────▼──────────┐
   │ API       │   │  Global State   │   │  Form Utils    │
   │ Services  │   │  (Zustand)      │   │  (React Hook   │
   │  (13+)    │   │                 │   │   Form + Zod)  │
   └────┬──────┘   └────────┬────────┘   └─────────────────┘
        │                   │
        └───────────────────┼───────────────────┘
                            │
           (Axios HTTP Client - HTTPS Only)
                            │
         ┌──────────────────▼──────────────────┐
         │     BACKEND API LAYER               │
         │    (FastAPI/Flask on :5000)        │
         │                                    │
         │  ┌────────────────────────────┐   │
         │  │    Route Handlers          │   │
         │  │  (46 endpoints total)      │   │
         │  ├────────────────────────────┤   │
         │  │  /api/v1/offres            │   │
         │  │  /api/v1/transactions      │   │
         │  │  /api/v1/notaires          │   │
         │  │  /api/v1/paiements         │   │
         │  │  /api/v1/documents         │   │
         │  │  /api/v1/users             │   │
         │  └────────────────────────────┘   │
         └──────────┬───────────────────────────┘
                    │
        ┌───────────┼───────────┬──────────────┐
        │           │           │              │
   ┌────▼──┐   ┌────▼──┐   ┌───▼──┐   ┌──────▼──┐
   │  CRUD │   │Models │   │  DB  │   │ Cache  │
   │ Layer │   │ Layer │   │ Conn │   │ (Redis)│
   └────┬──┘   └────┬──┘   └───┬──┘   └──────┬─┘
        │           │           │              │
        └───────────┼───────────┼──────────────┘
                    │
     ┌──────────────▼──────────────┐
     │    PERSISTENCE LAYER        │
     │   (PostgreSQL Database)     │
     │                            │
     │  ┌──────────────────────┐  │
     │  │  utilisateur         │  │
     │  │  notaire             │  │
     │  │  annonce             │  │
     │  │  offre               │  │
     │  │  transaction_notaire │  │
     │  │  frais_notaire       │  │
     │  │  paiement            │  │
     │  │  document_notaire    │  │
     │  │  historique_notaire  │  │
     │  └──────────────────────┘  │
     └─────────────────────────────┘

EXTERNAL INTEGRATIONS:
├─ Stripe (Payments)
├─ DocuSign (E-signatures)
├─ SendGrid (Email)
├─ AWS S3 (Document Storage)
├─ APScheduler (Background Jobs)
└─ OAuth 2.0 (Authentication)
```

---

## Technology Stack

### Frontend Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React | 18.2.0 | UI library |
| **Build Tool** | Vite | 4.0+ | Fast bundler |
| **HTTP Client** | Axios | 1.4.0 | API calls |
| **State** | Zustand | 4.3.8 | Global state |
| **Forms** | React Hook Form | 7.76.0 | Form handling |
| **Validation** | Zod | 3.22.0 | Schema validation |
| **UI Components** | Material-UI | 5.13.0 | Pre-built components |
| **Routing** | React Router | 6.14.0 | Client-side routing |
| **Payments** | @stripe/react-stripe-js | 2.0+ | Stripe integration |
| **Testing** | Vitest | 1.0+ | Unit tests |
| **Linting** | ESLint | 8.0+ | Code quality |

### Backend Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | FastAPI/Flask | 0.104+ | REST API |
| **ORM** | SQLAlchemy | 2.0+ | Database access |
| **Database** | PostgreSQL | 14+ | Data persistence |
| **Cache** | Redis | 6.0+ | Session/cache storage |
| **Auth** | JWT | PyJWT 2.8+ | Token-based auth |
| **Email** | SendGrid | sendgrid-python 6.9+ | Email delivery |
| **Payments** | Stripe | stripe-python 5.8+ | Payment processing |
| **Storage** | AWS SDK | boto3 1.26+ | S3 integration |
| **Scheduling** | APScheduler | 3.10+ | Background jobs |
| **Validation** | Pydantic | 2.0+ | Request validation |
| **Testing** | Pytest | 7.0+ | Unit tests |
| **CORS** | Flask-CORS | 4.0+ | Cross-origin support |

---

## Code Organization

### Frontend Structure

```
frontend/
├── public/              # Static assets
├── src/
│  ├── pages/           # Page components (7 main pages)
│  │  ├── NotaireDashboardPage.jsx
│  │  ├── TransactionDetailsPage.jsx
│  │  ├── SelectNotairePage.jsx
│  │  ├── ValidateFeesPage.jsx
│  │  ├── PaymentPage.jsx
│  │  ├── SignCompromisPage.jsx
│  │  └── SignActePage.jsx
│  │
│  ├── components/       # Reusable components
│  │  ├── forms/         # Form components
│  │  ├── layout/        # Layout components
│  │  ├── common/        # Common components
│  │  └── protected/     # Protected route wrapper
│  │
│  ├── services/         # API integration
│  │  ├── api/           # API endpoints
│  │  │  ├── transactions.js
│  │  │  ├── notaires.js
│  │  │  ├── payments.js
│  │  │  ├── documents.js
│  │  │  └── auth.js
│  │  ├── apiClient.js   # Axios instance
│  │  └── constants.js
│  │
│  ├── hooks/            # Custom hooks
│  │  ├── useAuth.js     # Authentication hook
│  │  ├── useTransaction.js
│  │  ├── usePayment.js
│  │  └── useNotaire.js
│  │
│  ├── store/            # State management
│  │  ├── transactionStore.js  # Zustand store
│  │  └── authStore.js
│  │
│  ├── schemas/          # Zod validation schemas
│  │  ├── transaction.js
│  │  └── payment.js
│  │
│  ├── utils/            # Utility functions
│  │  ├── format.js      # Formatting helpers
│  │  └── validation.js
│  │
│  ├── App.jsx           # Main component
│  ├── main.jsx          # Entry point
│  └── index.css         # Global styles
│
├── __tests__/           # Test files (parallel structure)
├── vite.config.js       # Vite configuration
├── vitest.config.js     # Test configuration
└── package.json
```

### Backend Structure

```
backend/
├── src/
│  ├── routes/           # API route handlers
│  │  ├── auth.py        # Authentication endpoints
│  │  ├── offres.py      # Offer endpoints
│  │  ├── transactions.py # Transaction endpoints
│  │  ├── notaires.py    # Notaire endpoints
│  │  ├── paiements.py   # Payment endpoints
│  │  ├── documents.py   # Document endpoints
│  │  └── users.py       # User endpoints
│  │
│  ├── models/           # SQLAlchemy models
│  │  ├── __init__.py
│  │  ├── utilisateur.py # User model
│  │  ├── notaires.py    # Notaire models
│  │  ├── offres.py      # Offer model
│  │  ├── annonces.py    # Listing model
│  │  └── transactions.py# Transaction models
│  │
│  ├── crud/             # CRUD operations
│  │  ├── __init__.py
│  │  ├── notaires.py    # Notaire CRUD
│  │  ├── offres.py      # Offer CRUD
│  │  └── paiements.py   # Payment CRUD
│  │
│  ├── schemas/          # Pydantic schemas
│  │  ├── notaires.py    # Notaire schemas
│  │  ├── transactions.py
│  │  └── paiements.py
│  │
│  ├── services/         # Business logic
│  │  ├── stripe_service.py
│  │  ├── docusign_service.py
│  │  ├── email_service.py
│  │  └── s3_service.py
│  │
│  ├── utils/            # Utilities
│  │  ├── auth.py        # JWT helpers
│  │  ├── decorators.py  # Custom decorators
│  │  └── validators.py  # Validation helpers
│  │
│  ├── app.py            # Flask/FastAPI app factory
│  └── __init__.py
│
├── migrations/          # Alembic migrations
├── tests/               # Test files
│  ├── test_notaires.py
│  ├── test_offres.py
│  ├── test_transactions.py
│  ├── test_paiements.py
│  └── conftest.py       # Pytest fixtures
│
├── config/              # Configuration
├── scripts/             # Utility scripts
├── Dockerfile           # Docker configuration
├── requirements.txt     # Python dependencies
├── run_server.py        # Development server
└── pytest.ini           # Pytest config
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       utilisateur (Users)                        │
├─────────────────────────────────────────────────────────────────┤
│ PK: utilisateur_id (UUID)                                       │
│ Columns: email, nom, prenom, role, created_at, avatar_url      │
└────────────┬───────────────────────────┬──────────────┬─────────┘
             │                           │              │
      1:1    │                    1:1    │         1:N  │
             │                           │              │
    ┌────────▼─────────┐      ┌──────────▼──────────┐  │
    │     notaire      │      │  annonce (Listing)  │  │
    ├──────────────────┤      ├─────────────────────┤  │
    │ PK: notaire_id   │      │ PK: annonce_id      │  │
    │ FK: utilisateur_ │      │ FK: utilisateur_id  │  │
    │      id          │      │ (seller)            │  │
    │                  │      │ Data: titre, prix,  │  │
    │                  │      │ adresse, surface    │  │
    └────┬──────────────┘      └────────┬────────────┘  │
         │                             │                │
         │                      1:N    │                │
         │                             │                │
         │                    ┌────────▼─────────┐     │
         │                    │   offre (Offer)  │     │
         │                    ├───────────────────┤     │
         │                    │ PK: offre_id      │     │
         │ 1:N   FK           │ FK: annonce_id    │     │
         │    transaction_     │ FK: acheteur_id   │────┘
         │    notaire_id      │ (buyer)           │
         │                    │ FK: vendeur_id    │
         │                    │ (seller)          │
         │                    │ prix_propose      │
         │                    │ statut             │
         └──────┬─────────────└────────┬──────────┘
                │                      │
                │ 1:1                  │
                │                      │
        ┌───────▼──────────────────────▼────────┐
        │  transaction_notaire (Transaction)     │
        ├──────────────────────────────────────┤
        │ PK: transaction_id (UUID)            │
        │ FK: notaire_id (assigned notaire)    │
        │ FK: offre_id (source offer)          │
        │ FK: vendeur_id, acheteur_id          │
        │ prix_compromis, statut               │
        │ created_at, updated_at               │
        └───────┬───────┬────────┬──────────────┘
                │       │        │
           1:N  │       │ 1:N    │
                │       │        │
      ┌─────────▼─┐  ┌──▼──────┐ │
      │ frais_    │  │ paiement │ │
      │ notaire   │  │ (Payment)│ │
      │           │  │          │ │
      │ % + amount│  │ montant, │ │
      │ TVA       │  │ type,    │ │
      │ (2%+20%)  │  │ statut   │ │
      └───────────┘  └──────────┘ │
                                   │
                              1:N  │
                                   │
                    ┌──────────────▼──────────┐
                    │  document_notaire       │
                    ├────────────────────────┤
                    │ PK: document_id        │
                    │ FK: transaction_id     │
                    │ type (COMPROMIS/ACTE) │
                    │ s3_url, docusign_id   │
                    │ statut (SIGNE/REJET)  │
                    │ signatures (JSON)     │
                    └────────────────────────┘
```

### Key Tables

**utilisateur** (User accounts)
- `utilisateur_id` (PK): UUID
- `email`: UNIQUE string
- `nom`, `prenom`: Name
- `role`: ENUM (UTILISATEUR, NOTAIRE, ADMINISTRATEUR)
- `password_hash`: bcrypt hash
- `created_at`, `updated_at`: Timestamps

**transaction_notaire** (Real estate transactions)
- `transaction_id` (PK): UUID
- `offre_id` (FK): Foreign key to offre
- `notaire_id` (FK): Assigned notaire
- `vendeur_id`, `acheteur_id` (FK): Parties
- `prix_compromis`: Transaction amount
- `statut`: ENUM (CREEE, NOTAIRE_ASSIGNEE, COMPROMIS_SIGNE, ACTE_SIGNE, FINALISEE)

**frais_notaire** (Notarial fees)
- `transaction_id` (FK): Related transaction
- `prix_bien`: Property value
- `montant_base`: 2% of price
- `montant_tva`: 20% of base
- `montant_ttc`: Total amount

**paiement** (Payments)
- `paiement_id` (PK): UUID
- `transaction_id` (FK): Related transaction
- `montant`: Payment amount
- `type`: ENUM (DEPOT, SOLDE)
- `stripe_payment_intent_id`: Stripe reference
- `statut`: ENUM (EN_COURS, CONFIRME, FAILED, REMBOURSEE)

---

## API Design Patterns

### RESTful Conventions

```
Offers:
POST   /api/v1/offres                  # Create offer
GET    /api/v1/offres/:offre_id        # Get offer
GET    /api/v1/offres?annonce_id=...   # List offers
POST   /api/v1/offres/:offre_id/accept # Accept offer
POST   /api/v1/offres/:offre_id/reject # Reject offer

Transactions:
GET    /api/v1/transactions/:id        # Get details
POST   /api/v1/transactions/:id/select-notaire
POST   /api/v1/transactions/:id/validate-fees
POST   /api/v1/transactions/:id/sign-compromis
POST   /api/v1/transactions/:id/sign-acte

Payments:
POST   /api/v1/paiements/create        # Create intent
POST   /api/v1/paiements/:id/confirm   # Confirm payment
GET    /api/v1/paiements/:id           # Get payment status
```

### Request/Response Patterns

**Successful Response (200/201)**:
```json
{
  "status": "success",
  "data": {
    "transaction_id": "tx-55555",
    "statut": "NOTAIRE_ASSIGNEE"
  }
}
```

**Error Response (4xx/5xx)**:
```json
{
  "status": "error",
  "error": {
    "code": "TRANSACTION_NOT_FOUND",
    "message": "Transaction does not exist",
    "details": {
      "transaction_id": "tx-55555"
    }
  }
}
```

---

## State Management

### Zustand Store Architecture

```javascript
// transactionStore.js
const useTransactionStore = create((set) => ({
  // State
  transaction: null,
  paiement: null,
  loading: false,
  error: null,
  successMessage: null,

  // Actions
  loadTransaction: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await transactionsApi.getById(id);
      set({ transaction: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  selectNotaire: async (transactionId, notaireId) => {
    try {
      await transactionsApi.selectNotaire(transactionId, notaireId);
      set(state => ({
        transaction: {
          ...state.transaction,
          notaire_id: notaireId,
          statut: 'NOTAIRE_ASSIGNEE'
        }
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  // Reset
  reset: () => set({
    transaction: null,
    paiement: null,
    error: null,
    successMessage: null
  })
}));

// Custom hooks
export const useTransaction = () => useTransactionStore(state => state.transaction);
export const useTransactionLoading = () => useTransactionStore(state => state.loading);
```

### Data Flow Example

```
User clicks "Select Notaire"
     ↓
Component calls: transactionsStore.selectNotaire(id, notaireId)
     ↓
Action makes API call: transactionsApi.selectNotaire()
     ↓
API sends: POST /api/v1/transactions/:id/select-notaire
     ↓
Backend updates database and returns success
     ↓
Zustand updates state: transaction.notaire_id = xxx
     ↓
Component re-renders with new data
     ↓
UI shows updated notaire information
```

---

## Security Architecture

### Authentication Flow

```
1. User enters credentials
   └─→ frontend/src/services/api/auth.js::login()

2. POST /api/v1/auth/login
   └─→ backend/src/routes/auth.py::login()

3. Backend verifies password (bcrypt)
   └─→ Returns JWT token

4. Frontend stores token:
   localStorage.setItem('token', token)

5. All subsequent requests include token:
   Authorization: Bearer <token>

6. Backend validates token:
   @token_required decorator checks JWT signature

7. Token expires in 24 hours
   └─→ User must login again
```

### Security Measures

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Signed with SECRET_KEY, expires 24h
- **HTTPS Only**: All production traffic encrypted
- **CORS Protection**: Whitelist allowed origins
- **Rate Limiting**: 1000 req/min per authenticated user
- **SQL Injection**: Parameterized queries (SQLAlchemy ORM)
- **CSRF Protection**: Token validation for state-changing requests
- **XSS Prevention**: Input sanitization, output encoding
- **Secrets Management**: Environment variables, no hardcoded secrets
- **Stripe PCI Compliance**: Never handle raw card data

---

## Performance Optimization

### Frontend Optimization

- **Code Splitting**: Route-based lazy loading
- **Bundle Size**: Tree-shaking unused imports
- **Caching**: Browser cache (Cache-Control headers)
- **Compression**: Gzip/Brotli compression
- **Image Optimization**: WebP format, responsive sizes
- **Memoization**: React.memo for expensive components
- **State Management**: Zustand (lightweight vs Redux)

### Backend Optimization

- **Database Indexing**:
  ```sql
  CREATE INDEX idx_transaction_notaire_id ON transaction_notaire(notaire_id);
  CREATE INDEX idx_paiement_status ON paiement(statut);
  CREATE INDEX idx_offre_annonce_id ON offre(annonce_id);
  ```

- **Query Optimization**:
  ```python
  # Good: Load only needed fields
  transaction = db.session.query(
    TransactionNotaire.id,
    TransactionNotaire.statut
  ).get(id)

  # Bad: Load entire object
  transaction = TransactionNotaire.query.get(id)
  ```

- **Caching**:
  ```python
  @app.route('/api/v1/notaires/<id>')
  @cache.cached(timeout=300)  # Cache 5 minutes
  def get_notaire(id):
      return notaire_data
  ```

- **Connection Pooling**: SQLAlchemy with proper pool_size

---

## Design Patterns & Best Practices

### Backend Patterns

**Repository Pattern** (CRUD operations):
```python
# crud/notaires.py
def create_transaction_notaire(db, **kwargs):
    """Create transaction and return object."""
    transaction = TransactionNotaire(**kwargs)
    db.add(transaction)
    db.commit()
    return transaction

def get_transaction(db, id):
    """Retrieve transaction by ID."""
    return db.query(TransactionNotaire).get(id)
```

**Service Layer** (Business logic):
```python
# services/stripe_service.py
class StripeService:
    @staticmethod
    def create_payment_intent(amount, currency='eur'):
        return stripe.PaymentIntent.create(
            amount=int(amount * 100),
            currency=currency
        )

    @staticmethod
    def confirm_payment(intent_id, payment_method):
        return stripe.PaymentIntent.confirm(intent_id)
```

**Dependency Injection**:
```python
@app.route('/api/v1/transactions/<id>/confirm')
def confirm_transaction(id):
    db = get_db()  # Inject database
    service = StripeService()  # Inject service
    result = service.create_payment_intent(...)
```

### Frontend Patterns

**Container/Presentational Components**:
```javascript
// Container (smart component)
function TransactionDetailsContainer() {
  const transaction = useTransactionStore(state => state.transaction);
  const load = useTransactionStore(state => state.loadTransaction);

  useEffect(() => load(transactionId), []);

  return <TransactionDetails transaction={transaction} />;
}

// Presentational (dumb component)
function TransactionDetails({ transaction }) {
  return <div>{transaction.prix_compromis}</div>;
}
```

**Custom Hooks Pattern**:
```javascript
// hooks/useTransaction.js
export function useTransaction() {
  const transaction = useTransactionStore(state => state.transaction);
  const loading = useTransactionStore(state => state.loading);
  const error = useTransactionStore(state => state.error);
  const load = useTransactionStore(state => state.loadTransaction);

  return { transaction, loading, error, load };
}
```

### General Best Practices

- **Error Handling**: Try-catch with meaningful messages
- **Logging**: Structured logs (JSON format for parsing)
- **Testing**: Unit tests + integration tests
- **Documentation**: Docstrings for functions
- **Version Control**: Semantic versioning for releases
- **Code Review**: Before merging to main
- **Monitoring**: Track errors and performance
- **Backwards Compatibility**: Versioned APIs

---

**Version**: 1.0
**Status**: ✅ Production Ready
**Last Updated**: Phase 4 Documentation
