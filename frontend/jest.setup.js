/**
 * Jest Setup File
 *
 * Global test configuration:
 * - Testing Library matchers
 * - Mock setup for modules
 * - Global test utilities
 */

// Import testing library matchers
import '@testing-library/jest-dom';

// ============================================================
// Global Mocks
// ============================================================

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});
global.sessionStorage = sessionStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
}
global.IntersectionObserver = MockIntersectionObserver;

// Mock fetch
global.fetch = jest.fn();

// Reset fetch mock before each test
beforeEach(() => {
  global.fetch.mockClear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorage.clear();
});

// ============================================================
// Suppress Console Warnings
// ============================================================

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: useLayoutEffect') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// ============================================================
// Custom Matchers
// ============================================================

expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// ============================================================
// Global Test Utilities
// ============================================================

/**
 * Helper to create mock JWT token
 */
global.createMockJWT = (userId = '123', role = 'user') => {
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiJHt1c2VySWR9Iiwicm9sZSI6IiR7cm9sZX0iLCJleHAiOjk5OTk5OTk5OTl9.signature`;
};

/**
 * Helper to setup localStorage with auth token
 */
global.setupAuthToken = (token = global.createMockJWT()) => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user_id', '123');
  return token;
};

/**
 * Helper to clear all mocks
 */
global.clearAllMocks = () => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
};
