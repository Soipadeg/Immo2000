import '../styles/CreerAnnonceEtape1.css';
import React, { useState } from 'react';
import { Button, Alert, Input } from '@/components';
import { useNavigate } from 'react-router-dom';

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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
      <div style={{ paddingTop: '32px', paddingBottom: '32px' }}>
        {/* Titre */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <h1 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            🏠 Créer une annonce
          </h1>
          <p style={{ color: '#666' }}>
            Étape 1 sur 4 : Adresse et photos
          </p>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#ddd', marginTop: '16px', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: '25%', backgroundColor: '#1976d2', transition: 'width 0.3s' }}></div>
          </div>
        </div>

        {/* Erreurs */}
        {error && <Alert severity="error" style={{ marginBottom: '24px' }}>{error}</Alert>}

        {/* Formulaire */}
        <div style={{ padding: '32px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Titre */}
              <div>
                <Input
                  label="Titre de l'annonce"
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  placeholder="Ex: Bel appartement 3 pièces à Paris"
                  required
                  maxLength={100}
                  helperText={`${formData.titre.length}/100`}
                />
              </div>

              {/* Adresse */}
              <div>
                <Input
                  label="Adresse complète"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  placeholder="Ex: 123 Rue de Paris, Apt 4B"
                  required
                />
              </div>

              {/* Code postal et Ville */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input
                  label="Code postal"
                  name="code_postal"
                  value={formData.code_postal}
                  onChange={handleChange}
                  placeholder="75001"
                  required
                  maxLength={5}
                />
                <Input
                  label="Ville"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  placeholder="Paris"
                  required
                />
              </div>

              {/* Masquer adresse */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                  <input
                    type="checkbox"
                    name="masquer_adresse_complete"
                    checked={formData.masquer_adresse_complete}
                    onChange={handleChange}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span>Masquer l'adresse complète (seul le code postal et la ville seront visibles)</span>
                </label>
              </div>

              {/* Photos */}
              <div>
                <h3 style={{ marginBottom: '16px' }}>
                  📸 Photos ({photos.length}/{MAX_PHOTOS})
                </h3>

                {/* Upload Area */}
                <label
                  style={{
                    border: '2px dashed #1976d2',
                    backgroundColor: '#f5f5f5',
                    cursor: 'pointer',
                    padding: '24px',
                    textAlign: 'center',
                    marginBottom: '16px',
                    borderRadius: '4px',
                  }}
                >
                  <input
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    type="file"
                    onChange={handlePhotoChange}
                    disabled={photos.length >= MAX_PHOTOS}
                  />
                  <div style={{ fontSize: '48px', color: '#1976d2', marginBottom: '8px' }}>☁️</div>
                  <h3 style={{ margin: '8px 0' }}>Déposer les photos ici</h3>
                  <span style={{ color: '#666' }}>
                    ou cliquez pour sélectionner (jpg, png, webp, max 10MB chacune)
                  </span>
                </label>

                {/* Photos Previews */}
                {photoPreviews.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    {photoPreviews.map((preview, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img
                          src={preview.url}
                          alt={`Photo ${index + 1}`}
                          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                          }}
                        >
                          ✕
                        </button>
                        <p style={{ marginTop: '4px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {preview.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div style={{ width: '100%', height: '4px', backgroundColor: '#ddd', borderRadius: '2px', marginBottom: '16px' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: '#4caf50', transition: 'width 0.3s' }}></div>
                  </div>
                )}
              </div>
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '32px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #1976d2',
                  backgroundColor: '#fff',
                  color: '#1976d2',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || (uploadProgress > 0 && uploadProgress < 100)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || (uploadProgress > 0 && uploadProgress < 100) ? 'not-allowed' : 'pointer',
                  opacity: loading || (uploadProgress > 0 && uploadProgress < 100) ? 0.6 : 1,
                  fontSize: '16px',
                  fontWeight: '500',
                }}
              >
                {loading ? 'Création en cours...' : 'Continuer vers étape 2'}
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div style={{ marginTop: '32px', padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
          <span style={{ color: '#1565c0' }}>
            💡 <strong>Conseil :</strong> Vous pouvez abandonner à tout moment. Votre brouillon sera sauvegardé
            et vous pourrez le continuer plus tard depuis votre dashboard.
          </span>
        </div>
      </div>
    </div>
  );
}
