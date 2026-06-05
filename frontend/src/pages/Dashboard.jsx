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
 * ONGLET 4 : ALERTES - Gestion des alertes immobilières
 */
function AlertesTab() {
  const [alertes, setAlertes] = useState([
    {
      id: 1,
      titre: 'Alertes pour Paris (75001)',
      criteres: 'Appartement, 3+ pièces, max 500k€',
      active: true,
      derniereVerification: '2 heures ago',
      nouvelles: 2,
    },
    {
      id: 2,
      titre: 'Alertes pour Lyon',
      criteres: 'Maison, 4+ pièces, max 400k€',
      active: false,
      derniereVerification: '3 jours ago',
      nouvelles: 0,
    },
  ]);

  const [loading, setLoading] = useState(false);

  const handleToggleAlerte = (id) => {
    setAlertes(alertes.map(a =>
      a.id === id ? { ...a, active: !a.active } : a
    ));
  };

  const handleDeleteAlerte = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) {
      setAlertes(alertes.filter(a => a.id !== id));
    }
  };

  return (
    <div className="tab-section">
      <div className="section-header">
        <div>🔔 Alertes immobilières</div>
        <Button variant="primary">
          ➕ Créer une alerte
        </Button>
      </div>

      {alertes.length === 0 ? (
        <Card className="empty-card">
          <div className="card-content">
            <div className="empty-text">Aucune alerte pour le moment</div>
            <Button variant="primary">Créer votre première alerte</Button>
          </div>
        </Card>
      ) : (
        <div className="alertes-list">
          {alertes.map((alerte) => (
            <Card key={alerte.id} className="alerte-card">
              <div className="alerte-header">
                <div>
                  <h3>{alerte.titre}</h3>
                  <p className="alerte-criteres">{alerte.criteres}</p>
                </div>
                <div className="alerte-toggle">
                  <input
                    type="checkbox"
                    checked={alerte.active}
                    onChange={() => handleToggleAlerte(alerte.id)}
                    style={{ width: '20px', height: '20px' }}
                  />
                </div>
              </div>
              <div className="alerte-footer">
                <div className="alerte-info">
                  <span>📅 {alerte.derniereVerification}</span>
                  {alerte.nouvelles > 0 && (
                    <span className="new-badge">🆕 {alerte.nouvelles} nouveau(x)</span>
                  )}
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteAlerte(alerte.id)}
                >
                  🗑️
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ONGLET 5 : FAVORIS - Bien aimés
 */
function FavorisTab() {
  const [favoris, setFavoris] = useState([
    {
      id: 1,
      titre: 'Bel appartement 3 pièces à Paris',
      prix: 450000,
      surface: 85,
      adresse: '123 Rue de Paris, 75001 Paris',
      photo: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
      ajouteLE: '5 jours',
    },
    {
      id: 2,
      titre: 'Maison avec jardin à Lyon',
      prix: 580000,
      surface: 120,
      adresse: '45 Rue Leblanc, 69002 Lyon',
      photo: 'https://images.unsplash.com/photo-1570129477492-45a003537e1c?w=300&h=200&fit=crop',
      ajouteLE: '2 semaines',
    },
  ]);

  const handleRemoveFavori = (id) => {
    setFavoris(favoris.filter(f => f.id !== id));
  };

  return (
    <div className="tab-section">
      <div className="section-header">
        <div>⭐ Mes favoris</div>
      </div>

      {favoris.length === 0 ? (
        <Card className="empty-card">
          <div className="card-content">
            <div className="empty-text">Aucun favori pour le moment</div>
            <Button variant="primary">Parcourir les annonces</Button>
          </div>
        </Card>
      ) : (
        <div className="favoris-grid">
          {favoris.map((favori) => (
            <Card key={favori.id} className="favori-card">
              <div className="favori-image" style={{
                backgroundImage: `url(${favori.photo})`,
              }}>
                <button
                  className="remove-favori-btn"
                  onClick={() => handleRemoveFavori(favori.id)}
                  title="Retirer des favoris"
                >
                  ❤️
                </button>
              </div>
              <div className="favori-content">
                <h3>{favori.titre}</h3>
                <p className="favori-adresse">📍 {favori.adresse}</p>
                <div className="favori-details">
                  <span className="price">💰 {favori.prix.toLocaleString('fr-FR')} €</span>
                  <span className="surface">📐 {favori.surface} m²</span>
                </div>
                <div className="favori-footer">
                  <small>Ajouté il y a {favori.ajouteLE}</small>
                  <Button size="small" variant="primary">Voir</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ONGLET 6 : HISTORIQUE - Biens consultés
 */
function HistoriqueTab() {
  const [historique, setHistorique] = useState([
    {
      id: 1,
      titre: 'Appartement 2 pièces à Marseille',
      prix: 250000,
      surface: 65,
      adresse: '78 Rue de la Plage, 13001 Marseille',
      consulteLE: 'Aujourd\'hui à 14:30',
      type: 'Appartement',
    },
    {
      id: 2,
      titre: 'Studio moderne à Bordeaux',
      prix: 180000,
      surface: 35,
      adresse: '22 Rue Fondaudège, 33000 Bordeaux',
      consulteLE: 'Hier à 10:15',
      type: 'Studio',
    },
    {
      id: 3,
      titre: 'Maison de village à Provence',
      prix: 320000,
      surface: 95,
      adresse: 'Vaucluse, 84000',
      consulteLE: '2 jours ago',
      type: 'Maison',
    },
  ]);

  const handleClearHistorique = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      setHistorique([]);
    }
  };

  return (
    <div className="tab-section">
      <div className="section-header">
        <div>📋 Historique de consultation</div>
        {historique.length > 0 && (
          <Button variant="secondary" onClick={handleClearHistorique}>
            Effacer l'historique
          </Button>
        )}
      </div>

      {historique.length === 0 ? (
        <Card className="empty-card">
          <div className="card-content">
            <div className="empty-text">Aucun historique pour le moment</div>
          </div>
        </Card>
      ) : (
        <div className="historique-list">
          {historique.map((item) => (
            <Card key={item.id} className="historique-item">
              <div className="item-content">
                <div>
                  <h3>{item.titre}</h3>
                  <p className="item-type">{item.type}</p>
                  <p className="item-adresse">📍 {item.adresse}</p>
                </div>
                <div className="item-details">
                  <div className="price">💰 {item.prix.toLocaleString('fr-FR')} €</div>
                  <div className="surface">📐 {item.surface} m²</div>
                </div>
              </div>
              <div className="item-footer">
                <small className="date">🕐 {item.consulteLE}</small>
                <Button size="small" variant="primary">Revoir</Button>
              </div>
            </Card>
          ))}
        </div>
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
            <button
              className={`tab-button ${tabValue === 3 ? 'active' : ''}`}
              onClick={() => setTabValue(3)}
            >
              🔔 Alertes
            </button>
            <button
              className={`tab-button ${tabValue === 4 ? 'active' : ''}`}
              onClick={() => setTabValue(4)}
            >
              ⭐ Favoris
            </button>
            <button
              className={`tab-button ${tabValue === 5 ? 'active' : ''}`}
              onClick={() => setTabValue(5)}
            >
              📋 Historique
            </button>
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

          <TabPanel value={tabValue} index={3}>
            <AlertesTab />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <FavorisTab />
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <HistoriqueTab />
          </TabPanel>
        </div>
      </FormContainer>
    </>
  );
}
