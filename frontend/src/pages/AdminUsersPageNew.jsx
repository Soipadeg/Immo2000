/**
 * TÂCHE 2: Gestion des Utilisateurs
 */

import React, { useState, useEffect } from 'react';
import { usersApi } from '../services/adminApi';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button, Alert, Input } from '@/components';
import '../styles/AdminUsersPageNew.css';
import { Button, Alert, Input } from '@/components';
import '../styles/AdminUsersPageNew.css';
import { Button, Alert, Input } from '@/components';
import '../styles/AdminUsersPageNew.css';
import { Button, Alert, Input } from '@/components';
import '../styles/AdminUsersPageNew.css';





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
    <div maxWidth="lg">
      <div>
        <h4 variant="h4" gutterBottom>👥 Gestion des Utilisateurs</h4>
        <div>
          <Input
            placeholder="Rechercher (email, nom...)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            size="small"
            InputProps={{ startAdornment: <Search /> }}
          />
        </div>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <div>
          <div />
        </div>
      ) : (
        <>
          <div component={Paper}>
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
                        <span
                          label={u.role}
                          size="small"
                          color={u.role === 'admin' ? 'error' : 'default'}
                          variant="outlined"
                        />
                      </td>
                      <td>
                        <span
                          label={u.actif ? 'Actif' : 'Suspendu'}
                          size="small"
                          color={u.actif ? 'success' : 'warning'}
                        />
                      </td>
                      <td>
                        <Tooltip title="Changer rôle">
                          <Button
                            size="small"
                            onClick={() => setDialog({ open: true, action: 'changeRole', userId: u.utilisateur_id })}
                          >
                            <Edit fontSize="small" />
                          </Button>
                        </Tooltip>
                        {u.actif ? (
                          <Tooltip title="Suspendre">
                            <Button
                              size="small"
                              onClick={() => setDialog({ open: true, action: 'suspend', userId: u.utilisateur_id })}
                            >
                              <Block fontSize="small" />
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Réactiver">
                            <Button
                              size="small"
                              onClick={() => setDialog({ open: true, action: 'reactivate', userId: u.utilisateur_id })}
                            >
                              <Check fontSize="small" />
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip title="Supprimer">
                          <Button
                            size="small"
                            onClick={() => setDialog({ open: true, action: 'delete', userId: u.utilisateur_id })}
                          >
                            <Delete fontSize="small" />
                          </Button>
                        </Tooltip>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div>
            <Pagination count={10} page={page} onChange={(e, p) => setPage(p)} />
          </div>
        </>
      )}

      {/* Dialogs */}
      <div open={dialog.open} onClose={() => setDialog({ open: false, action: null, userId: null })}>
        <div>
          {dialog.action === 'changeRole' && 'Changer le rôle?'}
          {dialog.action === 'suspend' && 'Suspendre l\'utilisateur?'}
          {dialog.action === 'reactivate' && 'Réactiver l\'utilisateur?'}
          {dialog.action === 'delete' && 'Supprimer l\'utilisateur?'}
        </div>
        <div>
          {dialog.action === 'suspend' && (
            <Input
              label="Durée de suspension (heures)"
              type="number"
              value={suspendHours}
              onChange={(e) => setSuspendHours(parseInt(e.target.value))}
              fullWidth
            />
          )}
          {dialog.action === 'delete' && (
            <p color="error">Cette action est irréversible!</h4>
          )}
        </div>
        <div>
          <Button onClick={() => setDialog({ open: false, action: null, userId: null })}>
            Annuler
          </Button>
          <Button
            onClick={() => handleAction(dialog.action, dialog.userId)}
            disabled={actionLoading}
            variant="contained"
            color={dialog.action === 'delete' ? 'error' : 'primary'}
          >
            {actionLoading ? <div size={24} /> : 'Confirmer'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
