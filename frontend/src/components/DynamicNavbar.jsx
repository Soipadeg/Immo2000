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
  const [openDropdown, setOpenDropdown] = useState(null);

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

    if (userRole === 'user') {
      // Dashboard avec sous-menus
      items.push({
        label: 'Dashboard',
        icon: '📊',
        path: '/user/dashboard',
        children: [
          { label: 'Créneaux', path: '/slots', icon: '📅' },
          { label: 'Feedback', path: '/feedback', icon: '💬' },
          { label: 'Messages', path: '/messages', icon: '✉️' },
          { label: 'Transactions', path: '/transaction-actions', icon: '💼' },
          { label: 'Historique RDV', path: '/appointment-history', icon: '📅' },
          { label: 'Exporter RDV', path: '/calendar-export', icon: '📤' },
        ],
      });

      // Notifications avec badge
      items.push({
        label: 'Notifications',
        path: '/notifications',
        icon: '🔔',
        badge: unreadNotifications,
      });
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
          <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
            {navItems.map((item) => (
              <div key={item.label} style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    if (item.path) {
                      handleNavigate(item.path);
                    } else if (item.children) {
                      setOpenDropdown(openDropdown === item.label ? null : item.label);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    opacity: location.pathname === item.path ? 1 : 0.7,
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {item.icon} {item.label}
                  {item.children && !item.path && (
                    <span style={{ fontSize: '10px' }}>
                      {openDropdown === item.label ? '▲' : '▼'}
                    </span>
                  )}
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

                {/* Dropdown Menu */}
                {item.children && openDropdown === item.label && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    minWidth: '180px',
                    zIndex: 1000,
                  }}>
                    {item.children.map((child) => (
                      <button
                        key={child.path}
                        onClick={() => {
                          handleNavigate(child.path);
                          setOpenDropdown(null);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          background: 'none',
                          border: 'none',
                          padding: '10px 16px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '13px',
                          opacity: location.pathname === child.path ? 1 : 0.7,
                          borderBottom: '1px solid #f0f0f0',
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f9f9f9'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        {child.icon} {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
            <div key={item.label}>
              <button
                onClick={() => {
                  if (item.path) {
                    handleNavigate(item.path);
                  } else if (item.children) {
                    setOpenDropdown(openDropdown === item.label ? null : item.label);
                  }
                }}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px',
                  textAlign: 'left',
                  fontSize: '14px',
                  opacity: location.pathname === item.path ? 1 : 0.7,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  {item.icon} {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span style={{
                      backgroundColor: '#ff4444',
                      color: '#fff',
                      borderRadius: '50%',
                      padding: '2px 6px',
                      fontSize: '10px',
                      marginLeft: '4px',
                      display: 'inline-block',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </span>
                {item.children && !item.path && (
                  <span style={{ fontSize: '10px' }}>
                    {openDropdown === item.label ? '▲' : '▼'}
                  </span>
                )}
              </button>

              {/* Mobile Dropdown Menu */}
              {item.children && openDropdown === item.label && (
                <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {item.children.map((child) => (
                    <button
                      key={child.path}
                      onClick={() => {
                        handleNavigate(child.path);
                        setOpenDropdown(null);
                      }}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        padding: '8px 12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                        opacity: location.pathname === child.path ? 1 : 0.7,
                        color: '#666',
                      }}
                    >
                      {child.icon} {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
