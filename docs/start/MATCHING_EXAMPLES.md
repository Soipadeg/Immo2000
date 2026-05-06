# Exemples de code - Page de Matching Immo2000

## 📖 Exemples d'intégration et d'utilisation

---

## 1. Utiliser le service API matchingApi

### Exemple basique
```javascript
import { matchingApi } from '../services/api';

// Récupérer les annonces matchées
const fetchMatches = async () => {
  try {
    const results = await matchingApi.getMatches(userId, {
      ville: 'Paris',
      budget_max: 500000,
      surface_min: 80,
      type_bien: 'Appartement'
    });
    console.log('Annonces trouvées:', results.data);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Avec destructuring
```javascript
const { acheteur_id, ville, budget_max, surface_min, type_bien } = filters;

const response = await matchingApi.getMatches(acheteur_id, {
  ...(ville && { ville }),
  ...(budget_max && { budget_max: parseInt(budget_max) }),
  ...(surface_min && { surface_min: parseInt(surface_min) }),
  ...(type_bien && { type_bien })
});
```

---

## 2. Intégrer MatchingPage dans un composant parent

### Avec routing
```javascript
// App.jsx
import MatchingPage from './pages/MatchingPage';
import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route path="/matching" element={<MatchingPage />} />
      {/* autres routes */}
    </Routes>
  );
}
```

### Sans routing (composant enfant)
```javascript
import MatchingPage from './pages/MatchingPage';

export default function MyComponent() {
  return (
    <div>
      <h1>Trouvez votre bien</h1>
      <MatchingPage />
    </div>
  );
}
```

---

## 3. Accéder aux résultats de matching ailleurs dans l'app

### Utiliser Zustand (state management)
```javascript
// stores/matchingStore.js
import create from 'zustand';

export const useMatchingStore = create((set) => ({
  results: [],
  setResults: (results) => set({ results }),
  clearResults: () => set({ results: [] })
}));
```

### Dans MatchingPage.jsx
```javascript
import { useMatchingStore } from '../stores/matchingStore';

const MatchingPage = () => {
  const { setResults } = useMatchingStore();

  const handleSubmit = async (e) => {
    // ... requête API ...
    const response = await matchingApi.getMatches(...);
    setResults(response.data);  // Sauvegarder dans le store
  };
};
```

### Accéder ailleurs
```javascript
import { useMatchingStore } from '../stores/matchingStore';

export default function ResultsSummary() {
  const results = useMatchingStore((state) => state.results);

  return (
    <div>
      <p>Vous avez {results.length} annonces intéressantes</p>
    </div>
  );
}
```

---

## 4. Ajouter des fonctionnalités avancées

### Ajouter à la wishlist
```javascript
// Dans MatchingPage.jsx
const handleAddToWishlist = async (annonce_id) => {
  try {
    await fetch(`/api/v1/wishlist`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ annonce_id })
    });
    showSuccessMessage('Annonce ajoutée à la wishlist');
  } catch (error) {
    console.error('Erreur:', error);
  }
};

// Dans CardActions
<Button
  variant="outlined"
  color="secondary"
  onClick={() => handleAddToWishlist(annonce.id)}
>
  ❤️ Ajouter aux favoris
</Button>
```

### Gérer les clics sur les cartes
```javascript
const handleCardClick = (annonce_id) => {
  // Loguer la vue (analytics)
  logAnalytics('annonce_viewed', { annonce_id });

  // Rediriger
  navigate(`/annonces/${annonce_id}`);
};

// Dans CardMedia
<CardMedia
  onClick={() => handleCardClick(annonce.id)}
  sx={{ cursor: 'pointer' }}
  // ...
/>
```

---

## 5. Améliorer la pagination

### Ajouter Pagination MUI
```javascript
import Pagination from '@mui/material/Pagination';

export default function MatchingPage() {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Paginer les résultats
  const paginatedResults = annonces.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <>
      <Grid container spacing={3}>
        {paginatedResults.map((annonce) => (
          // ... CardComponent ...
        ))}
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={Math.ceil(annonces.length / itemsPerPage)}
          page={page}
          onChange={(event, value) => setPage(value)}
          color="primary"
        />
      </Box>
    </>
  );
}
```

---

## 6. Ajouter des filtres avancés

### Expandable filters
```javascript
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';

<Accordion>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    <Typography>Filtres avancés</Typography>
  </AccordionSummary>
  <AccordionDetails>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField label="Nombre de pièces" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Nombre de chambres" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="Année de construction" />
      </Grid>
      {/* ...autres filtres... */}
    </Grid>
  </AccordionDetails>
