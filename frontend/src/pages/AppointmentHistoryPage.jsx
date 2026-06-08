import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppointmentHistory } from '../hooks/useAppointmentHistory';
import AppointmentStats from '../components/appointments/AppointmentStats';
import AppointmentList from '../components/appointments/AppointmentList';
import '../styles/AppointmentHistoryPage.css';

/**
 * Page d'historique des rendez-vous
 * Statistiques + liste avec filtres et actions
 */
const AppointmentHistoryPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  const {
    appointments,
    filteredAppointments,
    statistics,
    loading,
    updating,
    error,
    fetchAppointments,
    filterAppointments,
    rescheduleAppointment,
    cancelAppointment,
    generateReport,
    exportAppointments,
  } = useAppointmentHistory();

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    filterAppointments(filters);
  }, [filters, filterAppointments]);

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleGenerateReport = async () => {
    await generateReport('pdf');
  };

  const handleExportCSV = async () => {
    await exportAppointments('csv');
  };

  return (
    <div className="appointment-history-page">
      {/* En-tête */}
      <div className="appointment-header">
        <h1>📅 Historique des Rendez-vous</h1>
        <p className="subtitle">Consultez tous vos rendez-vous passés et présents</p>
      </div>

      {/* Erreurs */}
      {error && <div className="error-banner">{error}</div>}

      {/* Actions globales */}
      <div className="global-actions">
        <button
          className="btn btn-primary"
          onClick={handleGenerateReport}
          disabled={loading || updating}
        >
          📄 Générer Rapport
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleExportCSV}
          disabled={loading || updating}
        >
          📥 Exporter CSV
        </button>
      </div>

      {/* Statistiques */}
      {statistics && <AppointmentStats statistics={statistics} />}

      {/* Liste avec filtres */}
      <AppointmentList
        appointments={filteredAppointments}
        loading={loading}
        updating={updating}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReschedule={rescheduleAppointment}
        onCancel={cancelAppointment}
      />
    </div>
  );
};

export default AppointmentHistoryPage;
