"""
Système de Documents Obligatoires pour Mise en Ligne d'Annonce
==============================================================

## 📋 Vue d'Ensemble

Les vendeurs doivent fournir 5 documents obligatoires pour publier une annonce:
1. **Titre de propriété** (titre_propriete)
2. **Carte nationale d'identité du/des vendeur(s)** (carte_identite)
3. **3 derniers PV d'AG** - Procès verbal d'assemblée générale (pv_ag)
4. **Règlement de copropriété** (reglement_copropriete)
5. **Diagnostics Techniques** (diagnostics)

## 🏗️ Architecture

### Modèles de Données

**DocumentRequis** (Table: `documents_requis`)
- `document_requis_id`: Clé primaire
- `annonce_id`: FK vers annonces
- `type_document`: Type du document (enum)
- `statut`: Statut du document
  - `manquant`: Document non encore uploadé
  - `soumis`: Document uploadé, en attente de validation
  - `valide`: Document approuvé par admin
  - `rejete`: Document rejeté (avec motif_rejet)
- `url_document`: URL du fichier stocké
- `taille`: Taille du fichier en bytes
- `mime_type`: Type MIME (généralement "application/pdf")
- `motif_rejet`: Raison du rejet (si applicable)
- `date_submission`: Date d'upload du document
- `date_validation`: Date de validation par admin

### Routes API

#### 1. Upload un Document
```
POST /api/v1/annonces/{annonce_id}/documents-requis
Content-Type: multipart/form-data
Authorization: Bearer {token}

Parameters:
- file (fichier): Document PDF à uploader
- type_document (form): Type du document

Response 201:
{
  "success": true,
  "message": "Document titre_propriete uploadé avec succès",
  "document": {
    "document_requis_id": 123,
    "annonce_id": 456,
    "type_document": "titre_propriete",
    "statut": "soumis",
    "url_document": "/uploads/annonces/456/documents/...",
    "taille": 1024000,
    "mime_type": "application/pdf",
    "date_submission": "2026-06-09T12:00:00Z"
  }
}
```

#### 2. Lister les Documents d'une Annonce
```
GET /api/v1/annonces/{annonce_id}/documents-requis

Response 200:
{
  "success": true,
  "annonce_id": 456,
  "documents": [
    {
      "document_requis_id": 123,
      "type_document": "titre_propriete",
      "statut": "valide",
      "url_document": "/uploads/annonces/456/...",
      "date_submission": "2026-06-09T10:00:00Z"
    },
    ...
  ],
  "count": 5
}
```

#### 3. Vérifier le Statut des Documents (Important!)
```
GET /api/v1/annonces/{annonce_id}/documents-requis/statut

Response 200:
{
  "success": true,
  "annonce_id": 456,
  "peut_publier": false,
  "message": "Documents manquants: carte_identite, pv_ag",
  "documents": [...],
  "tous_valides": false,
  "nombre_valides": 3,
  "total_requis": 5,
  "manquants": ["carte_identite", "pv_ag"],
  "rejetes": [
    {
      "type": "diagnostics",
      "motif": "Fichier illisible, veuillez réuploader"
    }
  ]
}
```

#### 4. Valider un Document (ADMIN)
```
PUT /api/v1/documents-requis/{doc_id}/valider
Authorization: Bearer {admin_token}

Body:
{
  "accepte": true,
  "motif_rejet": null
}

Ou pour rejeter:
{
  "accepte": false,
  "motif_rejet": "Fichier illisible, veuillez réuploader"
}
```

#### 5. Supprimer/Réinitialiser un Document
```
DELETE /api/v1/documents-requis/{doc_id}
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Document supprimé. Vous pouvez le re-uploader."
}
```

## 🔄 Flux d'Intégration avec les Annonces

### Créer une Annonce et Uploader les Documents

```python
# 1. Vendeur crée une annonce (brouillon)
POST /api/v1/annonces
Body: {
  "titre": "Appartement 3 pièces",
  "description": "...",
  ...
}
Response: annonce_id = 456

# 2. Documents sont automatiquement initialisés (via app.py)
# Les 5 documents sont créés avec statut "manquant"

# 3. Vendeur upload les documents
POST /api/v1/annonces/456/documents-requis
- file: titre_propriete.pdf
- type_document: titre_propriete

POST /api/v1/annonces/456/documents-requis
- file: carte_identite.pdf
- type_document: carte_identite

... (répéter pour les 5 documents)

# 4. Vendeur vérifie le statut
GET /api/v1/annonces/456/documents-requis/statut
Response: {
  "peut_publier": true,
  "nombre_valides": 5,
  "tous_valides": true
}

# 5. Vendeur publie l'annonce
PUT /api/v1/annonces/456
Body: {
  "statut": "publiee"
}
```

## 🛡️ Workflow de Validation Admin

```
1. Vendeur upload document → statut = "soumis"
2. Admin vérifie le document
3. Si valide:
   PUT /api/v1/documents-requis/{id}/valider
   Body: {"accepte": true}
   → statut = "valide"

4. Si invalide:
   PUT /api/v1/documents-requis/{id}/valider
   Body: {
     "accepte": false,
     "motif_rejet": "Raison du rejet"
   }
   → statut = "rejete"
   → Vendeur doit re-uploader le document
```

## 🚀 Intégration Frontend

### Composant React pour Upload

```jsx
// DocumentUploadForm.jsx
import { useState } from 'react';

export default function DocumentUploadForm({ annonce_id }) {
  const [selectedDoc, setSelectedDoc] = useState('titre_propriete');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);

  const types = {
    'titre_propriete': 'Titre de propriété',
    'carte_identite': 'Carte nationale d\'identité',
    'pv_ag': 'Procès verbaux d\'AG (3 derniers)',
    'reglement_copropriete': 'Règlement de copropriété',
    'diagnostics': 'Diagnostics Techniques'
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type_document', selectedDoc);

    try {
      const response = await fetch(
        `/api/v1/annonces/${annonce_id}/documents-requis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatus({ type: 'success', message: data.message });
        setFile(null);
      } else {
        setStatus({ type: 'error', message: 'Erreur lors de l\'upload' });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <select value={selectedDoc} onChange={(e) => setSelectedDoc(e.target.value)}>
        {Object.entries(types).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Upload en cours...' : 'Upload'}
      </button>

      {status && (
        <div style={{ color: status.type === 'success' ? 'green' : 'red' }}>
          {status.message}
        </div>
      )}
    </div>
  );
}
```

### Composant pour Vérifier le Statut

```jsx
// DocumentStatusCheck.jsx
import { useEffect, useState } from 'react';

export default function DocumentStatusCheck({ annonce_id }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const response = await fetch(
        `/api/v1/annonces/${annonce_id}/documents-requis/statut`
      );
      const data = await response.json();
      setStatus(data);
      setLoading(false);
    };

    fetchStatus();
  }, [annonce_id]);

  if (loading) return <div>Chargement...</div>;
  if (!status) return <div>Erreur</div>;

  return (
    <div>
      <h3>Statut des Documents</h3>

      {status.peut_publier ? (
        <div style={{ color: 'green' }}>
          ✓ Tous les documents sont valides!
          Vous pouvez publier votre annonce.
        </div>
      ) : (
        <div style={{ color: 'orange' }}>
          ⚠ Vous devez uploader les documents manquants avant de publier.
        </div>
      )}

      <p>Documents valides: {status.nombre_valides}/{status.total_requis}</p>

      {status.manquants.length > 0 && (
        <div>
          <h4>Documents manquants:</h4>
          <ul>
            {status.manquants.map(doc => <li key={doc}>{doc}</li>)}
          </ul>
        </div>
      )}

      {status.rejetes.length > 0 && (
        <div style={{ color: 'red' }}>
          <h4>Documents rejetés:</h4>
          <ul>
            {status.rejetes.map(doc => (
              <li key={doc.type}>
                {doc.type}: {doc.motif}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## ✅ Checklist Implémentation

- [x] Créer le modèle `DocumentRequis`
- [x] Créer les CRUD operations
- [x] Créer les routes API
- [x] Enregistrer le blueprint dans app.py
- [x] Créer la migration Alembic
- [ ] Tester les routes avec Postman/curl
- [ ] Intégrer les composants React frontend
- [ ] Ajouter la validation lors de la publication d'annonce
- [ ] Implémenter le stockage des fichiers (S3 ou local)
- [ ] Ajouter la vérification du rôle admin pour valider les documents
- [ ] Créer une interface admin pour valider/rejeter les documents
- [ ] Ajouter les notifications aux vendeurs (document rejeté, validé, etc.)

## 🔧 Prochaines Étapes

1. **Exécuter la migration:**
   ```bash
   flask db upgrade
   ```

2. **Tester les routes:**
   ```bash
   # Upload un document
   curl -X POST http://localhost:5000/api/v1/annonces/1/documents-requis \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@titre_propriete.pdf" \
     -F "type_document=titre_propriete"

   # Vérifier le statut
   curl http://localhost:5000/api/v1/annonces/1/documents-requis/statut
   ```

3. **Implémenter le stockage des fichiers** (actuellement utilise des URLs de placeholder)

4. **Ajouter la vérification admin** pour valider les documents

5. **Intégrer le frontend** avec les composants React
"""

# Fichier de documentation - Pas de code Python ici
