import React, { useState, useCallback } from 'react';
import '../../styles/AuditFilters.css';

/**
 * Composant pour filtrer les logs d'audit
 * Permet de chercher par date, action, utilisateur, résultat
 */
const AuditFilters = ({ onFilter, onReset, onExport }) => {
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
    result: '',
    search: '',
  });

  const actionTypes = [
    'CREATE_LISTING',
    'APPROVE_LISTING',
    'REJECT_LISTING',
    'DELETE_LISTING',
    'PUBLISH_LISTING',
    'ARCHIVE_LISTING',
    'APPROVE_TRANSACTION',
    'CREATE_TRANSACTION',
    'UPDATE_TRANSACTION',
    'USER_LOGIN',
    'USER_LOGOUT',
    'CHANGE_PASSWORD',
    'UPDATE_PROFILE',
    'SUBMIT_FEEDBACK',
    'DELETE_FEEDBACK',
  ];

  const resultTypes = ['success', 'failed', 'warning'];

  /**
   * Gérer le changement de filtre
   */
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  /**
   * Appliquer les filtres
   */
  const handleApply = useCallback(() => {
    onFilter(filters);
  }, [filters, onFilter]);

  /**
   * Réinitialiser les filtres
   */
  const handleReset = useCallback(() => {
    setFilters({
      action: '',
      userId: '',
      startDate: '',
      endDate: '',
      result: '',
      search: '',
    });
    onReset();
  }, [onReset]);

  /**
   * Exporter les logs
   */
  const handleExport = useCallback((format) => {
    onExport(format, filters);
  }, [filters, onExport]);

  return (
    <div className="audit-filters">
      <div className="filters-grid">
        {/* Recherche */}
        <div className="filter-group">
          <label htmlFor="search">🔍 Rechercher</label>
          <input
            id="search"
            type="text"
            name="search"
            placeholder="Description, utilisateur, ressource..."
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>

        {/* Type d'action */}
        <div className="filter-group">
          <label htmlFor="action">📋 Type d'action</label>
          <select
            id="action"
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Tous les types</option>
            {actionTypes.map(action => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {/* Résultat */}
        <div className="filter-group">
          <label htmlFor="result">✅ Résultat</label>
          <select
            id="result"
            name="result"
            value={filters.result}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Tous les résultats</option>
            <option value="success">✅ Succès</option>
            <option value="failed">❌ Erreur</option>
            <option value="warning">⚠️ Attention</option>
          </select>
        </div>

        {/* Date de début */}
        <div className="filter-group">
          <label htmlFor="startDate">📅 De:</label>
          <input
            id="startDate"
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>

        {/* Date de fin */}
        <div className="filter-group">
          <label htmlFor="endDate">📅 À:</label>
          <input
            id="endDate"
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>

        {/* ID Utilisateur */}
        <div className="filter-group">
          <label htmlFor="userId">👤 ID Utilisateur</label>
          <input
            id="userId"
            type="text"
            name="userId"
            placeholder="Entrez l'ID utilisateur"
            value={filters.userId}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="filters-actions">
        <button
          className="btn btn-primary"
          onClick={handleApply}
        >
          🔍 Appliquer les filtres
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleReset}
        >
          🔄 Réinitialiser
        </button>
        <div className="export-buttons">
          <button
            className="btn btn-outline"
            onClick={() => handleExport('csv')}
            title="Télécharger en CSV"
          >
            📊 CSV
          </button>
          <button
            className="btn btn-outline"
            onClick={() => handleExport('json')}
            title="Télécharger en JSON"
          >
            📋 JSON
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditFilters;
