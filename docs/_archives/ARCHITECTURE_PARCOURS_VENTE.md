# 🏗️ Architecture Phase 3: Parcours de Vente

## Diagramme de Dépendances

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (À IMPLÉMENTER)                        │
│  Templates: offres/*, transactions/*, paiements/*                  │
│  Intégration: Stripe Elements, DocuSign Redirect, HTTP Fetch       │
└──────────────────────┬──────────────────────────────────────────────┘
                       │ HTTP/JSON
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FLASK API LAYER                                 │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │  transactions_vente_bp   │  │  paiements_vente_bp      │        │
│  │  (/api/v1/transactions/) │  │  (/api/v1/paiements/)    │        │
│  │                          │  │                          │        │
│  │  • selection notaire     │  │  • créer paiement        │        │
│  │  • valider frais         │  │  • confirmer paiement    │        │
│  │  • signer compromis      │  │  • enregistrer échec     │        │
│  │  • signer acte           │  │  • remboursement         │        │
│  │  • calculer frais        │  │  • webhook Stripe        │        │
│  └──────────────┬───────────┘  └──────────────┬───────────┘        │
│                 │                              │                   │
│                 └──────────────┬───────────────┘                   │
│                                ▼                                   │
│                    @token_required                                 │
│                    @handle_errors()                                │
│                                                                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌────────────────┐ ┌────────────┐ ┌──────────────────┐
│   MODELS       │ │ SERVICES   │ │   EXTERNAL APIs  │
│                │ │            │ │                  │
│ • Paiement     │ │ external_  │ │ • DocuSign       │
│ • FraisNotaire │ │ integrations│ │ • Stripe         │
│ • Commission   │ │            │ │ • SendGrid       │
│ • Offre (ext)  │ │ scheduler_  │ │ • AWS S3         │
│ • Transaction  │ │ parcours_   │ │                  │
│ • Notaire      │ │ vente       │ │                  │
│                │ │            │ │                  │
└────────────────┘ └────────────┘ └──────────────────┘
        ▲                ▲                ▲
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                  DATABASE (PostgreSQL)

                  Schema:
                  • transactions_notaire
                  • offres
                  • paiements
                  • frais_notaire
                  • commissions_immo2000
                  • notaires
                  • annonces
                  • utilisateurs (users)
```

---

## Flux de Données: Création d'Offre

```
ACHETEUR (HTTP POST)
       │
       ▼
POST /api/v1/offres
       │ @token_required
       ▼
routes/offres.py::creer_offre()
       │
       ├─ Validation (annonce existe, prix valide)
       │
       ├─ Créer Offre object
       │  ├─ annonce_id
       │  ├─ acheteur_id (from token)
       │  ├─ vendeur_id (from annonce)
       │  ├─ prix_propose
       │  └─ set_expiration_24h() ──→ datetime
       │
       ├─ db.session.add() + commit()
       │
       ├─ SendGrid.envoyer_email_offre_proposee()
       │  └─ Email à VENDEUR
       │
       └─ return {offre_id, statut, dates}
              │
              └──→ FRONTEND (afficher confirmation)


SCHEDULER (APScheduler)
       │ (toutes les heures)
       ▼
scheduler_parcours_vente.rappeler_offres_non_repondues()
       │
       ├─ Query: Offre.statut='proposee' AND created_at > 24h
       │
       ├─ For each offre:
       │  ├─ SendGrid.envoyer_email_offre_expiree()
       │  └─ Offre.statut = 'expiree' (optionnel)
       │
       └─ log: "Envoyé 5 rappels offres non répondues"
```

---

## Flux de Données: Paiement Stripe

```
ACHETEUR (HTTP POST avec stripe token)
       │
       ▼
POST /api/v1/paiements
       │ @token_required
       ▼
routes/paiements.py::creer_paiement()
       │
       ├─ Validation (montant > 0, transaction existe)
       │
       ├─ StripeService.creer_payment_intent()
       │  ├─ stripe.PaymentIntent.create(
       │  │    amount=montant*100,
       │  │    currency='eur'
       │  │  )
       │  └─ return {payment_intent_id, client_secret}
       │
       ├─ Créer Paiement object
       │  ├─ montant
       │  ├─ stripe_payment_intent_id
       │  ├─ statut = 'en_attente'
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
       ├─ Vérifier signature (webhook_secret)
       │
       ├─ Extraire payment_intent_id
       │
       ├─ Si statut='succeeded':
       │  ├─ Paiement.statut = 'reussi'
       │  ├─ Paiement.stripe_charge_id = charge_id
       │  ├─ Transaction.statut = 'paiement_depot'
       │  └─ SendGrid.envoyer_confirmation_paiement()
       │
       ├─ Si statut='failed':
       │  ├─ Paiement.statut = 'echoue'
       │  └─ SendGrid.envoyer_email_paiement_echoue()
       │
       └─ db.session.commit()
```

---

## Flux de Données: Signature DocuSign

```
NOTAIRE (HTTP POST)
       │
       ▼
POST /api/v1/transactions/{id}/acte/sign
       │ @token_required (notaire only)
       ▼
routes/transactions.py::signer_acte()
       │
       ├─ Vérifier transaction.statut = 'compromis_signe'
       │
       ├─ DocuSignService.generer_lien_signature()
       │  ├─ get_access_token() [JWT]
       │  ├─ Créer envelope (document)
       │  ├─ Ajouter signataires (notaire, acheteur, vendeur)
       │  └─ return {envelope_id, signing_url}
       │
       ├─ return {signing_url} + redirect NOTAIRE
       │
       └─ Notaire remplit et signe dans DocuSign
              │
              └─ DocuSign Webhook (callback_url)
                      │
                      ▼
POST /api/v1/transactions/{id}/webhook/docusign
       │
       ├─ Vérifier signature webhook
       │
       ├─ Extraire envelope_id et signé=true
       │
       ├─ DocuSignService.telecharger_document_signe()
       │  └─ return PDF signé
       │
       ├─ S3Service.upload_fichier()
       │  ├─ Clé: transactions/{id}/acte_signe.pdf
       │  └─ Stocker PDF
       │
       ├─ Transaction.statut = 'finalisee'
       │
       ├─ SendGrid.envoyer_email_vente_finalisee()
       │
       └─ db.session.commit()
```

---

## Flux du Scheduler: Rappels Automatiques

```
┌─────────────────────────────────────────────────────────────┐
│          APScheduler BackgroundScheduler                     │
│                                                              │
│  Appelé à: app.run() ou init_scheduler(app)                │
│  Exécution: En arrière-plan (thread séparé)                │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│ TOUTES LES HEURES    │
│ (0 * * * *)          │
└──────────────────────┘
       │
       ▼
rappeler_offres_non_repondues()
       │
       ├─ Query: Offre.statut='proposee'
       │         AND created_at < now - 24h
       │
       ├─ For each offre:
       │  └─ SendGrid.rappel_vendeur()
       │
       └─ log: "13 rappels envoyés"

┌──────────────────────┐
│ 9h ET 17h CHAQUE JOUR│
│ (0 9,17 * * *)       │
└──────────────────────┘
       │
       ▼
rappeler_offres_negociation()
       │
       ├─ Query: Offre.statut='negociation'
       │         AND date_reponse < now - 48h
       │
       ├─ For each:
       │  ├─ SendGrid.rappel_acheteur()
       │  └─ SendGrid.rappel_vendeur()
       │
       └─ log: "5 négociations rappelées"

┌──────────────────────┐
│ 10h CHAQUE JOUR      │
│ (0 10 * * *)         │
└──────────────────────┘
       │
       ▼
rappeler_paiement_depot()
       │
       ├─ Query: Transaction.statut='compromis_signe'
       │         AND date_compromis < now - 3d
       │
       ├─ For each:
       │  └─ SendGrid.rappel_paiement()
       │
       └─ log: "2 rappels paiement envoyés"

┌──────────────────────┐
│ 8h ET 16h CHAQUE JOUR│
│ (0 8,16 * * *)       │
└──────────────────────┘
       │
       ▼
rappeler_documents_en_attente()
       │
       ├─ Query: Transaction.statut IN
       │         ['compromis_signe', 'en_attente_acte']
       │         AND last_update < now - 5d
       │
       ├─ For each:
       │  ├─ SendGrid.rappel_notaire()
       │  └─ SendGrid.rappel_parties()
       │
       └─ log: "1 document rappelé"
```

---

## Modèles et Relations

```
Utilisateur (User)
    │
    ├─── vendeur ─────────────────────┐
    │                                  │
    ├─── acheteur ──────┐              │
    │                   │              │
    └─── notaire        │              │
                        │              │
                        ▼              ▼
                    Offre ←────── Annonce
                        │
                        ├─ statut: proposee | acceptee | refusee | negociation | expiree
                        ├─ prix_propose: Decimal(12,2)
                        ├─ contre_proposition: Decimal(12,2)
                        ├─ date_expiration: DateTime
                        └─────┐
                              │ (création après acceptation)
                              ▼
                    TransactionNotaire
                        │
                        ├─ statut: en_attente_selection | notaire_selectionne |
                        │          compromis_signe | paiement_depot | finalisee
                        ├─ prix_compromis: Decimal(12,2)
                        ├─ notaire_id: FK
                        │
                        ├─────┬─────────┬─────────┐
                        │     │         │         │
                        ▼     ▼         ▼         ▼
                    Paiement FraisNotaire CommissionImmo2000
                        │
                        ├─ type: depot_garantie | solde | frais |
                        │        commission | remboursement
                        ├─ statut: en_attente | en_cours | reussi |
                        │          echoue | rembourse | annule
                        ├─ montant: Decimal(12,2)
                        └─ stripe_payment_intent_id: String (Stripe)

Notaire
    │
    ├─ utilisateur_id: FK User
    ├─ etude_notariale: String
    ├─ zone_geographique: JSON
    └─ partenaire_actif: Boolean
```

---

## Flux de Statuts: Offre

```
                        ┌─────────────┐
                        │  CRÉÉE      │
                        │  (nouveau)  │
                        └──────┬──────┘
                               │ set_expiration_24h()
                               ▼
                        ┌─────────────┐
        ┌──────────────→│ PROPOSÉE    │←──────────────┐
        │               │  (24h)      │               │
        │               └──────┬──────┘               │
        │                      │                      │
        │                      ├─ vendeur accepte    │
        │                      │      ↓              │
        │                      │   ACCEPTÉE          │
        │                      │   (crée transaction)│
        │                      │                      │
        │                      ├─ vendeur refuse    │
        │                      │      ↓              │
        │                      │   REFUSÉE           │
        │                      │   (fin)             │
        │                      │                      │
        │                      └─ vendeur négocie   │
        │                           ↓                │
        │                      NÉGOCIATION          │
        │                      (contre-offre)      │
        │                                           │
        └───────────────────────────────────────────┘
                    (après 48h sans réponse)
                           (EXPIRE)
```

---

## Flux de Statuts: TransactionNotaire

```
ACCEPTÉE offre
    │
    ▼
EN_ATTENTE_SELECTION
  │ (sélectionner notaire)
  ▼
NOTAIRE_SÉLECTIONNÉ
  │ (notaire valide frais)
  ▼
FRAIS_VALIDÉS
  │ (signers signent compromis)
  ▼
COMPROMIS_SIGNÉ
  │ (acheteur paie 15%)
  ▼
PAIEMENT_DÉPÔT
  │ (paiement confirmé)
  ▼
EN_ATTENTE_PAIEMENT_SOLDE
  │ (signers signent acte authentique)
  ▼
FINALISÉE
  │
  └→ Documents archivés dans S3
  └→ Confirmations envoyées par email
```

---

## Points d'Intégration

### 1. Frontend → API
- Formulaires HTML POST vers endpoints `/api/v1/*`
- Authentification: Bearer Token dans Authorization header
- Erreurs: Codes HTTP standard (400, 401, 403, 404, 500)

### 2. Stripe → API
- Webhook: POST `/api/v1/paiements/webhook/stripe`
- Signature: Vérifiée avec `STRIPE_WEBHOOK_SECRET`
- Payload: Event JSON avec payment_intent détails

### 3. DocuSign → API
- Webhook: POST `/api/v1/transactions/webhook/docusign` (optionnel)
- Callback: URL configurée dans DocuSign dashboard
- Récupération: Download PDF après signature

### 4. SendGrid → Utilisateurs
- Emails: Envoyés synchrone lors d'actions
- Templates: HTML avec variables de contexte
- Erreurs: Loggées, ne bloquent pas requête

### 5. S3 → Archivage
- Upload: Après signature documents
- Key pattern: `transactions/{id}/{type}/{filename}.pdf`
- Récupération: Via endpoint GET `/api/v1/transactions/{id}/documents`

### 6. Scheduler → Database
- Exécution: Thread séparé, n'affecte pas requêtes
- Logs: Écrits dans application logs
- Erreurs: Loggées, tâches continuent

---

## Variables d'Environnement Requises

```bash
# DOCUSIGN
DOCUSIGN_CLIENT_ID=d7e3fd2c-XXXX-XXXX-XXXX-XXXXXXXXXXXX
DOCUSIGN_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----
DOCUSIGN_USER_ID=<your-docusign-user-id>
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi  # test
DOCUSIGN_OAUTH_URL=account-d.docusign.com  # test

# STRIPE (Use test keys from your Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLIC_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# SENDGRID (Use your SendGrid API key)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here

# AWS
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=immo2000-documents
AWS_S3_REGION=eu-west-1

# FLASK
FLASK_ENV=development  # ou production
SECRET_KEY=xxxxxxxxxx-changez-cette-clé
DATABASE_URL=postgresql://user:pass@localhost/immo2000_dev
```

---

## Performance et Optimisation

### Indexes Recommandés
```sql
-- Offres
CREATE INDEX idx_offre_statut ON offres(statut);
CREATE INDEX idx_offre_created_at ON offres(created_at);
CREATE INDEX idx_offre_acheteur ON offres(acheteur_id);

-- Transactions
CREATE INDEX idx_transaction_statut ON transactions_notaire(statut);
CREATE INDEX idx_transaction_created_at ON transactions_notaire(created_at);

-- Paiements
CREATE INDEX idx_paiement_statut ON paiements(statut);
CREATE INDEX idx_paiement_transaction ON paiements(transaction_notaire_id);
```

### Caching (Redis - Futur)
```python
# Notaires disponibles par zone
cache_key = f"notaires:zone:{code_postal}"
cache.set(cache_key, notaires, 24*3600)  # 24h TTL

# Transaction details
cache_key = f"transaction:{transaction_id}"
cache.set(cache_key, transaction.to_dict(), 1*3600)  # 1h TTL
```

---

**Dernière mise à jour**: 19 mai 2026
**Version**: 1.0 - Architecture Complète
**Statut**: ✅ Prêt pour Implémentation Frontend
