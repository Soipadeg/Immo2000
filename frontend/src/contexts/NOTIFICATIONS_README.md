# Système de Notifications - Immo2000

## 📋 Vue d'ensemble

Le système de notifications d'Immo2000 comprend trois composants intégrés:

1. **NotificationsPage** - Interface pour gérer les notifications et les préférences
2. **NotificationContext** - Contexte global pour afficher les Toasts (notifications temporaires)
3. **notificationsApi** - Service API pour les tests d'email

---

## 🎯 Utilisation

### 1. Afficher une notification Toast

Utilisez le hook `useNotification()` dans n'importe quel composant:

```jsx
import { useNotification } from '../contexts/NotificationContext';

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const handleAction = async () => {
    try {
      // Votre logique...
      showSuccess('Action réussie !');
    } catch (err) {
      showError('Une erreur est survenue');
    }
  };

  return <button onClick={handleAction}>Cliquer</button>;
}
```

### 2. Accéder à la page Notifications

La page est accessible via `/notifications`:
- **Onglet 1 (Notifications)**: Afficher et gérer les notifications
- **Onglet 2 (Préférences)**: Configurer les préférences de notification
- **Onglet 3 (Test Email)**: Tester l'envoi d'emails

### 3. Les 4 types de notifications Toasts

```jsx
const { addNotification, showSuccess, showError, showWarning, showInfo } = useNotification();

showSuccess('Succès !');           // Fond vert
showError('Erreur !');              // Fond rouge
showWarning('Attention !');          // Fond orange
showInfo('Information');             // Fond bleu

// Avec durée personnalisée (millisecondes)
showSuccess('Message', 10000);      // 10 secondes
showError('Message', 0);             // Pas d'auto-hide
```

---

## 🔧 Configuration

### États des Préférences

Les préférences sont stockées localement et incluent:

```javascript
{
  email_on_new_visite: true,        // Email pour nouvelles visites
  email_on_new_annonce: true,       // Email pour nouvelles annonces
  email_on_feedback: true,          // Email pour avis reçus
  email_on_message: true,           // Email pour messages
  email_newsletter: false,          // Email newsletter
  notification_frequency: 'immediate' // 'immediate' | 'daily' | 'weekly'
}
```

### Appel API de Test Email

```javascript
import { notificationsApi } from '../services/api';

await notificationsApi.testEmail('user@example.com');
```

---

## 📱 Architecture

```
frontend/src/
├── contexts/
│   └── NotificationContext.jsx          ← Contexte global des Toasts
├── pages/
│   └── NotificationsPage.jsx            ← Interface Notifications
├── services/
│   └── api.js                           ← notificationsApi service
└── App.jsx                              ← NotificationProvider wrapper
```

---

## ✨ Fonctionnalités

### NotificationsPage

- ✅ Afficher les notifications reçues
- ✅ Marquer comme lue
- ✅ Supprimer des notifications
- ✅ Configurer les préférences d'email
- ✅ Choisir la fréquence de notification (immédiate/quotidienne/hebdomadaire)
- ✅ Tester l'envoi d'emails
- ✅ Compteur de notifications non lues (Badge)

### NotificationContext (Toasts)

- ✅ Affichage temporaire de messages
- ✅ 4 niveaux de sévérité (success, error, warning, info)
- ✅ Auto-masquage configurable
- ✅ Position fixe en bas à droite
- ✅ Gestion de pile (plusieurs notifications à la fois)

---

## 🔌 Intégrations

Le système de notifications a été intégré dans:

- **VisitesPage**: Afficher les succès/erreurs lors de la gestion des visites
- **BiensPage**: Notifications pour CRUD des propriétés
- **EstimationsPage**: Feedback sur les estimations et comparaisons
- **FAQPage**: Confirmations de recherche/filtrage
- **ProfilePage**: Confirmation de mise à jour de profil

---

## 📝 Exemple Complet

```jsx
import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { biensApi } from '../services/api';

function BiensPage() {
  const { showSuccess, showError } = useNotification();

  const handleDeleteBien = async (bienId) => {
    try {
      await biensApi.delete(bienId);
      showSuccess('Propriété supprimée avec succès');
    } catch (err) {
      showError(err.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  return (
    // JSX...
  );
}

export default BiensPage;
```

---

## 🚀 Futures Améliorations

- [ ] Persistance des notifications en base de données
- [ ] Notifications en temps réel (WebSockets)
- [ ] Notifications push (Service Worker)
- [ ] Groupage des notifications par catégorie
- [ ] Historique complet des notifications
- [ ] Désabonnement des notifications
- [ ] Notifications par SMS
- [ ] Dashboard des statistiques de notifications

---

## ⚠️ Notes

- Les notifications Toast disparaissent automatiquement après 5 secondes (configurable)
- Les préférences sont stockées localement dans `localStorage`
- Le contexte NotificationProvider doit envelopper l'app pour que le hook marche
- Les Badges et compteurs sont en temps réel dans la UI
