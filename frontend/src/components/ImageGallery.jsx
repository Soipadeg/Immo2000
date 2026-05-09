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
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomInIcon,
} from '@mui/icons-material';
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
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (images.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">Aucune image</Typography>
      </Box>
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
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    onClick={() => setSelectedImage(image)}
                  >
                    <ZoomInIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    onClick={() => handleDelete(image.image_id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
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
              zIndex: 1,
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
