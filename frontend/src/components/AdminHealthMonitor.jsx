/**
 * AdminHealthMonitor - Affiche la santé du système dans la sidebar admin
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminHealthMonitor = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthCheck();
    // Recharger toutes les 30 secondes
    const interval = setInterval(loadHealthCheck, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthCheck = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/v1/health/detailed', {
        timeout: 5000,
      });
      setHealth(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Health check error:', err);
      setHealth({
        status: 'error',
        message: 'Impossible de contacter le serveur',
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '12px',
        fontSize: '12px',
        color: '#666',
        borderTop: '1px solid #e0e0e0',
      }}>
        ⏳ Chargement...
      </div>
    );
  }

  const isHealthy = health?.status === 'ok' || health?.status === '✅ OK';
  const statusColor = isHealthy ? '#4caf50' : '#ff9800';
  const statusEmoji = isHealthy ? '✅' : '⚠️';

  return (
    <div style={{
      padding: '12px',
      fontSize: '12px',
      color: '#666',
      borderTop: '1px solid #e0e0e0',
      backgroundColor: '#f9f9f9',
    }}>
      {/* Titre */}
      <div style={{
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#333',
        fontSize: '11px',
        textTransform: 'uppercase',
      }}>
        📡 Système
      </div>

      {/* Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '8px',
        padding: '6px',
        backgroundColor: '#fff',
        borderRadius: '4px',
        border: `1px solid ${statusColor}40`,
      }}>
        <span style={{ color: statusColor, fontSize: '14px' }}>
          {statusEmoji}
        </span>
        <div>
          <div style={{ fontWeight: 'bold', color: '#333' }}>
            {isHealthy ? 'Sain' : 'Alerte'}
          </div>
          <div style={{ fontSize: '10px', color: '#999' }}>
            {health?.database ? health.database : 'N/A'}
          </div>
        </div>
      </div>

      {/* Détails */}
      {health?.uptime && (
        <div style={{
          padding: '6px',
          backgroundColor: '#fff',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
          marginBottom: '6px',
          fontSize: '10px',
        }}>
          <div style={{ color: '#666' }}>
            ⏱️ Uptime: <strong>{health.uptime}</strong>
          </div>
        </div>
      )}

      {health?.version && (
        <div style={{
          padding: '6px',
          backgroundColor: '#fff',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
          fontSize: '10px',
          color: '#666',
        }}>
          📦 Version: <strong>{health.version}</strong>
        </div>
      )}

      {/* Bouton Rafraîchir */}
      <button
        onClick={loadHealthCheck}
        style={{
          width: '100%',
          marginTop: '8px',
          padding: '6px 8px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 'bold',
          color: '#333',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#e0e0e0';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#f0f0f0';
        }}
      >
        🔄 Rafraîchir
      </button>
    </div>
  );
};

export default AdminHealthMonitor;
