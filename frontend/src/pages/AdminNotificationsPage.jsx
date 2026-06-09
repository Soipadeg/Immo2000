/**
 * AdminNotificationsPage - Manage notifications and broadcast messages to users
 * Send notifications to users, topics, or all users
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminNotificationsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [notificationType, setNotificationType] = useState('all'); // all, role, specific
  const [recipientRole, setRecipientRole] = useState('utilisateur');
  const [recipientUsers, setRecipientUsers] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal'); // normal, important, urgent
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!authLoading && (!user || user.role !== 'admin')) {
    return null;
  }

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let endpoint = '/api/v1/admin/notifications/send';
      let payload = {
        title,
        message,
        priority,
        type: notificationType,
      };

      if (notificationType === 'role') {
        payload.recipient_role = recipientRole;
      } else if (notificationType === 'specific') {
        payload.recipient_ids = recipientUsers
          .split(',')
          .map(id => parseInt(id.trim()))
          .filter(id => !isNaN(id));

        if (payload.recipient_ids.length === 0) {
          setError('Veuillez spécifier au moins un ID utilisateur');
          setLoading(false);
          return;
        }
      }

      // Mock API call for demo
      if (true) { // Demo mode
        console.log('Sending notification:', payload);
        setSuccess(true);
        setTitle('');
        setMessage('');
        setRecipientUsers('');
        setTimeout(() => setSuccess(false), 3000);
        setLoading(false);
        return;
      }

      // Real API call would go here
      // const response = await fetch(endpoint, { ... });
    } catch (err) {
      console.error('Error sending notification:', err);
      setError('Erreur lors de l\'envoi de la notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2.5rem' }}>📢</span>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>Notifications & Broadcasting</h1>
        </div>
        <p style={{ color: '#666', margin: 0 }}>Envoyer des messages à vos utilisateurs</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          color: '#155724',
          marginBottom: '2rem',
          fontWeight: '500',
        }}>
          ✅ Notification envoyée avec succès!
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          color: '#721c24',
          marginBottom: '2rem',
          fontWeight: '500',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Main Form */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <form onSubmit={handleSendNotification}>
          {/* Recipient Type Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>👥 Type de Destinataires</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setNotificationType('all')}
                style={{
                  padding: '1rem',
                  border: `2px solid ${notificationType === 'all' ? '#007bff' : '#ddd'}`,
                  backgroundColor: notificationType === 'all' ? '#e7f3ff' : 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: notificationType === 'all' ? '600' : '500',
                  color: notificationType === 'all' ? '#007bff' : '#666',
                  transition: 'all 0.2s',
                }}
              >
                📣 Tous les Utilisateurs
              </button>

              <button
                type="button"
                onClick={() => setNotificationType('role')}
                style={{
                  padding: '1rem',
                  border: `2px solid ${notificationType === 'role' ? '#007bff' : '#ddd'}`,
                  backgroundColor: notificationType === 'role' ? '#e7f3ff' : 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: notificationType === 'role' ? '600' : '500',
                  color: notificationType === 'role' ? '#007bff' : '#666',
                  transition: 'all 0.2s',
                }}
              >
                👤 Par Rôle
              </button>

              <button
                type="button"
                onClick={() => setNotificationType('specific')}
                style={{
                  padding: '1rem',
                  border: `2px solid ${notificationType === 'specific' ? '#007bff' : '#ddd'}`,
                  backgroundColor: notificationType === 'specific' ? '#e7f3ff' : 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: notificationType === 'specific' ? '600' : '500',
                  color: notificationType === 'specific' ? '#007bff' : '#666',
                  transition: 'all 0.2s',
                }}
              >
                🔍 Spécifique
              </button>
            </div>

            {/* Role Filter */}
            {notificationType === 'role' && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Sélectionner le rôle
                </label>
                <select
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                  }}
                >
                  <option value="utilisateur">Utilisateurs</option>
                  <option value="notaire">Notaires</option>
                  <option value="admin">Administrateurs</option>
                </select>
              </div>
            )}

            {/* Specific Users */}
            {notificationType === 'specific' && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  IDs utilisateurs (séparés par des virgules)
                </label>
                <textarea
                  value={recipientUsers}
                  onChange={(e) => setRecipientUsers(e.target.value)}
                  placeholder="ex: 1, 2, 3, 4, 5"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    minHeight: '80px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            )}
          </div>

          {/* Message Content Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>✍️ Contenu du Message</h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Titre
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la notification"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Contenu du message"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  minHeight: '150px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                {message.length} caractères
              </div>
            </div>

            {/* Priority */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Priorité
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  style={{
                    padding: '0.75rem',
                    border: `2px solid ${priority === 'normal' ? '#28a745' : '#ddd'}`,
                    backgroundColor: priority === 'normal' ? '#e8f5e9' : 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: priority === 'normal' ? '600' : '500',
                    color: priority === 'normal' ? '#28a745' : '#666',
                  }}
                >
                  ⚪ Normal
                </button>

                <button
                  type="button"
                  onClick={() => setPriority('important')}
                  style={{
                    padding: '0.75rem',
                    border: `2px solid ${priority === 'important' ? '#ff9800' : '#ddd'}`,
                    backgroundColor: priority === 'important' ? '#fff3e0' : 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: priority === 'important' ? '600' : '500',
                    color: priority === 'important' ? '#ff9800' : '#666',
                  }}
                >
                  🟠 Important
                </button>

                <button
                  type="button"
                  onClick={() => setPriority('urgent')}
                  style={{
                    padding: '0.75rem',
                    border: `2px solid ${priority === 'urgent' ? '#d32f2f' : '#ddd'}`,
                    backgroundColor: priority === 'urgent' ? '#ffebee' : 'white',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: priority === 'urgent' ? '600' : '500',
                    color: priority === 'urgent' ? '#d32f2f' : '#666',
                  }}
                >
                  🔴 Urgent
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={loading || !title || !message}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: loading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.backgroundColor = '#0056b3';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.backgroundColor = '#007bff';
              }}
            >
              {loading ? '⏳ Envoi...' : '📤 Envoyer la Notification'}
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#e3f2fd',
        borderLeft: '4px solid #007bff',
        borderRadius: '6px',
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>ℹ️ Information</h3>
        <p style={{ margin: 0, color: '#555', fontSize: '0.95rem' }}>
          Les notifications seront envoyées à {notificationType === 'all' ? 'tous les utilisateurs' : notificationType === 'role' ? `tous les ${recipientRole}s` : 'les utilisateurs sélectionnés'} via push notification, email et in-app message.
        </p>
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
