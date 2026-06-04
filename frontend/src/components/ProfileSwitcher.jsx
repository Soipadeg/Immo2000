/**
 * Composant ProfileSwitcher
 * Menu déroulant pour switcher entre les profils en mode développement
 */

import React, { useState, useRef, useEffect } from 'react';
import { useProfileStore, PROFILES, PROFILE_CONFIG } from '../store/profileStore';
import './ProfileSwitcher.css';

const ProfileSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDevBanner, setShowDevBanner] = useState(true);
  const { currentProfile, setProfile, getCurrentProfileConfig } = useProfileStore();
  const dropdownRef = useRef(null);
  const config = getCurrentProfileConfig();

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Écouter les changements de profil
  useEffect(() => {
    const handleProfileChange = () => {
      setIsOpen(false);
    };

    window.addEventListener('profileChanged', handleProfileChange);
    return () => window.removeEventListener('profileChanged', handleProfileChange);
  }, []);

  const handleProfileChange = (profile) => {
    setProfile(profile);
    // Recharger la page pour que les changements prennent effet
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <>
      {/* Bannière de mode développement */}
      {showDevBanner && (
        <div className="dev-banner">
          <div className="dev-banner-content">
            <span className="dev-banner-text">🧪 Mode Développement - Sélecteur de Profil Actif</span>
            <button
              className="dev-banner-close"
              onClick={() => setShowDevBanner(false)}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Sélecteur de profil */}
      <div className="profile-switcher" ref={dropdownRef}>
        <button
          className="profile-switcher-button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            borderColor: config?.color || '#9CA3AF',
          }}
        >
          <span className="profile-icon">{config?.icon}</span>
          <span className="profile-label">{config?.label}</span>
          <span className={`profile-chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="profile-dropdown">
            <div className="profile-dropdown-title">Sélectionner un profil</div>

            <div className="profile-dropdown-items">
              {Object.entries(PROFILE_CONFIG).map(([key, value]) => (
                <button
                  key={key}
                  className={`profile-dropdown-item ${currentProfile === key ? 'active' : ''}`}
                  onClick={() => handleProfileChange(key)}
                  style={{
                    backgroundColor:
                      currentProfile === key ? value.color + '15' : 'transparent',
                    borderLeftColor: currentProfile === key ? value.color : 'transparent',
                  }}
                >
                  <span className="dropdown-item-icon">{value.icon}</span>
                  <div className="dropdown-item-content">
                    <div className="dropdown-item-label">{value.label}</div>
                    <div className="dropdown-item-description">{value.description}</div>
                  </div>
                  {currentProfile === key && <span className="dropdown-item-check">✓</span>}
                </button>
              ))}
            </div>

            {/* Infos du profil */}
            <div className="profile-dropdown-info">
              <div className="info-label">Profil courant :</div>
              {config?.mockUser && (
                <div className="info-user">
                  <div className="info-user-name">
                    {config.mockUser.prenom} {config.mockUser.nom}
                  </div>
                  <div className="info-user-email">{config.mockUser.email}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileSwitcher;
