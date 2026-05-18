/**
 * Utilitaire de compression d'images côté client
 * Phase 5.3 - Advanced Features
 *
 * Compresse les images avant upload:
 * - Resize dimensions
 * - Réduire la qualité
 * - Convertir en WebP
 * - Générer thumbnails
 */

/**
 * Configuration de compression
 */
const COMPRESSION_CONFIG = {
  // Dimensions max
  maxWidth: 1920,
  maxHeight: 1440,

  // Qualité JPEG (0-1)
  quality: 0.8,

  // Qualité WebP (0-100)
  webpQuality: 80,

  // Taille max fichier (en MB)
  maxFileSize: 50,

  // Thumbnail config
  thumbnail: {
    width: 200,
    height: 200,
    quality: 0.7,
  },
};

/**
 * Vérifier si le fichier est une image valide
 */
export function isValidImageFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type) && file.size <= COMPRESSION_CONFIG.maxFileSize * 1024 * 1024;
}

/**
 * Obtenir les dimensions d'une image
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresser une image
 * Retourne un Blob compressé
 */
export function compressImage(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Créer un canvas
          const canvas = document.createElement('canvas');

          // Calculer les nouvelles dimensions (garder l'aspect ratio)
          let width = img.width;
          let height = img.height;

          if (width > COMPRESSION_CONFIG.maxWidth) {
            height = (height * COMPRESSION_CONFIG.maxWidth) / width;
            width = COMPRESSION_CONFIG.maxWidth;
          }

          if (height > COMPRESSION_CONFIG.maxHeight) {
            width = (width * COMPRESSION_CONFIG.maxHeight) / height;
            height = COMPRESSION_CONFIG.maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          // Dessiner l'image sur le canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir en blob avec compression
          const quality = options.quality || COMPRESSION_CONFIG.quality;
          canvas.toBlob(
            (blob) => {
              console.log(
                `[ImageCompression] Compression: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(blob.size / 1024 / 1024).toFixed(2)}MB`
              );
              resolve(blob);
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Générer une thumbnail
 * Retourne un Blob de thumbnail
 */
export function generateThumbnail(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const thumbWidth = COMPRESSION_CONFIG.thumbnail.width;
          const thumbHeight = COMPRESSION_CONFIG.thumbnail.height;

          // Crop au carré si nécessaire
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;

          canvas.width = thumbWidth;
          canvas.height = thumbHeight;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, x, y, size, size, 0, 0, thumbWidth, thumbHeight);

          canvas.toBlob(
            (blob) => {
              console.log(`[Thumbnail] Générée: ${(blob.size / 1024).toFixed(0)}KB`);
              resolve(blob);
            },
            'image/jpeg',
            COMPRESSION_CONFIG.thumbnail.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Obtenir l'aperçu (preview) d'une image
 */
export function getImagePreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Traiter un fichier (compression + thumbnail)
 * Retourne { compressed, thumbnail, preview }
 */
export async function processImageFile(file) {
  try {
    console.log('[FileProcessor] Début du traitement:', file.name);

    // Vérifier le fichier
    if (!isValidImageFile(file)) {
      throw new Error(
        `Fichier invalide. Formats acceptés: JPG, PNG, WebP, GIF. Max: ${COMPRESSION_CONFIG.maxFileSize}MB`
      );
    }

    // Compresser
    console.log('[FileProcessor] Compression en cours...');
    const compressed = await compressImage(file);

    // Générer thumbnail
    console.log('[FileProcessor] Génération thumbnail...');
    const thumbnail = await generateThumbnail(file);

    // Aperçu
    console.log('[FileProcessor] Préparation aperçu...');
    const preview = await getImagePreview(compressed);

    return {
      file: new File([compressed], file.name, { type: 'image/jpeg' }),
      thumbnail: new File([thumbnail], `thumb_${file.name}`, { type: 'image/jpeg' }),
      preview,
      originalSize: file.size,
      compressedSize: compressed.size,
      reductionPercent: Math.round(((file.size - compressed.size) / file.size) * 100),
    };
  } catch (error) {
    console.error('[FileProcessor] Erreur:', error);
    throw error;
  }
}

/**
 * Uploader un fichier avec barre de progression
 */
export async function uploadFile(file, uploadUrl, onProgress = null) {
  try {
    console.log('[Upload] Début upload:', file.name);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    // Gérer la progression
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    return new Promise((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          console.log('[Upload] Succès:', response);
          resolve(response);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.onabort = () => reject(new Error('Upload aborted'));

      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('[Upload] Erreur:', error);
    throw error;
  }
}

/**
 * Uploader plusieurs fichiers en parallèle
 */
export async function uploadMultipleFiles(
  files,
  uploadUrl,
  options = {}
) {
  const { maxParallel = 3, onFileProgress = null, onOverallProgress = null } = options;

  const results = [];
  let completed = 0;

  // Créer des chunks de fichiers pour upload parallèle
  for (let i = 0; i < files.length; i += maxParallel) {
    const chunk = files.slice(i, i + maxParallel);

    const chunkResults = await Promise.all(
      chunk.map((file, idx) =>
        uploadFile(file, uploadUrl, (percent) => {
          if (onFileProgress) {
            onFileProgress({
              fileIndex: i + idx,
              fileName: file.name,
              percent,
            });
          }
        })
          .then((result) => {
            completed++;
            if (onOverallProgress) {
              onOverallProgress({
                completed,
                total: files.length,
                percent: (completed / files.length) * 100,
              });
            }
            return result;
          })
      )
    );

    results.push(...chunkResults);
  }

  return results;
}
