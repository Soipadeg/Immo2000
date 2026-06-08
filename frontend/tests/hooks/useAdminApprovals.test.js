/**
 * useAdminApprovals & useFeedback Hook Tests
 * Phase 8 - Admin & Feedback Features
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminApprovals } from '../../src/hooks/useAdminApprovals';
import { useFeedback } from '../../src/hooks/useFeedback';

jest.mock('../../src/services/api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

const mockClient = require('../../src/services/api/client');

// ============================================================
// useAdminApprovals Tests
// ============================================================

describe('useAdminApprovals Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch pending approvals', async () => {
    const mockApprovals = [
      {
        id: 1,
        type: 'listing',
        vendor_id: 100,
        status: 'pending',
        created_at: '2026-06-08T10:00:00Z',
      },
    ];

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockApprovals,
        total: 1,
      },
    });

    const { result } = renderHook(() => useAdminApprovals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.approvals).toEqual(mockApprovals);
  });

  test('should approve request', async () => {
    mockClient.put.mockResolvedValue({
      data: {
        status: 'success',
        data: { id: 1, status: 'approved' },
      },
    });

    const { result } = renderHook(() => useAdminApprovals());

    await act(async () => {
      await result.current.approveRequest(1, 'Approved');
    });

    expect(mockClient.put).toHaveBeenCalled();
  });

  test('should reject request', async () => {
    mockClient.put.mockResolvedValue({
      data: {
        status: 'success',
        data: { id: 1, status: 'rejected' },
      },
    });

    const { result } = renderHook(() => useAdminApprovals());

    await act(async () => {
      await result.current.rejectRequest(1, 'Rejected: Invalid listing');
    });

    expect(mockClient.put).toHaveBeenCalled();
  });

  test('should filter by type', async () => {
    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: [],
        total: 0,
      },
    });

    renderHook(() => useAdminApprovals({
      type: 'listing',
    }));

    await waitFor(() => {
      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/approvals'),
        expect.objectContaining({
          params: expect.objectContaining({
            type: 'listing',
          }),
        })
      );
    });
  });
});

// ============================================================
// useFeedback Tests
// ============================================================

describe('useFeedback Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch user feedback', async () => {
    const mockFeedback = [
      {
        id: 1,
        user_id: 100,
        rating: 5,
        comment: 'Great service!',
        created_at: '2026-06-08T10:00:00Z',
      },
    ];

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockFeedback,
        total: 1,
      },
    });

    const { result } = renderHook(() => useFeedback());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.feedback).toEqual(mockFeedback);
  });

  test('should submit feedback', async () => {
    mockClient.post.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          id: 1,
          rating: 5,
          comment: 'Excellent!',
        },
      },
    });

    const { result } = renderHook(() => useFeedback());

    await act(async () => {
      await result.current.submitFeedback({
        rating: 5,
        comment: 'Excellent!',
      });
    });

    expect(mockClient.post).toHaveBeenCalled();
  });

  test('should validate feedback rating', async () => {
    mockClient.post.mockResolvedValue({
      data: {
        status: 'success',
        data: { id: 1 },
      },
    });

    const { result } = renderHook(() => useFeedback());

    await act(async () => {
      await result.current.submitFeedback({
        rating: 5, // 1-5 scale
        comment: 'Good experience',
      });
    });

    expect(result.current.error).toBeNull();
  });

  test('should get average rating', async () => {
    const mockStats = {
      average_rating: 4.5,
      total_feedbacks: 100,
      distribution: {
        5: 60,
        4: 25,
        3: 10,
        2: 3,
        1: 2,
      },
    };

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockStats,
      },
    });

    const { result } = renderHook(() => useFeedback({
      stats: true,
    }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStats);
  });
});
