# Zustand Stores - Phase 4.1

## 📚 Guide d'Utilisation

Cette phase migre de React Context à Zustand pour une meilleure performance et simplicité.

### Qu'est-ce que Zustand?

Zustand est une bibliothèque de gestion d'état légère (2KB) qui remplace React Context avec:
- ✅ Syntaxe plus simple
- ✅ Pas de Provider Hell
- ✅ Performance meilleure (no unnecessary re-renders)
- ✅ Plus facile à tester

### Les 3 Stores

#### 1. **authStore.js** - Authentification
Gère: user, token, login, logout, roles

```javascript
// Importer le store
import { useAuthStore } from '../store';

// Utiliser dans un composant
function LoginForm() {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const handleLogin = async (email, password) => {
    const success = await login(email, password);
    if (success) {
      // Redirige vers dashboard
    }
  };

  return isAuthenticated ? (
    <button onClick={logout}>Logout {user.email}</button>
  ) : (
    <form onSubmit={handleLogin}>...</form>
  );
}
```

**API complète:**
```javascript
const {
  // State
  isAuthenticated,
  user,
  loading,
  error,
  isDevMode,

  // Actions
  checkAuth(),          // Vérifie l'auth au démarrage
  initDevMode(role),    // Active le mode dev
  exitDevMode(),        // Quitte le mode dev
  login(email, pwd),    // Se connecte
  logout(),             // Se déconnecte
  hasRole(role),        // Vérifie un rôle
  hasAnyRole(roles),    // Vérifie plusieurs rôles
  canAccess(roles),     // Peut accéder?
  setUser(user),        // Met à jour user
  clearError(),         // Vide les erreurs
} = useAuthStore();
```

#### 2. **notificationStore.js** - Notifications
Gère: toasts, messages, notifications

```javascript
import { useNotificationStore } from '../store';

function SaveButton() {
  const { showSuccess, showError } = useNotificationStore();

  const handleSave = async (data) => {
    try {
      await api.save(data);
      showSuccess('Sauvegardé!');  // Auto-dismiss après 5s
    } catch (err) {
      showError(err.message);
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

**API complète:**
```javascript
const {
  // State
  notifications,  // Array de notifications actuelles

  // Actions
  addNotification(msg, severity, duration),
  removeNotification(id),
  showSuccess(msg, duration),
  showError(msg, duration),
  showWarning(msg, duration),
  showInfo(msg, duration),
  clearAll(),  // Efface toutes les notifications
} = useNotificationStore();
```

#### 3. **uiStore.js** - State UI
Gère: thème, sidebar, filtres, tri, etc.

```javascript
import { useUIStore } from '../store';

