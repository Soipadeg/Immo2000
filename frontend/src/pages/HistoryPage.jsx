import '../styles/HistoryPage.css';
/**
 * Page Historique - Biens consultés et annonces contactées
 */

import React, { useState } from 'react';
import { Button, Alert } from '@/components';
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
      <div className="history-container">
        <div className="loading-spinner">⏳ Chargement...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <div className="history-page">
      <div className="page-header">
        <h1>📋 Historique</h1>
      </div>

      <div className="history-card">
        <div className="tabs-nav">
          {[
            { label: `Biens consultés (${viewedAnnonces.length})`, icon: '👀', index: 0 },
            { label: `Annonces contactées (${contactedAnnonces.length})`, icon: '💬', index: 1 },
          ].map((tab) => (
            <button
              key={tab.index}
              className={`tab-btn ${tabValue === tab.index ? 'active' : ''}`}
              onClick={() => setTabValue(tab.index)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Biens consultés */}
        {tabValue === 0 && (
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
                <div className="table-cell">{annonce.titre}</div>
                <div className="table-cell"><span className="type-badge">{annonce.type}</span></div>
                <div className="table-cell">{annonce.ville}</div>
                <div className="table-cell price">{annonce.prix.toLocaleString()}€</div>
                <div className="table-cell">{new Date(annonce.date).toLocaleDateString('fr-FR')}</div>
                <div className="table-cell"><a href={`/annonce/${annonce.id}`} className="action-link">Voir</a></div>
              </div>
            ))}
          </div>
        )}

        {/* Annonces contactées */}
        {tabValue === 1 && (
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
                <div className="table-cell">{annonce.titre}</div>
                <div className="table-cell">{annonce.ville}</div>
                <div className="table-cell">{annonce.vendeur}</div>
                <div className="table-cell">{new Date(annonce.dateContact).toLocaleDateString('fr-FR')}</div>
                <div className="table-cell">
                  <span className={`status-badge status-${annonce.statut === 'Répondu' ? 'replied' : 'pending'}`}>
                    {annonce.statut}
                  </span>
                </div>
                <div className="table-cell"><button className="action-btn">Voir messages</button></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(tabValue === 0 && viewedAnnonces.length === 0) || (tabValue === 1 && contactedAnnonces.length === 0) ? (
        <div className="empty-state">
          <h3>{tabValue === 0 ? 'Aucun bien consulté' : 'Aucune annonce contactée'}</h3>
          <p>
            {tabValue === 0 ? 'pour le moment' : 'pour le moment'}
          </p>
          <a href="/search" className="link-button">Consulter les annonces</a>
        </div>
      ) : null}
    </div>
  );
};

export default HistoryPage;