</Accordion>
```

---

## 7. Intégrer avec le système de notifications

### Notification de nouvelles annonces
```javascript
// services/notifications.js
export const subscribeToNewListings = (filters) => {
  const event = new EventSource(
    `/api/v1/listings/subscribe?${new URLSearchParams(filters)}`
  );

  event.onmessage = (e) => {
    const newListing = JSON.parse(e.data);
    showNotification(`Nouvelle annonce: ${newListing.adresse}`);
  };

  return event;
};

// Dans MatchingPage.jsx
useEffect(() => {
  const eventSource = subscribeToNewListings(filters);
  return () => eventSource.close();
}, [filters]);
```

---

## 8. Améliorer le formulaire avec validation

### Validation côté client
```javascript
import { useForm } from 'react-hook-form';

const MatchingPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      ville: '',
      budget_max: '',
      surface_min: '',
      type_bien: ''
    }
  });

  const onSubmit = async (data) => {
    // Validation manuelle
    if (data.budget_max < data.surface_min * 100) {
      setError('Budget trop faible pour la surface demandée');
      return;
    }

    // Requête API
    const response = await matchingApi.getMatches(userId, data);
    setAnnonces(response.data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField
        {...register('ville')}
        error={!!errors.ville}
        helperText={errors.ville?.message}
      />
      {/* ...autres champs... */}
    </form>
  );
};
```

---

## 9. Intégrer avec Google Maps

### Afficher les annonces sur une carte
```javascript
import { GoogleMap, Marker } from '@react-google-maps/api';

const mapStyle = { height: '500px', width: '100%' };

<GoogleMap defaultZoom={12} defaultCenter={{ lat: 48.8566, lng: 2.3522 }} mapContainerStyle={mapStyle}>
  {annonces.map((annonce) => (
    <Marker
      key={annonce.id}
      position={{ lat: annonce.latitude, lng: annonce.longitude }}
      onClick={() => navigate(`/annonces/${annonce.id}`)}
      title={annonce.adresse}
    />
  ))}
</GoogleMap>
```

---

## 10. Améliorer les performances

### Debouncer la recherche en temps réel
```javascript
import debounce from 'lodash/debounce';

const debouncedSearch = debounce(async (filters) => {
  const response = await matchingApi.getMatches(userId, filters);
  setAnnonces(response.data);
}, 500);

const handleFilterChange = (e) => {
  const { name, value } = e.target;
  const newFilters = { ...filters, [name]: value };
  setFilters(newFilters);
  debouncedSearch(newFilters);
};
```

### Lazy loading des images
```javascript
import LazyLoad from 'react-lazy-load-image-component';

<CardMedia>
  <LazyLoad>
    <img
      src={annonce.image_url}
      alt={annonce.adresse}
      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
    />
  </LazyLoad>
</CardMedia>
```

---

## 11. Tests avec Jest + React Testing Library

### Test du composant
```javascript
// tests/MatchingPage.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MatchingPage from '../pages/MatchingPage';
import * as api from '../services/api';

jest.mock('../services/api');

describe('MatchingPage', () => {
  test('renders filter form', () => {
    render(
      <BrowserRouter>
        <MatchingPage />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Ville/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Budget/i)).toBeInTheDocument();
  });

  test('submits form and displays results', async () => {
    const mockAnnonces = [
      { id: 1, adresse: 'Paris', prix: 300000, score: 95 }
    ];

    api.matchingApi.getMatches.mockResolvedValue({ data: mockAnnonces });

    render(
      <BrowserRouter>
        <MatchingPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Rechercher/i }));

    await waitFor(() => {
      expect(screen.getByText(/Paris/i)).toBeInTheDocument();
    });
  });
});
```

---

## 12. Exemple d'intégration complète

### Dashboard avec matching
```javascript
import { useState, useEffect } from 'react';
import { Container, Grid, Paper } from '@mui/material';
import MatchingPage from './pages/MatchingPage';
import WishlistSummary from './components/WishlistSummary';
import RecentViews from './components/RecentViews';

export default function BuyerDashboard() {
  return (
    <Container maxWidth="lg">
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3}>
            <MatchingPage />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <WishlistSummary />
            </Grid>
            <Grid item xs={12}>
              <RecentViews />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
```

---

## 📚 Ressources

- [Material-UI Docs](https://mui.com/)
- [React Router Docs](https://reactrouter.com/)
- [Axios Docs](https://axios-http.com/)
- [React Hooks](https://react.dev/reference/react)
- [Jest Testing](https://jestjs.io/)

---

**Version** : 1.0
**Dernière mise à jour** : 2024
