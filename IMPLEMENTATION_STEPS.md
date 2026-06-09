# 🚀 Prochaines Étapes Essentielles - Guide Pas à Pas

## 📋 Vue d'Ensemble des Tâches

Ce guide détaille les 3 prochaines étapes URGENTES pour que le système fonctionne en production.

---

## ÉTAPE 1️⃣: Implémenter le Stockage des Fichiers

### Problème Actuel
Les documents sont uploadés mais stockés avec des URLs **de placeholder**:
```
/uploads/annonces/{annonce_id}/documents/{type}_{timestamp}_{filename}
```

### Solutions (Choisir 1)

#### Option A: AWS S3 (Recommandé pour Production)

**Installation**
```bash
pip install boto3 python-dotenv
```

**Configuration (.env)**
```
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=eu-west-1
AWS_S3_BUCKET=immo2000-documents
```

**Code à ajouter dans documents_requis.py** (ligne ~115)
```python
import boto3
from botocore.exceptions import ClientError

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'eu-west-1')
)

def uploader_document(current_user, annonce_id, type_document, file):
    """Upload document to S3"""

    bucket = os.getenv('AWS_S3_BUCKET')
    timestamp = int(datetime.utcnow().timestamp())
    filename = f"annonce_{annonce_id}/{type_document}_{timestamp}_{secure_filename(file.filename)}"

    try:
        s3_client.upload_fileobj(
            file,
            bucket,
            filename,
            ExtraArgs={
                'ContentType': 'application/pdf',
                'ServerSideEncryption': 'AES256'  # Chiffrement
            }
        )

        url_document = f"s3://{bucket}/{filename}"

        # Créer accès temporaire (1 heure)
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': filename},
            ExpiresIn=3600
        )

        return url_document, presigned_url

    except ClientError as e:
        current_app.logger.error(f"Erreur S3: {str(e)}", exc_info=True)
        raise ValidationError(f"Erreur lors du stockage: {str(e)}")
```

#### Option B: Filesystem Local (Pour Développement)

**Configuration**
```python
UPLOAD_FOLDER = "/storage/documents"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
```

**Code** (ligne ~115 dans documents_requis.py)
```python
def uploader_document(current_user, annonce_id, type_document, file):
    """Upload document to local filesystem"""

    # Créer dossier si besoin
    folder = f"{UPLOAD_FOLDER}/annonce_{annonce_id}"
    os.makedirs(folder, exist_ok=True)

    timestamp = int(datetime.utcnow().timestamp())
    filename = f"{type_document}_{timestamp}_{secure_filename(file.filename)}"
    filepath = f"{folder}/{filename}"

    file.save(filepath)

    # Générer une URL relative
    url_document = f"/downloads/documents/annonce_{annonce_id}/{filename}"

    return url_document
```

**Route pour télécharger**
```python
@app.route('/downloads/documents/<path:filename>', methods=['GET'])
@token_required
def download_document(current_user, filename):
    """Télécharger document (vérifié sécurité)"""
    # Vérifier que c'est un notaire avec offre acceptée
    return send_from_directory(UPLOAD_FOLDER, filename)
```

### ✅ Tester

```bash
# 1. Uploader un document
curl -X POST http://localhost:5000/api/v1/annonces/1/documents-requis \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@document.pdf" \
  -F "type_document=titre_propriete"

# 2. Vérifier que url_document n'est plus un placeholder
curl http://localhost:5000/api/v1/annonces/1/documents-requis

# 3. Pour S3: vérifier dans AWS Console
# Pour Local: vérifier dans /storage/documents/
```

---

## ÉTAPE 2️⃣: Vérifier le Rôle Admin dans users table

### Problème Actuel
La route de validation vérifie:
```python
if current_user.get("role") != "admin":
    raise ForbiddenError("Seuls les administrateurs peuvent valider")
```

Mais il faut s'assurer que la table `utilisateurs` a une colonne `role`.

### Vérifier la Structure

```bash
# 1. Se connecter à PostgreSQL
psql -U postgres -d immo2000

# 2. Vérifier la table
\d utilisateurs

# 3. Chercher une colonne "role"
SELECT * FROM utilisateurs LIMIT 1;
```

### Si la colonne n'existe pas, l'ajouter

**Créer une migration**
```bash
flask db revision --autogenerate -m "add_role_column_to_users"
```

