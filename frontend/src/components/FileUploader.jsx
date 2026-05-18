/**
 * Composant FileUploader avec Drag-Drop
 * Phase 5.3 - Advanced Features
 *
 * Fonctionnalités:
 * - Drag-drop
 * - Compression avant upload
 * - Barre de progression
 * - Aperçu images
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  LinearProgress,
  Card,
  CardMedia,
  CardActions,
  Grid,
  Alert,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import {
  processImageFile,
  uploadFile,
  uploadMultipleFiles,
  isValidImageFile,
} from '../utils/imageCompressionService';
import { useNotificationStore } from '../store/notificationStore';

/**
 * Composant principal FileUploader
 */
export function FileUploader({
  onUpload,
  onError,
  uploadUrl = '/api/uploads',
  maxFiles = 10,
  acceptedTypes = ['image/*'],
  showThumbnails = true,
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const dragCounter = useRef(0);
  const { showError, showSuccess } = useNotificationStore();

  // Gérer le drag-drop
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;

      const droppedFiles = Array.from(e.dataTransfer.files);
      await processFiles(droppedFiles);
    },
    []
  );

  // Traiter les fichiers sélectionnés
  const processFiles = async (selectedFiles) => {
    try {
      // Vérifier le nombre max
      if (files.length + selectedFiles.length > maxFiles) {
        showError(`Maximum ${maxFiles} fichiers`);
        return;
      }

      // Traiter chaque fichier
      const newFiles = [];
      for (const file of selectedFiles) {
        try {
          if (!isValidImageFile(file)) {
            showError(`${file.name}: Fichier invalide ou trop gros`);
            continue;
          }

          const processed = await processImageFile(file);

          newFiles.push({
            id: Math.random(),
            name: file.name,
            ...processed,
            status: 'ready', // ready, uploading, done, error
            error: null,
          });
        } catch (error) {
          showError(`${file.name}: ${error.message}`);
          if (onError) onError(file, error);
        }
      }

      setFiles((prev) => [...prev, ...newFiles]);
    } catch (error) {
      showError('Erreur traitement fichiers');
    }
  };

  // Gérer la sélection de fichiers
  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    await processFiles(selectedFiles);
  };

  // Uploader les fichiers
  const handleUpload = async () => {
    try {
      setUploading(true);

      const filesToUpload = files.filter((f) => f.status === 'ready');

      if (filesToUpload.length === 0) {
        showError('Aucun fichier à uploader');
        return;
      }

      // Upload avec progression
      const results = await uploadMultipleFiles(filesToUpload.map((f) => f.file), uploadUrl, {
        maxParallel: 3,
        onFileProgress: (prog) => {
          setUploadProgress((prev) => ({
            ...prev,
            [prog.fileIndex]: prog.percent,
          }));
        },
        onOverallProgress: (prog) => {
          console.log(`Overall progress: ${prog.percent.toFixed(0)}%`);
        },
      });

      // Mettre à jour le statut des fichiers
      setFiles((prev) =>
        prev.map((f, idx) => {
          const result = results[filesToUpload.indexOf(f)];
          if (result) {
            return {
              ...f,
              status: 'done',
              url: result.url,
              thumbnail: result.thumbnail,
            };
          }
          return f;
        })
      );

      showSuccess('Fichiers uploadés avec succès');

      if (onUpload) {
        onUpload(results);
      }
    } catch (error) {
      showError('Erreur upload: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  // Supprimer un fichier
  const handleRemoveFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Calculer l'économie totale
  const totalReduction = files.reduce((sum, f) => sum + (f.reductionPercent || 0), 0);
  const avgReduction = files.length > 0 ? Math.round(totalReduction / files.length) : 0;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Zone drag-drop */}
      <Paper
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed #ccc',
          backgroundColor: dragCounter.current > 0 ? '#f0f7ff' : 'transparent',
          transition: 'all 0.3s',
          cursor: 'pointer',
          mb: 2,
          '&:hover': {
            borderColor: '#2196f3',
            backgroundColor: '#f5f5f5',
          },
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: '#2196f3', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          Déposez vos fichiers ici
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          ou cliquez pour sélectionner
        </Typography>

        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input" style={{ width: '100%' }}>
          <Button component="span" variant="contained" sx={{ mt: 2 }}>
            Sélectionner des fichiers
          </Button>
        </label>

        <Typography variant="caption" display="block" sx={{ mt: 2 }}>
          Max {maxFiles} fichiers, 50 MB chacun
        </Typography>
      </Paper>

      {/* Résumé compression */}
      {files.length > 0 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {files.length} fichier(s) prêt(s) • Compression moyenne: {avgReduction}%
        </Alert>
      )}

      {/* Liste des fichiers */}
      <Grid container spacing={2}>
        {files.map((fileItem, idx) => (
          <Grid item xs={12} sm={6} md={4} key={fileItem.id}>
            <Card>
              {/* Aperçu */}
              {showThumbnails && fileItem.preview && (
                <CardMedia component="img" height="200" image={fileItem.preview} alt={fileItem.name} />
              )}

              {/* Contenu */}
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" noWrap>
                  {fileItem.name}
                </Typography>

                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    {(fileItem.originalSize / 1024 / 1024).toFixed(2)} MB →{' '}
                    {(fileItem.compressedSize / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>

                {/* Compression stat */}
                <Chip
                  label={`-${fileItem.reductionPercent}%`}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ mb: 1 }}
                />

                {/* Status icon */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {fileItem.status === 'done' && (
                    <>
                      <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                      <Typography variant="caption" color="success.main">
                        Uploadé
                      </Typography>
                    </>
                  )}
                  {fileItem.status === 'uploading' && (
                    <>
                      <CircularProgress size={20} />
                      <Typography variant="caption">
                        {uploadProgress[idx]?.toFixed(0)}%
                      </Typography>
                    </>
                  )}
                  {fileItem.status === 'error' && (
                    <>
                      <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />
                      <Typography variant="caption" color="error">
                        Erreur
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Barre de progression */}
                {fileItem.status === 'uploading' && (
                  <LinearProgress variant="determinate" value={uploadProgress[idx] || 0} sx={{ mt: 1 }} />
                )}
              </Box>

              {/* Actions */}
              <CardActions>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleRemoveFile(fileItem.id)}
                  disabled={fileItem.status === 'uploading'}
                >
                  Supprimer
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Bouton upload */}
      {files.some((f) => f.status === 'ready') && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleUpload}
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {uploading ? 'Upload en cours...' : `Uploader ${files.filter((f) => f.status === 'ready').length} fichier(s)`}
          </Button>
        </Box>
      )}
    </Box>
  );
}

