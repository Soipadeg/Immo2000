import '../styles/HistoryPage.css';
/**
 * Page Historique - Biens consultés et annonces contactées
 * Affichage avec interface harmonisée
 */

import React, { useState } from 'react';
import { Button, Alert, Card } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const HistoryPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const viewedAnnonces = [
    { id: 1, titre: 'Maison avec jardin', ville: 'Paris', date: '2026-05-11', prix: 450000, type: 'Maison' },
    { id: 2, titre: 'Appartement moderne', ville: 'Lyon', date: '2026-05-10', prix: 350000, type: 'Appartement' },
    { id: 3, titre: 'Studio en centre-ville', ville: 'Marseille', date: '2026-05-09', prix: 150000, type: 'Studio' },
  ];

  const contactedAnnonces = [
    { id: 1, titre: 'Maison avec jardin', ville: 'Paris', dateContact: '2026-05-11', statut: 'En attente', vendeur: 'Jean D.' },
    { id: 2, titre: 'Villa luxe', ville: 'Côte d\'Azur', dateContact: '2026-05-08', statut: 'Répondu', vendeur: 'Marie L.' },
  ];

  if (loading) {
    return (
      <div className="history-page-container">
        <div className="loading-page">
          <div className="spinner"></div>
          <p>⏳ Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="history-page-container">
      {/* Page Header Banner */}
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">📋</span>
            <h1>Historique</h1>
          </div>
          <p>Consultez vos biens visités et vos contacts</p>
        </div>
      </div>

      {/* Conteneur des onglets */}}
      <Card className="tabs-card">
        <div className="tabs-nav">
          {[
            { label: `Biens consultés (${viewedAnnonces.length})`, icon: '👀', index: 0 },
            { label: `Annonces contactées (${contactedAnnonces.length})`, icon: '💬', index: 1 },
          ].map((tab) => (
            <button
              key={tab.index}
              className={`tab-button ${tabValue === tab.index ? 'active' : ''}`}
              onClick={() => setTabValue(tab.index)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="tabs-content">
          {/* Biens consultés */}
          {tabValue === 0 && (
            <>
              {viewedAnnonces.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👀</div>
                  <h3>Aucun bien consulté</h3>
                  <p>Explorez les annonces pour commencer</p>
                  <a href="/search" className="cta-button">Consulter les annonces</a>
                </div>
              ) : (
                <div className="table-wrapper">
                  <div className="table-header">
                    <div className="table-cell">Annonce</div>
                    <div className="table-cell">Type</div>
                    <div className="table-cell">Localité</div>
                    <div className="table-cell">Prix</div>
                    <div className="table-cell">Date de visite</div>
                    <div className="table-cell">Actions</div>
                  </div>
                  {viewedAnnonces.map((annonce) => (
                    <div key={annonce.id} className="table-row">
                      <div className="table-cell"><strong>{annonce.titre}</strong></div>
                      <div className="table-cell"><span className="type-badge">{annonce.type}</span></div>
                      <div className="table-cell">{annonce.ville}</div>
                      <div className="table-cell price">{annonce.prix.toLocaleString()}€</div>
                      <div className="table-cell">{new Date(annonce.date).toLocaleDateString('fr-FR')}</div>
                      <div className="table-cell">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => navigate(`/annonce/${annonce.id}`)}
                        >
                          Voir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Annonces contactées */}
          {tabValue === 1 && (
            <>
              {contactedAnnonces.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <h3>Aucune annonce contactée</h3>
                  <p>Contactez les vendeurs pour commencer</p>
                  <a href="/search" className="cta-button">Trouver des annonces</a>
                </div>
              ) : (
                <div className="table-wrapper">
                  <div className="table-header">
                    <div className="table-cell">Annonce</div>
                    <div className="table-cell">Localité</div>
                    <div className="table-cell">Vendeur</div>
                    <div className="table-cell">Date de contact</div>
                    <div className="table-cell">Statut</div>
                    <div className="table-cell">Actions</div>
                  </div>
                  {contactedAnnonces.map((annonce) => (
                    <div key={annonce.id} className="table-row">
                      <div className="table-cell"><strong>{annonce.titre}</strong></div>
                      <div className="table-cell">{annonce.ville}</div>
                      <div className="table-cell">{annonce.vendeur}</div>
                      <div className="table-cell">{new Date(annonce.dateContact).toLocaleDateString('fr-FR')}</div>
                      <div className="table-cell">
                        <span className={`status-badge status-${annonce.statut === 'Répondu' ? 'replied' : 'pending'}`}>
                          {annonce.statut}
                        </span>
                      </div>
                      <div className="table-cell">
                        <Button
                          variant="secondary"
                          size="small"
                        >
                          💬 Messages
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default HistoryPage;
