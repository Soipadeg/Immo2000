/**
 * Page de profil utilisateur
 * Afficher et modifier les informations du profil
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Input } from '@/components';
import { authApi } from '../services/api';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    adresse_contact: '',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authApi.me();
      setUser(response.data);
      setFormData({
        nom: response.data.nom || '',
        prenom: response.data.prenom || '',
        telephone: response.data.telephone || '',
        adresse_contact: response.data.adresse_contact || '',
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setError('');
    try {
      const response = await authApi.updateProfile(formData);
      setUser(response.data);
      setSuccess('Profil mis à jour avec succès');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page-container">
        <Alert type="error" title="Erreur" message="Impossible de charger le profil" />
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <h1 className="page-title">👤 Mon Profil</h1>

      {error && <Alert type="error" title="Erreur" message={error} />}
      {success && <Alert type="success" title="Succès" message={success} />}

      {/* Card d'information générale */}
      <Card className="profile-header-card">
        <div className="profile-header-content">
          <div className="avatar-section">
            <div className="avatar">
              {user.prenom?.[0]?.toUpperCase()}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">
                {user.prenom} {user.nom}
              </h2>
              <p className="profile-email">{user.email}</p>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
            >
              ✏️ Modifier
            </Button>
          )}
        </div>
      </Card>

      {/* Onglets */}
      <div className="profile-tabs">
        <div className="tabs-nav">
          <button
            className={`tab-button ${tabValue === 0 ? 'active' : ''}`}
            onClick={() => setTabValue(0)}
          >
            Informations personnelles
          </button>
          <button
            className={`tab-button ${tabValue === 1 ? 'active' : ''}`}
            onClick={() => setTabValue(1)}
          >
            🔐 Sécurité
          </button>
          <button
            className={`tab-button ${tabValue === 2 ? 'active' : ''}`}
            onClick={() => setTabValue(2)}
          >
            ⚙️ Préférences
          </button>
        </div>

        {/* Onglet 0: Informations personnelles */}
        {tabValue === 0 && (
          <Card className="tab-content">
            {isEditing ? (
              <div className="form-container">
                <div className="form-row">
                  <Input
                    label="Prénom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-row">
                  <Input
                    label="Téléphone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Email"
                    value={user.email}
                    disabled
                  />
                </div>
                <div>
                  <label className="form-label">Adresse de contact</label>
                  <textarea
                    name="adresse_contact"
                    value={formData.adresse_contact}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="2"
                  />
                </div>
                <div className="form-actions">
                  <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                  >
                    💾 Enregistrer
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="profile-info-grid">
                <div className="info-item">
                  <span className="info-label">PRÉNOM</span>
                  <p className="info-value">{user.prenom || '-'}</p>
                </div>
                <div className="info-item">
                  <span className="info-label">NOM</span>
                  <p className="info-value">{user.nom || '-'}</p>
                </div>
                <div className="info-item">
                  <span className="info-label">EMAIL</span>
                  <p className="info-value">{user.email}</p>
                </div>
                <div className="info-item">
                  <span className="info-label">TÉLÉPHONE</span>
                  <p className="info-value">{user.telephone || '-'}</p>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">ADRESSE DE CONTACT</span>
                  <p className="info-value">{user.adresse_contact || '-'}</p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Onglet 1: Sécurité */}
        {tabValue === 1 && (
          <Card className="tab-content">
            <div className="security-section">
              <h3 className="section-title">🔐 Sécurité du Compte</h3>

              <div className="security-item">
                <p className="security-label">Email vérifié</p>
                <span className={`verification-badge ${user.email_verified ? 'verified' : 'unverified'}`}>
                  {user.email_verified ? '✓ Vérifié' : '✗ Non vérifié'}
                </span>
              </div>

              <div className="security-actions">
                <Button variant="secondary">
                  🔑 Changer le mot de passe
                </Button>
                <Button variant="danger">
                  2️⃣ Activer authentification à 2 facteurs
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Onglet 2: Préférences */}
        {tabValue === 2 && (
          <Card className="tab-content">
            <div className="preferences-section">
              <h3 className="section-title">⚙️ Préférences</h3>

              <p className="preferences-text">
                Vous pouvez personnaliser votre expérience Immo2000 ici.
              </p>

              <div className="preference-item">
                <p className="preference-label">📧 Notifications par email</p>
                <p className="preference-value">Fonctionnalité à venir...</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

