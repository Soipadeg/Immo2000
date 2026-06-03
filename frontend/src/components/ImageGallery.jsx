/**
 * Composant de galerie d'images
 * Affiche les images optimisées avec thumbnails
 */

import React, { useState, useEffect } from 'react';
import { imagesApi } from '../services/api';

const ImageGalleryComponent = ({ annonceId, onDelete }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadImages();
  }, [annonceId]);

  const loadImages = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await imagesApi.getVariants(annonceId);
      setImages(response.data.images || response.data.variants || []);
    } catch (err) {
      setError('Erreur lors du chargement des images');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Supprimer cette image ?')) return;

    try {
      await imagesApi.delete(imageId);
      loadImages();
      if (onDelete) onDelete(imageId);
    } catch (err) {
      setError('Erreur lors de la suppression');
      console.error('Erreur:', err);
    }
  };

  if (loading) {
    return (
      <div>
        <div class="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div>{error}</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div>
        <div>Aucune image</div>
      </div>
    );
  }

  return (
    <>
      <ImageList cols={{ xs: 1, sm: 2, md: 3 }} gap={8}>
        {images.map((image) => (
          <ImageListItem key={image.image_id || image.url}>
            <img
              src={image.thumbnail_url || image.url}
              alt={image.filename || 'Image'}
              loading="lazy"
              style={{ borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => setSelectedImage(image)}
            />
            <ImageListItemBar
              actionIcon={
                <div>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedImage(image)}
                  >
                    <ZoomInIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(image.image_id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>
              }
            />
          </ImageListItem>
        ))}
      </ImageList>

      {/* Modal pour zoom */}
      <Modal
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      >
        <div
        >
          <IconButton
            onClick={() => setSelectedImage(null)}
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
        </div>
      </Modal>
    </>
  );
};

export default ImageGalleryComponent;
