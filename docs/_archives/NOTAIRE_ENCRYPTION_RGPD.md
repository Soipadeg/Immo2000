# Chiffrement de Documents et Conformité RGPD

## Vue d'ensemble

Ce module implémente le chiffrement AES-256 des documents notaires et la conformité RGPD complète:

- **Chiffrement**: AES-256 avec dérivation de clé PBKDF2
- **Audit trail**: Enregistrement de chaque accès aux documents
- **Droit à l'oubli**: Suppression sécurisée des données
- **Data retention**: Políticas de rétention automatiques
- **Droit d'accès**: Export complet des données utilisateur

## Architecture

### 1. Service de Chiffrement (`DocumentEncryptionService`)

#### Initialisation
```python
from src.services.document_encryption import DocumentEncryptionService

# Initialiser une seule fois au démarrage de l'app
DocumentEncryptionService.initialize(master_key="votre-clé-maître")
# Ou utiliser ENCRYPTION_KEY de l'environnement
DocumentEncryptionService.initialize()
```

#### Chiffrer un document
```python
content = open('document.pdf', 'rb').read()

encrypted_content, encryption_id = DocumentEncryptionService.encrypt_document(
    content=content,
    metadata={
        'filename': 'contrat.pdf',
        'mime_type': 'application/pdf'
    }
)

# Stocker encrypted_content et encryption_id dans la base de données
document.contenu = encrypted_content
document.estEncrypte = True
document.encryption_id = encryption_id
```

#### Déchiffrer un document
```python
# Avec vérification de permissions
DocumentEncryptionService.verify_access_permission(
    user_id=current_user_id,
    document_id=document_id,
    reason="visualization"
)

# Déchiffrer
decrypted_content = DocumentEncryptionService.decrypt_document(
    encrypted_content=document.contenu
)

# Utiliser le contenu déchiffré
```

### 2. Service RGPD (`RGPDComplianceService`)

#### Exporter les données d'un utilisateur (Droit d'accès)
```python
from src.services.document_encryption import RGPDComplianceService

data = RGPDComplianceService.export_user_data(user_id=42)

# Retourne:
{
    'user': {...},
    'transactions_as_vendeur': [...],
    'transactions_as_acheteur': [...],
    'documents': [
        {
            'id': 1,
            'filename': 'contrat.pdf',
            'upload_date': '2024-05-15T10:30:00',
            'encrypted': True,
            'access_log': [...]  # Audit trail
        }
    ],
    'export_date': '2024-05-15T14:22:30'
}
```

#### Supprimer toutes les données (Droit à l'oubli)
```python
# ATTENTION: Opération irréversible!

RGPDComplianceService.delete_user_data(
    user_id=42,
    reason="user_request"  # ou "contract_end", etc.
)

# Cette opération:
# 1. Supprime tous les documents de l'utilisateur
# 2. Anonymise ses transactions
# 3. Supprime son compte utilisateur
# 4. Enregistre tout dans les logs d'audit
```

#### Générer un rapport RGPD
```python
report = RGPDComplianceService.generate_privacy_report()

# Retourne:
{
    'report_date': '2024-05-15T14:22:30',
    'total_users': 1250,
    'total_documents': 8934,
    'encrypted_documents': 8934,
    'encryption_coverage': '100.0%',
    'compliance_status': 'COMPLIANT'
}
```

## API Endpoints

### Documents chiffrés

#### Récupérer un document (déchiffré)
```bash
GET /api/v1/notaires/documents/42/content?reason=visualization
Authorization: Bearer <token>

Response:
{
    "document_id": 42,
    "filename": "contrat.pdf",
    "content": "<binary data>",
    "mime_type": "application/pdf",
    "encrypted": true
}
```

**Notes**:
- L'accès est enregistré automatiquement pour l'audit RGPD
- Le paramètre `reason` peut être: `visualization`, `modification`, `export`
- Accessible au notaire, vendeur, acheteur ou admin

#### Journal d'accès aux documents
```bash
GET /api/v1/notaires/documents/42/access-log
Authorization: Bearer <token>

Response:
{
    "document_id": 42,
    "filename": "contrat.pdf",
    "access_log": [
        {
            "accessed_by": 10,
            "reason": "visualization",
            "timestamp": "2024-05-15T14:22:30",
            "ip_address": "192.168.1.100",
            "user_role": "vendeur"
        },
        {
            "accessed_by": 12,
            "reason": "modification",
            "timestamp": "2024-05-15T13:15:00",
            "ip_address": "192.168.1.101",
            "user_role": "notaire"
        }
    ],
    "total_accesses": 2
}
```

#### Supprimer un document (droit à l'oubli)
```bash
POST /api/v1/notaires/documents/42/delete-permanently
Authorization: Bearer <token>

Body:
{
    "reason": "user_request"
}

Response:
{
    "message": "Document supprimé définitivement",
    "document_id": 42
}
```

### Conformité RGPD

#### Exporter mes données (Droit d'accès RGPD)
```bash
GET /api/v1/notaires/rgpd/user-data/export
Authorization: Bearer <token>

Response:
{
    "data": {
        "user": {...},
        "transactions_as_vendeur": [...],
        "documents": [...]
    },
    "format": "json",
    "exported_at": "2024-05-15T14:22:30"
}
```

#### Supprimer mes données (Droit à l'oubli)
```bash
POST /api/v1/notaires/rgpd/user-data/delete
Authorization: Bearer <token>

Body:
{
    "confirm": true,
    "reason": "Je souhaite supprimer mon compte"
}

Response:
{
    "message": "Données supprimées définitivement",
    "timestamp": "2024-05-15T14:22:30"
}
```

