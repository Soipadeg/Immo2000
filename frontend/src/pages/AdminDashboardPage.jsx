/**
 * AdminDashboardPage - Dashboard administrateur
 * Même structure que UserDashboardPage avec 6 cartes sections
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminDashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user || user.role !== 'admin') {
    return null;
  }

  // Sections du dashboard admin
  const dashboardSections = [
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: '👥',
      description: 'Gérez tous les utilisateurs et leurs rôles',
      path: '/admin/users',
      color: '#FF6B6B'
    },
    {
      id: 'listings',
      label: 'Annonces',
      icon: '🏘️',
      description: 'Visualisez et approuvez les annonces',
      path: '/admin/listings',
      color: '#4ECDC4'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: '💳',
      description: 'Suivi des transactions et paiements',
      path: '/admin/transactions',
      color: '#45B7D1'
    },
    {
      id: 'security',
      label: 'Sécurité',
      icon: '🔒',
      description: 'Audit logs et incidents de sécurité',
      path: '/admin/security',
      color: '#F7DC6F'
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      icon: '📋',
      description: 'Consultez les logs d\'audit du système',
      path: '/admin/audit',
      color: '#BB8FCE'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: '⚙️',
      description: 'Configuration du système et intégrations',
      path: '/admin/settings',
      color: '#85C1E2'
    },
  ];

  // Statistiques rapides
  const quickStats = [
    { label: 'Utilisateurs', value: 1250, icon: '👥' },
    { label: 'Annonces', value: 487, icon: '🏘️' },
    { label: 'Transactions', value: 156, icon: '💳' },
    { label: 'Alertes', value: 23, icon: '🚨' },
  ];

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      {/* En-tête */}
      <div style={{
        marginBottom: '32px',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          margin: '0 0 8px 0',
          color: '#333',
        }}>
          📊 Tableau de Bord Admin
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#666',
          margin: '0',
        }}>
          Bienvenue <strong>{user?.prenom}</strong> 👋 — Centre de gestion administratif
        </p>
      </div>

      {/* Statistiques rapides */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            onClick={() => navigate(`/admin/${stat.label.toLowerCase().replace(' ', '-')}`)}
            style={{
              padding: '16px',
              backgroundColor: '#fff',
              border: '1px solid #eee',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '24px' }}>{stat.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '12px', color: '#999' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Sections principales */}
      <div style={{
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          margin: '0 0 16px 0',
          color: '#333',
        }}>
          🎯 Sections Principales
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {dashboardSections.map((section) => (
            <div
              key={section.id}
              onClick={() => navigate(section.path)}
              style={{
                cursor: 'pointer',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#fff',
                border: '1px solid #eee',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Barre colorée */}
              <div style={{
                height: '6px',
                backgroundColor: section.color,
              }} />

              {/* Contenu */}
              <div style={{
                padding: '16px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{
                  fontSize: '48px',
                  lineHeight: '1',
                }}>
                  {section.icon}
                </div>

                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#333',
                  margin: '0',
                }}>
                  {section.label}
                </h3>

                <p style={{
                  fontSize: '13px',
                  color: '#666',
                  margin: '0',
                  flex: 1,
                }}>
                  {section.description}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(section.path);
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: section.color,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    alignSelf: 'flex-start',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  Accéder →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div style={{
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          margin: '0 0 16px 0',
          color: '#333',
        }}>
          ⚡ Actions rapides
        </h2>

        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => navigate('/admin/users')}
            style={{
              padding: '10px 16px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
          >
            👥 Gérer les utilisateurs
          </button>

          <button
            onClick={() => navigate('/admin/listings/approval')}
            style={{
              padding: '10px 16px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
          >
            ✅ Approuver les annonces
          </button>

          <button
            onClick={() => navigate('/admin/settings')}
            style={{
              padding: '10px 16px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
          >
            ⚙️ Paramètres
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
