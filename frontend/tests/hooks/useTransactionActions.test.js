/**
 * useTransactionActions & useNotifications Hook Tests
 * Phase 8.2.3 & 8.2.4 - Transactions & Notifications
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTransactionActions } from '../../src/hooks/useTransactionActions';
import { useNotificationPreferences } from '../../src/hooks/useNotificationPreferences';

jest.mock('../../src/services/api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

const mockClient = require('../../src/services/api/client');

// ============================================================
// useTransactionActions Tests
// ============================================================

describe('useTransactionActions Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should accept offer in transaction', async () => {
    mockClient.post.mockResolvedValue({
      data: {
        status: 'success',
        data: { id: 1, status: 'accepted' },
      },
    });

    const { result } = renderHook(() => useTransactionActions());

    await act(async () => {
      await result.current.acceptOffer({
        transactionId: 1,
        offerId: 10,
      });
    });

    expect(mockClient.post).toHaveBeenCalled();
  });

  test('should reject offer in transaction', async () => {
    mockClient.post.mockResolvedValue({
      data: {
        status: 'success',
        data: { id: 1, status: 'rejected' },
      },
    });

    const { result } = renderHook(() => useTransactionActions());

    await act(async () => {
      await result.current.rejectOffer({
        transactionId: 1,
        offerId: 10,
      });
    });

    expect(mockClient.post).toHaveBeenCalled();
  });

  test('should fetch transaction details', async () => {
    const mockTransaction = {
      id: 1,
      buyer_id: 100,
      seller_id: 200,
      status: 'active',
      offers: [],
    };

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockTransaction,
      },
    });

    const { result } = renderHook(() => useTransactionActions());

    await act(async () => {
      await result.current.fetchTransaction(1);
    });

    expect(mockClient.get).toHaveBeenCalled();
  });
});

// ============================================================
// useNotificationPreferences Tests
// ============================================================

describe('useNotificationPreferences Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch notification preferences', async () => {
    const mockPreferences = {
      email: true,
      push: true,
      sms: false,
      in_app: true,
    };

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockPreferences,
      },
    });

    const { result } = renderHook(() => useNotificationPreferences());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.preferences).toEqual(mockPreferences);
  });

  test('should update notification preferences', async () => {
    mockClient.put.mockResolvedValue({
      data: {
        status: 'success',
        data: { email: false, push: true },
      },
    });

    const { result } = renderHook(() => useNotificationPreferences());

    await act(async () => {
      await result.current.updatePreferences({
        email: false,
      });
    });

    expect(mockClient.put).toHaveBeenCalled();
  });

  test('should handle quiet hours settings', async () => {
    mockClient.put.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
        },
      },
    });

    const { result } = renderHook(() => useNotificationPreferences());

    await act(async () => {
      await result.current.updateQuietHours({
        start: '22:00',
        end: '08:00',
      });
    });

    expect(mockClient.put).toHaveBeenCalled();
  });
});
