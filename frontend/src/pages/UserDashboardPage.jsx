/**
 * Dashboard Utilisateur (Vendeur/Acheteur)
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, Alert } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import '../styles/UserDashboardPage.css';

const UserDashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !['user', 'admin'].includes(user.role))) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const stats = [
    {
      label: 'Annonces actives',
      value: 12,
      icon: '📝',
      trend: '+2 ce mois',
      trendUp: true
    },
    {
      label: 'Vues totales',
      value: 1245,
      icon: '👁️',
      trend: '+340 cette semaine',
      trendUp: true
    },
    {
      label: 'Messages reçus',
      value: 47,
      icon: '💬',
      trend: '8 non lus',
      trendUp: false
    },
    {
      label: 'Alertes',
      value: 5,
      icon: '🔔',
      trend: '2 nouvelles',
      trendUp: false
    },
  ];

  const annonces = [
    {
      id: 1,
      titre: 'Appartement 3 pièces Paris 15ème',
      prix: 450000,
      ville: 'Paris',
      statut: 'Actif',
      vues: 145,
      messages: 8,
      dateCreation: '2026-03-15',
      progression: 85,
    },
    {
      id: 2,
      titre: 'Maison 4 pièces Lyon Fourvière',
      prix: 380000,
      ville: 'Lyon',
      statut: 'Actif',
      vues: 289,
      messages: 15,
      dateCreation: '2026-02-01',
      progression: 92,
    },
    {
      id: 3,
      titre: 'Studio Marseille Vieux-Port',
      prix: 320000,
      ville: 'Marseille',
      statut: 'Brouillon',
      vues: 0,
      messages: 0,
      dateCreation: '2026-04-20',
      progression: 40,
    },
  ];

  const alertes = [
    {
      id: 1,
      titre: 'Alerte prix',
      description: 'Propriétés similaires trouvées 15% moins chères',
      type: 'warning'
    },
    {
      id: 2,
      titre: 'Alerte localité',
      description: 'Nouvelles annonces dans Paris 15ème',
      type: 'info'
    },
    {
      id: 3,
      titre: 'Offre reçue',
      description: 'Une nouvelle offre pour votre appartement',
      type: 'success'
    },
  ];

  const operations = [
    { label: 'Consulter les guides', icon: '📚' },
    { label: 'Télécharger les modèles', icon: '📁' },
    { label: 'Utiliser le simulateur', icon: '📊' },
  ];

  if (authLoading || loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user || !['user', 'admin'].includes(user.role)) {
    return null;
  }

  return (
    <div className="user-dashboard-page-container">
      {/* En-tête */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">📊 Dashboard</h1>
          <p className="dashboard-subtitle">
            Bienvenue, <strong>{user.prenom} {user.nom}</strong> 👋
          </p>
        </div>
        <Button
          variant="primary"
          size="medium"
          onClick={() => navigate('/annonces/create')}
        >
          ➕ Créer une annonce
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <Card key={index} className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-text">
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value">{stat.value.toLocaleString('fr-FR')}</h3>
                <p className={`stat-trend ${stat.trendUp ? 'up' : 'down'}`}>
                  {stat.trendUp ? '📈' : '📉'} {stat.trend}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Contenu principal - Onglets */}
      <Card className="tabs-card">
        <div className="tabs-nav">
          <button
            className={`tab-button ${tabValue === 0 ? 'active' : ''}`}
            onClick={() => setTabValue(0)}
          >
            🔍 Mes annonces
          </button>
          <button
            className={`tab-button ${tabValue === 1 ? 'active' : ''}`}
            onClick={() => setTabValue(1)}
          >
            🔔 Mes alertes
          </button>
        </div>

        <div className="tabs-content">
          {/* Onglet Annonces */}
          {tabValue === 0 && (
            <div className="tab-pane">
              {annonces.length === 0 ? (
                <Alert type="info" title="Aucune annonce" message="Créer votre première annonce" />
              ) : (
                <div className="annonces-list">
                  {annonces.map((annonce) => (
                    <Card key={annonce.id} className="annonce-item">
                      <div className="annonce-header">
                        <div>
                          <h3 className="annonce-title">{annonce.titre}</h3>
                          <p className="annonce-location">
                            📍 {annonce.ville} • Créée le {new Date(annonce.dateCreation).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span className={`status-chip ${annonce.statut === 'Actif' ? 'active' : 'draft'}`}>
                          {annonce.statut}
                        </span>
                      </div>

                      <h2 className="annonce-price">
                        {annonce.prix.toLocaleString('fr-FR')} €
                      </h2>

                      <div className="progression-section">
                        <div className="progression-header">
                          <span className="progression-label">Progression du profil</span>
                          <span className="progression-value">{annonce.progression}%</span>
                        </div>
                        <div className="progression-bar">
                          <div
                            className="progression-fill"
                            style={{ width: `${annonce.progression}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="annonce-stats">
                        <div className="stat-item">👁️ {annonce.vues} vues</div>
                        <div className="stat-item">💬 {annonce.messages} messages</div>
                      </div>

                      <div className="annonce-actions">
                        <Button size="small" variant="primary">👁️ Voir</Button>
                        <Button size="small" variant="secondary">✏️ Éditer</Button>
                        <Button size="small" variant="danger">🗑️ Supprimer</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Alertes */}
          {tabValue === 1 && (
            <div className="tab-pane">
              {alertes.length === 0 ? (
                <Alert type="info" title="Aucune alerte" message="Aucune alerte pour le moment" />
              ) : (
                <div className="alertes-list">
                  {alertes.map((alerte) => (
                    <Alert
                      key={alerte.id}
                      type={alerte.type}
                      title={alerte.titre}
                      message={alerte.description}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Sections rapides */}
      <div className="dashboard-sections">
        <div className="section-resources">
          <Card>
            <div className="card-header">
              <h2 className="card-title">📚 Ressources utiles</h2>
            </div>
            <div className="resources-grid">
              {operations.map((op, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  className="resource-button"
                >
                  {op.icon} {op.label}
                </Button>
              ))}
            </div>
          </Card>
        </div>

        <div className="section-settings">
          <Card>
            <div className="card-header">
              <h2 className="card-title">⚙️ Paramètres</h2>
            </div>
            <div className="settings-buttons">
              <Button
                variant="secondary"
                onClick={() => navigate('/profile')}
              >
                ⚙️ Profil
              </Button>
              <Button variant="secondary">
                📥 Télécharger données
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;

export default UserDashboardPage;
