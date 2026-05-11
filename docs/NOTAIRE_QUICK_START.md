# Notaire System - Quick Start Guide

## Phase 3 Implementation Status

✅ **Backend Complete** (100%)
- ✅ Database models (6 tables with relationships)
- ✅ CRUD operations (~30 functions)
- ✅ API endpoints (11 routes)
- ✅ Validation schemas
- ✅ Migrations (6 SQL files)
- ✅ Authentication & authorization

🟡 **Frontend** (0% - To Do)
- ⏳ Notaire dashboard
- ⏳ User notaire selection UI
- ⏳ Status tracking UI

## Files Created

### Backend
```
backend/src/models/notaires.py          # 6 SQLAlchemy models
backend/src/schemas/notaires.py         # 8 Pydantic validation schemas
backend/src/crud/notaires.py            # ~30 CRUD operations
backend/src/routes/notaires.py          # 11 API endpoints
```

### Database
```
database/migrations/016_create_notaires_table.sql
database/migrations/017_create_notaire_specialisations_table.sql
database/migrations/018_create_transaction_notaire_table.sql
database/migrations/019_create_document_notaire_table.sql
database/migrations/020_create_historique_notaire_table.sql
database/migrations/021_create_disponibilite_notaire_table.sql
```

### Configuration
```
backend/src/app.py                      # Blueprint registered
backend/src/models/__init__.py           # Models exported
docs/NOTAIRE_SYSTEM.md                  # Full documentation
```

## Quick Usage Examples

### 1. Create a Notaire (Admin)
```python
from src.crud.notaires import create_notaire

notaire = create_notaire(
    db=db.session,
    utilisateur_id=123,
    etude_notariale="Étude Martin",
    numero_rpps="1234567890123",
    adresse_etude="10 Rue de Paris",
    code_postal_etude="75001",
    ville_etude="Paris",
    telephone="01.23.45.67.89",
    email_professionnel="contact@etudemARTIN.fr",
    zone_geographique={
        "villes": ["Paris", "Boulogne"],
        "codes_postaux": ["75001", "75002", "92100"]
    }
)
```

### 2. Create Transaction (Auto on Offer Accept)
```python
from src.crud.notaires import create_transaction_notaire

transaction = create_transaction_notaire(
    db=db.session,
    offre_id=10,
    annonce_id=5,
    vendeur_id=1,
    acheteur_id=2,
    prix_compromis=350000.00
)
# Status: "en_attente_selection"
```

### 3. Assign Notaire to Transaction
```python
from src.crud.notaires import assign_notaire_to_transaction

transaction = assign_notaire_to_transaction(
    db=db.session,
    transaction_notaire_id=1,
    notaire_id=45
)
# Status changes to: "en_attente_validation"
```

### 4. Notaire Validates Compromis
```python
from src.crud.notaires import validate_compromis

transaction = validate_compromis(
    db=db.session,
    transaction_notaire_id=1,
    notaire_id=45,
    commentaires="All documents correct"
)
# Status: "validee"
```

### 5. Notaire Requests Modifications
```python
from src.crud.notaires import request_modifications

transaction = request_modifications(
    db=db.session,
    transaction_notaire_id=1,
    notaire_id=45,
    modifications_demandees="Seller name correction line 5",
    delai_jours=5
)
# Status: "modifications_demandees"
```

### 6. List Notaires Available in Zone
```python
from src.crud.notaires import list_notaires_by_zone

notaires = list_notaires_by_zone(
    db=db.session,
    code_postal="75001",
    ville="Paris"
)
```

### 7. Get Notaire Dashboard
```python
from src.crud.notaires import list_transactions_for_notaire

transactions, total = list_transactions_for_notaire(
    db=db.session,
    notaire_id=45,
    statuts=['en_attente_validation', 'modifications_demandees'],
    skip=0,
    limit=20
)
```

