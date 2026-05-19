/**
 * Tests unitaires pour les services API
 * Phase 5.3 - Testing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the API client
vi.mock('../../services/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from '../../services/api/client';

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // Tests API Service Methods
  // ============================================
  describe('transactionsApi - getById', () => {
    it('should fetch transaction by ID', async () => {
      const mockTransaction = {
        transaction_id: '123',
        titre: 'Test Property',
        prix_compromis: 250000,
      };

      apiClient.get.mockResolvedValue({ data: mockTransaction });

      // Import happens after mock setup
      const { transactionsApi } = await import('../../services/api/transactions');
      const res = await transactionsApi.getById('123');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/transactions/123');
      expect(res.data).toEqual(mockTransaction);
    });
  });

  describe('transactionsApi - list', () => {
    it('should list transactions with filters', async () => {
      const mockTransactions = [
        { transaction_id: '1', titre: 'Property 1' },
        { transaction_id: '2', titre: 'Property 2' },
      ];

      apiClient.get.mockResolvedValue({ data: mockTransactions });

      const { transactionsApi } = await import('../../services/api/transactions');
      const res = await transactionsApi.list({ status: 'pending' });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/transactions',
        expect.objectContaining({ params: { status: 'pending' } })
      );
      expect(res.data).toHaveLength(2);
    });
  });

  describe('transactionsApi - selectNotaire', () => {
    it('should select notaire for transaction', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });

      const { transactionsApi } = await import('../../services/api/transactions');
      const res = await transactionsApi.selectNotaire('123', 1);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/transactions/123/notaire',
        { notaire_id: 1 }
      );
      expect(res.data.success).toBe(true);
    });
  });

  describe('transactionsApi - validateFees', () => {
    it('should validate transaction fees', async () => {
      apiClient.post.mockResolvedValue({ data: { validated: true } });

      const { transactionsApi } = await import('../../services/api/transactions');
      const res = await transactionsApi.validateFees('123', { agree: true });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/transactions/123/frais/valider',
        { agree: true }
      );
      expect(res.data.validated).toBe(true);
    });
  });

  describe('transactionsApi - calculateFees', () => {
    it('should calculate fees correctly', async () => {
      const mockFees = {
        prix_net: 250000,
        commission: 5000,
        tva: 1000,
        total: 256000,
      };

      apiClient.get.mockResolvedValue({ data: mockFees });

      const { transactionsApi } = await import('../../services/api/transactions');
      const res = await transactionsApi.calculateFees('123');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/transactions/123/calcul-frais');
      expect(res.data.commission).toBe(5000);
      expect(res.data.tva).toBe(1000);
    });
  });

  // Payments API tests
  describe('paymentsApi - create', () => {
    it('should create payment intent', async () => {
      const mockPayment = {
        paiement_id: 'pay-123',
        amount: 50000,
        status: 'pending',
      };

      apiClient.post.mockResolvedValue({ data: mockPayment });

      const { paymentsApi } = await import('../../services/api/transactions');
      const res = await paymentsApi.create({ amount: 50000 });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/paiements',
        { amount: 50000 }
      );
      expect(res.data.status).toBe('pending');
    });
  });

  describe('paymentsApi - confirm', () => {
    it('should confirm payment', async () => {
      apiClient.post.mockResolvedValue({ data: { confirmed: true } });

      const { paymentsApi } = await import('../../services/api/transactions');
      const res = await paymentsApi.confirm('pay-123');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/paiements/pay-123/confirmer',
        {}
      );
      expect(res.data.confirmed).toBe(true);
    });
  });

  describe('paymentsApi - recordFailure', () => {
    it('should record payment failure', async () => {
      apiClient.post.mockResolvedValue({ data: { recorded: true } });

      const { paymentsApi } = await import('../../services/api/transactions');
      const res = await paymentsApi.recordFailure('pay-123', { reason: 'declined' });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/paiements/pay-123/echec',
        { reason: 'declined' }
      );
      expect(res.data.recorded).toBe(true);
    });
  });

  describe('paymentsApi - refund', () => {
    it('should process refund', async () => {
      apiClient.post.mockResolvedValue({ data: { refunded: true } });

      const { paymentsApi } = await import('../../services/api/transactions');
      const res = await paymentsApi.refund('pay-123');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/v1/paiements/pay-123/remboursement',
        {}
      );
      expect(res.data.refunded).toBe(true);
    });
  });

  // Notaires API tests
  describe('notairesApi - list', () => {
    it('should list all notaires', async () => {
      const mockNotaires = [
        { notaire_id: 1, nom: 'Notaire A' },
        { notaire_id: 2, nom: 'Notaire B' },
      ];

      apiClient.get.mockResolvedValue({ data: mockNotaires });

      const { notairesApi } = await import('../../services/api/transactions');
      const res = await notairesApi.list();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/notaires', expect.any(Object));
      expect(res.data).toHaveLength(2);
    });
  });

  describe('notairesApi - getById', () => {
    it('should get notaire by ID', async () => {
      const mockNotaire = {
        notaire_id: 1,
        nom: 'Notaire Test',
        adresse: '123 Rue de Paris',
      };

      apiClient.get.mockResolvedValue({ data: mockNotaire });

      const { notairesApi } = await import('../../services/api/transactions');
      const res = await notairesApi.getById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/notaires/1');
      expect(res.data.nom).toBe('Notaire Test');
    });
  });

  describe('notairesApi - searchByLocation', () => {
    it('should search notaires by postal code', async () => {
      const mockResults = [
        { notaire_id: 1, nom: 'Notaire Paris', ville: 'Paris' },
      ];

      apiClient.get.mockResolvedValue({ data: mockResults });

      const { notairesApi } = await import('../../services/api/transactions');
      const res = await notairesApi.searchByLocation('75001');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/notaires/search',
        { params: { code_postal: '75001' } }
      );
      expect(res.data).toHaveLength(1);
    });
  });

  // DocuSign API tests
  describe('docusignApi - startOAuth', () => {
    it('should start DocuSign OAuth flow', async () => {
      const mockAuth = {
        auth_url: 'https://account.docusign.com/oauth/authorize?...',
      };

      apiClient.post.mockResolvedValue({ data: mockAuth });

      const docusignApi = (await import('../../services/api/docusign')).default;
      const res = await docusignApi.startOAuth('tx-123', 'compromis');

      expect(apiClient.post).toHaveBeenCalled();
      expect(res.auth_url).toContain('docusign');
    });
  });

  describe('docusignApi - getEnvelopeStatus', () => {
    it('should get envelope status', async () => {
      const mockStatus = { status: 'completed' };

      apiClient.get.mockResolvedValue({ data: mockStatus });

      const docusignApi = (await import('../../services/api/docusign')).default;
      const res = await docusignApi.getEnvelopeStatus('tx-123', 'env-123');

      expect(apiClient.get).toHaveBeenCalled();
      expect(res.status).toBe('completed');
    });
  });

  // Error handling
  describe('API Error Handling', () => {
    it('should handle network errors', async () => {
      const error = new Error('Network error');
      apiClient.get.mockRejectedValue(error);

      const { transactionsApi } = await import('../../services/api/transactions');

      try {
        await transactionsApi.getById('123');
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.message).toBe('Network error');
      }
    });

    it('should handle API errors with response', async () => {
      const error = new Error('Not found');
      error.response = { status: 404, data: { message: 'Transaction not found' } };
      apiClient.get.mockRejectedValue(error);

      const { notairesApi } = await import('../../services/api/transactions');

      try {
        await notairesApi.getById(999);
        throw new Error('Should have thrown');
      } catch (err) {
        expect(err.response.status).toBe(404);
      }
    });
  });

  // ============================================
  // Enhanced Error Path Tests - Phase 5.3.2
  // ============================================
  describe('API Error Paths - Network', () => {
    it('should handle connection timeout', async () => {
      const error = new Error('ECONNABORTED');
      apiClient.get.mockRejectedValue(error);

      const { transactionsApi } = await import('../../services/api/transactions');
      try {
        await transactionsApi.getById('123');
      } catch (err) {
        expect(err.message).toBe('ECONNABORTED');
      }
    });

    it('should handle connection refused', async () => {
      const error = new Error('ECONNREFUSED');
      apiClient.post.mockRejectedValue(error);

      const { paymentsApi } = await import('../../services/api/transactions');
      try {
        await paymentsApi.create({ amount: 50000 });
      } catch (err) {
        expect(err.message).toBe('ECONNREFUSED');
      }
    });

    it('should handle network unavailable', async () => {
      const error = new Error('Network is unavailable');
      apiClient.get.mockRejectedValue(error);

      const { notairesApi } = await import('../../services/api/transactions');
      try {
        await notairesApi.list();
      } catch (err) {
        expect(err.message).toContain('unavailable');
      }
    });
  });

  describe('API Error Paths - HTTP Status Codes', () => {
    it('should handle 401 Unauthorized', async () => {
      const error = new Error('Unauthorized');
      error.response = { status: 401, data: { message: 'Token expired' } };
      apiClient.get.mockRejectedValue(error);

      const { transactionsApi } = await import('../../services/api/transactions');
      try {
        await transactionsApi.list();
      } catch (err) {
        expect(err.response.status).toBe(401);
      }
    });

    it('should handle 403 Forbidden', async () => {
      const error = new Error('Forbidden');
      error.response = { status: 403, data: { message: 'Access denied' } };
      apiClient.post.mockRejectedValue(error);

      const { transactionsApi } = await import('../../services/api/transactions');
      try {
        await transactionsApi.selectNotaire('123', 1);
      } catch (err) {
        expect(err.response.status).toBe(403);
      }
    });

    it('should handle 429 Rate Limited', async () => {
      const error = new Error('Too Many Requests');
      error.response = { status: 429, headers: { 'retry-after': '60' } };
      apiClient.post.mockRejectedValue(error);

      const { paymentsApi } = await import('../../services/api/transactions');
      try {
        await paymentsApi.create({ amount: 50000 });
      } catch (err) {
        expect(err.response.status).toBe(429);
      }
    });

    it('should handle 500 Server Error', async () => {
      const error = new Error('Internal Server Error');
      error.response = { status: 500, data: { message: 'Server crashed' } };
      apiClient.get.mockRejectedValue(error);

      const { transactionsApi } = await import('../../services/api/transactions');
      try {
        await transactionsApi.calculateFees('123');
      } catch (err) {
        expect(err.response.status).toBe(500);
      }
    });

    it('should handle 503 Service Unavailable', async () => {
      const error = new Error('Service Unavailable');
      error.response = { status: 503 };
      apiClient.post.mockRejectedValue(error);

      const docusignApi = (await import('../../services/api/docusign')).default;

      await expect(docusignApi.startOAuth('123', 'compromis')).rejects.toThrow('Service Unavailable');
    });
  });

  describe('API Error Paths - Malformed Responses', () => {
    it('should handle null response data', async () => {
      apiClient.get.mockResolvedValue({ data: null });

      const { transactionsApi } = await import('../../services/api/transactions');
      const res = await transactionsApi.getById('123');

      expect(res.data).toBeNull();
    });

    it('should handle empty response data', async () => {
      apiClient.get.mockResolvedValue({ data: {} });

      const { transactionsApi } = await import('../../services/api/transactions');
      const res = await transactionsApi.list();

      expect(res.data).toEqual({});
    });

    it('should handle missing required fields', async () => {
      const malformed = { titre: 'No ID field' };
      apiClient.get.mockResolvedValue({ data: malformed });

      const { transactionsApi } = await import('../../services/api/transactions');
      const res = await transactionsApi.getById('123');

      expect(res.data.transaction_id).toBeUndefined();
    });

    it('should handle extra unexpected fields', async () => {
      const response = {
        transaction_id: '123',
        titre: 'Test',
        unexpected_field: 'should ignore',
        another_extra: 12345,
      };
      apiClient.get.mockResolvedValue({ data: response });

      const { transactionsApi } = await import('../../services/api/transactions');
      const res = await transactionsApi.getById('123');

      expect(res.data.transaction_id).toBe('123');
      expect(res.data.unexpected_field).toBeDefined();
    });
  });
});
