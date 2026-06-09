# Système de Notifications Notaires - Documentation

## Vue d'ensemble

Le système de notifications notaires gère l'envoi automatique de notifications (emails et in-app) lors d'événements clés dans le workflow des transactions notaires.

## Architecture

### 1. Service de Notifications (`src/services/notaire_notifications.py`)

#### Types d'événements supportés
```python
class NotaireEventType(str, Enum):
    NOTAIRE_ASSIGNED = "notaire_assigned"
    NOTAIRE_VALIDATION_REQUESTED = "notaire_validation_requested"
    COMPROMIS_VALIDATED = "compromis_validated"
    MODIFICATIONS_REQUESTED = "modifications_requested"
    COMPROMIS_REJECTED = "compromis_rejected"
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_VALIDATED = "document_validated"
```

### 2. Méthodes principales du service

#### `notify_notaire_assigned()`
**Déclencheur**: Quand un notaire est assigné à une transaction
**Destinataires**: Notaire assigné
**Contenu**:
- Email avec lien vers son dashboard
- Notification in-app avec détails de la transaction

```python
NotaireNotificationService.notify_notaire_assigned(
    notaire_id=1,
    transaction_id=42,
    transaction_data={
        'prix_compromis': 350000.00,
        'vendeur_name': 'Jean Dupont',
        'acheteur_name': 'Marie Martin',
        'bien': 'Immeuble Paris 75001'
    }
)
```

#### `notify_compromis_validated()`
**Déclencheur**: Quand un notaire valide le compromis
**Destinataires**: Vendeur et acheteur
**Contenu**:
- Email de confirmation
- Notification in-app avec statut "Validé"

```python
NotaireNotificationService.notify_compromis_validated(
    transaction_id=42,
    notaire_name="Étude Dupont et Associés",
    users=[
        {'user_id': 10, 'email': 'vendeur@email.fr', 'name': 'Jean Dupont'},
        {'user_id': 11, 'email': 'acheteur@email.fr', 'name': 'Marie Martin'}
    ]
)
```

#### `notify_modifications_requested()`
**Déclencheur**: Quand un notaire demande des modifications
**Destinataires**: Vendeur et acheteur
**Contenu**:
- Email détaillant les modifications requises
- Notification in-app avec délai limite

```python
NotaireNotificationService.notify_modifications_requested(
    transaction_id=42,
    notaire_name="Étude Dupont et Associés",
    modifications="Erreur sur le nom du vendeur - doit être Jean-Paul Dupont",
    users=[...]
)
```

#### `notify_compromis_rejected()`
**Déclencheur**: Quand un notaire refuse le compromis
**Destinataires**: Vendeur et acheteur
**Contenu**:
- Email avec raison du rejet
- Notification in-app avec détails

```python
NotaireNotificationService.notify_compromis_rejected(
    transaction_id=42,
    notaire_name="Étude Dupont et Associés",
    raison="Document fiscaux manquants",
    users=[...]
)
```

### 3. Gestion des notifications utilisateur

#### `get_user_notifications()`
Récupère toutes les notifications d'un utilisateur

```python
notifications = NotaireNotificationService.get_user_notifications(
    user_id=10,
    notaire_events_only=True  # Filtrer seulement notaires
)
# Retourne: [{'id': 1, 'title': '...', 'message': '...', 'read': False, ...}, ...]
```

#### `mark_notification_as_read()`
Marquer une notification comme lue

```python
NotaireNotificationService.mark_notification_as_read(notification_id=5)
```

## Intégration dans les CRUD

### Automatisation des notifications

Les notifications sont envoyées **automatiquement** lors des opérations CRUD:

```python
# Lors de l'assignation d'un notaire
def assign_notaire_to_transaction(db, transaction_id, notaire_id):
    # ... logique métier ...

    # 📧 Envoyer notification automatiquement
    NotaireNotificationService.notify_notaire_assigned(...)

    return transaction
```

**Avantages**:
- Pas d'appels manuels nécessaires
- Cohérent et fiable
- Traçabilité complète des événements

## API Endpoints

### Récupérer les notifications de l'utilisateur
```
GET /api/v1/notaires/notifications/user?notaire_only=true
Authorization: Bearer <token>

Response:
{
    "notifications": [
        {
            "id": 1,
            "title": "Nouveau Dossier Assigné",
            "message": "Vous avez un nouveau dossier de validation",
            "read": false,
            "created_at": "2024-05-15T10:30:00",
            "data": {
                "event_type": "notaire_assigned",
                "related_id": 42
            }
        }
    ],
    "total": 1
}
```

### Marquer notification comme lue
```
POST /api/v1/notaires/notifications/5/read
Authorization: Bearer <token>

Response:
{
    "message": "Notification marquée comme lue",
    "notification_id": 5
}
```