## API Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/notaires` | Create notaire (admin) |
| GET | `/api/v1/notaires` | List notaires (filtered) |
| GET | `/api/v1/notaires/<id>` | Get notaire details |
| PUT | `/api/v1/notaires/<id>` | Update profile |
| GET | `/api/v1/notaires/<id>/stats` | Get statistics |
| POST | `/api/v1/notaires/transactions/<id>/assign` | Assign notaire |
| GET | `/api/v1/notaires/available-for-transaction/<id>` | Get available notaires |
| POST | `/api/v1/notaires/transactions/<id>/validate` | Validate compromis |
| POST | `/api/v1/notaires/transactions/<id>/request-modifications` | Request changes |
| POST | `/api/v1/notaires/transactions/<id>/reject` | Reject compromis |
| GET | `/api/v1/notaires/<id>/dashboard/pending` | Pending cases dashboard |
| GET | `/api/v1/notaires/transactions/<id>/history` | Get audit trail |

## Database Tables

```
notaires                    # Notaire profiles
notaire_specialisations     # M2M: notaire → specialization
transaction_notaire         # Links: transaction ↔ notaire
document_notaire            # Documents for transactions
historique_notaire          # Audit trail of actions
disponibilite_notaire       # Calendar availability
```

## Status Workflow

```
en_attente_selection
    ↓ assign_notaire()
en_attente_validation
    ├→ validate_compromis() → validee ✅
    ├→ request_modifications() → modifications_demandees (need revisions)
    └→ reject_compromis() → refusee ❌
```

## Integration with Phase 2 (Offres)

The notaire system integrates with Phase 2's offer system:

1. User creates and publishes offer (Offre)
2. Seller accepts offer → status = "acceptee"
3. **Notaire system triggered:**
   - TransactionNotaire created automatically
   - Notification sent to buyer: "Please select a notaire"
4. Buyer selects notaire from available list (zone-based)
5. Notaire assigned → status = "en_attente_validation"
6. Notaire validates or requests modifications
7. Transaction completed → Offre status updated

## Development Checklist

### To Run Backend Tests
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run Flask app
python backend/run_server.py

# Test notaire endpoint
curl http://localhost:5000/api/v1/notaires \
  -H "Authorization: Bearer <token>"
```

### To Create Test Data
```python
# backend/create_test_notaires.py (to be created)
from src.crud.notaires import create_notaire

# Creates 5-10 test notaires in Paris region
```

### Frontend Tasks
- [ ] Create `static/dashboard-notaire.html` (notaire workspace)
- [ ] Create notaire selection UI in offer acceptance flow
- [ ] Add real-time notifications on status changes
- [ ] Create transaction history timeline view
- [ ] Add calendar widget for availability blocking

## Important Notes

### Security
- All routes require JWT authentication
- Notaire actions can only be performed by assigned notaire
- History audit trail created for all actions
- Prepare for document encryption (Phase 3.1)

### Performance
- Notaire capacity limited (max_dossiers_simultanees = 10)
- SLA tracking prevents indefinite backlogs
- Indices optimize zone-based searches
- Pagination on all list endpoints

### RGPD Compliance
- Audit trail with timestamps
- User data linked to user accounts
- Document versioning through history
- Prepare for data retention policies (Phase 3.1)

## Troubleshooting

### "Notaire not found" error
- Verify notaire exists: `db.query(Notaire).filter_by(notaire_id=45).first()`
- Check `partenaire_actif = True`
- Verify utilisateur_id matches

### "Not authorized" error on validation
- Verify notaire.notaire_id == transaction.notaire_id
- Check user is authenticated

### Migration issues
- Run migrations in order (016 → 021)
- Check PostgreSQL user has ALTER TABLE permissions
- Verify foreign key constraints

## Next Steps (In Order)

1. ✅ Backend implementation (DONE)
2. ⏳ Frontend dashboard development
3. ⏳ Integration with offer workflow
4. ⏳ Notification system enhancement
5. ⏳ Document encryption & RGPD
6. ⏳ Testing & deployment

## Support

See full documentation: `/docs/NOTAIRE_SYSTEM.md`