**Fichier de migration (migrations/versions/xxx_add_role.py)**
```python
def upgrade():
    op.add_column('utilisateurs', sa.Column('role', sa.String(50), default='user'))

def downgrade():
    op.drop_column('utilisateurs', 'role')
```

**Exécuter**
```bash
flask db upgrade
```

**Ajouter des rôles existants**
```sql
UPDATE utilisateurs SET role = 'user' WHERE role IS NULL;
UPDATE utilisateurs SET role = 'admin' WHERE email = 'admin@immo2000.com';
UPDATE utilisateurs SET role = 'notaire' WHERE notaire_id IS NOT NULL;
```

### ✅ Tester

```bash
# 1. Admin tente de valider
curl -X PUT http://localhost:5000/api/v1/documents-requis/1/valider \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accepte": true}'
# → Doit retourner 200 OK

# 2. Non-admin tente
curl -X PUT http://localhost:5000/api/v1/documents-requis/1/valider \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accepte": true}'
# → Doit retourner 403 Forbidden
```

---

## ÉTAPE 3️⃣: Tester Toutes les Routes de Sécurité

### Vue Admin (Sans URLs)

```bash
# Admin voit le statut SANS les URLs des fichiers
curl http://localhost:5000/api/v1/documents-requis/statut-admin/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Vérifier:
# ✅ "statut": "valide"
# ✅ "nombre_valides": 5
# ❌ "url_document" N'EXISTE PAS dans la réponse
```

### Accès Notaire (Avec Vérification Offre)

```bash
# Notaire tente d'accéder AVANT acceptation → 403
curl http://localhost:5000/api/v1/annonces/1/documents-requis/telecharger/titre_propriete \
  -H "Authorization: Bearer NOTAIRE_TOKEN"
# → "Aucune offre acceptée"

# APRÈS création offre acceptée:
curl http://localhost:5000/api/v1/annonces/1/documents-requis/telecharger/titre_propriete \
  -H "Authorization: Bearer NOTAIRE_TOKEN"
# → 200 OK avec "url_telechargement"
```

### Blocage Publication (Documents Manquants)

```bash
# Vendeur tente de publier SANS documents → 422
curl -X POST http://localhost:5000/api/v1/annonces/1/publier \
  -H "Authorization: Bearer VENDOR_TOKEN"
# → "Impossible de publier. Documents manquants: ..."

# APRÈS upload et validation de tous → 200
curl -X POST http://localhost:5000/api/v1/annonces/1/publier \
  -H "Authorization: Bearer VENDOR_TOKEN"
# → 200 OK, "statut": "publiée"
```

---

## 🔄 Workflow Complet de Test

### Scénario 1: Création et Upload Documents

```bash
# 1. Vendeur crée annonce
VENDOR_TOKEN="jwt_token_vendeur"
RESPONSE=$(curl -X POST http://localhost:5000/api/v1/annonces \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Appart 3P",
    "description": "Nice apartment",
    "prix": 250000,
    "surface": 75,
    "adresse": "123 rue de Paris",
    "code_postal": "75001",
    "ville": "Paris",
    "type_bien": "apartment",
    "nombre_pieces": 3
  }')

ANNONCE_ID=$(echo $RESPONSE | jq '.data.annonce_id')
echo "Annonce créée: $ANNONCE_ID"

# 2. Documents auto-initialisés
curl http://localhost:5000/api/v1/annonces/$ANNONCE_ID/documents-requis \
  -H "Authorization: Bearer $VENDOR_TOKEN"
# → Doit retourner 5 documents avec statut="manquant"

# 3. Vendeur upload un document
curl -X POST http://localhost:5000/api/v1/annonces/$ANNONCE_ID/documents-requis \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -F "file=@titre_propriete.pdf" \
  -F "type_document=titre_propriete"
# → Doit retourner 201 Created, statut="soumis"

# 4. Vérifier statut
curl http://localhost:5000/api/v1/annonces/$ANNONCE_ID/documents-requis/statut \
  -H "Authorization: Bearer $VENDOR_TOKEN"
# → peut_publier: false (1/5 documents)

# 5. Upload les 4 autres documents
for DOC in carte_identite pv_ag reglement_copropriete diagnostics; do
  curl -X POST http://localhost:5000/api/v1/annonces/$ANNONCE_ID/documents-requis \
    -H "Authorization: Bearer $VENDOR_TOKEN" \
    -F "file=@$DOC.pdf" \
    -F "type_document=$DOC"
done

# 6. Tenter publication (doit échouer: en attente validation)
curl -X POST http://localhost:5000/api/v1/annonces/$ANNONCE_ID/publier \
  -H "Authorization: Bearer $VENDOR_TOKEN"
# → 422 Error: "Documents manquants: ..."
```

