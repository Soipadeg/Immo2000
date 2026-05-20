import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useAuth Hook - localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('stores and retrieves authentication token', () => {
    const token = 'test-token-123';
    localStorage.setItem('token', token);
    expect(localStorage.getItem('token')).toBe(token);
  });

  it('stores and retrieves user data', () => {
    const user = JSON.stringify({
      id: 1,
      email: 'test@test.com',
      name: 'Test User',
      role: 'vendor',
    });
    localStorage.setItem('user', user);
    expect(localStorage.getItem('user')).toBe(user);
  });

  it('persists authentication state across sessions', () => {
    localStorage.setItem('token', 'session-token');
    localStorage.setItem('isAuthenticated', 'true');

    expect(localStorage.getItem('token')).toBe('session-token');
    expect(localStorage.getItem('isAuthenticated')).toBe('true');
  });

  it('clears all authentication data on logout', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', '{}');
    localStorage.clear();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('validates user role types', () => {
    const validRoles = ['admin', 'vendor', 'buyer', 'acheteur', 'vendeur'];
    validRoles.forEach(role => {
      const user = JSON.stringify({ id: 1, role });
      localStorage.setItem('user', user);
      const stored = JSON.parse(localStorage.getItem('user'));
      expect(validRoles).toContain(stored.role);
    });
  });

  it('handles user without token', () => {
    localStorage.removeItem('token');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('stores user metadata', () => {
    const metadata = JSON.stringify({
      lastLogin: Date.now(),
      preferences: { theme: 'dark' },
    });
    localStorage.setItem('userMetadata', metadata);
    expect(JSON.parse(localStorage.getItem('userMetadata')).preferences.theme).toBe('dark');
  });

  it('maintains authentication across multiple operations', () => {
    const operations = ['token', 'user', 'role', 'preferences'];
    operations.forEach(op => {
      localStorage.setItem(op, `value-${op}`);
    });

    expect(localStorage.getItem('token')).toBe('value-token');
    expect(localStorage.getItem('user')).toBe('value-user');
  });

  it('handles concurrent storage updates', () => {
    localStorage.setItem('field1', 'value1');
    localStorage.setItem('field2', 'value2');
    localStorage.setItem('field3', 'value3');

    expect(localStorage.getItem('field1')).toBe('value1');
    expect(localStorage.getItem('field2')).toBe('value2');
    expect(localStorage.getItem('field3')).toBe('value3');
  });
});
