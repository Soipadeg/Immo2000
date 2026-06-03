/**
 * Composant d'upload d'images
 * Utilisé dans VendeurDashboard pour créer/éditer annonces
 */

import React, { useState } from 'react';
import './ImageUpload.css';

const ImageUploadComponent = ({ annonceId, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const MAX_FILES = 10;
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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
        setError(`L'image ${file.name} est trop volumineuse (max 10MB)`);
        return;
      }
    }

    // Ajouter fichiers et preview
    setFiles([...files, ...selectedFiles]);
    setError('');

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

      const xhr = new XMLHttpRequest();

      // Tracker la progression
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(progress);
        }
      });

      // Gérer la réponse
      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          setFiles([]);
          setPreviews([]);
          setUploadProgress(0);

          if (onUploadSuccess) {
            onUploadSuccess(response);
          }
        } else {
          const response = JSON.parse(xhr.responseText);
          setError(response.detail || 'Erreur lors de l\'upload');
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        setError('Erreur lors de l\'upload');
        setUploading(false);
      });

      // Envoyer la requête
      xhr.open('POST', `${API_BASE_URL}/images/upload?annonce_id=${annonceId}`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'upload');
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-content">
        <div>
          <ImageIcon /> Ajouter des photos
        </div>

        {error && <div className="alert">{error}</div>}

        {/* Zone de drop */}
        <div sx={{
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
          <CloudUploadIcon />
          <div>
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
          </div>
          <div>
            Max {MAX_FILES} images, 10MB chacune
          </div>
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="grid" container spacing={2}>
            {previews.map((preview, index) => (
              <div className="grid" item xs={6} sm={4} md={3} key={index}>
                <div>
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
                  <button class="icon-btn"
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
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {uploading && (
          <div>
            <div class="progress-bar"><div class="progress-fill"></div></div>
            <div>
              {uploadProgress}%
            </div>
          </div>
        )}

        {/* Upload button */}
        {previews.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            fullWidth
          >
            {uploading ? 'Upload en cours...' : `Uploader ${previews.length} image(s)`}
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageUploadComponent;

// CSS already imported at top

// CSS already imported at top
