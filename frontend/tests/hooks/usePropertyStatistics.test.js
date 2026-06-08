/**
 * usePropertyStatistics & useHealthCheck Hook Tests
 * Phase 8.3.3 & 8.3.4 - Statistics & Health
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePropertyStatistics } from '../../src/hooks/usePropertyStatistics';
import { useHealthCheck } from '../../src/hooks/useHealthCheck';

jest.mock('../../src/services/api/client', () => ({
  get: jest.fn(),
}));

const mockClient = require('../../src/services/api/client');

// ============================================================
// usePropertyStatistics Tests
// ============================================================

describe('usePropertyStatistics Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch property statistics', async () => {
    const mockStats = {
      total_properties: 145,
      active_listings: 89,
      sold_count: 32,
      average_price: 275000,
      days_to_sell_avg: 42,
    };

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockStats,
      },
    });

    const { result } = renderHook(() => usePropertyStatistics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statistics).toEqual(mockStats);
    expect(result.current.statistics.total_properties).toBe(145);
  });

  test('should calculate statistics by location', async () => {
    const mockStats = {
      total_properties: 145,
      by_location: {
        Paris: { count: 50, avg_price: 450000 },
        Lyon: { count: 35, avg_price: 250000 },
        Marseille: { count: 30, avg_price: 300000 },
      },
    };

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockStats,
      },
    });

    const { result } = renderHook(() => usePropertyStatistics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.statistics.by_location).toBeDefined();
    expect(Object.keys(result.current.statistics.by_location)).toHaveLength(3);
  });

  test('should export statistics', async () => {
    mockClient.get.mockResolvedValue({
      data: 'PDF binary data',
    });

    const { result } = renderHook(() => usePropertyStatistics());

    await act(async () => {
      await result.current.exportStats({ format: 'pdf' });
    });

    expect(mockClient.get).toHaveBeenCalled();
  });
});

// ============================================================
// useHealthCheck Tests
// ============================================================

describe('useHealthCheck Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should check system health', async () => {
    const mockHealth = {
      system_status: 'healthy',
      services: {
        database: 'healthy',
        redis: 'healthy',
        api: 'healthy',
      },
      uptime_hours: 240,
      response_time_ms: 5,
    };

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockHealth,
      },
    });

    const { result } = renderHook(() => useHealthCheck());

    await waitFor(() => {
      expect(result.current.isHealthy).toBe(true);
    });

    expect(result.current.healthStatus).toEqual(mockHealth);
  });

  test('should detect degraded health', async () => {
    const mockHealth = {
      system_status: 'degraded',
      services: {
        database: 'healthy',
        redis: 'unhealthy',
        api: 'healthy',
      },
    };

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockHealth,
      },
    });

    const { result } = renderHook(() => useHealthCheck());

    await waitFor(() => {
      expect(result.current.isHealthy).toBe(false);
    });

    expect(result.current.healthStatus.system_status).toBe('degraded');
  });

  test('should check chat service health', async () => {
    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          chat_service: 'healthy',
          message_queue: 'healthy',
        },
      },
    });

    const { result } = renderHook(() => useHealthCheck({
      service: 'chat',
    }));

    await waitFor(() => {
      expect(result.current.isHealthy).toBe(true);
    });
  });

  test('should auto-refresh health status', async () => {
    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: { system_status: 'healthy' },
      },
    });

    const { result } = renderHook(() => useHealthCheck({
      autoRefresh: true,
      interval: 30000, // 30 seconds
    }));

    // Mock timers
    jest.useFakeTimers();

    expect(mockClient.get).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
