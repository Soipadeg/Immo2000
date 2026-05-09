# 📸 Dossier Images

Ce dossier est ignoré par git car il contient des fichiers trop volumineux.

## 🚀 Pour stocker les images en production:

### Option 1: AWS S3 (Recommandé)
```python
# backend/src/services/storage.py
import boto3

s3 = boto3.client('s3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

s3.upload_file('image.jpg', 'immo2000-bucket', 'images/image.jpg')
```

### Option 2: Cloudinary
```python
from cloudinary.uploader import upload
url = upload('image.jpg')['secure_url']
```

### Option 3: Local avec serveur CDN (nginx)
```nginx
location /images/ {
    alias /var/www/immo2000/uploads/;
    expires 30d;
}
```

## 📁 Structure locale (dev)

```
images/
├── [images téléchargées pendant le développement]
└── .gitkeep
```

## ⚙️ Configuration Recommandée

1. **Développement**: Stocker localement dans ce dossier
2. **Staging/Production**: Utiliser S3 ou Cloudinary
3. **Ne pas committer** les images dans git

---

Voir `docs/guides/IMAGES_OPTIMIZATION.md` pour les détails techniques.
