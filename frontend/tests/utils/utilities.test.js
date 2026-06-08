/**
 * Utility Tests - Testing helper functions
 * These test common utility functions used across the app
 */

/**
 * Format date utility tests
 */
describe('Date Formatting', () => {
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  test('should format date correctly', () => {
    const date = '2026-06-08';
    const formatted = formatDate(date);
    expect(formatted).toContain('2026');
    expect(formatted).toContain('8');
  });

  test('should return empty string for null/undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });
});

/**
 * String validation tests
 */
describe('String Validation', () => {
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  test('should validate email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid.email')).toBe(false);
    expect(isValidEmail('user@domain.co.uk')).toBe(true);
  });

  test('should validate phone numbers', () => {
    expect(isValidPhone('0123456789')).toBe(true);
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('abcdefghij')).toBe(false);
  });

  test('should handle edge cases', () => {
    expect(isValidEmail('a@b.c')).toBe(true);
    expect(isValidEmail('@@..')).toBe(false);
    expect(isValidPhone('00000000000')).toBe(false); // 11 digits
  });
});

/**
 * Number formatting tests
 */
describe('Number Formatting', () => {
  const formatCurrency = (amount, locale = 'fr-FR') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatPercent = (value, decimals = 2) => {
    return (value * 100).toFixed(decimals) + '%';
  };

  test('should format currency correctly', () => {
    expect(formatCurrency(1000)).toContain('1');
    expect(formatCurrency(1000)).toContain('€');
  });

  test('should format percentage correctly', () => {
    expect(formatPercent(0.5)).toBe('50.00%');
    expect(formatPercent(0.333333, 2)).toBe('33.33%');
  });

  test('should handle edge cases', () => {
    expect(formatCurrency(0)).toContain('€');
    expect(formatCurrency(-100)).toContain('-');
    expect(formatPercent(0)).toBe('0.00%');
  });
});

/**
 * Array utility tests
 */
describe('Array Utilities', () => {
  const chunk = (array, size) => {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, (i + 1) * size)
    );
  };

  const unique = (array) => [...new Set(array)];

  const sortBy = (array, key) => {
    return [...array].sort((a, b) => a[key] - b[key]);
  };

  test('should chunk array correctly', () => {
    const arr = [1, 2, 3, 4, 5];
    const chunked = chunk(arr, 2);
    expect(chunked).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('should get unique values', () => {
    const arr = [1, 2, 2, 3, 3, 3];
    expect(unique(arr)).toEqual([1, 2, 3]);
  });

  test('should sort by property', () => {
    const arr = [
      { name: 'Charlie', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 28 },
    ];

    const sorted = sortBy(arr, 'age');
    expect(sorted[0].name).toBe('Alice');
    expect(sorted[2].name).toBe('Charlie');
  });

  test('should handle empty arrays', () => {
    expect(chunk([], 2)).toEqual([]);
    expect(unique([])).toEqual([]);
    expect(sortBy([], 'key')).toEqual([]);
  });
});

/**
 * Object utility tests
 */
describe('Object Utilities', () => {
  const merge = (obj1, obj2) => {
    return { ...obj1, ...obj2 };
  };

  const pick = (obj, keys) => {
    return keys.reduce((acc, key) => {
      if (key in obj) acc[key] = obj[key];
      return acc;
    }, {});
  };

  const omit = (obj, keys) => {
    return Object.keys(obj).reduce((acc, key) => {
      if (!keys.includes(key)) acc[key] = obj[key];
      return acc;
    }, {});
  };

  test('should merge objects correctly', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 3, c: 4 };
    expect(merge(obj1, obj2)).toEqual({ a: 1, b: 3, c: 4 });
  });

  test('should pick properties from object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  test('should omit properties from object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
  });
});

/**
 * API response utility tests
 */
describe('API Response Handling', () => {
  const isSuccessResponse = (response) => {
    return response?.status === 'success';
  };

  const extractData = (response) => {
    return response?.data || null;
  };

  const parseError = (error) => {
    return error?.message || 'An error occurred';
  };

  test('should check successful response', () => {
    expect(isSuccessResponse({ status: 'success', data: [] })).toBe(true);
    expect(isSuccessResponse({ status: 'error', data: [] })).toBe(false);
  });

  test('should extract data from response', () => {
    const response = { status: 'success', data: { id: 1, name: 'Test' } };
    expect(extractData(response)).toEqual({ id: 1, name: 'Test' });
  });

  test('should parse error messages', () => {
    expect(parseError({ message: 'Network error' })).toBe('Network error');
    expect(parseError(null)).toBe('An error occurred');
  });
});
