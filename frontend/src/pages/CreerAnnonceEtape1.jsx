import React
import { Button, Alert, Input } from '@/components';, { useState } from 'react';

import { useNavigate } from 'react-router-dom';


import { createBrouillonAnnonce } from '../services/api';
import '../styles/CreerAnnonceEtape1.css';

/**
 * Page ÉTAPE 1 du tunnel : Adresse et Photos
 *
 * Utilisateur (visiteur) remplit :
 * - Adresse complète
 * - Code postal + Ville
 * - Masquer adresse complète (optionnel)
 * - Photos (max 10, max 10MB chacune)
 */
export default function CreerAnnonceEtape1() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    titre: '',
    adresse: '',
    code_postal: '',
    ville: '',
    masquer_adresse_complete: false,
  });

  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const MAX_PHOTOS = 10;
  const MAX_FILE_SIZE_MB = 10;

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length + photos.length > MAX_PHOTOS) {
      setError(`Vous ne pouvez ajouter que ${MAX_PHOTOS} photos maximum`);
      return;
    }

    const newPhotos = [];
    const newPreviews = [];
    let totalSize = 0;

    for (const file of files) {
      // Vérifier la taille
      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        setError(`${file.name} dépasse ${MAX_FILE_SIZE_MB}MB`);
        continue;
      }

      // Vérifier le format
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError(`${file.name} : format non autorisé (jpg, png, webp uniquement)`);
        continue;
      }

      totalSize += file.size;
      newPhotos.push(file);

      // Créer une preview
      const reader = new FileReader();
      reader.onload = (event) => {
        newPreviews.push({
          url: event.target.result,
          name: file.name,
        });
      };
      reader.readAsDataURL(file);
    }

    setPhotos([...photos, ...newPhotos]);
    setPhotoPreviews([...photoPreviews, ...newPreviews]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.titre.trim()) {
      setError('Le titre de l\'annonce est requis');
      return;
    }

    if (!formData.adresse.trim()) {
      setError('L\'adresse complète est requise');
      return;
    }

    if (!formData.code_postal.trim() || formData.code_postal.length !== 5) {
      setError('Code postal invalide (5 chiffres)');
      return;
    }

    if (!formData.ville.trim()) {
      setError('La ville est requise');
      return;
    }

    if (photos.length === 0) {
      setError('Veuillez ajouter au moins une photo');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Créer FormData pour l'upload
      const uploadData = new FormData();
      uploadData.append('titre', formData.titre);
      uploadData.append('adresse', formData.adresse);
      uploadData.append('code_postal', formData.code_postal);
      uploadData.append('ville', formData.ville);
      uploadData.append('masquer_adresse_complete', formData.masquer_adresse_complete);

      // Ajouter les photos
      photos.forEach((photo) => {
        uploadData.append('photos', photo);
      });

      // Appeler l'API
      const response = await createBrouillonAnnonce(uploadData);

      setUploadProgress(100);

      // Rediriger vers étape 2 avec annonce_id
      navigate(
        `/creer-annonce/etape2?annonce_id=${response.annonce_id}`,
        {
          state: {
            temp_photo_urls: response.temp_photo_urls,
          },
        }
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du brouillon');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div maxWidth="md">
      <div sx={{ py: 4 }}>
        {/* Titre */}
        <div sx={{ mb: 4, textAlign: 'center' }}>
          <h1  component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            🏠 Créer une annonce
          </h1>
          <p  sx={{ color: 'text.secondary' }}>
            Étape 1 sur 4 : Adresse et photos
          </h1>
          <LinearProgress variant="determinate" value={25} sx={{ mt: 2 }} />
        </div>

        {/* Erreurs */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Formulaire */}
        <div elevation={3} sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <div container spacing={3}>
              {/* Titre */}
              <div item xs={12}>
                <Input
                  fullWidth
                  label="Titre de l'annonce"
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  placeholder="Ex: Bel appartement 3 pièces à Paris"
                  required
                  maxLength={100}
                  helperText={`${formData.titre.length}/100`}
                / />
              </div>

              {/* Adresse */}
              <div item xs={12}>
                <Input
                  fullWidth
                  label="Adresse complète"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  placeholder="Ex: 123 Rue de Paris, Apt 4B"
                  required
                / />
              </div>

              {/* Code postal et Ville */}
              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="Code postal"
                  name="code_postal"
                  value={formData.code_postal}
                  onChange={handleChange}
                  placeholder="75001"
                  required
                  inputProps={{ maxLength: 5 }}
                / />
              </div>

              <div item xs={12} sm={6}>
                <Input
                  fullWidth
                  label="Ville"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  placeholder="Paris"
                  required
                / />
              </div>

              {/* Masquer adresse */}
              <div item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="masquer_adresse_complete"
                      checked={formData.masquer_adresse_complete}
                      onChange={handleChange}
                    />
                  }
                  label="Masquer l'adresse complète (seul le code postal et la ville seront visibles)"
                />
              </div>

              {/* Photos */}
              <div item xs={12}>
                <h3  sx={{ mb: 2 }}>
                  📸 Photos ({photos.length}/{MAX_PHOTOS})
                </h1>

                {/* Upload Area */}
                <div
                  sx={{
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                    cursor: 'pointer',
                    p: 3,
                    textAlign: 'center',
                    mb: 2,
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                  component="label"
                >
                  <input
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    type="file"
                    onChange={handlePhotoChange}
                    disabled={photos.length >= MAX_PHOTOS}
                  />
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <h3 >Déposer les photos ici</h1>
                  <span  sx={{ color: 'text.secondary' }}>
                    ou cliquez pour sélectionner (jpg, png, webp, max 10MB chacune)
                  </h1>
                </div>

                {/* Photos Previews */}
                {photoPreviews.length > 0 && (
                  <div container spacing={2}>
                    {photoPreviews.map((preview, index) => (
                      <div item xs={6} sm={4} key={index}>
                        <div sx={{ position: 'relative' }}>
                          <divMedia
                            component="img"
                            height="140"
                            image={preview.url}
                            alt={`Photo ${index + 1}`}
                            sx={{ borderRadius: 1, objectFit: 'cover' }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            }}
                            onClick={() => removePhoto(index)}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                          <p  sx={{ mt: 0.5, display: 'block' }}>
                            {preview.name}
                          </h1>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div item xs={12}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </div>
              )}
            </div>

            {/* Boutons */}
            <Stack direction="row" spacing={2} sx={{ mt: 4, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => navigate('/')}
              >
                Annuler
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="large"
                type="submit"
                disabled={loading || uploadProgress > 0 && uploadProgress < 100}
              >
                {loading ? 'Création en cours...' : 'Continuer vers étape 2'}
              </Button>
            </Stack>
          </form>
        </div>

        {/* Info */}
        <div sx={{ mt: 4, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
          <span  sx={{ color: 'info.dark' }}>
            💡 <strong>Conseil :</strong> Vous pouvez abandonner à tout moment. Votre brouillon sera sauvegardé
            et vous pourrez le continuer plus tard depuis votre dashboard.
          </h1>
        </div>
      </div>
    </div>
  );
}
