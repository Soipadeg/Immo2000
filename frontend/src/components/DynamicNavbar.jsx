/**
 * Barre de navigation dynamique selon les rôles
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notificationsApi } from '../services/api';
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
  const location = useLocation();  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  // Simple mobile detection

  // Simple mobile detection

  // Charger le count des notifications non-lues
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      // Actualiser toutes les 30 secondes
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadUnreadCount = async () => {
    try {
      // Skip API call if in dev mode
      const devMode = localStorage.getItem('dev_mode') === 'true';
      if (devMode) {
        setUnreadNotifications(0);
        return;
      }

      const response = await notificationsApi.getUnreadCount();
      if (response.data) {
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

    // Items disponibles pour tous (connecté ou pas)
    items.push({ label: 'Acheter', path: '/search', icon: <HomeIcon /> });
    items.push({ label: 'Simulateur', path: '/simulateur-pret', icon: <TimelineIcon /> });

    if (!isAuthenticated) {
      return items;
    }

    // Items pour utilisateurs connectés
    items.push({ label: 'Matching', path: '/matching', icon: <BookmarkIcon /> });
    items.push({ label: 'Alertes', path: '/alertes', icon: <NotificationsIcon /> });
    items.push({ label: 'Guides', path: '/guides', icon: <SpeakerNotesIcon /> });
    items.push({ label: 'Modèles', path: '/modeles', icon: <FeedIcon /> });

    if (userRole === 'user') {
      items.push({ label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> });
      items.push({ label: 'Favoris', path: '/favoris', icon: <BookmarkIcon /> });
      items.push({ label: 'Historique', path: '/historique', icon: <FeedIcon /> });
      items.push({ label: 'Notifications', path: '/notifications', icon: <NotificationsIcon />, badge: unreadNotifications });
    }

    if (userRole === 'admin') {
      items.push({ label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> });
      items.push({ label: 'Admin', path: '/admin', icon: <AdminPanelSettingsIcon /> });
      items.push({ label: 'Utilisateurs', path: '/admin/users', icon: <PersonIcon /> });
      items.push({ label: 'Modération', path: '/admin/moderation', icon: <SpeakerNotesIcon /> });
    }

    if (userRole === 'notaire') {
      items.push({ label: 'Dashboard', path: '/notaire/dashboard', icon: <BuildIcon /> });
    }

    return items;
  };

  const navItems = getNavItems();

  /**
   * Ouvrir le menu utilisateur
   */
  const handleUserMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  /**
   * Fermer le menu utilisateur
   */
  const handleUserMenuClose = () => {
    setMenuAnchorEl(null);
  };

  /**
   * Gérer la déconnexion
   */
  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
    navigate('/login');
  };

  /**
   * Naviguer vers une page
   */
  const handleNavigate = (path) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  return (
    <nav class="dynamic-navbar">
      <div class="dynamic-navbar__container">
        {/* Logo - left aligned */}
        <div class="dynamic-navbar__brand"> handleNavigate('/')}
        >
          🏠 Immo2000
        </div>

        {/* Navigation and Buttons container - kept together */}
        {!isMobile && (
          <div 
            {/* Navigation items */}
            <div 
              {navItems.map((item) => (
                <button class="dynamic-navbar__menu-item"> handleNavigate(item.path)}
                      </span>
                    ) : (
                      item.icon
                    )
                  }
                  sx={{
                    opacity: location.pathname === item.path ? 1 : 0.7,
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '6px 12px',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    '&:hover': { opacity: 1 },
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Spacer to push buttons to the right */}
        <div 

        {/* Menu utilisateur ou boutons login */}
        {isAuthenticated && user ? (
          <>
            {/* Desktop: Avatar menu */}
            {!isMobile && (
              <button class="dynamic-navbar__menu-item">
                    {user?.prenom?.[0]?.toUpperCase()}
                  </div>
                }
              >
                {user?.prenom}
              </button>
            )}

            {/* Mobile: Menu icon */}
            {isMobile && (
              <button class="dynamic-navbar__menu-button"> setMobileDrawerOpen(true)}
              >
                <div class="dynamic-navbar__dropdown">
              </button>
            )}

            {/* Menu utilisateur desktop */}
            <div class="dynamic-navbar__dropdown">
              <div class="dynamic-navbar__dropdown">
                <PersonIcon />
                <p>
                  {user?.prenom} {user?.nom}
                </div>
              </button>
              <div class="dynamic-navbar__dropdown">
                <p>
                  {user?.email}
                </div>
              </button>
              <div class="dynamic-navbar__dropdown-divider"></div>
              <div class="dynamic-navbar__dropdown"> { handleUserMenuClose(); handleNavigate('/profile'); }}>
                <SettingsIcon />
                Mon Profil
              </button>
              <div class="dynamic-navbar__dropdown">
                <LogoutIcon />
                Déconnexion
              </button>
            </div>
          </>
        ) : (
          /* Buttons pour non-authentifiés */
          !isMobile && (
            <div 
              <button class="dynamic-navbar__menu-item"> window.location.href = 'http://localhost:5000/login.html'}
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '6px 12px',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                  '&:hover': { opacity: 1 },
                }}
              >
                Se connecter
              </button>
              <button class="dynamic-navbar__menu-item"> window.location.href = 'http://localhost:5000/register.html'}
              >
                S'inscrire
              </button>
            </div>
          )
        )}

        {/* Mobile: Menu icon si pas connecté */}
        {!isAuthenticated && isMobile && (
          <button class="dynamic-navbar__menu-button"> setMobileDrawerOpen(true)}
          >
            <div class="dynamic-navbar__dropdown">
          </button>
        )}
      </div>

      {/* Drawer mobile */}
      <div class="dynamic-navbar__drawer"> setMobileDrawerOpen(false)}
      >
        <div 
          <p>
            Navigation
          </div>
          <div class="dynamic-navbar__dropdown-divider"></div>

          <div>
            {navItems.map((item) => (
              <div> handleNavigate(item.path)}
              >
                <div>
                  {item.badge !== undefined && item.badge > 0 ? (
                    <span class="dynamic-navbar__notification-btn"><span class="dynamic-navbar__badge">item.badge</span>
                      {item.icon}
                    </span>
                  ) : (
                    item.icon
                  )}
                </span>
                <div>
              </button>
            ))}
          </div>

          {isAuthenticated ? (
            <>
              <div class="dynamic-navbar__dropdown-divider"></div>
              <div>
                <div> { setMobileDrawerOpen(false); handleNavigate('/profile'); }}>
                  <div><SettingsIcon /></span>
                  <div>
                </button>
                <div>
                  <div><LogoutIcon /></span>
                  <div>
                </button>
              </div>
            </>
          ) : (
            <>
              <div class="dynamic-navbar__dropdown-divider"></div>
              <button class="dynamic-navbar__menu-item"> handleNavigate('/login')}
              >
                Se connecter
              </button>
              <button class="dynamic-navbar__menu-item"> handleNavigate('/register')}
              >
                S'inscrire
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DynamicNavbar;
