import React, { useEffect } from 'react';
import { usePropertyStatistics } from '../hooks/usePropertyStatistics';
import '../styles/PropertyStatisticsPage.css';

/**
 * Page de statistiques des propriétés
 */
const PropertyStatisticsPage = () => {
  const { statistics, performanceData, loading, error, fetchStatistics, fetchPerformance, downloadReport } =
    usePropertyStatistics();

  useEffect(() => {
    fetchStatistics();
    fetchPerformance();
  }, [fetchStatistics, fetchPerformance]);

  const handleDownloadPDF = () => {
    downloadReport('pdf');
  };

  const handleDownloadExcel = () => {
    downloadReport('xlsx');
  };

  if (loading) {
    return <div className="stats-loading">Chargement des statistiques...</div>;
  }

  return (
    <div className="property-statistics-page">
      {/* En-tête */}
      <div className="stats-header">
        <h1>📊 Statistiques des Propriétés</h1>
        <p className="subtitle">Analysez la performance de votre portefeuille immobilier</p>
      </div>

      {/* Erreurs */}
      {error && <div className="error-banner">{error}</div>}

      {/* Actions */}
      <div className="stats-actions">
        <button className="btn btn-primary" onClick={handleDownloadPDF} disabled={loading}>
          📄 Télécharger PDF
        </button>
        <button className="btn btn-primary" onClick={handleDownloadExcel} disabled={loading}>
          📊 Télécharger Excel
        </button>
      </div>

      {/* Grille de KPIs */}
      {statistics && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <p className="kpi-label">Propriétés Totales</p>
              <p className="kpi-value">{statistics.total_properties}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Annonces Actives</p>
              <p className="kpi-value">{statistics.active_listings}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Propriétés Vendues</p>
              <p className="kpi-value">{statistics.sold_count}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Prix Moyen Vente</p>
              <p className="kpi-value">{(statistics.average_sale_price / 1000).toFixed(0)}k €</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Jours Pour Vendre</p>
              <p className="kpi-value">{statistics.average_days_to_sell}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Taux Conversion</p>
              <p className="kpi-value">{statistics.contact_conversion_rate}%</p>
            </div>
          </div>

          {/* Répartition */}
          <div className="stats-breakdown">
            <div className="breakdown-card">
              <h3>État des Annonces</h3>
              <div className="breakdown-items">
                {Object.entries(statistics.by_status).map(([status, count]) => (
                  <div key={status} className="breakdown-item">
                    <span>{status === 'active' && '🟢'} {status === 'sold' && '✓'} {status === 'inactive' && '⭕'} {status}</span>
                    <span className="count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="breakdown-card">
              <h3>Par Type</h3>
              <div className="breakdown-items">
                {Object.entries(statistics.by_type).map(([type, count]) => (
                  <div key={type} className="breakdown-item">
                    <span>{type}</span>
                    <span className="count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="breakdown-card">
              <h3>Par Localisation</h3>
              <div className="breakdown-items">
                {Object.entries(statistics.by_location).map(([location, count]) => (
                  <div key={location} className="breakdown-item">
                    <span>{location}</span>
                    <span className="count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Performances */}
      {performanceData.length > 0 && (
        <div className="performance-section">
          <h2>📈 Top Propriétés Par Performance</h2>
          <div className="performance-table">
            <div className="table-header">
              <div className="col">Propriété</div>
              <div className="col">Type</div>
              <div className="col">Vues</div>
              <div className="col">Contacts</div>
              <div className="col">Conversion</div>
              <div className="col">Jours</div>
              <div className="col">Statut</div>
            </div>
            {performanceData.map((prop) => (
              <div key={prop.id} className="table-row">
                <div className="col">{prop.address}</div>
                <div className="col">{prop.type}</div>
                <div className="col">{prop.views}</div>
                <div className="col">{prop.contacts}</div>
                <div className="col">{prop.conversion.toFixed(1)}%</div>
                <div className="col">{prop.days_listed}</div>
                <div className="col">
                  <span className={`badge ${prop.status}`}>{prop.status === 'sold' ? '✓ Vendu' : '🟢 Actif'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyStatisticsPage;
