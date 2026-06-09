import '../styles/AdminUsersPageNew.css';
/**
 * TÂCHE 2: Gestion des Utilisateurs
 */

import React, { useState, useEffect } from 'react';
import { usersApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button, Alert, Input, FormContainer } from '@/components';





const AdminUsersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialog, setDialog] = useState({ open: false, action: null, userId: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendHours, setSuspendHours] = useState(48);

  useEffect(() => {
    if (!authLoading && (!user || user?.role !== 'admin')) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && user?.role === 'admin') {
      loadUsers();
    }
  }, [page, searchQuery, user, authLoading]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      let response;
      if (searchQuery) {
        response = await usersApi.search(searchQuery);
      } else {
        response = await usersApi.list(skip, limit);
      }
      setUsers(response.data?.data?.utilisateurs || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, userId) => {
    setActionLoading(true);
    try {
      switch (action) {
        case 'changeRole':
          await usersApi.changeRole(userId);
          break;
        case 'suspend':
          await usersApi.suspend(userId, suspendHours);
          break;
        case 'reactivate':
          await usersApi.reactivate(userId);
          break;
        case 'delete':
          await usersApi.delete(userId);
          break;
        default:
          break;
      }
      setDialog({ open: false, action: null, userId: null });
      loadUsers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'action');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="search-page-header">
        <div className="search-page-header__content">
          <div className="search-page-header__title-row">
            <span className="search-page-header__icon">👥</span>
            <h1>Gestion des Utilisateurs</h1>
          </div>
          <p>Recherchez et gérez les comptes utilisateurs</p>
        </div>
      </div>

      <FormContainer maxWidth="full-width">
        <div>
          <div>
            <Input
              placeholder="Rechercher (email, nom...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              size="small"
            />
          </div>
        </div>

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <div>
            <div>⏳ Chargement...</div>
          </div>
        ) : (
          <>
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', backgroundColor: '#fff' }}>
              <table>
                <thead>
                  <tr>
                    <td><strong>Email</strong></td>
                    <td><strong>Nom</strong></td>
                    <td><strong>Rôle</strong></td>
                  <td><strong>Statut</strong></td>
                  <td><strong>Actions</strong></td>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.utilisateur_id}>
                      <td>{u.email}</td>
                      <td>{u.nom || '-'}</td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: u.role === 'admin' ? '#ffe6e6' : '#e6f0ff',
                          color: u.role === 'admin' ? '#c00' : '#004a99',
                          fontSize: '12px',
                          border: `1px solid ${u.role === 'admin' ? '#ff6b6b' : '#0066cc'}`
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: u.actif ? '#e6ffe6' : '#fff0e6',
                          color: u.actif ? '#004d00' : '#996600',
                          fontSize: '12px',
                          border: `1px solid ${u.actif ? '#66cc66' : '#ff9933'}`
                        }}>
                          {u.actif ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>
                      <td>
                        <Button
                          size="small"
                          title="Changer rôle"
                          onClick={() => setDialog({ open: true, action: 'changeRole', userId: u.utilisateur_id })}
                        >
                          ✏️ Rôle
                        </Button>
                        {u.actif ? (
                          <Button
                            size="small"
                            title="Suspendre"
                            onClick={() => setDialog({ open: true, action: 'suspend', userId: u.utilisateur_id })}
                          >
                            🚫 Suspendre
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            title="Réactiver"
                            onClick={() => setDialog({ open: true, action: 'reactivate', userId: u.utilisateur_id })}
                          >
                            ✅ Réactiver
                          </Button>
                        )}
                        <Button
                          size="small"
                          title="Supprimer"
                          onClick={() => setDialog({ open: true, action: 'delete', userId: u.utilisateur_id })}
                        >
                          🗑️ Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              ← Précédent
            </Button>
            <div style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              Page {page}
            </div>
            <Button
              onClick={() => setPage(page + 1)}
            >
              Suivant →
            </Button>
          </div>
        </>
      )}

      {/* Modal d'actions */}
      {dialog.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginTop: 0 }}>
              {dialog.action === 'changeRole' && 'Changer le rôle?'}
              {dialog.action === 'suspend' && 'Suspendre l\'utilisateur?'}
              {dialog.action === 'reactivate' && 'Réactiver l\'utilisateur?'}
              {dialog.action === 'delete' && 'Supprimer l\'utilisateur?'}
            </h2>
            <div style={{ marginBottom: '16px' }}>
              {dialog.action === 'suspend' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Durée de suspension (heures):</label>
                  <input
                    type="number"
                    value={suspendHours}
                    onChange={(e) => setSuspendHours(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              )}
              {dialog.action === 'delete' && (
                <div style={{ padding: '12px', backgroundColor: '#ffe6e6', borderRadius: '4px', color: '#c00' }}>
                  ⚠️ Cette action est irréversible!
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button onClick={() => setDialog({ open: false, action: null, userId: null })}>
                Annuler
              </Button>
              <Button
                onClick={() => handleAction(dialog.action, dialog.userId)}
                disabled={actionLoading}
              >
                {actionLoading ? '⏳...' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}
      </FormContainer>
    </>
  );
};

export default AdminUsersPage;
