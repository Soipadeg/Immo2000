/**
 * Tests Frontend - Composants Admin
 * Utilise Vitest + React Testing Library
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock du contexte d'authentification
const mockAuthContext = {
  user: { user_id: 1, email: 'admin@test.com', role: 'admin', nom: 'Admin' },
  loading: false,
};

// Mock du service API
vi.mock('../services/adminApi', () => ({
  dashboardApi: {
    getSummary: vi.fn(() => Promise.resolve({
      data: {
        data: {
          utilisateurs: { total: 10, actifs_derniers_30_jours: 8, nouveaux_derniers_30_jours: 2, taux_retention_pct: 80 },
          annonces: { total: 50, publiees: 40, vendues: 5, draft: 5, prix_moyen: 350000, prix_min: 100000, prix_max: 800000 },
          offres: { total: 15, acceptees: 10, refusees: 3, en_negociation: 2, taux_conversion_pct: 66.67 },
          revenus: { valeur_totale_offres: 5250000, valeur_moyenne_offre: 350000 },
        },
      },
    })),
  },
  analyticsApi: {
    getSummary: vi.fn(() => Promise.resolve({
      data: {
        data: {
          utilisateurs: { total: 10 },
          annonces: { total: 50 },
          offres: { total: 15 },
          revenus: { valeur_totale_offres: 5250000 },
        },
      },
    })),
  },
  usersApi: {
    list: vi.fn(() => Promise.resolve({
      data: {
        data: {
          utilisateurs: [
            { utilisateur_id: 1, email: 'user1@test.com', nom: 'User1', role: 'user', actif: true },
            { utilisateur_id: 2, email: 'user2@test.com', nom: 'User2', role: 'user', actif: true },
          ],
        },
      },
    })),
    search: vi.fn(() => Promise.resolve({
      data: { data: [] },
    })),
  },
  listingsApi: {
    getPending: vi.fn(() => Promise.resolve({
      data: {
        data: {
          brouillons: [
            { annonce_id: 1, titre: 'Test Listing', prix: 300000, type_bien: 'appartement' },
          ],
        },
      },
    })),
  },
  transactionsApi: {
    list: vi.fn(() => Promise.resolve({
      data: {
        data: {
          offres: [
            { offre_id: 1, annonce_id: 1, prix_propose: 280000, statut: 'proposee', date_offre: '2026-05-12' },
          ],
        },
      },
    })),
  },
  settingsApi: {
    list: vi.fn(() => Promise.resolve({
      data: {
        data: {
          parametres: [
            { cle_parametre: 'email_notifications_enabled', valeur_parametre: true, type_parametre: 'boolean', description: 'Notifications email' },
          ],
        },
      },
    })),
  },
}));

// Mock du hook useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock du hook useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/admin/dashboard' }),
  };
});

const theme = createTheme();

function renderWithProviders(component) {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
}

// ============================================================================
// Tests Dashboard Admin
// ============================================================================

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait charger les données du dashboard', async () => {
    const { default: AdminDashboardPage } = await import('../pages/AdminDashboardPage');
    renderWithProviders(<AdminDashboardPage />);

    // Attendre le chargement
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Vérifier que les KPIs sont affichés
    await waitFor(() => {
      expect(screen.getByText(/Dashboard Admin/i)).toBeInTheDocument();
    });
  });

  it('devrait afficher les statistiques principales', async () => {
    const { default: AdminDashboardPage } = await import('../pages/AdminDashboardPage');
    renderWithProviders(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Vérifier la présence des KPIs
    await waitFor(() => {
      expect(screen.getByText(/Utilisateurs|Annonces|Offres|Revenus/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Tests Gestion Utilisateurs
// ============================================================================

describe('AdminUsersPageNew', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher la liste des utilisateurs', async () => {
    const { default: AdminUsersPageNew } = await import('../pages/AdminUsersPageNew');
    renderWithProviders(<AdminUsersPageNew />);

    // Attendre le chargement
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Vérifier que la liste est affichée
    await waitFor(() => {
      expect(screen.getByText(/Gestion des Utilisateurs/i)).toBeInTheDocument();
    });
  });

  it('devrait permettre de rechercher des utilisateurs', async () => {
    const { default: AdminUsersPageNew } = await import('../pages/AdminUsersPageNew');
    const { usersApi } = await import('../services/adminApi');

    renderWithProviders(<AdminUsersPageNew />);

    const searchInput = screen.getByPlaceholderText(/Rechercher/i);
    await userEvent.type(searchInput, 'test');

    await waitFor(() => {
      expect(usersApi.search).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Tests Modération Annonces
// ============================================================================

describe('AdminListingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher les annonces en attente', async () => {
    const { default: AdminListingsPage } = await import('../pages/AdminListingsPage');
    renderWithProviders(<AdminListingsPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Vérifier que la page est chargée
    await waitFor(() => {
      expect(screen.getByText(/Modération des Annonces/i)).toBeInTheDocument();
    });
  });

  it('devrait permettre d\'approuver une annonce', async () => {
    const { default: AdminListingsPage } = await import('../pages/AdminListingsPage');
    renderWithProviders(<AdminListingsPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const approveButton = await screen.findByText(/Approuver/i);
    expect(approveButton).toBeInTheDocument();
  });
});

// ============================================================================
// Tests Gestion Transactions
// ============================================================================

describe('AdminTransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher la liste des transactions', async () => {
    const { default: AdminTransactionsPage } = await import('../pages/AdminTransactionsPage');
    renderWithProviders(<AdminTransactionsPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Gestion des Transactions/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Tests Paramètres Système
// ============================================================================

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher les paramètres système', async () => {
    const { default: AdminSettingsPage } = await import('../pages/AdminSettingsPage');
    renderWithProviders(<AdminSettingsPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Paramètres Système/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Tests Analytics
// ============================================================================

describe('AdminAnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher le dashboard analytics', async () => {
    const { default: AdminAnalyticsPage } = await import('../pages/AdminAnalyticsPage');
    renderWithProviders(<AdminAnalyticsPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
    });
  });

  it('devrait afficher les KPIs analytics', async () => {
    const { default: AdminAnalyticsPage } = await import('../pages/AdminAnalyticsPage');
    renderWithProviders(<AdminAnalyticsPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Vérifier les KPIs
    await waitFor(() => {
      expect(screen.getByText(/Utilisateurs/i)).toBeInTheDocument();
    });
  });
});
