/**
 * useMessages Hook Tests
 * Phase 8.2.2 - Messages Management
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessages } from '../../src/hooks/useMessages';

jest.mock('../../src/services/api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const mockClient = require('../../src/services/api/client');

describe('useMessages Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch messages successfully', async () => {
    const mockMessages = [
      {
        id: 1,
        sender_id: 100,
        recipient_id: 200,
        text: 'Hello',
        read: false,
        created_at: '2026-06-08T10:00:00Z',
      },
    ];

    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: mockMessages,
        total: 1,
      },
    });

    const { result } = renderHook(() => useMessages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.messages).toEqual(mockMessages);
    expect(result.current.total).toBe(1);
  });

  test('should send message', async () => {
    mockClient.post.mockResolvedValue({
      data: {
        status: 'success',
        data: {
          id: 1,
          text: 'New message',
          read: false,
        },
      },
    });

    const { result } = renderHook(() => useMessages());

    await act(async () => {
      await result.current.sendMessage({
        recipient_id: 200,
        text: 'New message',
      });
    });

    expect(mockClient.post).toHaveBeenCalled();
  });

  test('should filter unread messages', async () => {
    mockClient.get.mockResolvedValue({
      data: {
        status: 'success',
        data: [{ id: 1, read: false }],
        total: 1,
      },
    });

    renderHook(() => useMessages({
      read: false,
    }));

    await waitFor(() => {
      expect(mockClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.objectContaining({
          params: expect.objectContaining({
            read: false,
          }),
        })
      );
    });
  });
});
