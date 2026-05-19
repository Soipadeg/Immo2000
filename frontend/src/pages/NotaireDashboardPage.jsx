import '../styles/NotaireDashboardPage.css';
/**
 * Dashboard Notaire - Gestion des dossiers et documents
 */

import React, { useState, useEffect } from 'react';
import { Button, Alert, Card } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { notairesApi } from '../services/api/transactions';

const NotaireDashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dossiers, setDossiers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'notaire')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Load dossiers from API
  useEffect(() => {
    if (user && user.notaire_id) {
      loadDossiers();
    }
  }, [user]);

  const loadDossiers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notairesApi.getPendingDossiers(user.notaire_id, 0, 20);
      setDossiers(response.data.transactions || []);
    } catch (err) {
      setError('Erreur lors du chargement des dossiers');
      console.error('Error loading dossiers:', err);
      // Fallback to empty list to show UI anyway
      setDossiers([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="notaire-dashboard-page">
        <div className="loading-state">⏳ Chargement du dashboard...</div>
      </div>
    );
  }

  if (!user || user.role !== 'notaire') {
    return null;
  }

  const handleTabChange = (newTab) => {
    setTabValue(newTab);
  };

  const stats = [
    { label: 'Dossiers en cours', value: dossiers.length, icon: '📄', trend: `${dossiers.length} en attente` },
    { label: 'En attente validation', value: dossiers.filter(d => d.statut === 'en_attente_validation').length, icon: '✓', trend: 'Action requise' },
    { label: 'Modifications demandées', value: dossiers.filter(d => d.statut === 'modifications_demandees').length, icon: '⚠', trend: 'À réviser' },
  ];

  const rendezVous = dossiers.slice(0, 4).map((dossier, idx) => ({
    id: idx + 1,
    temps: `${9 + idx * 2}:00`,
    client: dossier.vendeur_nom || 'Client',
    dossier: dossier.annonce_titre || 'Dossier',
    lieu: 'Bureau'
  }));

  const notifications = [
    ...dossiers.slice(0, 2).map((d, idx) => ({
      id: idx + 1,
      texte: `Dossier #${d.transaction_notaire_id}: ${d.statut}`,
      type: d.statut === 'modifications_demandees' ? 'warning' : 'info'
    })),
    { id: 3, texte: 'Vérifiez les documents en attente', type: 'warning' },
  ].slice(0, 4);

  return (
    <div className="notaire-dashboard-page">
      <div className="page-header">
        <div>
          <h1>👨‍⚖️ Dashboard Notaire</h1>
          <p className="page-header-subtitle">Bienvenue, <strong>{user.prenom} {user.nom}</strong> 👋</p>
        </div>
        <Button variant="primary" size="medium" onClick={() => navigate('/notaire/new-dossier')}>+ Nouveau dossier</Button>
      </div>

      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-trend">{stat.trend}</div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        <div className="dossiers-card">
          <div className="tabs-container">
            <button className={`tab ${tabValue === 0 ? 'active' : ''}`} onClick={() => handleTabChange(0)}>📋 Dossiers en cours</button>
            <button className={`tab ${tabValue === 1 ? 'active' : ''}`} onClick={() => handleTabChange(1)}>🕐 Rendez-vous</button>
          </div>

          {tabValue === 0 && (
            <div>
              {dossiers.length === 0 ? (
                <div className="empty-state">
                  <Alert type="info" title="Info" message="Aucun dossier. Créer un nouveau dossier pour commencer." />
                </div>
              ) : (
                <div className="dossiers-list">
                  {dossiers.map((dossier) => (
                    <div key={dossier.id || dossier.transaction_notaire_id} className="dossier-card">
                      <div className="dossier-header">
                        <h3 className="dossier-title">{dossier.titre || dossier.annonce_titre || 'Dossier sans titre'}</h3>
                        <span className={`status-badge status-badge.${(dossier.statut || '').toLowerCase().replace(/\s/g, '-')}`}>{dossier.statut || 'N/A'}</span>
                      </div>

                      <div className="dossier-meta">
                        <span className="dossier-meta-item">👤 {dossier.client || dossier.vendeur_nom || 'Client inconnu'}</span>
                        <span className="dossier-meta-item">💰 {dossier.montant || 'N/A'}</span>
                        <span className="dossier-meta-item">📄 {dossier.docs || 0} docs</span>
                      </div>

                      <div className="progress-section">
                        <div className="progress-label">
                          <span>Progression du dossier</span>
                          <span>{dossier.progression || 0}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${dossier.progression || 0}%` }}></div>
                        </div>
                      </div>

                      <div className="dossier-date">📅 Créé le {new Date(dossier.date || Date.now()).toLocaleDateString('fr-FR')}</div>

                      <div className="dossier-actions">
                        <Button size="small" variant="primary">Voir détails</Button>
                        <Button size="small" variant="secondary">📥 Documents</Button>
                        <Button size="small" variant="secondary">Modifier</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tabValue === 1 && (
            <div className="rdv-list">
              {rendezVous.map((rdv, idx) => (
                <div key={rdv.id} className={`rdv-card ${idx === 0 ? 'first' : ''}`}>
                  <div className="rdv-info">
                    <div className="rdv-time">🕐 {rdv.temps}</div>
                    <div className="rdv-client">{rdv.client} - {rdv.dossier}</div>
                    <div className="rdv-location">📍 {rdv.lieu}</div>
                  </div>
                  <Button size="small" variant="secondary">Détails</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-right">
          <div className="notifications-card">
            <div className="notifications-header">
              <span>🔔 Notifications</span>
              <span className="notification-badge">{notifications.length}</span>
            </div>
            <div className="notifications-list">
              {notifications.map((notif) => (
                <Alert key={notif.id} type={notif.type} title={notif.type === 'warning' ? '⚠' : 'ℹ'} message={notif.texte} />
              ))}
            </div>
          </div>

          <div className="quick-actions-card">
            <div className="quick-actions-header">⚡ Actions rapides</div>
            <div className="quick-actions-list">
              <Button fullWidth variant="primary" onClick={() => navigate('/notaire/new-dossier')}>+ Nouveau dossier</Button>
              <Button fullWidth variant="secondary">📥 Upload documents</Button>
              <Button fullWidth variant="secondary">📅 Calendrier</Button>
              <Button fullWidth variant="secondary">👥 Clients</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotaireDashboardPage;
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            👨‍⚖️ Dashboard Notaire
          </Typography>
          <Typography color="textSecondary">
            Bienvenue, <strong>{user.prenom} {user.nom}</strong> 👋
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<AddIcon />}
          sx={{ fontWeight: 'bold' }}
        >
          + Nouveau dossier
        </Button>
      </Box>

      {/* Statistiques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={4} key={index}>
            <StatCard
              title={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              trendUp={stat.trendUp}
            />
          </Grid>
        ))}
      </Grid>

      {/* Contenu principal */}
      <Grid container spacing={3}>
        {/* Dossiers et rendez-vous */}
        <Grid item xs={12} lg={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtonsDisplay="auto"
              >
                <Tab icon={<DocumentScannerIcon />} label="Dossiers en cours" iconPosition="start" />
                <Tab icon={<ClockIcon />} label="Rendez-vous" iconPosition="start" />
              </Tabs>
            </Box>

            {/* Onglet Dossiers */}
            {tabValue === 0 && (
              <CardContent sx={{ pt: 3 }}>
                {dossiers.length === 0 ? (
                  <Alert severity="info">
                    Aucun dossier. <Button color="primary">Créer un dossier</Button>
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {dossiers.map((dossier) => (
                      <Card
                        key={dossier.id}
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-2px)',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {dossier.titre}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                              <Tooltip title="Client">
                                <Typography variant="body2" color="textSecondary">
                                  👤 {dossier.client}
                                </Typography>
                              </Tooltip>
                              <Tooltip title="Montant">
                                <Typography variant="body2" color="textSecondary">
                                  💰 {dossier.montant}
                                </Typography>
                              </Tooltip>
                              <Tooltip title="Documents">
                                <Badge badgeContent={dossier.docs} color="primary">
                                  <Typography variant="body2" color="textSecondary">
                                    📄
                                  </Typography>
                                </Badge>
                              </Tooltip>
                            </Box>
                          </Box>
                          <Chip
                            label={dossier.statut}
                            color={
                              dossier.statut === 'Signature prévue' ? 'success' :
                              dossier.statut === 'Documents reçus' ? 'info' :
                              'warning'
                            }
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Progression du dossier
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                              {dossier.progression}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={dossier.progression}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                        </Box>

                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                          📅 Créé le {new Date(dossier.date).toLocaleDateString('fr-FR')}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="contained">
                            Voir détails
                          </Button>
                          <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />}>
                            Documents
                          </Button>
                          <Button size="small" variant="outlined">
                            Modifier
                          </Button>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </CardContent>
            )}

            {/* Onglet Rendez-vous */}
            {tabValue === 1 && (
              <CardContent sx={{ pt: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {rendezVous.map((rdv, index) => (
                    <Card
                      key={rdv.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        backgroundColor: index === 0 ? 'action.hover' : 'background.paper',
                        borderLeft: 4,
                        borderLeftColor: 'primary.main',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                          <Chip
                            label={rdv.temps}
                            size="small"
                            icon={<ClockIcon />}
                            color="primary"
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {rdv.client} - {rdv.dossier}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            📍 {rdv.lieu}
                          </Typography>
                        </Box>
                        <Button size="small" variant="outlined">
                          Détails
                        </Button>
                      </Box>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            )}
          </Card>
        </Grid>

        {/* Notifications et Actions rapides */}
        <Grid item xs={12} lg={4}>
          {/* Notifications */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Badge badgeContent={notifications.length} color="error">
                  <NotificationsIcon color="primary" />
                </Badge>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Notifications
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {notifications.map((notif) => (
                  <Alert key={notif.id} severity={notif.type} sx={{ py: 1 }}>
                    <Typography variant="body2">
                      {notif.texte}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                ⚡ Actions rapides
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  color="success"
                >
                  Nouveau dossier
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                >
                  Upload documents
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CalendarTodayIcon />}
                >
                  Calendrier
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PersonIcon />}
                >
                  Clients
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NotaireDashboardPage;
