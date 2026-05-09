/**
 * Composant pour afficher et gérer les feedbacks de visite
 * Peut être intégré dans VisitesPage ou standalone
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Rating,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  Grid,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { feedbacksApi } from '../services/api';

/**
 * Formulaire de soumission de feedback (pour acheteurs)
 */
export const FeedbackSubmitForm = ({ visiteId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    rating: 3,
    commentaire: '',
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      if (formData.rating === 0) {
        setError('Veuillez donner une note');
        setLoading(false);
        return;
      }

      await feedbacksApi.create(visiteId, formData);
      setFormData({ rating: 3, commentaire: '' });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f9f9f9' }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        📝 Donner votre avis sur la visite
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 2 }}>
        <Typography component="legend" variant="body2" sx={{ mb: 1 }}>
          Votre note
        </Typography>
        <Rating
          value={formData.rating}
          onChange={(e, value) => setFormData({ ...formData, rating: value })}
          size="large"
        />
      </Box>

      <TextField
        fullWidth
        label="Commentaire (optionnel)"
        multiline
        rows={3}
        value={formData.commentaire}
        onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
        placeholder="Partager votre expérience avec cette propriété..."
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        color="primary"
        disabled={loading}
        onClick={handleSubmit}
        fullWidth
      >
        {loading ? <CircularProgress size={24} /> : 'Envoyer mon avis'}
      </Button>
    </Paper>
  );
};

/**
 * Card d'affichage d'un feedback (pour vendeurs)
 */
export const FeedbackCard = ({ feedback, onReply }) => {
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) {
      return;
    }

    setLoading(true);
    try {
      await feedbacksApi.repondre(feedback.feedback_id, replyText);
      setReplyText('');
      setReplyDialogOpen(false);

      if (onReply) {
        onReply();
      }
    } catch (err) {
      console.error('Erreur lors de la réponse:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card sx={{ mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent>
          {/* En-tête avec avatar et infos */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar
              sx={{
                backgroundColor: '#1976d2',
                mr: 2,
                width: 40,
                height: 40,
              }}
            >
              {feedback.acheteur_nom?.[0]?.toUpperCase() || 'A'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {feedback.acheteur_nom || 'Utilisateur anonyme'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(feedback.date_creation).toLocaleDateString('fr-FR')}
              </Typography>
            </Box>
          </Box>

          {/* Note */}
          <Box sx={{ mb: 2 }}>
            <Rating value={feedback.rating} readOnly size="small" />
            <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
              {['Très mauvais', 'Mauvais', 'Acceptable', 'Bon', 'Excellent'][feedback.rating - 1]}
            </Typography>
          </Box>

          {/* Commentaire */}
          {feedback.commentaire && (
            <Typography variant="body2" sx={{ mb: 2, color: '#333' }}>
              {feedback.commentaire}
            </Typography>
          )}

          {/* Réponse du vendeur */}
          {feedback.reponse_vendeur && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                backgroundColor: '#f5f5f5',
                borderLeft: '3px solid #4caf50',
                borderRadius: '4px',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#4caf50' }}>
                ✓ Réponse du vendeur
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: '#555' }}>
                {feedback.reponse_vendeur}
              </Typography>
            </Box>
          )}
        </CardContent>

        <CardActions>
          {!feedback.reponse_vendeur && (
            <Button
              size="small"
              startIcon={<ReplyIcon />}
              onClick={() => setReplyDialogOpen(true)}
            >
              Répondre
            </Button>
          )}
        </CardActions>
      </Card>

      {/* Dialog de réponse */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} fullWidth>
        <DialogTitle>Répondre au feedback</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Feedback de {feedback.acheteur_nom}: "{feedback.commentaire}"
          </Typography>
          <TextField
            fullWidth
            label="Votre réponse"
            multiline
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Répondez au feedback du visiteur..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handleReply}
            variant="contained"
            color="primary"
            disabled={!replyText.trim() || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Envoyer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/**
 * Liste complète des feedbacks (pour vendeurs)
 */
export const FeedbacksList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await feedbacksApi.listForVendeur(0, 100);
      setFeedbacks(response.data.feedbacks || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (feedbacks.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Aucun feedback reçu pour le moment
        </Typography>
      </Paper>
    );
  }

  // Statistiques
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : 0;

  const ratingDistribution = {
    5: feedbacks.filter(f => f.rating === 5).length,
    4: feedbacks.filter(f => f.rating === 4).length,
    3: feedbacks.filter(f => f.rating === 3).length,
    2: feedbacks.filter(f => f.rating === 2).length,
    1: feedbacks.filter(f => f.rating === 1).length,
  };

  return (
    <Box>
      {/* Statistiques */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f9f9f9' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Note Moyenne
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                {avgRating}
              </Typography>
              <Rating value={Math.round(avgRating)} readOnly size="small" sx={{ mt: 1 }} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total de Feedbacks
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                {feedbacks.length}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Positifs (4-5★)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#8bc34a' }}>
                {ratingDistribution[5] + ratingDistribution[4]}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                À améliorer (1-2★)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                {ratingDistribution[1] + ratingDistribution[2]}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Liste des feedbacks */}
      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          📋 Feedbacks Reçus
        </Typography>
        {feedbacks.map((feedback) => (
          <FeedbackCard
            key={feedback.feedback_id}
            feedback={feedback}
            onReply={loadFeedbacks}
          />
        ))}
      </Box>
    </Box>
  );
};

export default FeedbacksList;
