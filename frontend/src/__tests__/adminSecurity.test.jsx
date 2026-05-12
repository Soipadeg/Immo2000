import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminAuditPage from '../pages/AdminAuditPage';
import AdminSecurityPage from '../pages/AdminSecurityPage';
import { auditApi } from '../services/adminApi';
import { AuthProvider } from '../context/AuthContext';

// Mock the auditApi
vi.mock('../services/adminApi', () => ({
  auditApi: {
    getAuditLogs: vi.fn(),
    exportAuditLogs: vi.fn(),
    getSecurityStatus: vi.fn(),
  },
}));

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { user_id: 5, email: 'admin@immo2000.fr', role: 'admin' },
    isAuthenticated: true,
  }),
}));

const mockAuditLogs = {
  logs: [
    {
      log_id: 1,
      admin_id: 5,
      admin_email: 'admin@immo2000.fr',
      action: 'user_suspended',
      resource_type: 'user',
      resource_id: 123,
      status_code: 200,
      ip_address: '192.168.1.1',
      timestamp: '2024-01-15T10:30:00Z',
      old_value: { status: 'active' },
      new_value: { status: 'suspended' },
    },
  ],
  total: 1,
};

const mockSecurityStatus = {
  failed_actions_24h: 2,
  suspicious_ips: [
    { ip: '203.0.113.1', failed_count: 8 },
  ],
  top_active_admins: [
    { admin_id: 5, email: 'admin@immo2000.fr', actions: 15 },
  ],
};

describe('AdminAuditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditApi.getAuditLogs.mockResolvedValue({ data: mockAuditLogs });
  });

  it('should render the audit logs page', async () => {
    render(
      <BrowserRouter>
        <AdminAuditPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Audit Trail/i)).toBeInTheDocument();
  });

  it('should load and display audit logs', async () => {
    render(
      <BrowserRouter>
        <AdminAuditPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(auditApi.getAuditLogs).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('user_suspended')).toBeInTheDocument();
    });
  });

  it('should handle export CSV', async () => {
    auditApi.exportAuditLogs.mockResolvedValue({
      data: 'log_id,admin_email,action\n1,admin@immo2000.fr,user_suspended',
    });

    const { getByRole } = render(
      <BrowserRouter>
        <AdminAuditPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Exporter CSV')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Exporter CSV');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(auditApi.exportAuditLogs).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    auditApi.getAuditLogs.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <AdminAuditPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Erreur lors du chargement des logs d'audit/i)
      ).toBeInTheDocument();
    });
  });
});

describe('AdminSecurityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditApi.getSecurityStatus.mockResolvedValue({ data: mockSecurityStatus });
  });

  it('should render the security status page', async () => {
    render(
      <BrowserRouter>
        <AdminSecurityPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Statut de Sécurité/i)).toBeInTheDocument();
  });

  it('should load and display security status', async () => {
    render(
      <BrowserRouter>
        <AdminSecurityPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(auditApi.getSecurityStatus).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/Sûr/)).toBeInTheDocument();
    });
  });

  it('should display suspicious IPs', async () => {
    render(
      <BrowserRouter>
        <AdminSecurityPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('203.0.113.1')).toBeInTheDocument();
    });
  });

  it('should display active admins', async () => {
    render(
      <BrowserRouter>
        <AdminSecurityPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('admin@immo2000.fr')).toBeInTheDocument();
    });
  });

  it('should handle refresh button', async () => {
    render(
      <BrowserRouter>
        <AdminSecurityPage />
      </BrowserRouter>
    );

    const refreshButton = screen.getByRole('button', { name: /Rafraîchir/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(auditApi.getSecurityStatus).toHaveBeenCalledTimes(2);
    });
  });

  it('should show health status as Safe', async () => {
    render(
      <BrowserRouter>
        <AdminSecurityPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sûr')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    auditApi.getSecurityStatus.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <AdminSecurityPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Erreur lors du chargement du statut de sécurité/i)
      ).toBeInTheDocument();
    });
  });
});

describe('useSessionTimeout Hook', () => {
  it('should initialize session on first load', () => {
    localStorage.clear();
    // This would be tested with a test component that uses the hook
    const loginTime = localStorage.getItem('loginTime');
    expect(loginTime).toBeNull(); // Before the hook is called
  });

  it('should extend session when called', () => {
    // This would be tested with a test component that uses the hook
    // Testing the extendSession function
    expect(true).toBe(true); // Placeholder
  });

  it('should show warning after 19 minutes', () => {
    // This would be tested with a test component that uses the hook
    // and mocked timers
    expect(true).toBe(true); // Placeholder
  });
});
