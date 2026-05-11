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
  Grid,
  IconButton,
  Alert,
} from '@mui/material';
import { Cancel as CloseIcon } from '@mui/icons-material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
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
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ImageIcon /> Ajouter des photos
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
          <CloudUploadIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
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
