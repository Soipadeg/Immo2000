import '../styles/AdminUsersPage.css';
/**
 * Page Gestion des Utilisateurs (Admin)
 */

import React, { useState } from 'react';
import { Button, Input } from '@/components';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminUsersPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([
    { id: 1, email: 'jean@example.com', nom: 'Dupont', prenom: 'Jean', role: 'user', statut: 'actif', dateInscription: '2026-01-15' },
    { id: 2, email: 'marie@example.com', nom: 'Martin', prenom: 'Marie', role: 'user', statut: 'actif', dateInscription: '2026-02-20' },
    { id: 3, email: 'admin@immo2000.fr', nom: 'Admin', prenom: 'Super', role: 'admin', statut: 'actif', dateInscription: '2025-12-01' },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-spinner">⏳ Chargement...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  const handleOpenDialog = (userToEdit) => {
    setSelectedUser(userToEdit);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleSuspendUser = (id) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, statut: u.statut === 'actif' ? 'suspendu' : 'actif' } : u
      )
    );
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false;
    if (filterStatut && u.statut !== filterStatut) return false;
    return true;
  });

  const getRoleColor = (role) => {
    return role === 'admin' ? 'error' : 'primary';
  };

  const getStatutColor = (statut) => {
    return statut === 'actif' ? 'success' : 'warning';
  };

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <div>👥 Gestion des Utilisateurs</div>
        <div>Total: {users.length} utilisateurs | Actifs: {users.filter((u) => u.statut === 'actif').length}</div>
      </div>

      {/* Filtres */}
      <div className="filters">
        <select className="filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="">Rôle: Tous</option>
          <option value="user">Rôle: Utilisateur</option>
          <option value="admin">Rôle: Administrateur</option>
        </select>

        <select className="filter-select" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
          <option value="">Statut: Tous</option>
          <option value="actif">Statut: Actif</option>
          <option value="suspendu">Statut: Suspendu</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="table-wrapper">
        <div className="table-header">
          <div>Email</div>
          <div>Nom</div>
          <div>Rôle</div>
          <div>Statut</div>
          <div>Date d'inscription</div>
          <div>Actions</div>
        </div>
        <div className="table-body">
          {filteredUsers.map((u) => (
            <div key={u.id} className="table-row">
              <div className="table-cell">{u.email}</div>
              <div className="table-cell">{u.prenom} {u.nom}</div>
              <div className="table-cell"><div className={`role-badge role-${u.role}`}>{u.role === 'admin' ? 'Admin' : 'Utilisateur'}</div></div>
              <div className="table-cell"><div className={`statut-badge statut-${u.statut}`}>{u.statut === 'actif' ? 'Actif' : 'Suspendu'}</div></div>
              <div className="table-cell">{new Date(u.dateInscription).toLocaleDateString('fr-FR')}</div>
              <div className="table-cell actions">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleSuspendUser(u.id)}
                  className="action-btn"
                >
                  {u.statut === 'actif' ? '🔒 Suspendre' : '✓ Activer'}
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleDeleteUser(u.id)}
                  className="action-btn"
                >
                  🗑️ Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
