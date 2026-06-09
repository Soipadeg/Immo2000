import '../styles/NotaireDashboardPage.css';
import React, { useState, useEffect } from 'react';
import { Button, Alert, Card } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { notairesApi } from '../services/api/transactions';

const NotaireDashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dossiers, setDossiers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'notaire')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadDossiers = async () => {
      try {
        setLoading(true);
        const response = await notairesApi.getDossiers();
        setDossiers(response.data || []);
      } catch (err) {
        console.error('Error loading dossiers:', err);
        setError('Erreur lors du chargement des dossiers');
      } finally {
        setLoading(false);
      }
    };
    loadDossiers();
  }, []);

  // Calculate statistics
  const stats = [
    {
      label: 'Dossiers actifs',
      value: dossiers.filter(d => d.statut === 'en_cours').length,
      icon: '📋',
      trend: 'En traitement'
    },
    {
      label: 'Documents à signer',
      value: dossiers.filter(d => d.statut === 'signature_en_attente').length,
      icon: '✍️',
      trend: 'En attente de signature'
    },
    {
      label: 'Transactions complétées',
      value: dossiers.filter(d => d.statut === 'completee').length,
      icon: '✅',
      trend: 'Ce mois-ci'
    },
    {
      label: 'Dossiers totaux',
      value: dossiers.length,
      icon: '📊',
      trend: 'Tous les statuts'
    },
  ];

  // Group dossiers by status
  const dossierEnCours = dossiers.filter(d => d.statut === 'en_cours' || !d.statut);
  const dossierSignature = dossiers.filter(d => d.statut === 'signature_en_attente');
  const dossierCompletee = dossiers.filter(d => d.statut === 'completee');

  const handleViewDossier = (dossierId) => {
    navigate(`/notaire/dossier/${dossierId}`);
  };

  const handleCreateDossier = () => {
    navigate('/notaire/nouveau-dossier');
  };

  if (authLoading || loading) {
    return (
      <div className="notaire-dashboard-page-container">
        <div className="loading-page">
          <div className="spinner"></div>
          <p>⏳ Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'notaire') {
    return null;
  }

  return (
    <div className="notaire-dashboard-page-container">
      {/* Page Header Banner */}
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">⚖️</span>
            <h1>Dashboard Notaire</h1>
          </div>
          <p>Gérez vos dossiers de transactions et documents notariés</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError(null)}
          style={{ marginBottom: '1.5rem' }}
        />
      )}
      {success && (
        <Alert
          type="success"
          message={success}
          onClose={() => setSuccess(null)}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* Quick Stats */}
      {dossiers.length > 0 && (
        <div className="dashboard-quick-stats">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <span className="stat-icon">{stat.icon}</span>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-trend">{stat.trend}</div>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard Modules */}
      <div className="dashboard-modules">
        {/* Dossiers en cours */}
        <Card className="module-card">
          <div className="module-header">
            <span className="module-icon">📋</span>
            <h3 className="module-title">Dossiers en cours</h3>
          </div>
          <div className="module-content">
            {dossierEnCours.length > 0 ? (
              <div className="module-list">
                {dossierEnCours.slice(0, 5).map((dossier) => (
                  <div key={dossier.id || dossier.transaction_notaire_id} className="module-item">
                    <div className="module-item-content">
                      <div className="module-item-title">
                        {dossier.titre || dossier.annonce_titre || 'Dossier sans titre'}
                      </div>
                      <div className="module-item-subtitle">
                        {dossier.client_nom || 'Client'} • Créé le{' '}
                        {dossier.date_creation ? new Date(dossier.date_creation).toLocaleDateString('fr-FR') : 'N/A'}
                      </div>
                    </div>
                    <span className="module-item-status active">En cours</span>
                    <button
                      className="module-action"
                      onClick={() => handleViewDossier(dossier.id || dossier.transaction_notaire_id)}
                      title="Voir le dossier"
                    >
                      →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="module-empty">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                <p>Aucun dossier en cours</p>
              </div>
            )}
            <div className="module-footer">
              <Button
                variant="primary"
                size="small"
                onClick={handleCreateDossier}
                style={{ width: '100%' }}
              >
                ➕ Nouveau dossier
              </Button>
            </div>
          </div>
        </Card>

        {/* Documents à signer */}
        <Card className="module-card">
          <div className="module-header">
            <span className="module-icon">✍️</span>
            <h3 className="module-title">En attente de signature</h3>
          </div>
          <div className="module-content">
            {dossierSignature.length > 0 ? (
              <div className="module-list">
                {dossierSignature.slice(0, 5).map((dossier) => (
                  <div key={dossier.id || dossier.transaction_notaire_id} className="module-item">
                    <div className="module-item-content">
                      <div className="module-item-title">
                        {dossier.titre || dossier.annonce_titre || 'Document sans titre'}
                      </div>
                      <div className="module-item-subtitle">
                        Signataire: {dossier.client_nom || 'N/A'} • Signé: 0/{dossier.nb_signataires || 1}
                      </div>
                    </div>
                    <span className="module-item-status pending">Attente</span>
                    <button
                      className="module-action"
                      onClick={() => handleViewDossier(dossier.id || dossier.transaction_notaire_id)}
                      title="Consulter"
                    >
                      →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="module-empty">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <p>Aucun document en attente de signature</p>
              </div>
            )}
          </div>
        </Card>

        {/* Transactions complétées */}
        <Card className="module-card">
          <div className="module-header">
            <span className="module-icon">✅</span>
            <h3 className="module-title">Transactions complétées</h3>
          </div>
          <div className="module-content">
            {dossierCompletee.length > 0 ? (
              <div className="module-list">
                {dossierCompletee.slice(0, 5).map((dossier) => (
                  <div key={dossier.id || dossier.transaction_notaire_id} className="module-item">
                    <div className="module-item-content">
                      <div className="module-item-title">
                        {dossier.titre || dossier.annonce_titre || 'Dossier sans titre'}
                      </div>
                      <div className="module-item-subtitle">
                        Complétée le{' '}
                        {dossier.date_completion
                          ? new Date(dossier.date_completion).toLocaleDateString('fr-FR')
                          : 'N/A'}
                      </div>
                    </div>
                    <span className="module-item-status completed">Complétée</span>
                    <button
                      className="module-action"
                      onClick={() => handleViewDossier(dossier.id || dossier.transaction_notaire_id)}
                      title="Consulter"
                    >
                      →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="module-empty">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                <p>Aucune transaction complétée</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Empty State - No dossiers at all */}
      {dossiers.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2 className="empty-state-title">Aucun dossier pour le moment</h2>
          <p className="empty-state-message">Créez votre premier dossier notarié pour commencer</p>
          <Button
            variant="primary"
            size="medium"
            onClick={handleCreateDossier}
          >
            ➕ Créer un dossier
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotaireDashboardPage;
