# Immo2000 - 4 Prochaines Étapes Détaillées

## 1️⃣ CENTRALISER LES APPELS API (High Priority)

### 🎯 Objectif
Éliminer les appels axios bruts et faire passer **TOUS** les appels API par les services centralisés dans `api.js`

### 📋 Problème Actuel

**SimulateurPret.jsx (ligne 57)** - ❌ Axios brut
```javascript
const response = await axios.post(`${API_BASE_URL}/simulateur-pret`, data, {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

**MatchingPage.jsx** - ❌ Axios brut (alternative)
```javascript
const response = await apiClient.post('/matching', {...})
```

**Chatbot.jsx (ligne 55)** - ❌ fetch() au lieu d'axios
```javascript
const response = await fetch('/api/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
});
```

### ✅ Solution

#### Étape 1.1: Ajouter les services manquants dans api.js

```javascript
// Service du simulateur de prêt
export const simulateurApi = {
  calculate: (data) =>
    apiClient.post('/simulateur-pret', {
      revenu_mensuel_net: data.revenu_mensuel_net,
      apport: data.apport,
      taux_interet: data.taux_interet,
      duree_ans: data.duree_ans,
      taux_assurance: data.taux_assurance,
    }),

  getInfo: () => apiClient.get('/simulateur-pret/info'),
};

