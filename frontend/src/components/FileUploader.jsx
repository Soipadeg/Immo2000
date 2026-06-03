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
  processImageFile,
  uploadFile,
  uploadMultipleFiles,
  isValidImageFile,
} from '../utils/imageCompressionService';
import { useNotificationStore } from '../store/notificationStore';
import './FileUploader.css';

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
    <div className="file-uploader">
      {/* Zone drag-drop */}
      <div
        className={`file-uploader__drop-zone ${dragCounter.current > 0 ? 'drag-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="file-uploader__drop-icon">📁</div>
        <div className="file-uploader__drop-text">Déposez vos fichiers ici</div>
        <div className="file-uploader__drop-hint">ou cliquez pour sélectionner</div>

        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="file-uploader__input"
          id="file-input"
        />
        <label htmlFor="file-input" style={{ width: '100%' }}>
          <button className="file-uploader__button" type="button">
            Sélectionner des fichiers
          </button>
        </label>

        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#999' }}>
          Max {maxFiles} fichiers, 50 MB chacun
        </div>
      </div>

      {/* Résumé compression */}
      {files.length > 0 && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#dbeafe',
          color: '#0c4a6e',
          borderRadius: '0.375rem',
          fontSize: '0.875rem'
        }}>
          ✓ {files.length} fichier(s) prêt(s) • Compression moyenne: {avgReduction}%
        </div>
      )}

      {/* Liste des fichiers */}
      <div className="file-uploader__files">
        {files.map((fileItem, idx) => (
          <div key={fileItem.id} className="file-uploader__file-item">
            {/* Aperçu */}
            {showThumbnails && fileItem.preview && (
              <div className="file-uploader__file-thumbnail">
                <img src={fileItem.preview} alt={fileItem.name} />
              </div>
            )}

            {/* Contenu */}
            <div className="file-uploader__file-info">
              <div className="file-uploader__file-name">{fileItem.name}</div>

              <div className="file-uploader__file-details">
                <div>{(fileItem.originalSize / 1024 / 1024).toFixed(2)} MB</div>
                <div>→</div>
                <div>{(fileItem.compressedSize / 1024 / 1024).toFixed(2)} MB</div>
                <div style={{ marginLeft: 'auto', color: '#22c55e', fontWeight: '600' }}>
                  -{fileItem.reductionPercent}%
                </div>
              </div>

              {/* Barre de progression */}
              {fileItem.status === 'uploading' && (
                <div className="file-uploader__progress-bar">
                  <div
                    className="file-uploader__progress-fill"
                    style={{ width: `${uploadProgress[idx] || 0}%` }}
                  />
                </div>
              )}

              {/* Status */}
              <div className={`file-uploader__status ${fileItem.status}`}>
                {fileItem.status === 'done' && <div>✓ Uploadé</div>}
                {fileItem.status === 'uploading' && <div>⟳ {uploadProgress[idx]?.toFixed(0)}%</div>}
                {fileItem.status === 'error' && <div>✘ Erreur</div>}
                {fileItem.status === 'ready' && <div>Prêt</div>}
              </div>
            </div>

            {/* Bouton supprimer */}
            <button
              className="file-uploader__remove-btn"
              onClick={() => handleRemoveFile(fileItem.id)}
              disabled={fileItem.status === 'uploading'}
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>

      {/* Bouton upload */}
      {files.some((f) => f.status === 'ready') && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            className="file-uploader__button"
            onClick={handleUpload}
            disabled={uploading}
            style={{
              fontSize: '1rem',
              padding: '0.75rem 2rem'
            }}
          >
            {uploading ? 'Upload en cours...' : `Uploader ${files.filter((f) => f.status === 'ready').length} fichier(s)`}
          </button>
        </div>
      )}
    </div>
  );
}
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
    <div style={{ textAlign: 'center' }}>
      {file && file.preview ? (
        <div style={{ marginBottom: '1rem' }}>
          <img
            src={file.preview}
            alt="preview"
            style={{
              maxHeight: '300px',
              marginBottom: '0.5rem',
              borderRadius: '0.375rem'
            }}
          />
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {(file.compressedSize / 1024 / 1024).toFixed(2)} MB (-{file.reductionPercent}%)
          </div>
        </div>
      ) : (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleSelect}
            style={{ display: 'none' }}
            id="single-image-input"
          />
          <label htmlFor="single-image-input">
            <button className="file-uploader__button" type="button">
              Sélectionner une image
            </button>
          </label>
        </div>
      )}

      {file && (
        <div style={{ marginTop: '1rem' }}>
          {uploading && (
            <div className="file-uploader__progress-bar" style={{ marginBottom: '1rem' }}>
              <div
                className="file-uploader__progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <button
            className="file-uploader__button"
            onClick={handleUpload}
            disabled={uploading || !file}
            style={{ marginRight: '0.5rem' }}
          >
            {uploading ? `Upload ${progress.toFixed(0)}%` : 'Uploader'}
          </button>
          <button
            className="file-uploader__button"
            onClick={() => setFile(null)}
            disabled={uploading}
            style={{
              backgroundColor: '#6b7280',
              marginLeft: '0.5rem'
            }}
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}
