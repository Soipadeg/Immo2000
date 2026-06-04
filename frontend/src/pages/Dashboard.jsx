import '../styles/Dashboard.css';
/**
 * Dashboard principal avec 3 onglets : Achat, Vente, Messagerie
 * Route: /dashboard
 * Protégé par JWT (hook useAuth)
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, FormContainer } from '@/components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getMesAnnonces } from '../services/api';

/**
 * Composant Tab Panel
 */
function TabPanel(props) {
  const { children, value, index } = props;
  return (
    <div hidden={value !== index} role="tabpanel" className="tab-content">
      {value === index && <div className="tab-pane">{children}</div>}
    </div>
  );
}

/**
 * ONGLET 1 : ACHAT - Recherche et favoris
 */
function AchatTab() {
  return (
    <div className="tab-section">
      <div>🔍 Rechercher un bien</div>

      <Alert type="info" title="Fonctionnalité" message="Les fonctionnalités de recherche et de favoris seront bientôt disponibles !" />

      <Card className="empty-card">
        <div className="card-content">
          <div className="empty-text">Cherchez votre bien idéal parmi nos annonces</div>
          <Button variant="primary">Consulter les annonces</Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * ONGLET 2 : VENTE - Gestion des annonces
 */
function VenteTab({ user }) {
  const navigate = useNavigate();
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('tous'); // tous, brouillons, publiees

  useEffect(() => {
    loadAnnonces();
  }, [filter]);

  const loadAnnonces = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (filter === 'brouillons') {
        params.statut = 'brouillon';
      } else if (filter === 'publiees') {
        params.statut = 'publiée';
      }

      const response = await getMesAnnonces(params);
      setAnnonces(response.annonces || []);
    } catch (err) {
      setError('Erreur lors du chargement des annonces');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnonce = async (annonceId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      console.log('Supprimer annonce:', annonceId);
    }
  };

  return (
    <div className="tab-section">
      <div className="section-header">
        <div>📝 Mes annonces</div>
        <Button
          variant="primary"
          onClick={() => navigate('/creer-annonce/etape1')}
        >
          ➕ Créer une annonce
        </Button>
      </div>

      {error && <Alert type="error" title="Erreur" message={error} />}

      {/* Filtres */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'tous' ? 'active' : ''}`}
          onClick={() => setFilter('tous')}
        >
          Toutes ({annonces.length})
        </button>
        <button
          className={`filter-btn ${filter === 'brouillons' ? 'active' : ''}`}
          onClick={() => setFilter('brouillons')}
        >
          Brouillons
        </button>
        <button
          className={`filter-btn ${filter === 'publiees' ? 'active' : ''}`}
          onClick={() => setFilter('publiees')}
        >
          Publiées
        </button>
      </div>

      {/* Chargement */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      )}

      {/* Liste vide */}
      {!loading && annonces.length === 0 && (
        <Card className="empty-card">
          <div className="card-content">
            <div className="empty-text">
              Vous n'avez pas encore d'annonce {filter !== 'tous' ? `en ${filter}` : ''}
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/creer-annonce/etape1')}
            >
              ➕ Créer votre première annonce
            </Button>
          </div>
        </Card>
      )}

      {/* Annonces */}
      {!loading && annonces.length > 0 && (
        <div className="announcements-grid">
          {annonces.map((annonce) => (
            <Card key={annonce.annonce_id} className="announcement-card">
              {/* Image */}
              <div
                className="card-image"
                style={{
                  backgroundImage: annonce.photos_list?.length
                    ? `url(${annonce.photos_list[0]?.url})`
                    : 'none',
                }}
              >
                <div className={`status-badge ${annonce.statut === 'publiée' ? 'published' : 'draft'}`}>
                  {annonce.statut.toUpperCase()}
                </div>
              </div>

              <div className="card-body">
                <div>{annonce.titre}</div>

                <div className="card-location">📍 {annonce.adresse}, {annonce.code_postal}</div>


                {/* Détails */}
                <div className="card-details">
                  {annonce.prix && (
                    <div className="detail-badge">
                      💰 {annonce.prix.toLocaleString('fr-FR')} €
                    </div>
                  )}
                  {annonce.surface && (
                    <div className="detail-badge">
                      📐 {annonce.surface} m²
                    </div>
                  )}
                  {annonce.nombre_pieces && (
                    <div className="detail-badge">
                      🚪 {annonce.nombre_pieces} pièces
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="card-actions">
                  {annonce.statut === 'brouillon' && (
                    <Button
                      size="small"
                      variant="primary"
                      onClick={() =>
                        navigate(`/creer-annonce/etape4?annonce_id=${annonce.annonce_id}`)
                      }
                    >
                      Continuer
                    </Button>
                  )}
                  {annonce.statut === 'publiée' && (
                    <Button
                      size="small"
                      variant="secondary"
                    >
                      👁️ Voir
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="danger"
                    onClick={() => handleDeleteAnnonce(annonce.annonce_id)}
                  >
                    🗑️ Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Contrat d'exclusivité */}
      {user?.has_exclusivity_contract && (
        <Alert
          type="success"
          title="✅ Contrat d'exclusivité signé !"
          message="Vous avez accès aux outils IA futurs pour optimiser la vente de vos biens. Une section dédiée aux outils IA sera bientôt disponible."
        />
      )}

      {!user?.has_exclusivity_contract && (
        <Alert
          type="info"
          title="🤖 Boostez vos ventes !"
          message="Signez un contrat d'exclusivité pour accéder à nos outils IA futurs (matching intelligent, estimation automatique, gestion d'agenda, etc.). Commission: 1.5% en cas de vente seulement."
        />
      )}
    </div>
  );
}

/**
 * ONGLET 3 : MESSAGERIE
 */
function MessagerieTab() {
  const messages = [
    {
      id: 1,
      from: 'Marie Dupont',
      subject: 'Intéressée par votre appartement',
      preview: 'Bonjour, je suis très intéressée par votre appartement à Paris...',
      date: '15 mai 2026',
      unread: true,
    },
    {
      id: 2,
      from: 'Jean Martin',
      subject: 'Questions sur le bien',
      preview: 'Pourriez-vous me donner plus d\'informations sur le chauffage...',
      date: '14 mai 2026',
      unread: false,
    },
  ];

  return (
    <div className="tab-section">
      <div>💬 Messages</div>

      <div className="messages-list">
        {messages.map((msg, idx) => (
          <div key={msg.id}>
            <div className={`message-item ${msg.unread ? 'unread' : ''}`}>
              <div className="message-content">
                <div className="message-from" style={{ fontWeight: msg.unread ? 'bold' : 'normal' }}>
                  {msg.from}
                </div>
                <div className="message-subject">{msg.subject}</div>
                <div className="message-preview">{msg.preview}</div>
              </div>
              <div className="message-date">{msg.date}</div>
            </div>
            {idx < messages.length - 1 && <div className="divider"></div>}
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <Card className="empty-card">
          <div className="card-content">
            <div className="empty-text">Aucun message pour le moment</div>
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * COMPOSANT PRINCIPAL : DASHBOARD
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // Récupérer l'onglet depuis l'URL (tab=achat, vente, messagerie)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'achat') setTabValue(0);
    else if (tabParam === 'vente') setTabValue(1);
    else if (tabParam === 'messagerie') setTabValue(2);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {/* Animated Header - Exact same structure as SearchPage */}
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">📊</span>
            <h1>Bienvenue, {user?.prenom} !</h1>
          </div>
          <p>Gérez vos annonces, recherches et messages en un seul endroit</p>
        </div>
      </div>

      <FormContainer maxWidth="full-width">
        {/* Onglets */}
        <div className="dashboard-tabs">
        <div className="tabs-nav">
          <button
            className={`tab-button ${tabValue === 0 ? 'active' : ''}`}
            onClick={() => setTabValue(0)}
          >
            🛒 Achat
          </button>
          <button
            className={`tab-button ${tabValue === 1 ? 'active' : ''}`}
            onClick={() => setTabValue(1)}
          >
            🏠 Vente
          </button>
          <button
            className={`tab-button ${tabValue === 2 ? 'active' : ''}`}
            onClick={() => setTabValue(2)}
          >
            💬 Messagerie
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      <TabPanel value={tabValue} index={0}>
        <AchatTab />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <VenteTab user={user} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <MessagerieTab />
      </TabPanel>
      </FormContainer>
    </>
  );
}
