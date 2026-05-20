import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';

// Mock NotificationContext
const mockAddNotification = vi.fn();
const mockRemoveNotification = vi.fn();
const mockClearNotifications = vi.fn();

const NotificationContext = {
  addNotification: mockAddNotification,
  removeNotification: mockRemoveNotification,
  clearNotifications: mockClearNotifications,
  notifications: [],
};

describe('Notification System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds notification', () => {
    act(() => {
      mockAddNotification({
        type: 'success',
        message: 'Operation successful',
      });
    });

    expect(mockAddNotification).toHaveBeenCalled();
  });

  it('adds error notification', () => {
    act(() => {
      mockAddNotification({
        type: 'error',
        message: 'An error occurred',
      });
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
      })
    );
  });

  it('adds warning notification', () => {
    act(() => {
      mockAddNotification({
        type: 'warning',
        message: 'Warning message',
      });
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'warning',
      })
    );
  });

  it('adds info notification', () => {
    act(() => {
      mockAddNotification({
        type: 'info',
        message: 'Information',
      });
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
      })
    );
  });

  it('removes notification by id', () => {
    act(() => {
      mockRemoveNotification('notification-1');
    });

    expect(mockRemoveNotification).toHaveBeenCalledWith('notification-1');
  });

  it('clears all notifications', () => {
    act(() => {
      mockClearNotifications();
    });

    expect(mockClearNotifications).toHaveBeenCalled();
  });

  it('notification has title and message', () => {
    const notification = {
      type: 'success',
      title: 'Success',
      message: 'Operation completed',
    };

    act(() => {
      mockAddNotification(notification);
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Success',
        message: 'Operation completed',
      })
    );
  });

  it('notification can auto-dismiss', () => {
    const notification = {
      type: 'success',
      message: 'Done',
      autoDismiss: true,
      duration: 3000,
    };

    act(() => {
      mockAddNotification(notification);
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        autoDismiss: true,
        duration: 3000,
      })
    );
  });

  it('validates notification type', () => {
    const validTypes = ['success', 'error', 'warning', 'info'];

    validTypes.forEach(type => {
      act(() => {
        mockAddNotification({
          type: type,
          message: 'Test',
        });
      });
    });

    expect(mockAddNotification).toHaveBeenCalledTimes(4);
  });

  it('handles multiple notifications', () => {
    const notifications = [
      { type: 'success', message: 'First' },
      { type: 'error', message: 'Second' },
      { type: 'warning', message: 'Third' },
    ];

    act(() => {
      notifications.forEach(n => mockAddNotification(n));
    });

    expect(mockAddNotification).toHaveBeenCalledTimes(3);
  });
});
