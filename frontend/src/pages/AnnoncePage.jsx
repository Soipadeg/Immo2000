import '../styles/AnnoncePage.css';
/**
 * Page de détail d'une annonce immobilière
 * Affiche tous les détails du bien avec photos en galerie et annonces similaires
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Card, Modal, Alert, FormContainer } from '@/components';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { annoncesApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import ListingActions from '../components/listings/ListingActions';
import SimilarAnnoncesCarousel from '../components/SimilarAnnoncesCarousel';

const AnnoncePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [annonce, setAnnonce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [openContactModal, setOpenContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    message: '',
  });
  const [userRole] = useState(() => localStorage.getItem('user_role') || 'visiteur');

  // Charger l'annonce
  useEffect(() => {
    loadAnnonce();
    loadFavorites();
  }, [id]);

  const loadAnnonce = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await annoncesApi.getById(id);
      setAnnonce(response.data.annonce || response.data);
    } catch (err) {
      setError('Annonce introuvable ou supprimée');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(favs.includes(parseInt(id)));
    } catch {
      setIsFavorite(false);
    }
  };

  const toggleFavorite = () => {
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const updated = isFavorite
        ? favs.filter((fav) => fav !== parseInt(id))
        : [...favs, parseInt(id)];
      localStorage.setItem('favorites', JSON.stringify(updated));
      setIsFavorite(!isFavorite);
    } catch {
      console.error('Erreur lors de la modification des favoris');
    }
  };

  /**
   * Vérifier si l'utilisateur actuel est propriétaire de l'annonce
   */
  const isOwner = () => {
    if (!user || !annonce) return false;
    return user.id === annonce.utilisateur?.id || user.id === annonce.vendeur_id;
  };

  /**
   * Callback après une action sur l'annonce (delete, publish, archive, etc.)
   */
  const handleListingActionComplete = () => {
    // Recharger l'annonce pour réfléter les changements
    loadAnnonce();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: annonce.titre,
          text: `Découvrez ce bien: ${annonce.titre} - ${annonce.prix.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copier l'URL
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papiers!');
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendContact = async () => {
    if (!contactForm.nom || !contactForm.email || !contactForm.message) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      // TODO: Implémenter l'envoi du message de contact
      console.log('Message de contact:', contactForm);
      alert('Message envoyé avec succès!');
      setOpenContactModal(false);
      setContactForm({ nom: '', email: '', telephone: '', message: '' });
    } catch (err) {
      alert('Erreur lors de l\'envoi du message');
    }
  };

  if (loading) {
    return (
      <div className="annonce-page-container">
        <div className="annonce-loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !annonce) {
    return (
      <div className="annonce-page-container">
        <Alert type="error" title="Erreur" message={error} />
        <div style={{ marginTop: '1rem' }}>
          <Button onClick={() => navigate(-1)} size="small">
            ← Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="annonce-page-container">
      {/* Header avec retour */}
      <div className="annonce-header">
        <Button onClick={() => navigate(-1)} variant="ghost" size="small">
          ← Retour
        </Button>
      </div>

      <div className="annonce-content">
        {/* Colonne gauche: Images et détails */}
        <div className="annonce-left">
          {/* Galerie d'images */}
          {annonce.photos && annonce.photos.length > 0 ? (
            <div className="annonce-gallery">
              {/* Image principale */}
              <div className="gallery-main">
                <img
                  src={annonce.photos[selectedImageIndex]}
                  alt={annonce.titre}
                  className="main-image"
                />

                {/* Badge favori */}
                <button
                  className="favorite-badge"
                  onClick={toggleFavorite}
                  aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  {isFavorite ? '❤️' : '🤍'}
                </button>

                {/* Compteur photos */}
                {annonce.photos.length > 1 && (
                  <div className="photo-counter">
                    {selectedImageIndex + 1} / {annonce.photos.length}
                  </div>
                )}
              </div>

              {/* Miniatures */}
              {annonce.photos.length > 1 && (
                <div className="gallery-thumbnails">
                  {annonce.photos.map((photo, idx) => (
                    <button
                      key={idx}
                      className={`thumbnail ${selectedImageIndex === idx ? 'active' : ''}`}
                      onClick={() => setSelectedImageIndex(idx)}
                      aria-label={`Photo ${idx + 1}`}
                    >
                      <img src={photo} alt={`Miniature ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="gallery-placeholder">
              Pas de photo disponible
            </div>
          )}

          {/* Détails principaux */}
          <Card className="annonce-details-card">
            <div className="details-section">
              <div>{annonce.titre}</div>

              <div className="price-section">
                <div className="price-main">
                  {annonce.prix.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </div>
                <div className="price-sqm">
                  Prix au m²: {(annonce.prix / annonce.surface).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </div>
              </div>

              <hr className="divider" />

              {/* Caractéristiques principales */}
              <div className="features-grid">
                <div className="feature-item">
                  <div className="feature-icon">📐</div>
                  <div className="feature-value">{annonce.surface}m²</div>
                  <div className="feature-label">Surface</div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🚪</div>
                  <div className="feature-value">{annonce.nombre_pieces}</div>
                  <div className="feature-label">Pièces</div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🏠</div>
                  <div className="feature-value">{annonce.type_bien}</div>
                  <div className="feature-label">Type</div>
                </div>
                {annonce.dpe && (
                  <div className="feature-item">
                    <div className="feature-icon">⚡</div>
                    <div className="feature-value">{annonce.dpe}</div>
                    <div className="feature-label">DPE</div>
                  </div>
                )}
              </div>

              {/* Localisation */}
              <div className="location-section">
                <div className="location-header">📍 Localisation</div>
                <div className="location-address">{annonce.adresse}</div>
                <div className="location-city">
                  {annonce.code_postal} {annonce.ville}
                </div>
              </div>

              <hr className="divider" />

              {/* Équipements */}
              {(annonce.ascenseur ||
                annonce.balcon ||
                annonce.terrasse ||
                annonce.jardin ||
                annonce.piscine ||
                annonce.parking) && (
                <div className="amenities-section">
                  <div>Équipements</div>
                  <div className="amenities-list">
                    {annonce.ascenseur && <div className="amenity-badge">🛗 Ascenseur</div>}
                    {annonce.balcon && <div className="amenity-badge">🏠 Balcon</div>}
                    {annonce.terrasse && <div className="amenity-badge">🪴 Terrasse</div>}
                    {annonce.jardin && <div className="amenity-badge">🌳 Jardin</div>}
                    {annonce.piscine && <div className="amenity-badge">🏊 Piscine</div>}
                    {annonce.parking && <div className="amenity-badge">🚗 Parking</div>}
                  </div>
                </div>
              )}

              {/* Informations supplémentaires */}
              <hr className="divider" />

              <div className="info-grid">
                {annonce.annee_construction && (
                  <div className="info-item">
                    <div className="info-label">Année de construction</div>
                    <div className="info-value">{annonce.annee_construction}</div>
                  </div>
                )}
                {annonce.etage !== undefined && annonce.etage !== null && (
                  <div className="info-item">
                    <div className="info-label">Étage</div>
                    <div className="info-value">{annonce.etage}</div>
                  </div>
                )}
                <div className="info-item">
                  <div className="info-label">Annoncée le</div>
                  <div className="info-value">
                    {format(new Date(annonce.date_creation), 'dd MMMM yyyy', { locale: fr })}
                  </div>
                </div>
              </div>

              {/* Description */}
              <hr className="divider" />

              <div className="description-section">
                <div>Description</div>
                <div className="description-text">{annonce.description}</div>

              </div>
            </div>
          </Card>
        </div>

        {/* Colonne droite: Contact vendeur */}
        <div className="annonce-right">
          <Card className="seller-card">
            <div className="seller-section">
              <div>👤 Vendeur</div>

              <div className="seller-info">
                <div className="seller-label">Annonce publiée par</div>
                <div className="seller-name">
                  {annonce.utilisateur?.prenom} {annonce.utilisateur?.nom}
                </div>
              </div>

              <hr className="divider" />

              {/* Boutons d'action propriétaire */}
              {isOwner() && (
                <div className="owner-actions">
                  <div className="action-label" style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                    ⚙️ Gestion de l'annonce
                  </div>
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={() => navigate(`/annonce/${annonce.id}/editer`)}
                    style={{ marginBottom: '10px' }}
                  >
                    ✏️ Éditer
                  </Button>
                  <ListingActions
                    listing={annonce}
                    onActionComplete={handleListingActionComplete}
                    size="sm"
                    variant="secondary"
                    showLabel={true}
                    className="w-100"
                  />
                  <hr className="divider" />
                </div>
              )}

              {/* Boutons d'action standard */}
              <div className="action-label" style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                {isOwner() ? '📧 Commentaires' : '✉️ Contacter'}
              </div>
              <div className="action-buttons">
                <Button
                  fullWidth
                  variant="primary"
                  onClick={() => setOpenContactModal(true)}
                >
                  ✉️ Envoyer un message
                </Button>

                <Button
                  fullWidth
                  variant="secondary"
                  onClick={handleShare}
                >
                  📤 Partager
                </Button>

                <Button
                  fullWidth
                  variant={isFavorite ? 'danger' : 'secondary'}
                  onClick={toggleFavorite}
                >
                  {isFavorite ? '❤️ Retirer des favoris' : '🤍 Ajouter aux favoris'}
                </Button>
              </div>

              {/* Info de contact */}
              <div className="contact-info">
                Vous avez des questions? Contactez le vendeur directement par email ou téléphone.
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Annonces similaires */}
      <SimilarAnnoncesCarousel
        annonceActuelle={annonce}
        userRole={userRole}
      />

      {/* Modal de contact */}
      {openContactModal && (
        <Modal onClose={() => setOpenContactModal(false)}>
          <div className="contact-modal">
            <div>Contacter le vendeur</div>
            <div className="modal-content">
              <Input
                label="Votre nom *"
                name="nom"
                value={contactForm.nom}
                onChange={handleContactChange}
                required
              />
              <Input
                type="email"
                label="Votre email *"
                name="email"
                value={contactForm.email}
                onChange={handleContactChange}
                required
              />
              <Input
                label="Votre téléphone"
                name="telephone"
                value={contactForm.telephone}
                onChange={handleContactChange}
              />
              <div className="textarea-wrapper">
                <textarea
                  name="message"
                  value={contactForm.message}
                  onChange={handleContactChange}
                  placeholder="Décrivez votre intérêt pour ce bien... *"
                  className="contact-textarea"
                  required
                />
              </div>
            </div>
            <div className="modal-actions">
              <Button onClick={() => setOpenContactModal(false)} variant="secondary">
                Annuler
              </Button>
              <Button onClick={handleSendContact} variant="primary">
                Envoyer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AnnoncePage;