/**
 * Composant simplifié pour une seule image
 */
export function SingleImageUploader({ onUpload, uploadUrl = '/api/uploads' }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showError, showSuccess } = useNotificationStore();

  const handleSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    try {
      const processed = await processImageFile(selectedFile);
      setFile(processed);
    } catch (error) {
      showError(error.message);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadFile(file.file, uploadUrl, (percent) => {
        setProgress(percent);
      });

      showSuccess('Image uploadée');
      if (onUpload) onUpload(result);
      setFile(null);
    } catch (error) {
      showError('Erreur upload: ' + error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      {file && file.preview ? (
        <Box sx={{ mb: 2 }}>
          <CardMedia component="img" image={file.preview} alt="preview" sx={{ maxHeight: 300, mb: 1 }} />
          <Typography variant="body2">
            {(file.compressedSize / 1024 / 1024).toFixed(2)} MB (-{file.reductionPercent}%)
          </Typography>
        </Box>
      ) : (
        <Box>
          <input
            type="file"
            accept="image/*"
            onChange={handleSelect}
            style={{ display: 'none' }}
            id="single-image-input"
          />
          <label htmlFor="single-image-input">
            <Button component="span" variant="contained">
              Sélectionner une image
            </Button>
          </label>
        </Box>
      )}

      {file && (
        <Box sx={{ mt: 2 }}>
          {uploading && <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />}
          <Button variant="contained" onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? `Upload ${progress.toFixed(0)}%` : 'Uploader'}
          </Button>
          <Button variant="outlined" onClick={() => setFile(null)} disabled={uploading} sx={{ ml: 1 }}>
            Annuler
          </Button>
        </Box>
      )}
    </Box>
  );
}