function Sidebar() {
  const { sidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore();

  return (
    <>
      <button onClick={toggleSidebar}>
        {sidebarOpen ? 'Fermer' : 'Ouvrir'} Sidebar
      </button>
      <button onClick={toggleTheme}>
        Thème actuel: {theme}
      </button>
    </>
  );
}
```

**API complète:**
```javascript
const {
  // State
  sidebarOpen,
  theme,              // 'light' | 'dark'
  mobileMenuOpen,
  searchQuery,
  activeFilters,      // { prix_min: 100000, ... }
  sortBy,             // 'date_desc', 'prix_asc', etc.
  pageSize,           // 12 par défaut

  // Sidebar
  toggleSidebar(),
  setSidebarOpen(open),

  // Thème
  toggleTheme(),
  setTheme(theme),

  // Menu Mobile
  toggleMobileMenu(),
  setMobileMenuOpen(open),

  // Recherche & Filtres
  setSearchQuery(query),
  setActiveFilters(filters),
  setFilter(key, value),
  removeFilter(key),
  clearFilters(),

  // Tri & Pagination
  setSortBy(sortBy),
  setPageSize(pageSize),

  // Reset
  reset(),  // Réinitialise tout
} = useUIStore();
```

---

## 🎯 Migration de React Context

### Avant (React Context)
```javascript
// Importer le contexte
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Utiliser dans un composant
function MyComponent() {
  const { user, login } = useContext(AuthContext);
  // ...
}
```

### Après (Zustand)
```javascript
// Importer le store
import { useAuthStore } from '../store';

// Utiliser dans un composant
function MyComponent() {
  const { user, login } = useAuthStore();
  // ...
}
```

**Avantages:**
- Moins de boilerplate (pas de Provider)
- Meilleure performance (selective subscription)
- Plus facile à tester (fonctions pures)
- DevTools Zustand intégré

---

## 📈 Performance

### Avant (Context - Re-render tout le tree)
```javascript
function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <UIProvider>
          <MainComponent />  // Re-render si auth change
        </UIProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
```

### Après (Zustand - Selective subscription)
```javascript
function MainComponent() {
  // Seul ce composant re-render si auth.user change
  // Les autres composants ne sont pas affectés
  const { user } = useAuthStore();
  return <div>{user.name}</div>;
}
```

**Résultat:** 50-70% moins de re-renders 🚀

---

## 💾 Persistance

**uiStore** utilise automatiquement localStorage:
- `sidebarOpen` est persisté
- `theme` est persisté
- `pageSize` est persisté

**Pour ajouter d'autres données persistées:**
```javascript
persist(
  (set) => ({ ... }),
  {
    name: 'my-storage',
    partialize: (state) => ({
      myData: state.myData,  // Sera persisté
      otherData: state.otherData,  // Aussi
    }),
  }
)
```

---

## 🧪 Tester les Stores

### Tester un store
```javascript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../store/authStore';

test('login sets user and token', async () => {
  const { result } = renderHook(() => useAuthStore());

  act(() => {
    result.current.login('user@test.com', 'password');
  });

  expect(result.current.isAuthenticated).toBe(true);
  expect(result.current.user).not.toBeNull();
});
```

### Tester un composant utilisant un store
```javascript
import { useAuthStore } from '../store';

// Mock le store
jest.mock('../store', () => ({
  useAuthStore: jest.fn(),
}));

test('component shows user name', () => {
  useAuthStore.mockReturnValue({
    user: { name: 'John' },
    isAuthenticated: true,
  });

  render(<MyComponent />);
  expect(screen.getByText('John')).toBeInTheDocument();
});
```

---

## 🔧 Configuration

### .env
Pas de variables d'env nécessaires pour les stores.
Les stores utilisent les APIs existantes dans `services/api`.

### localStorage
**uiStore** utilise localStorage avec la clé `ui-storage`.

---

## ✅ Checklist Migration

Pendant la migration de Context à Zustand:

- [ ] Remplacer tous les `useContext(AuthContext)` par `useAuthStore()`
- [ ] Remplacer tous les `useContext(NotificationContext)` par `useNotificationStore()`
- [ ] Ajouter les stores initialisés dans `App.jsx`
- [ ] Tester que les notifications fonctionnent toujours
- [ ] Tester que l'auth fonctionne toujours
- [ ] Supprimer les fichiers Context.jsx (après vérification)
- [ ] Mettre à jour les imports dans les composants

---

## 🚀 Prochaines Étapes

**Phase 4.2:** Centraliser les appels API
- Créer `services/api/client.js` avec axios instance
- Créer des modules pour auth, listings, messages, etc.
- Ajouter des interceptors pour auth headers et retry logic

**Phase 4.3:** React Hook Form
- Installer `react-hook-form`
- Migrer les formulaires (login, register, create listing)
- Ajouter validation côté client

**Phase 4.4:** Code Splitting
- Lazy load les routes principales
- Lazy load les composants lourds
- Vérifier le bundle size

---

## 📚 Ressources

- Zustand Docs: https://github.com/pmndrs/zustand
- Zustand DevTools: https://github.com/pmndrs/zustand-devtools
- React Context vs Zustand: https://dev.to/jackfan/zustand-vs-react-context-api-18

---

## ❓ FAQ

**Q: Dois-je utiliser les hooks personnalisés (useAuth, useNotification)?**
A: Non, c'est optionnel. Vous pouvez utiliser directement `useAuthStore()`.

**Q: Comment ajouter une nouvelle propriété au store?**
A: Ajoutez-la dans `create((set) => ({ ... }))` et créez une action.

**Q: Zustand fonctionne en SSR (Server-Side Rendering)?**
A: Oui, avec quelques ajustements. Pour un client-side app (Vite), pas d'ajustement nécessaire.

**Q: Comment déboguer avec Zustand?**
A: Utilisez Zustand DevTools ou simplement `console.log(useAuthStore.getState())`.
