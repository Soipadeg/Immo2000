# 🏗️ Architecture - Immo2000

**Version**: 2.0.0
**Status**: ✅ PRODUCTION READY
**Last Updated**: 2026-06-09
**Architecture Pattern**: Clean Architecture with Microservices

---

## 📖 Table of Contents

1. [System Overview](#-system-overview)
2. [High-Level Architecture](#-high-level-architecture)
3. [Technology Stack](#-technology-stack)
4. [Code Organization](#-code-organization)
5. [Database Schema](#-database-schema)
6. [Data Models](#-data-models)
7. [Data Flows](#-data-flows)
8. [Integration Points](#-integration-points)
9. [Performance Optimization](#-performance-optimization)
10. [Best Practices](#-best-practices)

---

## 🌐 System Overview

Immo2000 is a real estate platform connecting buyers, sellers, and notaries through a complete transaction workflow. The system implements a **Clean Architecture** pattern with:

- **Frontend**: React 18 + Vite + Material-UI
- **Backend**: FastAPI (recommended) / Flask (legacy)
- **Database**: PostgreSQL 14+
- **Cache**: Redis 6+
- **Storage**: AWS S3
- **External Services**: Stripe (payments), DocuSign (e-signatures), SendGrid (email)

---

## 🏛️ High-Level Architecture

### Complete System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                                  │
│                   (React 18.2 + Vite + Material-UI)                           │
│                                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Pages     │  │  Components  │  │  Custom Hooks   │  │   Store    │ │
│  │  (7 total)  │  │  (Reusable)  │  │  (useAuth, etc) │  │ (Zustand) │ │
│  └─────────────┘  └──────────────┘  └─────────────────┘  └─────────────┘ │
└───────────────────────────────────────────────┬──────────────────────────────┘
                                                │
                    ┌───────────────────────────┼──────────────────────────────┐
                    │                           │                          │
               ┌────▼──────┐            ┌────────▼────────┐           ┌────▼────┐
               │ API       │            │  Global State   │           │  Form   │
               │ Services  │            │  (Zustand)      │           │ Utils   │
               │  (13+)    │            │                 │           │ (Zod)   │
               └────┬──────┘            └────────┬────────┘           └─────┬───┘
                    │                           │                        │
                    └───────────────────────────┼────────────────────────────┘
                                                │
                                   (Axios HTTP Client - HTTPS Only)
                                                │
                     ┌──────────────────────────▼──────────────────────────┐
                     │                  BACKEND API LAYER                        │
                     │           (FastAPI on :8000 / Flask on :5000)             │
                     │                                                          │
                     │  ┌────────────────────────────────────────────────┐  │
                     │  │                    ROUTERS                         │  │
                     │  │  /api/v1/offres              - Offers management      │  │
                     │  │  /api/v1/transactions        - Transaction workflow    │  │
                     │  │  /api/v1/notaires            - Notary management       │  │
                     │  │  /api/v1/paiements           - Payment processing      │  │
                     │  │  /api/v1/documents           - Document storage        │  │
                     │  │  /api/v1/users               - User management         │  │
                     │  │  /api/v1/annonces            - Property listings       │  │
                     │  │  /api/v1/messages            - Messaging               │  │
                     │  │  /api/v1/appointments         - Scheduling              │  │
                     │  │  /api/v1/notifications        - Notifications           │  │
                     │  │  /api/v1/calendar             - Calendar integration     │  │
                     │  │  /api/v1/statistics          - Analytics               │  │
                     │  └────────────────────────────────────────────────┘  │
                     │                              │                              │
                     │  ┌─────────────────────────┐  ┌────────────────────┐  │
                     │  │      SERVICES LAYER     │  │    MIDDLEWARE      │  │
                     │  │  ┌─────────────────┐    │  │  (CORS, Auth,     │  │
                     │  │  │  Auth Service   │    │  │   Logging, Error   │  │
                     │  │  │  Payment Svc    │    │  │   Handling)        │  │
                     │  │  │  Notaire Svc    │    │  │                    │  │
                     │  │  │  Document Svc  │    │  └────────────────────┘  │
                     │  │  │  Email Svc     │    │                          │
                     │  │  │  S3 Svc       │    │                          │
                     │  │  └─────────────────┘    │                          │
                     │  └─────────────────────────┘                          │
                     └──────────────────────┬──────────────────────────────┘
                                            │
                 ┌───────────────────────────┼───────────────────────────┐
                 │                           │                           │
            ┌────▼──────┐            ┌────────▼────────┐           ┌────▼────┐
            │  MODELS   │            │    CRUD      │           │   DB    │
            │  Layer    │            │    Layer     │           │  Conn   │
            │           │            │              │           │         │
            └────┬──────┘            └────────┬────────┘           └─────┬───┘
                 │                           │                        │
                 └───────────────────────────┼────────────────────────────┘
                                             │
                      ┌──────────────────────────▼──────────────────────────┐
                      │                   PERSISTENCE LAYER                      │
                      │                  (PostgreSQL Database)                   │
                      │                                                          │
                      │  ┌────────────────────────────────────────────────┐  │
                      │  │                    MAIN TABLES                       │  │
                      │  │  ┌──────────────┐  ┌──────────────┐                │  │
                      │  │  │  utilisateurs │  │    annonces   │                │  │
                      │  │  │   (users)    │  │ (listings)    │                │  │
                      │  │  └──────┬───────┘  └──────┬───────┘                │  │
                      │  │         │                  │                         │  │
                      │  │  ┌──────────────┐  ┌──────▼───────┐                │  │
                      │  │  │   notaires   │  │     offres    │                │  │
                      │  │  │  (notaries)  │  │   (offers)    │                │  │
                      │  │  └──────┬───────┘  └──────┬───────┘                │  │
                      │  │         │                  │                         │  │
                      │  │         └──────────────────┬────────────────┘      │  │
                      │  │                          │                         │  │
                      │  │                  ┌──────────▼──────────┐         │  │
                      │  │                  │ transactions_notaire│         │  │
                      │  │                  │  (transactions)     │         │  │
                      │  │                  └──────────┬──────────┘         │  │
                      │  │                             │                   │  │
                      │  │          ┌──────────────────┼──────────────────┐ │  │
                      │  │          │                  │                  │ │  │
                      │  │  ┌───────────────┐ ┌──────────────┐ ┌────────────┐ │  │
                      │  │  │   paiements   │ │ frais_notaire│ │commissions  │ │  │
                      │  │  │  (payments)  │ │  (notary    │ │ (commissions)│ │  │
                      │  │  │              │ │   fees)     │ │             │ │  │
                      │  │  └──────────────┘ └──────────────┘ └────────────┘ │  │
                      │  │                                          │        │  │
                      │  │                  ┌──────────────────┐          │  │
                      │  │                  │  documents_       │          │  │
                      │  │                  │   notariale      │          │  │
                      │  │                  │  (documents)      │          │  │
                      │  │                  └──────────────────┘          │  │
                      │  └────────────────────────────────────────────────┘  │
                      │                                                         │
                      └──────────────────────────────────────────────────────┘
                                                                     │
                              ┌──────────────────────────┬──────────────────────────┐
                              │                          │                          │
                     ┌────────▼─────────┐   ┌─────────▼────────┐   ┌───────▼─────────┐
                     │   Redis Cache    │   │   AWS S3        │   │   APScheduler   │
                     │   (Optional)     │   │  (Documents)     │   │   (Background   │
                     │                  │   │                  │   │    Jobs)        │
                     └──────────────────┘   └──────────────────┘   └─────────────────┘

EXTERNAL INTEGRATIONS:
├─ Stripe (Payments) - Webhook: POST /api/v1/paiements/webhook/stripe
├─ DocuSign (E-signatures) - Callback: POST /api/v1/transactions/webhook/docusign
├─ SendGrid (Email) - SMTP & API for transactional emails
├─ AWS S3 (Document Storage) - For signed documents
└─ OAuth 2.0 (Authentication) - Google, Facebook, Apple
```

---

## 🛠️ Technology Stack

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
| **Framework** | FastAPI | 0.104+ | REST API (recommended) |
| **Framework** | Flask | 2.0+ | REST API (legacy) |
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

## 📁 Code Organization

### Frontend Structure

```
frontend/
├── public/                      # Static assets
├── src/
│  ├── pages/                    # Page components (7 main pages)
│  │  ├── NotaireDashboardPage.jsx
│  │  ├── TransactionDetailsPage.jsx
│  │  ├── SelectNotairePage.jsx
│  │  ├── ValidateFeesPage.jsx
│  │  ├── PaymentPage.jsx
│  │  ├── SignCompromisPage.jsx
│  │  └── SignActePage.jsx
│  │
│  ├── components/              # Reusable components
│  │  ├── forms/                # Form components
│  │  ├── layout/               # Layout components
│  │  ├── common/               # Common components
│  │  └── protected/            # Protected route wrapper
│  │
│  ├── services/                # API integration
│  │  ├── api/                  # API endpoints
│  │  │  ├── transactions.js
│  │  │  ├── notaires.js
│  │  │  ├── payments.js
│  │  │  ├── documents.js
│  │  │  ├── auth.js
│  │  │  └── annonces.js
│  │  ├── apiClient.js          # Axios instance with interceptors
│  │  └── constants.js
│  │
│  ├── hooks/                   # Custom React hooks
│  │  ├── useAuth.js            # Authentication hook
│  │  ├── useTransaction.js
│  │  ├── usePayment.js
│  │  └── useNotaire.js
│  │
│  ├── store/                   # State management (Zustand)
│  │  ├── transactionStore.js
│  │  └── authStore.js
│  │
│  ├── schemas/                 # Zod validation schemas
│  │  ├── transaction.js
│  │  └── payment.js
│  │
│  ├── utils/                   # Utility functions
│  │  ├── format.js
│  │  └── validation.js
│  │
│  ├── App.jsx                  # Main component
│  ├── main.jsx                 # Entry point
│  └── index.css                # Global styles
│
├── __tests__/                  # Test files (parallel structure)
├── vite.config.js              # Vite configuration
├── vitest.config.js            # Test configuration
└── package.json
```

### Backend Structure

```
backend/
├── src/
│  ├── main.py                  # FastAPI app factory
│  ├── run_server.py            # Flask entry point
│  │
│  ├── api/                     # API routes
│  │  ├── v1/                   # API version 1
│  │  │  ├── __init__.py
│  │  │  ├── offres.py          # Offers endpoints
│  │  │  ├── transactions.py   # Transactions endpoints
│  │  │  ├── notaires.py        # Notaries endpoints
│  │  │  ├── paiements.py       # Payments endpoints
│  │  │  ├── documents.py       # Documents endpoints
│  │  │  ├── users.py           # Users endpoints
│  │  │  ├── annonces.py        # Listings endpoints
│  │  │  ├── messages.py        # Messaging endpoints
│  │  │  ├── appointments.py     # Appointments endpoints
│  │  │  ├── calendar.py         # Calendar endpoints
│  │  │  └── admin.py           # Admin endpoints
│  │  │
│  │  └── auth.py               # Authentication endpoints
│  │
│  ├── models/                  # Database models
│  │  ├── __init__.py
│  │  ├── user.py               # User model (Unified)
│  │  ├── notaire.py            # Notary model
│  │  ├── annonce.py            # Listing model
│  │  ├── offre.py              # Offer model
│  │  ├── transaction.py        # Transaction model
│  │  ├── paiement.py           # Payment model
│  │  ├── document.py           # Document model
│  │  └── ...
│  │
│  ├── services/                # Business logic services
│  │  ├── external_integrations/ # External service integrations
│  │  │  ├── stripe_service.py
│  │  │  ├── docusign_service.py
│  │  │  ├── sendgrid_service.py
│  │  │  └── s3_service.py
│  │  │
│  │  ├── parcours_vente/        # Sales journey services
│  │  │  ├── transactions_service.py
│  │  │  ├── notaires_service.py
│  │  │  └── fees_service.py
│  │  │
│  │  └── scheduler/            # Background job services
│  │     └── parcours_vente_scheduler.py
│  │
│  ├── schemas/                 # Pydantic request/response schemas
│  │  ├── user.py
│  │  ├── transaction.py
│  │  └── ...
│  │
│  ├── utils/                   # Utility functions
│  │  ├── auth.py
│  │  ├── security.py
│  │  └── helpers.py
│  │
│  └── config.py               # Configuration
│
├── tests/                    # Test suite
│  ├── unit/
│  └── integration/
│
├── migrations/               # Alembic migrations
├── requirements.txt          # Python dependencies
└── Dockerfile
```

---

## 🗃️ Database Schema

### Core Tables

#### **utilisateurs** (Users - Unified Model)

The unified user model consolidates authentication and buyer criteria into a single table.

```sql
CREATE TABLE utilisateurs (
    -- Authentication
    utilisateur_id         SERIAL PRIMARY KEY,
    email                  VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe_hash      VARCHAR(255) NOT NULL,
    auth_method            ENUM ('email', 'google', 'facebook', 'apple') DEFAULT 'email',
    
    -- Profile
    nom                    VARCHAR(100) NOT NULL,
    prenom                 VARCHAR(100) NOT NULL,
    telephone              VARCHAR(20),
    adresse_contact        VARCHAR(255),
    photo_url              VARCHAR(500),
    role                   VARCHAR(50) DEFAULT 'user',
    actif                  BOOLEAN DEFAULT true,
    
    -- Buyer Criteria (All nullable by default)
    budget_max             INTEGER,  -- Maximum budget in euros
    ville_recherchee       VARCHAR(100),  -- Preferred location
    surface_min            INTEGER,  -- Minimum surface in m²
    type_bien_recherche    VARCHAR(50),  -- apartment|maison|terrain|commercial
    nombre_pieces_min      INTEGER,  -- Minimum number of rooms
    dpe_ideale             VARCHAR(10),  -- A, B, C, D, E, F, G
    
    -- Email Verification & 2FA
    email_verified         BOOLEAN DEFAULT false,
    verification_token     TEXT,
    verification_token_expires TIMESTAMPTZ,
    requires_2fa           BOOLEAN DEFAULT false,
    two_fa_code            VARCHAR(10),
    two_fa_code_expires    TIMESTAMPTZ,
    
    -- Password Reset
    reset_token            TEXT,
    reset_token_expires    TIMESTAMPTZ,
    
    -- OAuth Integration
    google_id              VARCHAR(255) UNIQUE,
    facebook_id            VARCHAR(255) UNIQUE,
    apple_id               VARCHAR(255) UNIQUE,
    
    -- Audit
    date_inscription       TIMESTAMPTZ DEFAULT NOW(),
    date_derniere_connexion TIMESTAMPTZ,
    updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Recommended indexes for buyer criteria
CREATE INDEX idx_user_ville_budget ON utilisateurs(ville_recherchee, budget_max);
CREATE INDEX idx_user_role ON utilisateurs(role);
```

**Benefits of Unified Model:**
- ✅ Single source of truth (1 table instead of 2)
- ✅ No JOINs required for buyer criteria
- ✅ All fields nullable → maximum flexibility
- ✅ User can be both buyer and seller
- ✅ Easy to add new criteria (just add columns)
- ✅ Better performance (direct access)
- ✅ Cache-friendly

#### **notaires** (Notaries)

```sql
CREATE TABLE notaires (
    notaire_id             SERIAL PRIMARY KEY,
    utilisateur_id         INTEGER UNIQUE REFERENCES utilisateurs(utilisateur_id),
    etude_notariale        VARCHAR(255) NOT NULL,
    numero_rpps            VARCHAR(50) UNIQUE,
    telephone              VARCHAR(20),
    adresse                VARCHAR(255),
    code_postal           VARCHAR(10),
    ville                  VARCHAR(100),
    specialisations       VARCHAR(255),  -- JSON: ["Immobilier", "Succession"]
    zone_geographique      JSONB,          -- Areas served
    partenaire_actif       BOOLEAN DEFAULT true,
    dossiers_max          INTEGER DEFAULT 30,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);
```

#### **annonces** (Listings)

```sql
CREATE TABLE annonces (
    annonce_id             SERIAL PRIMARY KEY,
    utilisateur_id         INTEGER REFERENCES utilisateurs(utilisateur_id),
    titre                  VARCHAR(255) NOT NULL,
    description            TEXT,
    prix                   DECIMAL(12,2) NOT NULL,
    prix_demande           DECIMAL(12,2),
    surface                DECIMAL(10,2),
    adresse                VARCHAR(255),
    code_postal           VARCHAR(10),
    ville                  VARCHAR(100),
    type_bien              VARCHAR(50) NOT NULL,  -- maison|appartement|terrain|local commercial
    nombre_pieces          INTEGER,
    etage                  INTEGER,
    ascenseur              BOOLEAN DEFAULT false,
    balcon                 BOOLEAN DEFAULT false,
    terrasse               BOOLEAN DEFAULT false,
    jardin                 BOOLEAN DEFAULT false,
    piscine                BOOLEAN DEFAULT false,
    parking                BOOLEAN DEFAULT false,
    dpe                    VARCHAR(10),  -- A, B, C, D, E, F, G
    annee_construction     INTEGER,
    photos                 JSONB,          -- Array of image URLs
    statut                 VARCHAR(20) DEFAULT 'brouillon',  -- brouillon|publiée|vendue|archivée
    date_creation          TIMESTAMPTZ DEFAULT NOW(),
    date_modification      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_annonce_ville ON annonces(ville);
CREATE INDEX idx_annonce_prix ON annonces(prix);
CREATE INDEX idx_annonce_statut ON annonces(statut);
```

#### **offres** (Offers)

```sql
CREATE TABLE offres (
    offre_id               SERIAL PRIMARY KEY,
    annonce_id             INTEGER REFERENCES annonces(annonce_id),
    acheteur_id            INTEGER REFERENCES utilisateurs(utilisateur_id),
    vendeur_id            INTEGER REFERENCES utilisateurs(utilisateur_id),
    prix_propose           DECIMAL(12,2) NOT NULL,
    message                TEXT,
    statut                 VARCHAR(20) DEFAULT 'EN_ATTENTE',  -- EN_ATTENTE|ACCEPTEE|REJETEE|NEGOCIATION|EXPIREE
    contre_proposition     DECIMAL(12,2),
    date_expiration        TIMESTAMPTZ,
    date_creation          TIMESTAMPTZ DEFAULT NOW(),
    date_modification      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offre_statut ON offres(statut);
CREATE INDEX idx_offre_annonce ON offres(annonce_id);
CREATE INDEX idx_offre_acheteur ON offres(acheteur_id);
CREATE INDEX idx_offre_created ON offres(date_creation);
```

#### **transactions_notaire** (Transactions)

```sql
CREATE TABLE transactions_notaire (
    transaction_id         SERIAL PRIMARY KEY,
    annonce_id             INTEGER REFERENCES annonces(annonce_id),
    offre_id               INTEGER REFERENCES offres(offre_id),
    vendeur_id            INTEGER REFERENCES utilisateurs(utilisateur_id),
    acheteur_id            INTEGER REFERENCES utilisateurs(utilisateur_id),
    notaire_id             INTEGER REFERENCES notaires(notaire_id),
    prix_compromis         DECIMAL(12,2) NOT NULL,
    statut                 VARCHAR(50) DEFAULT 'CREEE',
    -- Status flow: CREEE → NOTAIRE_ASSIGNEE → FRAIS_VALIDES → COMPROMIS_PREPARE → 
    --              COMPROMIS_SIGNE → PAIEMENT_DEPOT → EN_ATTENTE_PAIEMENT_SOLDE → FINALISEE
    date_creation          TIMESTAMPTZ DEFAULT NOW(),
    date_modification      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transaction_statut ON transactions_notaire(statut);
CREATE INDEX idx_transaction_created ON transactions_notaire(date_creation);
```

#### **paiements** (Payments)

```sql
CREATE TABLE paiements (
    paiement_id            SERIAL PRIMARY KEY,
    transaction_id         INTEGER REFERENCES transactions_notaire(transaction_id),
    montant                DECIMAL(12,2) NOT NULL,
    type                   VARCHAR(50) NOT NULL,  -- DEPOT|SOLDE|COMMISSION|REMBOURSEMENT
    statut                 VARCHAR(50) DEFAULT 'EN_COURS',  -- EN_COURS|CONFIRME|ECHOUEE|REMBOURSEE|ANNULEE
    stripe_payment_intent_id VARCHAR(255),
    stripe_client_secret  VARCHAR(255),
    stripe_charge_id       VARCHAR(255),
    date_creation          TIMESTAMPTZ DEFAULT NOW(),
    date_confirmation      TIMESTAMPTZ,
    date_echec            TIMESTAMPTZ,
    date_remboursement     TIMESTAMPTZ
);

CREATE INDEX idx_paiement_statut ON paiements(statut);
CREATE INDEX idx_paiement_transaction ON paiements(transaction_id);
```

#### **frais_notaire** (Notary Fees)

```sql
CREATE TABLE frais_notaire (
    frais_id              SERIAL PRIMARY KEY,
    transaction_id         INTEGER REFERENCES transactions_notaire(transaction_id),
    montant_base          DECIMAL(12,2) NOT NULL,
    pourcentage_base      DECIMAL(5,2) NOT NULL,
    montant_tva           DECIMAL(12,2) NOT NULL,
    pourcentage_tva       DECIMAL(5,2) NOT NULL,
    montant_ttc           DECIMAL(12,2) NOT NULL,
    date_creation          TIMESTAMPTZ DEFAULT NOW()
);
```

#### **commissions_immo2000** (Platform Commissions)

```sql
CREATE TABLE commissions_immo2000 (
    commission_id         SERIAL PRIMARY KEY,
    transaction_id         INTEGER REFERENCES transactions_notaire(transaction_id),
    montant                DECIMAL(12,2) NOT NULL,
    date_creation          TIMESTAMPTZ DEFAULT NOW()
);
```

#### **documents_notariale** (Documents)

```sql
CREATE TABLE documents_notariale (
    document_id            SERIAL PRIMARY KEY,
    transaction_id         INTEGER REFERENCES transactions_notaire(transaction_id),
    type                   VARCHAR(50) NOT NULL,  -- COMPROMIS|ACTE|AUTRE
    statut                 VARCHAR(50) DEFAULT 'EN_COURS',  -- EN_COURS|SIGNE|ARCHIVE
    s3_url                 VARCHAR(500),
    s3_key                 VARCHAR(500),
    docusign_envelope_id   VARCHAR(255),
    date_creation          TIMESTAMPTZ DEFAULT NOW(),
    date_signature         TIMESTAMPTZ,
    nom_fichier            VARCHAR(255)
);
```

---

## 🔄 Data Models & Relationships


### Unified User Model Evolution

**Before (Separate):**
```
User (authentication)
├── utilisateur_id
├── email
├── mot_de_passe_hash
└── role

Acheteur (buyer criteria)
├── acheteur_id → FK utilisateur_id
├── budget_max
├── ville_recherchee
└── surface_min
```

**Problems:**
- ❌ 2 tables, 2 primary keys
- ❌ Mandatory JOINs for all queries
- ❌ Complex N:N relationships
- ❌ Duplicated logic
- ❌ Performance: Systematic JOINs

**After (Unified):**
```
User (single source of truth)
├── utilisateur_id
├── email, mot_de_passe_hash
├── nom, prenom, role
├── Buyer Criteria (all nullable)
│   ├── budget_max
│   ├── ville_recherchee
│   ├── surface_min
│   ├── type_bien_recherche
│   ├── nombre_pieces_min
│   └── dpe_ideale
├── OAuth & Auth
│   ├── google_id, facebook_id, apple_id
│   ├── email_verified
│   └── requires_2fa
└── Metadata
    ├── date_inscription
    ├── date_derniere_connexion
    └── updated_at
```

**Benefits:**
- ✅ 1 table, 1 primary key
- ✅ No JOINs required
- ✅ All fields nullable → flexibility
- ✅ User can be both buyer and seller
- ✅ Scalable: Add criteria = add columns
- ✅ Better performance
- ✅ Cache-friendly

### Entity Relationships

```
Utilisateur (User)
    │
    ├─── Vendeur ─────────────────────┬────────────────────────┐
    │                                  │                        │
    ├─── Acheteur ──────────────────────┼────────────────────────┘
    │                                        │
    └─── Notaire ─────────────────────────┐
                                     (via notaires table)
                                           │
                        ┌──────────────────┬──────────────────┐
                        │                  │                  │
                        ▼                  ▼                  ▼
                   Annonce (Listing)     Offre (Offer)    TransactionNotaire
                        │                  │                  │
                        │                  │ (after acceptance)
                        │                  ▼
                        │             TransactionNotaire
                        │                  │
                        └──────────────────┘
                                    │
                    ┌───────────────────┬───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
            Paiement (Payment)   FraisNotaire (Fees)   Commission (Commission)
                    │
                    ├─ type: DEPOT, SOLDE, COMMISSION
                    │
                    ├─ statut: EN_COURS, CONFIRME, ECHOUEE, REMBOURSEE
                    │
                    └─ stripe_payment_intent_id

                    DocumentsNotariale
                    │
                    ├─ type: COMPROMIS, ACTE, AUTRE
                    │
                    ├─ statut: EN_COURS, SIGNE, ARCHIVE
                    │
                    ├─ s3_url
                    │
                    └─ docusign_envelope_id
```

---

## 🔄 Data Flows

### Offer Creation Flow

```
BUYER (HTTP POST)
       │
       ▼
POST /api/v1/offres
       │ @token_required
       ▼
routes/offres.py::creer_offre()
       │
       ├─ Validation (annonce exists, prix valid)
       │
       ├─ Create Offre object
       │  ├─ annonce_id
       │  ├─ acheteur_id (from token)
       │  ├─ vendeur_id (from annonce)
       │  ├─ prix_propose
       │  └─ set_expiration_24h()
       │
       ├─ db.session.add() + commit()
       │
       ├─ SendGrid.envoyer_email_offre_proposee()
       │  └─ Email to SELLER
       │
       └─ return {offre_id, statut, dates}
              │
              └──→ FRONTEND (show confirmation)


SCHEDULER (APScheduler - Every Hour)
       │
       ▼
scheduler_parcours_vente.rappeler_offres_non_repondues()
       │
       ├─ Query: Offre.statut='EN_ATTENTE' AND created_at > 24h
       │
       ├─ For each offre:
       │  └─ SendGrid.envoyer_email_offre_expiree()
       │
       └─ log: "Sent X reminders for unanswered offers"
```

### Payment Flow (Stripe)

```
BUYER (HTTP POST with Stripe token)
       │
       ▼
POST /api/v1/paiements
       │ @token_required
       ▼
routes/paiements.py::creer_paiement()
       │
       ├─ Validation (montant > 0, transaction exists)
       │
       ├─ StripeService.creer_payment_intent()
       │  ├─ stripe.PaymentIntent.create(
       │  │    amount=montant*100,
       │  │    currency='eur'
       │  │  )
       │  └─ return {payment_intent_id, client_secret}
       │
       ├─ Create Paiement object
       │  ├─ montant
       │  ├─ stripe_payment_intent_id
       │  ├─ statut = 'EN_COURS'
       │  └─ stripe_client_secret
       │
       ├─ db.session.add() + commit()
       │
       └─ return {paiement_id, client_secret, statut}
              │
              └──→ FRONTEND (Stripe Elements)
                      │
                      ├─ Payment.confirm(client_secret)
                      │
                      └─ Stripe Webhook ─────────────────┐
                                                          │
                                            ┌─────────────┘
                                            │
                                            ▼
POST /api/v1/paiements/webhook/stripe
       │
       ├─ Verify signature (webhook_secret)
       │
       ├─ Extract payment_intent_id
       │
       ├─ If statut='succeeded':
       │  ├─ Paiement.statut = 'CONFIRME'
       │  ├─ Paiement.stripe_charge_id = charge_id
       │  ├─ Transaction.statut = 'PAIEMENT_DEPOT'
       │  └─ SendGrid.envoyer_confirmation_paiement()
       │
       ├─ If statut='failed':
       │  ├─ Paiement.statut = 'ECHOUEE'
       │  └─ SendGrid.envoyer_email_paiement_echoue()
       │
       └─ db.session.commit()
```

### DocuSign Signature Flow

```
NOTARY (HTTP POST)
       │
       ▼
POST /api/v1/transactions/{id}/acte/sign
       │ @token_required (notaire only)
       ▼
routes/transactions.py::signer_acte()
       │
       ├─ Verify transaction.statut = 'COMPROMIS_SIGNE'
       │
       ├─ DocuSignService.generer_lien_signature()
       │  ├─ get_access_token() [JWT]
       │  ├─ Create envelope (document)
       │  ├─ Add signataires (notaire, acheteur, vendeur)
       │  └─ return {envelope_id, signing_url}
       │
       └─ return {signing_url} + redirect NOTARY
              │
              └─ Notary fills and signs in DocuSign
                     │
                     └─ DocuSign Webhook (callback_url)
                             │
                             ▼
POST /api/v1/transactions/webhook/docusign
       │
       ├─ Verify webhook signature
       │
       ├─ Extract envelope_id and signed=true
       │
       ├─ DocuSignService.telecharger_document_signe()
       │  └─ return signed PDF
       │
       ├─ S3Service.upload_fichier()
       │  ├─ Key: transactions/{id}/acte_signe.pdf
       │  └─ Store PDF
       │
       ├─ Transaction.statut = 'FINALISEE'
       │
       ├─ SendGrid.envoyer_email_vente_finalisee()
       │
       └─ db.session.commit()
```

---

## ⏰ Scheduler Data Flow

The APScheduler runs background jobs for automatic reminders:

```
┌─────────────────────────────────────────────────────────────┐
│          APScheduler BackgroundScheduler                     │
│                                                              │
│  Called at: app.run() or init_scheduler(app)                │
│  Execution: Background thread (separate from request handling)│
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│ EVERY HOUR          │
│ (0 * * * *)          │
└──────────────────────┘
       │
       ▼
rappeler_offres_non_repondues()
       │
       ├─ Query: Offre.statut='EN_ATTENTE' AND created_at < now - 24h
       │
       ├─ For each offre:
       │  └─ SendGrid.rappel_vendeur()
       │
       └─ log: "Sent X reminders for unanswered offers"

┌──────────────────────┐
│ 9h ET 17h EVERY DAY │
│ (0 9,17 * * *)       │
└──────────────────────┘
       │
       ▼
rappeler_offres_negociation()
       │
       ├─ Query: Offre.statut='NEGOCIATION' AND date_reponse < now - 48h
       │
       ├─ For each:
       │  ├─ SendGrid.rappel_acheteur()
       │  └─ SendGrid.rappel_vendeur()
       │
       └─ log: "Sent X reminders for negotiations"

┌──────────────────────┐
│ 10h EVERY DAY       │
│ (0 10 * * *)         │
└──────────────────────┘
       │
       ▼
rappeler_paiement_depot()
       │
       ├─ Query: Transaction.statut='COMPROMIS_SIGNE' AND date_compromis < now - 3d
       │
       ├─ For each:
       │  └─ SendGrid.rappel_paiement()
       │
       └─ log: "Sent X payment reminders"

┌──────────────────────┐
│ 8h ET 16h EVERY DAY  │
│ (0 8,16 * * *)       │
└──────────────────────┘
       │
       ▼
rappeler_documents_en_attente()
       │
       ├─ Query: Transaction.statut IN ['COMPROMIS_SIGNE', 'EN_ATTENTE_ACTE']
       │         AND last_update < now - 5d
       │
       ├─ For each:
       │  ├─ SendGrid.rappel_notaire()
       │  └─ SendGrid.rappel_parties()
       │
       └─ log: "Sent X document reminders"
```

---

## 🔌 Integration Points

### 1. Frontend → API
- **Method**: HTML forms POST to `/api/v1/*` endpoints
- **Authentication**: Bearer Token in Authorization header
- **Errors**: Standard HTTP status codes (400, 401, 403, 404, 500)
- **Format**: JSON request/response

### 2. Stripe → API
- **Webhook**: POST `/api/v1/paiements/webhook/stripe`
- **Signature**: Verified with `STRIPE_WEBHOOK_SECRET`
- **Payload**: Event JSON with payment_intent details
- **Actions**: Update payment status, trigger confirmations

### 3. DocuSign → API
- **Webhook**: POST `/api/v1/transactions/webhook/docusign` (optional)
- **Callback**: URL configured in DocuSign dashboard
- **Retrieval**: Download PDF after signing
- **Storage**: Documents stored in AWS S3

### 4. SendGrid → Users
- **Emails**: Sent synchronously during actions
- **Templates**: HTML with context variables
- **Errors**: Logged, do not block requests
- **Use Cases**: Offer notifications, payment confirmations, document reminders

### 5. AWS S3 → Document Storage
- **Upload**: After document signing
- **Key Pattern**: `transactions/{id}/{type}/{filename}.pdf`
- **Retrieval**: Via endpoint GET `/api/v1/transactions/{id}/documents`
- **Access**: Temporary signed URLs for downloads

### 6. Scheduler → Database
- **Execution**: Separate thread, does not affect requests
- **Logs**: Written to application logs
- **Errors**: Logged, jobs continue running
- **Frequency**: Hourly, daily at specific times

---

## 🎯 Status Workflows

### Offer Status Flow

```
                        ┌─────────────┐
                        │  CREEE      │
                        │  (new)      │
                        └──────┬──────┘
                               │ set_expiration_24h()
                               ▼
                        ┌─────────────┐
        ┌──────────────→│ EN_ATTENTE  │←──────────────┐
        │               │  (24h)      │               │
        │               └──────┬──────┘               │
        │                      │                      │
        │                      ├─ Vendeur accepte    │
        │                      │      ↓              │
        │                      │   ACCEPTEE          │
        │                      │   (creates transaction)│
        │                      │                      │
        │                      ├─ Vendeur refuse    │
        │                      │      ↓              │
        │                      │   REFUSEE           │
        │                      │   (end)             │
        │                      │                      │
        │                      └─ Vendeur négocie   │
        │                           ↓                │
        │                      NEGOCIATION          │
        │                      (counter-offer)      │
        │                                           │
        └───────────────────────────────────────────┘
                    (after 48h without response)
                           (EXPIREE)
```

### Transaction Status Flow

```
OFFER ACCEPTED
    │
    ▼
EN_ATTENTE_SELECTION
  │ (select notaire)
  ▼
NOTAIRE_SELECTIONNE
  │ (notaire validates fees)
  ▼
FRAIS_VALIDES
  │ (parties sign compromis)
  ▼
COMPROMIS_SIGNE
  │ (buyer pays 15% deposit)
  ▼
PAIEMENT_DEPOT
  │ (payment confirmed)
  ▼
EN_ATTENTE_PAIEMENT_SOLDE
  │ (parties sign acte authentique)
  ▼
FINALISEE
  │
  └─ Documents archived in S3
  └─ Confirmations sent by email
```

### Payment Status Flow

```
EN_COURS (PaymentIntent created)
  ↓ (user confirms card)
  ↓ (Stripe webhook)
CONFIRME (payment successful)

OR

CONFIRME
  ↓ (refund issued)
REMBOURSEE

OR

EN_COURS
  ↓ (card declined)
FAILED
  ↓ (retry possible)
CONFIRME (if retry succeeds)

OR

FAILED
  ↓ (manual intervention)
ANNULEE
```

---

## 🚀 Environment Variables

### Required Configuration

```bash
# ========== DOCUSIGN ==========
DOCUSIGN_CLIENT_ID=d7e3fd2c-XXXX-XXXX-XXXX-XXXXXXXXXXXX
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
DOCUSIGN_USER_ID=<your-docusign-user-id>
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi  # test
DOCUSIGN_OAUTH_URL=account-d.docusign.com  # test

# ========== STRIPE ==========
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLIC_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# ========== SENDGRID ==========
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here

# ========== AWS ==========
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=immo2000-documents
AWS_S3_REGION=eu-west-1

# ========== FLASK/FASTAPI ==========
FLASK_ENV=production
SECRET_KEY=xxxxxxxxxx-changez-cette-cle
JWT_SECRET_KEY=your-jwt-secret-key
API_PORT=5000
DATABASE_URL=postgresql://user:pass@localhost/immo2000

# ========== REDIS ==========
REDIS_URL=redis://localhost:6379/0

# ========== DATABASE ==========
DB_HOST=localhost
DB_PORT=5432
DB_NAME=immo2000
DB_USER=immo2000
DB_PASSWORD=your-password

# ========== CORS ==========
API_CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-production-domain.com
```

---

## 🎯 Performance Optimization

### Recommended Database Indexes

```sql
-- Offres (Offers)
CREATE INDEX idx_offre_statut ON offres(statut);
CREATE INDEX idx_offre_created_at ON offres(created_at);
CREATE INDEX idx_offre_acheteur ON offres(acheteur_id);
CREATE INDEX idx_offre_annonce ON offres(annonce_id);

-- Transactions
CREATE INDEX idx_transaction_statut ON transactions_notaire(statut);
CREATE INDEX idx_transaction_created_at ON transactions_notaire(created_at);
CREATE INDEX idx_transaction_notaire ON transactions_notaire(notaire_id);

-- Paiements (Payments)
CREATE INDEX idx_paiement_statut ON paiements(statut);
CREATE INDEX idx_paiement_transaction ON paiements(transaction_id);

-- Users
CREATE INDEX idx_user_ville_budget ON utilisateurs(ville_recherchee, budget_max);
CREATE INDEX idx_user_role ON utilisateurs(role);
CREATE INDEX idx_user_email ON utilisateurs(email);

-- Annonces (Listings)
CREATE INDEX idx_annonce_ville ON annonces(ville);
CREATE INDEX idx_annonce_prix ON annonces(prix);
CREATE INDEX idx_annonce_statut ON annonces(statut);
CREATE INDEX idx_annonce_type ON annonces(type_bien);
```

### Caching Strategy (Redis)

```python
# Notaires disponibles par zone (24h TTL)
cache_key = f"notaires:zone:{code_postal}"
cache.set(cache_key, notaires, 24*3600)

# Transaction details (1h TTL)
cache_key = f"transaction:{transaction_id}"
cache.set(cache_key, transaction.to_dict(), 1*3600)

# User profile (30min TTL)
cache_key = f"user:profile:{user_id}"
cache.set(cache_key, user.to_dict(), 30*60)

# API response caching for public endpoints
cache_key = f"api:annonces:ville={ville}&type={type_bien}"
cache.set(cache_key, response_data, 5*60)  # 5 min
```

### Query Optimization

**Bad:**
```python
# Multiple queries
transaction = Transaction.query.get(transaction_id)
offers = Offer.query.filter_by(transaction_id=transaction_id).all()
user = User.query.get(transaction.acheteur_id)
```

**Good:**
```python
# Single query with JOINs
transaction = Transaction.query.options(
    joinedload(Transaction.offers),
    joinedload(Transaction.acheteur)
).get(transaction_id)
```

---

## ✅ Best Practices

### Architecture Principles

1. **Separation of Concerns**: Keep frontend, backend, and database layers separate
2. **Single Responsibility**: Each component/service should do one thing well
3. **DRY (Don't Repeat Yourself)**: Consolidate common logic
4. **KISS (Keep It Simple)**: Simple solutions over complex ones
5. **YAGNI (You Aren't Gonna Need It)**: Don't build features you don't need yet

### Code Quality

1. **Type Hints**: Use Python type hints for better IDE support
2. **Pydantic Models**: Validate all request/response data
3. **Error Handling**: Catch and handle exceptions properly
4. **Logging**: Log important events and errors
5. **Testing**: Write unit and integration tests

### Database

1. **Use ORM**: Always use SQLAlchemy ORM, never raw SQL in application code
2. **Transactions**: Group related operations in database transactions
3. **Migrations**: Use Alembic for all schema changes
4. **Indexes**: Add indexes for frequently queried columns
5. **Backup**: Regular database backups

### Security

1. **HTTPS**: Always use HTTPS in production
2. **Input Validation**: Validate all user input
3. **SQL Injection**: Use ORM to prevent SQL injection
4. **XSS**: Escape all user-generated content
5. **CSRF**: Implement CSRF protection for forms
6. **Secrets**: Never commit secrets to version control
7. **Webhook Verification**: Always verify webhook signatures

### Performance

1. **Pagination**: Always use pagination for large datasets
2. **Caching**: Cache frequently accessed data
3. **Lazy Loading**: Load related data only when needed
4. **Async**: Use async/await for I/O operations (FastAPI)
5. **Connection Pooling**: Use database connection pooling

---

## 📚 Additional Resources

- [Database Schema Diagram](../database/SCHEMA_DIAGRAM.md)
- [API Reference](../API/REFERENCE.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Security Guide](../SECURITY.md)

---

**Documentation Version**: 2.0.0
**Last Updated**: 2026-06-09
**Status**: ✅ PRODUCTION READY