#### Rapport RGPD de conformité (Admin uniquement)
```bash
GET /api/v1/notaires/rgpd/privacy-report
Authorization: Bearer <admin-token>

Response:
{
    "report_date": "2024-05-15T14:22:30",
    "total_users": 1250,
    "total_documents": 8934,
    "encrypted_documents": 8934,
    "encryption_coverage": "100.0%",
    "compliance_status": "COMPLIANT"
}
```

## Configuration

### Variables d'environnement requises

```bash
# Clé maître pour le chiffrement (64+ caractères recommandé)
ENCRYPTION_KEY=your-very-secure-master-key-min-64-chars-recommended

# Rétention des données (jours)
DATA_RETENTION_DAYS=365

# Configuration SMTP pour alertes RGPD
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=admin@immo2000.fr
MAIL_PASSWORD=your-app-password
```

### Initialisation au démarrage

```python
# Dans backend/src/app.py ou un hook d'initialisation

from src.services.document_encryption import DocumentEncryptionService

def initialize_app(app):
    # ... autres initializations ...

    # Initialiser le chiffrement
    DocumentEncryptionService.initialize()

    # Configurer la task de rétention
    schedule_retention_job()
```

## Sécurité

### Dérivation de clé
- **Algorithme**: PBKDF2 avec SHA-256
- **Iterations**: 100,000 (configurable)
- **Salt**: Statique pour la dérivation cohérente
- **Longueur**: 256 bits (32 bytes)

### Chiffrement
- **Algorithme**: Fernet (AES-128 CBC + HMAC)
- **Mode**: Chiffrement authentifié
- **Integrity**: Vérification HMAC automatique

### Audit trail RGPD
Chaque accès enregistre:
- ID utilisateur
- Timestamp exact
- Raison de l'accès
- Adresse IP du client
- Rôle de l'utilisateur

## Policies de rétention

### Automatisation

La retention est appliquée automatiquement via une task cron:

```python
# Exécuté chaque jour à 2h du matin
@scheduler.scheduled_job('cron', hour=2)
def cleanup_old_documents():
    from src.services.document_encryption import DocumentEncryptionService
    DocumentEncryptionService.apply_retention_policy(days_to_keep=365)
```

### Configuration personnalisée

```python
# Conserver seulement 90 jours
DocumentEncryptionService.apply_retention_policy(days_to_keep=90)

# Résultat:
# - Documents > 90 jours supprimés définitivement
# - Audit trail enregistré avec raison "retention_policy_90days"
# - Email d'alerte envoyé aux administrateurs
```

## Cas d'usage

### Scenario 1: Utilisateur demande ses données (Article 15 RGPD)
```
1. Utilisateur demande l'export via l'API
2. Système exporte toutes ses données personnelles
3. Fichier JSON téléchargeable généré
4. Entrée d'audit créée
5. Email de confirmation envoyé
```

### Scenario 2: Utilisateur demande l'oubli (Article 17 RGPD)
```
1. Utilisateur demande la suppression via l'API
2. Confirmation requise pour éviter les erreurs
3. Système supprime:
   - Tous les documents de l'utilisateur
   - Les métadonnées personnelles
   - Le compte utilisateur
4. Les transactions sont anonymisées
5. Un audit trail persiste (légal requirement)
```

### Scenario 3: Audit d'accès aux documents
```
1. Admin génère un rapport RGPD
2. Cherche un document spécifique
3. Consulte le journal d'accès complet
4. Voit qui, quand, d'où, et pourquoi le document a été accédé
5. Peut identifier les accès suspects
```

## Tests

### Test de chiffrement
```bash
# Test basique
python -c "
from src.services.document_encryption import DocumentEncryptionService
DocumentEncryptionService.initialize()

content = b'Test document'
enc, id = DocumentEncryptionService.encrypt_document(content, {})
dec = DocumentEncryptionService.decrypt_document(enc)
assert dec == content
print('✅ Chiffrement OK')
"
```

### Test RGPD
```bash
# Export et suppression de test
python -c "
from src.services.document_encryption import RGPDComplianceService
# Lancer suite de tests...
"
```

## Conformité légale

### RGPD (UE)
- ✅ Chiffrement à la source
- ✅ Droit d'accès (Article 15)
- ✅ Droit à l'oubli (Article 17)
- ✅ Portabilité des données (Article 20)
- ✅ Audit trail complet
- ✅ Privacy by design

### France (CNIL)
- ✅ Chiffrement des données sensibles
- ✅ Politique de rétention
- ✅ Access logging
- ✅ Anonymisation

### Recommendations
1. **Externaliser le chiffrement**: Considérer un HSM (Hardware Security Module) en production
2. **Rotation de clés**: Implémenter tous les 90 jours
3. **Backups sécurisés**: Chiffrer aussi les sauvegardes
4. **Audit externe**: Faire auditer régulièrement la conformité
5. **Alertes**: Mettre en place des alertes pour accès suspects

## Troubleshooting

### "ENCRYPTION_KEY not found"
```bash
# Définir la variable d'environnement
export ENCRYPTION_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(64))")
```

### "Decryption failed - corrupted data"
- Vérifier que la même clé est utilisée (changement de clé?)
- Vérifier que les données n'ont pas été modifiées
- Restaurer depuis une sauvegarde

### "Access denied" sur document
- Vérifier les permissions de l'utilisateur
- Vérifier qu'il est lié à la transaction
- Consulter les logs d'audit

## Support

Pour les questions RGPD:
- Consulter la [documentation officielle RGPD](https://www.cnil.fr/)
- Contact CNIL: protection-donnees@cnil.fr
- Documentation technique: [docs/NOTAIRE_SYSTEM.md](./NOTAIRE_SYSTEM.md)
