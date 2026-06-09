import '../styles/UserDashboardPage.css';
/**
 * Dashboard Utilisateur - Centre névralgique
 * Accès centralisé à toutes les options de l'utilisateur
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const UserDashboardPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || !['user', 'admin'].includes(user.role))) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Sections du dashboard avec navigation
  const dashboardSections = [
    {
      id: 'creneaux',
      label: 'Créneaux',
      icon: '📅',
      description: 'Gérez vos créneaux de visite',
      path: '/slots',
      color: '#FF6B6B',
    },
    {
      id: 'feedback',
      label: 'Feedback',
      icon: '💬',
      description: 'Consultez les avis et commentaires',
      path: '/feedback',
      color: '#4ECDC4',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: '✉️',
      description: 'Conversations avec acheteurs/vendeurs',
      path: '/messages',
      color: '#45B7D1',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: '💼',
      description: 'Suivi des transactions en cours',
      path: '/transaction-actions',
      color: '#F7DC6F',
    },
    {
      id: 'historique-rdv',
      label: 'Historique RDV',
      icon: '📋',
      description: 'Consultez l\'historique de vos visites',
      path: '/appointment-history',
      color: '#BB8FCE',
    },
    {
      id: 'exporter-rdv',
      label: 'Exporter RDV',
      icon: '📤',
      description: 'Téléchargez vos rendez-vous',
      path: '/calendar-export',
      color: '#85C1E2',
    },
  ];

  const quickStats = [
    { label: 'Messages', value: 12, icon: '💬' },
    { label: 'Rendez-vous', value: 5, icon: '📅' },
    { label: 'Transactions', value: 3, icon: '💼' },
    { label: 'Notifications', value: 8, icon: '🔔' },
  ];

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666',
      }}>
        ⏳ Chargement...
      </div>
    );
  }

  if (!user || !['user', 'admin'].includes(user.role)) {
    return null;
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
    }}>
      {/* En-tête du dashboard */}
      <div style={{
        marginBottom: '40px',
        paddingBottom: '30px',
        borderBottom: '2px solid #e0e0e0',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          margin: '0 0 10px 0',
          color: '#333',
        }}>
          📊 Tableau de Bord
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#666',
          margin: '0',
        }}>
          Bienvenue <strong>{user.prenom}</strong> 👋 — Centre de gestion de tous vos éléments immobiliers
        </p>
      </div>

      {/* Statistiques rapides */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '40px',
      }}>
        {quickStats.map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              textAlign: 'center',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>
              {stat.icon}
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1976d2',
              marginBottom: '8px',
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#888',
              fontWeight: '500',
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Grille de sections du dashboard */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '24px',
          marginTop: '0',
        }}>
          🎯 Sections Principales
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {dashboardSections.map((section) => (
            <div
              key={section.id}
              onClick={() => navigate(section.path)}
              style={{
                background: '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                border: '1px solid #f0f0f0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              {/* Barre de couleur en haut */}
              <div
                style={{
                  height: '6px',
                  backgroundColor: section.color,
                }}
              />

              {/* Contenu de la carte */}
              <div style={{ padding: '24px' }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}>
                  {section.icon}
                </div>

                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333',
                  margin: '0 0 12px 0',
                  textAlign: 'center',
                }}>
                  {section.label}
                </h3>

                <p style={{
                  fontSize: '14px',
                  color: '#666',
                  margin: '0 0 20px 0',
                  textAlign: 'center',
                  lineHeight: '1.5',
                }}>
                  {section.description}
                </p>

                {/* Bouton d'accès */}
                <button
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: section.color,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Accéder →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section supplémentaire - Actions rapides */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
          marginTop: '0',
          marginBottom: '20px',
        }}>
          ⚡ Actions rapides
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
        }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              padding: '12px 16px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              e.currentTarget.style.borderColor = '#bbb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.borderColor = '#ddd';
            }}
          >
            ⚙️ Mon Profil
          </button>
          <button
            onClick={() => navigate('/notifications')}
            style={{
              padding: '12px 16px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              e.currentTarget.style.borderColor = '#bbb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.borderColor = '#ddd';
            }}
          >
            🔔 Notifications
          </button>
          <button
            onClick={() => navigate('/guides')}
            style={{
              padding: '12px 16px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
              e.currentTarget.style.borderColor = '#bbb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.borderColor = '#ddd';
            }}
          >
            📚 Guides
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboardPage;
