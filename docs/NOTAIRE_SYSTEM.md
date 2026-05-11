# Notaire Partenaire System - Complete Documentation

## Overview

The Notaire Partenaire (Partner Notary) system is Phase 3 of Immo2000, enabling users to work with professional notaries for transaction validation and legal document handling during real estate sales.

## Features

### 1. Notaire Profile Management
- Professional information (RPPS number, office name, address, contact)
- Geographic zone coverage (postcodes, cities)
- Specialization tracking (vente, succession, donation, fiscalité, divorce)
- Availability management and capacity tracking
- Rating and statistics

### 2. Transaction Management
- Automatic notaire assignment workflow when offer accepted
- Status tracking: selection → validation → approval/rejection
- Document upload and validation
- SLA tracking (deadlines for response and completion)
- Multi-step validation process:
  - Notaire can validate compromis
  - Request modifications with reasons and deadline
  - Reject with explanation

### 3. Document Handling
- Upload documents (compromis, diagnostics, identity docs, etc.)
- Notaire validation workflow
- Document versioning through transaction history
- Preparation for encryption and RGPD compliance

### 4. Audit Trail
- Complete history of all actions
- Status change tracking
- IP logging for security
- Compliance with RGPD requirements
- User-accessible history view

### 5. Dashboard Features
- Notaire dashboard: pending cases, document review, action tracking
- User notifications on notaire actions
- Transaction history and timeline
- Statistics and performance metrics

### 6. Calendar System (Bonus)
- Availability slots management
- Block unavailable periods (vacation, training)
- Prevent overbooking
- Date-based filtering

## Database Schema

### Notaires Table
```sql
notaire_id (PK)
utilisateur_id (FK) - Links to user account
etude_notariale - Office name
numero_rpps - Professional registration number (unique)
adresse_etude, code_postal_etude, ville_etude - Office location
latitude, longitude - For map display
telephone, email_professionnel
zone_geographique (JSON) - Coverage area: {villes: [...], codes_postaux: [...]}
disponibilites (JSON) - Weekly schedule
partenaire_actif - Partnership status
max_dossiers_simultanees - Capacity limit (default 10)
delai_traitement_jours - SLA (default 5 days)
note_moyenne - Rating (0-5)
dossiers_traites - Completed transactions count
```

### Related Tables
- **notaire_specialisations**: Many-to-many for specializations
- **transaction_notaire**: Bridges transactions with notaires
- **document_notaire**: Transaction documents with validation status
- **historique_notaire**: Audit trail of all actions
- **disponibilite_notaire**: Calendar availability slots

## API Reference

### Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Notaire Management

#### Create Notaire (Admin only)
```
POST /api/v1/notaires
{
  "utilisateur_id": 123,
  "etude_notariale": "Étude Dupont",
  "numero_rpps": "12345678901",
  "adresse_etude": "123 Rue de Paris",
  "code_postal_etude": "75001",
  "ville_etude": "Paris",
  "telephone": "01.23.45.67.89",
  "email_professionnel": "contact@etudedupont.fr",
  "zone_geographique": {
    "villes": ["Paris", "Boulogne-Billancourt"],
    "codes_postaux": ["75001", "75002", "92100"]
  }
}
```

#### List Notaires
```
GET /api/v1/notaires?ville=Paris&code_postal=75001&specialisation=vente&skip=0&limit=10
```

#### Get Notaire Details
```
GET /api/v1/notaires/<notaire_id>
```

#### Update Notaire Profile
```
PUT /api/v1/notaires/<notaire_id>
{
  "telephone": "+33.1.23.45.67.89",
  "disponibilites": {
    "lundi": "09:00-17:00",
    "mardi": "09:00-17:00",
    "mercredi": "09:00-17:00",
    "jeudi": "09:00-17:00",
    "vendredi": "09:00-17:00"
  }
}
```

#### Get Notaire Statistics
```
GET /api/v1/notaires/<notaire_id>/stats
Response:
{
  "dossiers_en_cours": 7,
  "dossiers_ce_mois": 3,
  "delai_moyen_jours": 4.5,
  "note_moyenne": 4.8,
  "dossiers_traites_total": 42
}
```

### Transaction Management

#### Create Transaction (Automatic)
Triggered when offer accepted. Creates transaction with status "en_attente_selection".

#### Assign Notaire
```
POST /api/v1/notaires/transactions/<transaction_id>/assign
{
  "notaire_id": 45
}
```
Sets status to "en_attente_validation" and sends notification.

#### Get Available Notaires
```
GET /api/v1/notaires/available-for-transaction/<transaction_id>
Response:
{
  "notaires": [...],
  "total": 5
}
```

### Notaire Actions

#### Validate Compromis
```
POST /api/v1/notaires/transactions/<transaction_id>/validate
{
  "commentaires": "Document correct et complet"
}
```
Status → "validee", users notified.

#### Request Modifications
```
POST /api/v1/notaires/transactions/<transaction_id>/request-modifications
{
  "modifications_demandees": "Erreur: nom vendeur incorrect ligne 5",
  "delai_jours": 5
}
```
Status → "modifications_demandees", deadline set.

#### Reject Compromis
```
POST /api/v1/notaires/transactions/<transaction_id>/reject
{
  "raison_refus": "Document incomplet: diagnostic manquant"
}
```
Status → "refusee", users notified.

