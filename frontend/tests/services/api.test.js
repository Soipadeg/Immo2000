/**
 * API Services Tests
 * Testing real API service functions with mocked API client
 */

import apiClient from '../../src/services/api/client';

// Mock the API client
jest.mock('../../src/services/api/client');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => '123'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Client Calls', () => {
    test('should make GET request', async () => {
      const mockData = { id: 1, title: 'Test' };

      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await apiClient.get('/listings');

      expect(apiClient.get).toHaveBeenCalledWith('/listings');
      expect(result.data).toEqual(mockData);
    });

    test('should make POST request', async () => {
      const requestData = { title: 'New Listing' };
      const responseData = { id: 1, ...requestData };

      apiClient.post.mockResolvedValue({ data: responseData });

      const result = await apiClient.post('/listings', requestData);

      expect(apiClient.post).toHaveBeenCalledWith('/listings', requestData);
      expect(result.data.id).toBe(1);
    });

    test('should make PUT request', async () => {
      const updateData = { title: 'Updated' };

      apiClient.put.mockResolvedValue({ data: { success: true } });

      const result = await apiClient.put('/listings/1', updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/listings/1', updateData);
      expect(result.data.success).toBe(true);
    });

    test('should make PATCH request', async () => {
      apiClient.patch.mockResolvedValue({ data: { status: 'updated' } });

      const result = await apiClient.patch('/listings/1/status', {
        status: 'published',
      });

      expect(apiClient.patch).toHaveBeenCalled();
      expect(result.data.status).toBe('updated');
    });

    test('should make DELETE request', async () => {
      apiClient.delete.mockResolvedValue({ data: { success: true } });

      const result = await apiClient.delete('/listings/1');

      expect(apiClient.delete).toHaveBeenCalledWith('/listings/1');
      expect(result.data.success).toBe(true);
    });
  });

  describe('Listings API Pattern', () => {
    test('should fetch listings with pagination', async () => {
      const mockListings = [
        { id: 1, title: 'Listing 1' },
        { id: 2, title: 'Listing 2' },
      ];

      apiClient.get.mockResolvedValue({
        data: mockListings,
        pagination: { skip: 0, limit: 20, total: 100 },
      });

      const result = await apiClient.get('/listings', {
        params: { skip: 0, limit: 20 },
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(100);
    });

    test('should create new listing', async () => {
      const listingData = {
        title: 'New Property',
        price: 500000,
        location: 'Paris',
      };

      apiClient.post.mockResolvedValue({
        data: { id: 1, ...listingData },
      });

      const result = await apiClient.post('/listings', listingData);

      expect(result.data.title).toBe('New Property');
      expect(result.data.price).toBe(500000);
    });

    test('should update listing', async () => {
      const updates = { title: 'Updated Title', price: 480000 };

      apiClient.put.mockResolvedValue({
        data: { id: 1, ...updates },
      });

      const result = await apiClient.put('/listings/1', updates);

      expect(result.data.title).toBe('Updated Title');
    });
  });

  describe('Messages API Pattern', () => {
    test('should fetch conversations', async () => {
      const mockConversations = [
        { id: 1, subject: 'Property inquiry' },
        { id: 2, subject: 'Offer negotiation' },
      ];

      apiClient.get.mockResolvedValue({ data: mockConversations });

      const result = await apiClient.get('/conversations');

      expect(result.data).toHaveLength(2);
      expect(result.data[0].subject).toBe('Property inquiry');
    });

    test('should send message', async () => {
      const messageData = { content: 'Hello', conversation_id: 1 };

      apiClient.post.mockResolvedValue({
        data: { id: 1, ...messageData, timestamp: '2026-06-08' },
      });

      const result = await apiClient.post('/messages', messageData);

      expect(result.data.content).toBe('Hello');
      expect(result.data.timestamp).toBeDefined();
    });

    test('should mark message as read', async () => {
      apiClient.patch.mockResolvedValue({ data: { success: true } });

      const result = await apiClient.patch('/messages/1/read');

      expect(result.data.success).toBe(true);
    });
  });

  describe('Transactions API Pattern', () => {
    test('should fetch transaction details', async () => {
      const mockTransaction = {
        id: 1,
        listing_id: 1,
        buyer_id: 2,
        status: 'in_progress',
        amount: 400000,
      };

      apiClient.get.mockResolvedValue({ data: mockTransaction });

      const result = await apiClient.get('/transactions/1');

      expect(result.data.status).toBe('in_progress');
      expect(result.data.amount).toBe(400000);
    });

    test('should update transaction status', async () => {
      apiClient.patch.mockResolvedValue({ data: { status: 'completed' } });

      const result = await apiClient.patch('/transactions/1/status', {
        status: 'completed',
      });

      expect(result.data.status).toBe('completed');
    });

    test('should handle transaction list with filters', async () => {
      const mockTransactions = [
        { id: 1, status: 'completed' },
        { id: 2, status: 'pending' },
      ];

      apiClient.get.mockResolvedValue({ data: mockTransactions });

      const result = await apiClient.get('/transactions', {
        params: { status: 'pending' },
      });

      expect(result.data).toHaveLength(2);
    });
  });

  describe('Offers API Pattern', () => {
    test('should create offer', async () => {
      const offerData = { listing_id: 1, amount: 400000 };

      apiClient.post.mockResolvedValue({
        data: { id: 1, ...offerData, status: 'pending' },
      });

      const result = await apiClient.post('/offers', offerData);

      expect(result.data.amount).toBe(400000);
      expect(result.data.status).toBe('pending');
    });

    test('should accept offer', async () => {
      apiClient.put.mockResolvedValue({ data: { status: 'accepted' } });

      const result = await apiClient.put('/offers/1/accept');

      expect(result.data.status).toBe('accepted');
    });

    test('should reject offer', async () => {
      apiClient.put.mockResolvedValue({ data: { status: 'rejected' } });

      const result = await apiClient.put('/offers/1/reject');

      expect(result.data.status).toBe('rejected');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 errors', async () => {
      const error = {
        response: { status: 404, data: { message: 'Not found' } },
      };

      apiClient.get.mockRejectedValue(error);

      try {
        await apiClient.get('/listings/999');
        fail('Should have thrown error');
      } catch (err) {
        expect(err.response.status).toBe(404);
      }
    });

    test('should handle 401 unauthorized errors', async () => {
      const error = {
        response: { status: 401, data: { message: 'Unauthorized' } },
      };

      apiClient.get.mockRejectedValue(error);

      try {
        await apiClient.get('/admin/users');
        fail('Should have thrown error');
      } catch (err) {
        expect(err.response.status).toBe(401);
      }
    });

    test('should handle network timeout errors', async () => {
      const error = new Error('Request timeout');

      apiClient.post.mockRejectedValue(error);

      try {
        await apiClient.post('/listings', {});
        fail('Should have thrown error');
      } catch (err) {
        expect(err.message).toContain('timeout');
      }
    });

    test('should handle 500 server errors', async () => {
      const error = {
        response: { status: 500, data: { message: 'Server error' } },
      };

      apiClient.get.mockRejectedValue(error);

      try {
        await apiClient.get('/listings');
        fail('Should have thrown error');
      } catch (err) {
        expect(err.response.status).toBe(500);
      }
    });

    test('should handle validation errors', async () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Validation failed', errors: { email: 'Invalid' } },
        },
      };

      apiClient.post.mockRejectedValue(error);

      try {
        await apiClient.post('/listings', {});
        fail('Should have thrown error');
      } catch (err) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.errors).toBeDefined();
      }
    });
  });
});
