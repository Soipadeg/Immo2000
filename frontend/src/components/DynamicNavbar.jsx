/**
 * Barre de navigation dynamique selon les rôles
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notificationsApi } from '../services/api';
import ProfileSwitcher from './ProfileSwitcher';
import './DynamicNavbar.css';

/**
 * Composant Navbar dynamique
 *
 * @param {Object} props
 * @param {boolean} props.isAuthenticated - Utilisateur connecté?
 * @param {string} props.userRole - Rôle de l'utilisateur (user, admin, notaire)
 * @param {Object} props.user - Données utilisateur
 * @param {function} props.onLogout - Callback de déconnexion
 */
export const DynamicNavbar = ({
  isAuthenticated,
  userRole,
  user,
  onLogout,
  showAppBar = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Détecter les changements de taille d'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Charger le count des notifications non-lues
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadUnreadCount = async () => {
    try {
      const devMode = localStorage.getItem('dev_mode') === 'true';
      if (devMode) {
        setUnreadNotifications(0);
        return;
      }
      const response = await notificationsApi.getUnreadCount();
      if (response?.data) {
        setUnreadNotifications(response.data.unread_count || 0);
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // Ne pas afficher la navbar sur certaines pages
  if (!showAppBar || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  /**
   * Éléments du menu selon le rôle
   */
  const getNavItems = () => {
    const items = [];

    // Items disponibles pour tous
    items.push({ label: 'Vendre', path: '/vendre', icon: '📝' });
    items.push({ label: 'Acheter', path: '/search', icon: '🏠' });
    items.push({ label: 'Simulateur', path: '/simulateur-pret', icon: '📈' });

    if (!isAuthenticated) {
      return items;
    }

    // Items pour utilisateurs connectés
    items.push({ label: 'Matching', path: '/matching', icon: '❤️' });
    items.push({ label: 'Guides', path: '/guides', icon: '📚' });
    items.push({ label: 'Modèles', path: '/modeles', icon: '📄' });

    if (userRole === 'user') {
      items.push({ label: 'Dashboard', path: '/dashboard', icon: '📊' });
      items.push({ label: 'Notifications', path: '/notifications', icon: '🔔', badge: unreadNotifications });
    }

    if (userRole === 'admin') {
      items.push({ label: 'Dashboard', path: '/dashboard', icon: '📊' });
      items.push({ label: 'Admin', path: '/admin', icon: '⚙️' });
    }

    if (userRole === 'notaire') {
      items.push({ label: 'Dashboard', path: '/notaire/dashboard', icon: '📋' });
    }

    return items;
  };

  const navItems = getNavItems();

  /**
   * Gérer la navigation
   */
  const handleNavigate = (path) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  /**
   * Gérer la déconnexion
   */
  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <>
      <nav style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #eee',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        height: '64px',
        gap: '16px',
      }}>
        {/* Logo */}
        <button
          onClick={() => handleNavigate('/')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🏠 Immo2000
        </button>

        {/* Navigation Desktop */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  opacity: location.pathname === item.path ? 1 : 0.7,
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {item.icon} {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <div style={{
                    backgroundColor: '#ff4444',
                    color: '#fff',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '10px',
                    marginLeft: '4px',
                  }}>
                    {item.badge}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: isMobile ? 1 : 0 }} />

        {/* Profile Switcher (Mode Dev) */}
        <ProfileSwitcher />

        {/* User Menu ou Login Buttons */}
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => handleNavigate('/profile')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              👤 {user?.prenom}
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '6px 12px',
              }}
            >
              🚪 Déconnexion
            </button>
          </div>
        ) : (
          !isMobile && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: '1px solid #1976d2',
                  color: '#1976d2',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Se connecter
              </button>
              <button
                onClick={() => navigate('/register')}
                style={{
                  background: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                S'inscrire
              </button>
            </div>
          )
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
            }}
          >
            ☰
          </button>
        )}
      </nav>

      {/* Mobile Drawer */}
      {isMobile && mobileDrawerOpen && (
        <div style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #eee',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '12px',
                textAlign: 'left',
                fontSize: '14px',
                opacity: location.pathname === item.path ? 1 : 0.7,
              }}
            >
              {item.icon} {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <div style={{
                  backgroundColor: '#ff4444',
                  color: '#fff',
                  borderRadius: '50%',
                  padding: '2px 6px',
                  fontSize: '10px',
                  marginLeft: '4px',
                }}>
                  {item.badge}
                </div>
              )}
            </button>
          ))}

          {isAuthenticated && user ? (
            <>
              <div style={{ height: '1px', backgroundColor: '#eee', margin: '8px 0' }} />
              <button
                onClick={() => handleNavigate('/profile')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
              >
                👤 Mon Profil
              </button>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
              >
                🚪 Déconnexion
              </button>
            </>
          ) : (
            <>
              <div style={{ height: '1px', backgroundColor: '#eee', margin: '8px 0' }} />
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
              >
                Se connecter
              </button>
              <button
                onClick={() => navigate('/register')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
              >
                S'inscrire
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default DynamicNavbar;
