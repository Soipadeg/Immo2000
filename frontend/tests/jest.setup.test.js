/**
 * Jest Verification Test
 * Simple test to verify Jest is working correctly
 */

describe('Jest Setup Verification', () => {
  test('should verify Jest is working', () => {
    expect(true).toBe(true);
  });

  test('should add numbers correctly', () => {
    expect(2 + 2).toBe(4);
  });

  test('should have access to custom matchers', () => {
    expect(5).toBeWithinRange(1, 10);
    expect(20).not.toBeWithinRange(1, 10);
  });

  test('should have localStorage mock object', () => {
    expect(localStorage).toBeDefined();
    expect(typeof localStorage.setItem).toBe('function');
    expect(typeof localStorage.getItem).toBe('function');
  });

  test('should have sessionStorage mock object', () => {
    expect(sessionStorage).toBeDefined();
    expect(typeof sessionStorage.setItem).toBe('function');
  });

  test('should have custom test utilities', () => {
    const token = global.createMockJWT('456', 'admin');
    expect(token).toBeTruthy();
    expect(token).toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  });

  test('should setup auth token utility', () => {
    const token = global.createMockJWT('456', 'admin');
    expect(token).toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    expect(token).toMatch(/^[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/); // JWT format
  });

  test('should clear all mocks', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.setItem).toBeDefined();
    global.clearAllMocks();
    localStorage.clear();
  });
});
