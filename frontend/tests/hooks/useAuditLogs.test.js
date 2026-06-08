/**
 * useAuditLogs Hook Tests
 * Phase 8.2.1 - Audit Logs Management
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuditLogs } from '../../src/hooks/useAuditLogs';

// Mock the API client
jest.mock('../../src/services/api/client', () => ({
  get: jest.fn(),
}));

const mockClient = require('../../src/services/api/client');

describe('useAuditLogs Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch audit logs successfully', async () => {
    const mockAuditLogs = [
      {
        id: 1,
        user_id: 100,
        action: 'ACCEPT_OFFER',
        timestamp: '2026-06-08T10:00:00Z',
      },
      {
        id: 2,
        user_id: 101,
        action: 'CREATE_MESSAGE',
        timestamp: '2026-06-08T10:01:00Z',
      },
    ];

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockAuditLogs,
        total: 2,
      },
    });

    const { result } = renderHook(() => useAuditLogs());

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.auditLogs).toEqual([]);

    // Wait for fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check results
    expect(result.current.auditLogs).toEqual(mockAuditLogs);
    expect(result.current.total).toBe(2);
    expect(result.current.error).toBeNull();
  });

  test('should handle fetch error', async () => {
    const errorMessage = 'Failed to fetch audit logs';
    mockClient.get.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAuditLogs());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.auditLogs).toEqual([]);
  });

  test('should support pagination', async () => {
    const mockAuditLogs = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      user_id: 100 + i,
      action: 'ACTION',
      timestamp: '2026-06-08T10:00:00Z',
    }));

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockAuditLogs,
        total: 50,
        page: 1,
      },
    });

    const { result } = renderHook(() => useAuditLogs({
      skip: 0,
      limit: 10,
    }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.auditLogs).toHaveLength(10);
    expect(result.current.total).toBe(50);
  });

  test('should filter by action', async () => {
    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: [],
        total: 0,
      },
    });

    renderHook(() => useAuditLogs({
      action: 'ACCEPT_OFFER',
    }));

    await waitFor(() => {
      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/admin/audit-logs'),
        expect.objectContaining({
          params: expect.objectContaining({
            action: 'ACCEPT_OFFER',
          }),
        })
      );
    });
  });
});
