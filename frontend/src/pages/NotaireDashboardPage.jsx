// import '../styles/NotaireDashboardPage.css';
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

  return (
    <div>
      <div>Dashboard Notaire</div>
      {loading && <div>Chargement...</div>}
      {error && <Alert type="error" message={error} />}
      {dossiers.length === 0 && !loading && (
        <div>Aucun dossier en cours</div>
      )}
      <ul>
        {dossiers.map((dossier) => (
          <li key={dossier.id || dossier.transaction_notaire_id}>
            <div>{dossier.titre || dossier.annonce_titre || 'Dossier sans titre'}</div>
            <div>Statut: {dossier.statut || 'N/A'}</div>

          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotaireDashboardPage;