### Récupérer notifications d'une transaction
```
GET /api/v1/notaires/transactions/42/notifications
Authorization: Bearer <token>

Response:
{
    "notifications": [
        {
            "id": 1,
            "title": "✅ Compromis Validé",
            "message": "Votre compromis a été validé par Étude Dupont",
            "created_at": "2024-05-15T10:30:00",
            "read": false
        }
    ],
    "total": 1
}
```

## Modèles d'email

Le système utilise des templates email localisés:

```
backend/src/templates/emails/notaire/
├── notaire_assignment.html      # Assignation
├── compromis_validated.html     # Validation
├── modifications_requested.html # Modifications
├── compromis_rejected.html      # Rejet
└── email_base.html              # Template de base
```

**Variables disponibles dans les templates**:
- `notaire_name`: Nom de l'étude notariale
- `user_name`: Nom de l'utilisateur
- `transaction_id`: ID de la transaction
- `prix`: Prix du compromis
- `modifications`: Détails des modifications
- `raison`: Raison du rejet
- `action_url`: Lien vers l'action à effectuer

## Stockage des notifications

### Table `notifications`
```sql
- notification_id (PK)
- utilisateur_id (FK)
- titre
- message
- type_notification (notaire_event, etc.)
- donnees (JSON) -- Contient: event_type, related_id, created_at
- lu (boolean)
- date_creation
- date_lecture
```

## Gestion des erreurs

Le service enveloppe tous les appels dans try-except pour éviter les interruptions:

```python
try:
    NotaireNotificationService.notify_notaire_assigned(...)
except Exception as e:
    logger.warning(f"Erreur lors de l'envoi de notification: {str(e)}")
    # Continue quand même le workflow
```

**Bonne pratique**: Les erreurs d'envoi de notifications ne doivent jamais bloquer les opérations métier.

## Configuration

### Variables d'environnement requises
```bash
# Email
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Base de données (notifications)
DATABASE_URL=postgresql://user:pass@localhost/immo2000

# URLs frontend
FRONTEND_URL=http://localhost:3000
```

## Cas d'usage

### Scénario 1: Assignation d'un notaire
```
1. Admin assigne notaire via API
   POST /api/v1/notaires/transactions/42/assign
2. Fonction assign_notaire_to_transaction() appelée
3. Service notifie automatiquement:
   - Email au notaire avec lien vers son dashboard
   - Notification in-app au notaire
4. Notaire reçoit notification et peut accéder à la transaction
```

### Scénario 2: Validation du compromis
```
1. Notaire valide compromis via son dashboard
   POST /api/v1/notaires/transactions/42/validate
2. Fonction validate_compromis() appelée
3. Service notifie automatiquement:
   - Email au vendeur: "Compromis validé"
   - Email à l'acheteur: "Compromis validé"
   - Notifications in-app pour les deux
4. Vendeur/acheteur voient l'update dans leur dashboard
```

### Scénario 3: Demande de modifications
```
1. Notaire demande modifications
   POST /api/v1/notaires/transactions/42/request-modifications
2. Fonction request_modifications() appelée
3. Service notifie automatiquement:
   - Email au vendeur avec détails des modifs
   - Email à l'acheteur
   - Notifications in-app avec délai limite
4. Les utilisateurs doivent réagir avant le délai limite
```

## Tests

### Test manuel avec curl
```bash
# Récupérer notifications
curl -X GET http://localhost:5000/api/v1/notaires/notifications/user \
  -H "Authorization: Bearer YOUR_TOKEN"

# Marquer comme lue
curl -X POST http://localhost:5000/api/v1/notaires/notifications/1/read \
  -H "Authorization: Bearer YOUR_TOKEN"

# Notifications d'une transaction
curl -X GET http://localhost:5000/api/v1/notaires/transactions/42/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Améliorations futures

1. **WebSockets**: Notifications en temps réel
2. **SMS**: Alertes critiques par SMS
3. **Slack/Teams**: Intégration avec outils collaboratifs
4. **Templates personnalisés**: Par notaire/région
5. **Analytics**: Dashboard de statistiques d'envoi
6. **Rate limiting**: Éviter les déluges de notifications

## Troubleshooting

### "email-validator not installed"
```bash
pip install email-validator
```

### "Notification table not found"
```bash
# Vérifier que les migrations sont executées
python run_migrations_and_tests.py
```

### Emails non reçus
- Vérifier les logs: `tail -f logs/app.log`
- Vérifier la config SMTP
- Vérifier que le service EmailService fonctionne

## Support

Pour les problèmes avec le système de notifications:
1. Vérifier les logs: `backend/logs/`
2. Consulter la documentation des modèles: [docs/NOTAIRE_SYSTEM.md](./NOTAIRE_SYSTEM.md)
3. Lancer les tests: `python test_notaire_system.py`