// Service du chatbot
export const chatbotApi = {
  sendMessage: (message, sessionId = null, userId = null) =>
    apiClient.post('/chat', {
      message,
      session_id: sessionId,
      user_id: userId,
    }),

  health: () => apiClient.get('/chat/health'),
};
```

#### Étape 1.2: Mettre à jour SimulateurPret.jsx

**Avant:**
```javascript
const response = await axios.post(`${API_BASE_URL}/simulateur-pret`, data, {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

**Après:**
```javascript
import { simulateurApi } from '../services/api';

// ...

const response = await simulateurApi.calculate(payload);
```

#### Étape 1.3: Mettre à jour Chatbot.jsx

**Avant:**
```javascript
const response = await fetch('/api/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
});
const data = await response.json();
```

**Après:**
```javascript
import { chatbotApi } from '../services/api';

// ...

try {
  const response = await chatbotApi.sendMessage(trimmedInput, sessionId, userId);
  const data = response.data;
  // ... rest of logic
} catch (err) {
  // error handling
}
```

#### Étape 1.4: Vérifier MatchingPage.jsx

Vérifier que la route matching utilise `matchingApi` correctement (elle existe déjà dans api.js)

### 🎁 Bénéfices
- ✅ Gestion centralisée du JWT dans les interceptors
- ✅ Gestion d'erreurs uniforme
- ✅ Pas de duplication de en-têtes
- ✅ Plus facile à tester et déboguer
- ✅ Respects du pattern "Single Responsibility"

### 📈 Complexité: **BASSE** ⭐

**Fichiers à modifier:** 3
- api.js - Ajouter 2 services (5 min)
- SimulateurPret.jsx - Remplacer axios (5 min)
- Chatbot.jsx - Remplacer fetch (5 min)

---

## 2️⃣ INTÉGRER LE SYSTÈME D'IMAGES (High Priority)

### 🎯 Objectif
- ✅ Permettre upload d'images
- ✅ Afficher les images optimisées (thumbnails)
- ✅ Gérer les variantes d'images

### 📋 État Actuel

**Backend:**
- ✅ [POST /images/upload](backend/src/routes/images.py#L31)
- ✅ [GET /images/{id}](backend/src/routes/images.py#L87)
- ✅ [POST /images/{id}/regenerate](backend/src/routes/images.py#L124)
- ✅ Thumbnail generator exists

**Frontend:**
- ❌ Pas d'upload UI
- ⚠️ Images uses fallback URLs (placeholder)
- ❌ Pas de gestion des thumbnails

### ✅ Solution

#### Étape 2.1: Créer ImageUploadComponent

Créer [frontend/src/components/ImageUpload.jsx](frontend/src/components/ImageUpload.jsx)

```javascript
/**
 * Composant d'upload d'images
 * Utilisé dans VendeurDashboard pour créer/éditer annonces
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Image as ImageIcon,
  Close as CloseIcon,
  Grid,
  IconButton,
  Alert,
} from '@mui/material';
import axios from 'axios';

const ImageUploadComponent = ({ annonceId, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const MAX_FILES = 10;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validation
    if (files.length + selectedFiles.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} images autorisées`);
      return;
    }

    // Vérifier taille
    for (let file of selectedFiles) {
      if (file.size > MAX_SIZE) {
        setError(`L'image ${file.name} est trop voluminense (max 10MB)`);
        return;
      }
    }

    // Ajouter fichiers et preview
    setFiles([...files, ...selectedFiles]);

    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!annonceId) {
      setError('ID annonce manquant');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();

      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/images/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          params: { annonce_id: annonceId },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        }
      );

      setFiles([]);
      setPreviews([]);
      setUploadProgress(0);

      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📸 Ajouter des photos
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Zone de drop */}
        <Box
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            backgroundColor: '#f9f9f9',
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': {
              borderColor: '#1976d2',
              backgroundColor: '#f0f7ff',
            },
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileSelect({ target: { files: e.dataTransfer.files } });
          }}
        >
          <ImageIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
          <Typography>
            Glissez-déposez vos images ou{' '}
            <label style={{ color: '#1976d2', cursor: 'pointer', fontWeight: 'bold' }}>
              cliquez pour sélectionner
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Max {MAX_FILES} images, 10MB chacune
          </Typography>
        </Box>

        {/* Previews */}
        {previews.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {previews.map((preview, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Box sx={{ position: 'relative' }}>
                  <img
                    src={preview}
                    alt={`Preview ${index}`}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: 2,
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveFile(index)}
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: -12,
                      backgroundColor: '#f44336',
                      color: 'white',
                      '&:hover': { backgroundColor: '#d32f2f' },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Progress bar */}
        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="caption" color="text.secondary">
              {uploadProgress}%
            </Typography>
          </Box>
        )}

        {/* Upload button */}
        {previews.length > 0 && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={uploading}
            sx={{ mt: 2 }}
            fullWidth
          >
            {uploading ? 'Upload en cours...' : `Uploader ${previews.length} image(s)`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageUploadComponent;
```

#### Étape 2.2: Créer ImageGalleryComponent

```javascript
/**
 * Composant de galerie d'images
 * Affiche les images optimisées avec thumbnails
 */

import React, { useState, useEffect } from 'react';
import {
  Grid,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
  Modal,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomInIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ImageGalleryComponent = ({ annonceId, onDelete }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const token = localStorage.getItem('auth_token');

  useEffect(() => {
    loadImages();
  }, [annonceId]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/images/${annonceId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      setImages(response.data.images || response.data.variants || []);
    } catch (err) {
      setError('Erreur lors du chargement des images');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Supprimer cette image ?')) return;

    try {
      // À ajouter au backend si pas présent
      await axios.delete(`${API_BASE_URL}/images/${imageId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      loadImages();
      if (onDelete) onDelete(imageId);
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (images.length === 0) {
    return <p>Aucune image</p>;
  }

  return (
    <>
      <ImageList cols={{ xs: 1, sm: 2, md: 3 }} gap={8}>
        {images.map((image) => (
          <ImageListItem key={image.image_id || image.url}>
            <img
              src={image.thumbnail_url || image.url}
              alt={image.filename}
              loading="lazy"
              style={{ borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => setSelectedImage(image)}
            />
            <ImageListItemBar
              actionIcon={
                <>
                  <IconButton
                    sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    onClick={() => setSelectedImage(image)}
                  >
                    <ZoomInIcon />
                  </IconButton>
                  <IconButton
                    sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    onClick={() => handleDelete(image.image_id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            />
          </ImageListItem>
        ))}
      </ImageList>

      {/* Modal pour zoom */}
      <Modal
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box
          sx={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
          }}
        >
          <IconButton
            onClick={() => setSelectedImage(null)}
            sx={{
              position: 'absolute',
              top: -40,
              right: 0,
              color: 'white',
            }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={selectedImage?.url}
            alt="Full size"
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              borderRadius: '8px',
            }}
          />
        </Box>
      </Modal>
    </>
  );
};

export default ImageGalleryComponent;
```

#### Étape 2.3: Intégrer dans VendeurDashboard

```javascript
import ImageUploadComponent from '../components/ImageUpload';
import ImageGalleryComponent from '../components/ImageGallery';

// Dans le composant AnnoncesCard:
<ImageGalleryComponent
  annonceId={annonce.annonce_id}
  onDelete={() => loadAnnonces()}
/>

// Dans le dialog de création:
<ImageUploadComponent
  annonceId={newAnnonceId}
  onUploadSuccess={() => loadAnnonces()}
/>
```

#### Étape 2.4: Créer imagesApi dans api.js

```javascript
export const imagesApi = {
  upload: (annonceId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    return apiClient.post('/images/upload', formData, {
      params: { annonce_id: annonceId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getVariants: (annonceId) =>
    apiClient.get(`/images/${annonceId}`),

  delete: (imageId) =>
    apiClient.delete(`/images/${imageId}`),

  regenerate: (annonceId) =>
    apiClient.post(`/images/${annonceId}/regenerate`),

  getMissingVariants: (annonceId) =>
    apiClient.get(`/images/${annonceId}/missing-variants`),
};
```

### 🎁 Bénéfices
- ✅ Upload photos avec preview
- ✅ Affichage thumbnails optimisées
- ✅ Drag & drop support
- ✅ Progress bar
- ✅ Gestion complète images

### 📈 Complexité: **MOYENNE** ⭐⭐

**Fichiers à créer:** 2
- ImageUploadComponent.jsx (150 lines)
- ImageGalleryComponent.jsx (100 lines)

**Fichiers à modifier:** 3
- api.js - Ajouter imagesApi
- VendeurDashboard.jsx - Intégrer composants
- RechercheBiens.jsx - Afficher images au lieu de placeholder

---

## 3️⃣ AFFICHER FEEDBACKS DANS VISITESPAGE (Medium Priority)

### 🎯 Objectif
Intégrer le composant FeedbackComponent dans VisitesPage pour que:
- Les acheteurs voient le formulaire de feedback après une visite
- Les vendeurs voient les feedbacks reçus avec stats

### 📋 État Actuel

**VisitesPage.jsx:**
- ✅ Planifier visite
- ✅ Lister visites
- ✅ Modifier/Annuler
- ❌ Pas d'affichage feedback

**FeedbackComponent.jsx:** Créé mais jamais utilisé

### ✅ Solution

#### Étape 3.1: Ajouter onglet Feedback dans VisitesPage

```javascript
import {
  FeedbackSubmitForm,
  FeedbacksList,
} from '../components/FeedbackComponent';

const VisitesPage = () => {
  const [tabValue, setTabValue] = useState(0);
  // ... existing code ...

  return (
    <>
      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Planifier une visite" />
        <Tab label="Mes visites" />
        <Tab label="Feedbacks reçus" /> {/* NEW */}
      </Tabs>

      {/* ... existing tabs ... */}

      {/* NEW TAB: Feedbacks */}
      {tabValue === 2 && (
        <Box>
          {userRole === 'vendeur' ? (
            <FeedbacksList />
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Vous êtes acheteur. Les feedbacks s'affichent après les visites.
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </>
  );
};
```

#### Étape 3.2: Ajouter formulaire feedback dans card visite

```javascript
// Dans VisitesPage, onglet 2 (Mes visites)
// Pour chaque visite complétée, afficher le formulaire

{visites.map((visite) => {
  const isCompleted = visite.statut === 'complétée';

  return (
    <Box key={visite.visite_id}>
      {/* Card visite existante */}
      <Card>
        {/* ... existing content ... */}
      </Card>

      {/* NEW: Feedback form si visite complétée */}
      {isCompleted && (
        <FeedbackSubmitForm
          visiteId={visite.visite_id}
          onSuccess={() => loadVisites()}
        />
      )}
    </Box>
  );
})}
```

#### Étape 3.3: Logique de détection visite complétée

```javascript
// Dans backend routes/visites.py, s'assurer que:
// 1. Visite a un statut 'complétée' après la date/heure
// 2. Feedback ne peut être soumis qu'une fois
// 3. Vendeur peut répondre au feedback

// Frontend doit aussi:
// - Checker si feedback existe déjà
// - Afficher message de confirmation après submission
// - Recharger les données
```

### 🎁 Bénéfices
- ✅ Cycle complet: visite → feedback → réponse
- ✅ Statistiques vendeur (ratings)
- ✅ Engagement utilisateur
- ✅ Reviews/reputation system

### 📈 Complexité: **BASSE** ⭐

**Fichiers à modifier:** 1
- VisitesPage.jsx - Ajouter onglet et imports (20 min)

---

## 4️⃣ AJOUTER STATS FAQ (Low Priority)

### 🎯 Objectif
Ajouter un onglet ou section affichant:
- Nombre total de FAQs
- Questions par catégorie
- Questions populaires (most viewed)
- Tendances search

### 📋 État Actuel

**FAQPage.jsx:**
- ✅ Lister FAQs
- ✅ Rechercher
- ✅ Filtrer par catégorie
- ❌ Pas de stats

**Backend:**
- ✅ [GET /faq/stats](backend/src/routes/faq.py#L136) - Endpoint exists!

### ✅ Solution

#### Étape 4.1: Utiliser endpoint /faq/stats

```javascript
// Dans FAQPage.jsx, ajouter:

const [stats, setStats] = useState(null);

useEffect(() => {
  loadStats();
}, []);

const loadStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/faq/stats`);
    setStats(response.data.stats);
  } catch (err) {
    console.error('Erreur stats:', err);
  }
};
```

#### Étape 4.2: Ajouter onglet Stats

```javascript
<Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
  <Tab label="Parcourir les FAQs" />
  <Tab label="Statistiques" /> {/* NEW */}
</Tabs>

{tabValue === 1 && (
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6} md={3}>
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Total FAQs
        </Typography>
        <Typography variant="h4">
          {stats?.total_faqs || 0}
        </Typography>
      </Paper>
    </Grid>

    <Grid item xs={12} sm={6} md={3}>
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Catégories
        </Typography>
        <Typography variant="h4">
          {stats?.total_categories || 0}
        </Typography>
      </Paper>
    </Grid>

    {/* Distribution par catégorie */}
    <Grid item xs={12}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          FAQs par Catégorie
        </Typography>
        {stats?.category_distribution?.map((cat) => (
          <Box key={cat.categorie} sx={{ mb: 1 }}>
            <Typography variant="body2">
              {cat.categorie}: {cat.count}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(cat.count / stats.total_faqs) * 100}
            />
          </Box>
        ))}
      </Paper>
    </Grid>

    {/* Questions populaires */}
    {stats?.popular_questions && (
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Questions Populaires
          </Typography>
          {stats.popular_questions.map((q, i) => (
            <Box key={i} sx={{ mb: 1 }}>
              <Typography variant="body2">
                {i + 1}. {q.question}
                <Chip
                  label={`${q.views || 0} views`}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>
          ))}
        </Paper>
      </Grid>
    )}
  </Grid>
)}
```

#### Étape 4.3: Créer faqApi dans api.js (optionnel)

```javascript
export const faqApi = {
  listAll: (skip = 0, limit = 50) =>
    apiClient.get('/faq', { params: { skip, limit } }),

  search: (query) =>
    apiClient.get('/faq/search', { params: { query } }),

  getStats: () =>
    apiClient.get('/faq/stats'),
};
```

### 🎁 Bénéfices
- ✅ Insights pour améliorer FAQ
- ✅ SEO: identifier questions importantes
- ✅ UX: mettre en avant questions populaires
- ✅ Analytics pour content strategy

### 📈 Complexité: **TRÈS BASSE** ⭐

**Fichiers à modifier:** 1-2
- FAQPage.jsx - Ajouter onglet stats (15 min)
- api.js - Ajouter faqApi (optionnel)

---

## 📊 RÉSUMÉ COMPARATIF

| Étape | Complexité | Impact | Durée Estimée | Priorité |
|-------|-----------|--------|---------------|----------|
| 1. Centraliser API | ⭐ Basse | ⭐⭐⭐⭐ Élevé | 15 min | **HAUTE** |
| 2. Images | ⭐⭐ Moyenne | ⭐⭐⭐⭐ Élevé | 1h | **HAUTE** |
| 3. Feedbacks | ⭐ Basse | ⭐⭐⭐ Moyen | 20 min | **MOYENNE** |
| 4. Stats FAQ | ⭐ Très Basse | ⭐⭐ Faible | 15 min | **BASSE** |

---

## 🎯 ORDRE RECOMMANDÉ

1. **Étape 1 (15 min)** - Centraliser API
   - Quickwin, meilleure qualité code

2. **Étape 2 (1h)** - Intégrer images
   - Majeures: photos essentielles pour immobilier

3. **Étape 3 (20 min)** - Feedbacks
   - Cycle complet UX

4. **Étape 4 (15 min)** - Stats FAQ
   - Nice-to-have, bon pour product insights

**Total: ~2h pour tout completer** ✨
