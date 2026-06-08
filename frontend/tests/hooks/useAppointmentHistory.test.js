/**
 * useAppointmentHistory & useCalendarExport Hook Tests
 * Phase 8.3.1 & 8.3.2 - Appointments & Calendar
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAppointmentHistory } from '../../src/hooks/useAppointmentHistory';
import { useCalendarExport } from '../../src/hooks/useCalendarExport';

jest.mock('../../src/services/api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

const mockClient = require('../../src/services/api/client');

// ============================================================
// useAppointmentHistory Tests
// ============================================================

describe('useAppointmentHistory Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch appointment history', async () => {
    const mockHistory = [
      {
        id: 1,
        property_id: 100,
        scheduled_date: '2026-06-15T14:00:00Z',
        status: 'scheduled',
      },
    ];

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockHistory,
      },
    });

    const { result } = renderHook(() => useAppointmentHistory(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.history).toEqual(mockHistory);
  });

  test('should reschedule appointment', async () => {
    mockClient.put.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          id: 1,
          new_date: '2026-06-20T10:00:00Z',
        },
      },
    });

    const { result } = renderHook(() => useAppointmentHistory(1));

    await act(async () => {
      await result.current.reschedule({
        new_date: '2026-06-20T10:00:00Z',
        reason: 'Visitor requested',
      });
    });

    expect(mockClient.put).toHaveBeenCalled();
  });

  test('should get appointment details with timeline', async () => {
    const mockDetails = {
      id: 1,
      property_id: 100,
      visitor_id: 200,
      scheduled_date: '2026-06-15T14:00:00Z',
      history: [
        {
          action: 'created',
          timestamp: '2026-06-01T10:00:00Z',
        },
      ],
    };

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockDetails,
      },
    });

    const { result } = renderHook(() => useAppointmentHistory(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.history).toHaveProperty('id');
  });
});

// ============================================================
// useCalendarExport Tests
// ============================================================

describe('useCalendarExport Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should export calendar as iCal format', async () => {
    const mockICalData = 'BEGIN:VCALENDAR...';

    mockClient.get.mockResolvedValue({
      data: mockICalData,
    });

    const { result } = renderHook(() => useCalendarExport());

    await act(async () => {
      await result.current.exportAsIcal();
    });

    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/calendar/export/ical'),
    );
  });

  test('should export calendar as CSV', async () => {
    const mockCSVData = 'ID,Date,Title\n1,2026-06-15,Appointment';

    mockClient.get.mockResolvedValue({
      data: mockCSVData,
    });

    const { result } = renderHook(() => useCalendarExport());

    await act(async () => {
      await result.current.exportAsCSV();
    });

    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/calendar/export/csv'),
    );
  });

  test('should import calendar events', async () => {
    mockClient.post.mockResolvedValue({
      data: {
        status: 'success',
        data: { imported: 10 },
      },
    });

    const { result } = renderHook(() => useCalendarExport());

    const mockFile = new File(['calendar data'], 'calendar.ics', {
      type: 'text/calendar',
    });

    await act(async () => {
      await result.current.importCalendar(mockFile);
    });

    expect(mockClient.post).toHaveBeenCalled();
  });
});