### Scénario 2: Admin Valide Documents

```bash
# Admin voit le statut
ADMIN_TOKEN="jwt_admin"
curl http://localhost:5000/api/v1/documents-requis/statut-admin/$ANNONCE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Admin valide les documents
for DOC_ID in 1 2 3 4 5; do
  curl -X PUT http://localhost:5000/api/v1/documents-requis/$DOC_ID/valider \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"accepte": true}'
done

# Vendeur peut maintenant publier
curl -X POST http://localhost:5000/api/v1/annonces/$ANNONCE_ID/publier \
  -H "Authorization: Bearer $VENDOR_TOKEN"
# → 200 OK, statut="publiée"
```

### Scénario 3: Notaire Accède aux Documents

```bash
# Notaire tente avant offre acceptée → 403
NOTAIRE_TOKEN="jwt_notaire"
curl http://localhost:5000/api/v1/annonces/$ANNONCE_ID/documents-requis/telecharger/titre_propriete \
  -H "Authorization: Bearer $NOTAIRE_TOKEN"
# → Forbidden: "Aucune offre acceptée"

# Acheteur crée offre
BUYER_TOKEN="jwt_acheteur"
curl -X POST http://localhost:5000/api/v1/offres \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"annonce_id\": $ANNONCE_ID,
    \"prix_propose\": 240000
  }"

# Vendeur accepte offre
curl -X PUT http://localhost:5000/api/v1/offres/1/accepter \
  -H "Authorization: Bearer $VENDOR_TOKEN"

# Notaire peut maintenant accéder
curl http://localhost:5000/api/v1/annonces/$ANNONCE_ID/documents-requis/telecharger/titre_propriete \
  -H "Authorization: Bearer $NOTAIRE_TOKEN"
# → 200 OK avec "url_telechargement"
```

---

## 📝 Checklist d'Implémentation

### Phase 1: Stockage (URGENT)
- [ ] Choisir S3 ou Filesystem
- [ ] Installer dépendances (boto3 ou non)
- [ ] Configurer .env
- [ ] Tester upload
- [ ] Vérifier URLs retournées

### Phase 2: Sécurité (URGENT)
- [ ] Vérifier colonne "role" dans users
- [ ] Ajouter rôles si manquant
- [ ] Tester accès admin/notaire
- [ ] Tester rejection accès
- [ ] Vérifier logs d'erreur

### Phase 3: Workflow (IMPORTANT)
- [ ] Créer script test complet
- [ ] Tester création annonce → documents
- [ ] Tester vendeur → upload
- [ ] Tester admin → validation
- [ ] Tester publication bloquer
- [ ] Tester notaire → accès

### Phase 4: Production (RECOMMANDÉ)
- [ ] Chiffrement S3 AES-256
- [ ] Tokens presigned URLs (1h expiry)
- [ ] Audit trail des accès
- [ ] Rate limiting
- [ ] Scan antivirus

---

## 🆘 Troubleshooting

### Erreur: "role not found"
```bash
# Ajouter colonne role
flask db upgrade
# Ou manuellement:
ALTER TABLE utilisateurs ADD COLUMN role VARCHAR(50) DEFAULT 'user';
```

### Erreur: "S3 access denied"
```bash
# Vérifier credentials .env
echo $AWS_ACCESS_KEY_ID
# Vérifier permissions S3
# Vérifier bucket exists dans la région
```

### Documents ne s'uploadent pas
```bash
# Vérifier permissions dossier (Filesystem)
chmod 755 /storage/documents
# Vérifier logs
tail -f backend.log | grep -i upload
```

---

## 📚 Documentation Complète

Voir fichiers:
- `SECURITE_DOCUMENTS_ACCES.md` - Guide sécurité
- `docs/DOCUMENTS_REQUIS.md` - Endpoints complets
- `CURL_EXAMPLES.sh` - Exemples curl

**Vous êtes prêt à déployer! 🚀**