### Dashboard

#### Notaire Dashboard (Pending Cases)
```
GET /api/v1/notaires/<notaire_id>/dashboard/pending?skip=0&limit=20
Response:
{
  "transactions": [
    {
      "transaction_notaire_id": 1,
      "offre_id": 10,
      "statut": "en_attente_validation",
      "prix_compromis": 350000,
      "date_assignation_notaire": "2024-01-15T10:30:00",
      "delai_validation": "2024-01-20T23:59:59",
      "...": "..."
    }
  ],
  "total": 7
}
```

#### Transaction History (Audit Trail)
```
GET /api/v1/notaires/transactions/<transaction_id>/history
Response:
{
  "transaction_id": 1,
  "historique": [
    {
      "historique_id": 1,
      "type_action": "creation",
      "description": "Transaction créée pour offre 10",
      "ancien_statut": null,
      "nouveau_statut": "en_attente_selection",
      "date_action": "2024-01-15T10:00:00"
    },
    {
      "historique_id": 2,
      "type_action": "assignment",
      "description": "Notaire Dupont assigné",
      "ancien_statut": "en_attente_selection",
      "nouveau_statut": "en_attente_validation",
      "date_action": "2024-01-15T10:30:00"
    }
  ],
  "total": 5
}
```

## Status Workflow

```
en_attente_selection (No notaire yet)
    ↓
    assign_notaire()
    ↓
en_attente_validation (Notaire reviewing)
    ├→ validate_compromis() → validee (APPROVED)
    ├→ request_modifications() → modifications_demandees (REVISIONS NEEDED)
    │   └→ (user resubmits) → en_attente_validation
    └→ reject_compromis() → refusee (REJECTED)
```

## Security & RGPD

### Implemented
✅ Audit trail with timestamps and user IDs
✅ User authentication and authorization checks
✅ Role-based access control (admin, notaire, user)
✅ Transaction history accessible only to involved parties

### To Implement
🚧 Document encryption at rest
🚧 RGPD data retention policies
🚧 Access logging for document downloads
🚧 Data anonymization for terminated transactions

## Integration Points

### With Existing Systems

#### Offres (Offers)
- Transaction created when offer status = "acceptee"
- Notaire assignment integrated into offer workflow
- Status updates reflected in offer timeline

#### Annonces (Listings)
- Zone coverage based on listing location
- Notaire filtering by geographic region
- Notification integration with existing alert system

#### Users
- Notaire linked via utilisateur_id
- Notifications sent through existing notification system
- Dashboard accessible via role verification

#### Messages
- Communication channel between notaire and users
- Document references in message system
- Notification of transaction updates

## Performance Considerations

### Indices Optimization
- Zone-based searches: `(partenaire_actif, ville_etude)`
- Transaction lookups: `(statut, date_creation)`
- Historical queries: `(transaction_notaire_id, date_action)`

### Query Optimization
- Eagerly load related transactions in dashboard
- Use pagination for notaire listings
- Cache notaire statistics (updated on transaction completion)

### Load Limiting
- Max dossiers per notaire (default 10)
- SLA-based deadline tracking prevents indefinite queues
- Availability blocking prevents overcommitment

## Testing Strategy

### Unit Tests (CRUD)
- Test notaire creation with validation
- Test transaction workflow state machine
- Test document upload and validation
- Test statistics calculations

### Integration Tests
- Test full transaction lifecycle
- Test notifications triggered by actions
- Test permission checking
- Test audit trail logging

### API Tests
- Test all 11 endpoints
- Test error handling (404, 403, 400)
- Test pagination and filtering
- Test concurrent updates

## Deployment Steps

1. **Execute migrations** (in order: 016-021)
   ```bash
   flask db upgrade
   ```

2. **Create test notaires** (optional)
   ```bash
   python backend/create_test_notaires.py
   ```

3. **Start backend**
   ```bash
   python backend/run_server.py
   ```

4. **Deploy frontend** (when complete)
   - Create notaire-dashboard.html
   - Add notaire selection UI to offer flow
   - Update notification system

5. **Verify endpoints**
   ```bash
   curl http://localhost:5000/api/v1/notaires
   ```

## Future Enhancements

### Phase 3.1 - Security
- Document encryption with per-user keys
- RGPD compliance tooling
- Access logging and compliance reports

### Phase 3.2 - Advanced Features
- WebSocket for real-time notifications
- Calendar availability integration with external services
- Bulk document upload with progress tracking
- e-signature integration

### Phase 3.3 - Analytics
- Notaire performance metrics
- Transaction completion analytics
- Bottleneck identification
- User satisfaction surveys

## Troubleshooting

### Issue: "Notaire not found"
- Verify utilisateur_id exists and has notaire profile
- Check partenaire_actif = true

### Issue: "Not authorized" on assignment
- Ensure transaction exists and user is acheteur or vendeur
- Verify notaire exists and is partenaire_actif

### Issue: Documents not uploading
- Check mime_type is correct
- Verify transaction_notaire_id is valid

## Support & Documentation

- Full CRUD operation examples in `crud/notaires.py`
- Schema validation in `schemas/notaires.py`
- Route examples in `routes/notaires.py`
- Database schema in `migrations/016-021_*.sql`
