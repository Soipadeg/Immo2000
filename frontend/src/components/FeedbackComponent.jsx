/**
 * Composant pour afficher et gérer les feedbacks de visite
 * Peut être intégré dans VisitesPage ou standalone
 */

import React, { useState, useEffect } from 'react';
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
    <div className="card">
      <div>
        📝 Donner votre avis sur la visite
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div>
        <div>
          Votre note
        </div>
        <Rating
          value={formData.rating}
          onChange={(e, value) => setFormData({ ...formData, rating: value })}
          size="large"
        />
      </div>

      <TextField
        fullWidth
        label="Commentaire (optionnel)"
        multiline
        rows={3}
        value={formData.commentaire}
        onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
        placeholder="Partager votre expérience avec cette propriété..."
      />

      <button variant="contained"
        color="primary"
        disabled={loading}
        onClick={handleSubmit}
        fullWidth
      >
        {loading ? <div class="spinner"></div> : 'Envoyer mon avis'}
      </button>
    </div>
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
      <Card>
        <CardContent>
          {/* En-tête avec avatar et infos */}
          <div>
            <Avatar
            >
              {feedback.acheteur_nom?.[0]?.toUpperCase() || 'A'}
            </Avatar>
            <div>
              <div>
                {feedback.acheteur_nom || 'Utilisateur anonyme'}
              </div>
              <div>
                {new Date(feedback.date_creation).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <Rating value={feedback.rating} readOnly size="small" />
            <div>
              {['Très mauvais', 'Mauvais', 'Acceptable', 'Bon', 'Excellent'][feedback.rating - 1]}
            </div>
          </div>

          {/* Commentaire */}
          {feedback.commentaire && (
            <div>
              {feedback.commentaire}
            </div>
          )}

          {/* Réponse du vendeur */}
          {feedback.reponse_vendeur && (
            <div
            >
              <div>
                ✓ Réponse du vendeur
              </div>
              <div>
                {feedback.reponse_vendeur}
              </div>
            </div>
          )}
        </CardContent>

        <CardActions>
          {!feedback.reponse_vendeur && (
            <button size="small"
              startIcon={<ReplyIcon />}
              onClick={() => setReplyDialogOpen(true)}
            >
              Répondre
            </button>
          )}
        </CardActions>
      </Card>

      {/* Dialog de réponse */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} fullWidth>
        <div>Répondre au feedback</div>
        <div>
          <div>
            Feedback de {feedback.acheteur_nom}: "{feedback.commentaire}"
          </div>
          <TextField
            fullWidth
            label="Votre réponse"
            multiline
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Répondez au feedback du visiteur..."
          />
        </div>
        <div>
          <button onClick={() => setReplyDialogOpen(false)}>Annuler</button>
          <button onClick={handleReply}
            variant="contained"
            color="primary"
            disabled={!replyText.trim() || loading}
          >
            {loading ? <div class="spinner"></div> : 'Envoyer'}
          </button>
        </div>
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
      <div>
        <div class="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (feedbacks.length === 0) {
    return (
      <div className="card">
        <div>
          Aucun feedback reçu pour le moment
        </div>
      </div>
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
      <div className="card">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <div>
              <div>
                Note Moyenne
              </div>
              <div>
                {avgRating}
              </div>
              <Rating value={Math.round(avgRating)} readOnly size="small" />
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <div>
              <div>
                Total de Feedbacks
              </div>
              <div>
                {feedbacks.length}
              </div>
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <div>
              <div>
                Positifs (4-5★)
              </div>
              <div>
                {ratingDistribution[5] + ratingDistribution[4]}
              </div>
            </div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <div>
              <div>
                À améliorer (1-2★)
              </div>
              <div>
                {ratingDistribution[1] + ratingDistribution[2]}
              </div>
            </div>
          </Grid>
        </Grid>
      </div>

      {/* Liste des feedbacks */}
      <Box>
        <div>
          📋 Feedbacks Reçus
        </div>
        {feedbacks.map((feedback) => (
          <FeedbackCard
            key={feedback.feedback_id}
            feedback={feedback}
            onReply={loadFeedbacks}
          />
        ))}
      </div>
    </div>
  );
};

export default FeedbacksList;
