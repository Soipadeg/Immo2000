/**
 * Jest Configuration for Immo2000 Frontend
 *
 * Test framework setup for React components and utilities
 * with coverage reporting and module mocking
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Module name mappings for CSS/images
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // Transform files
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },

  // Collect coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },

  // Test match patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.test.jsx',
  ],

  // Module paths
  modulePaths: ['<rootDir>/src'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset modules between tests
  resetModules: true,

  // Timeout
  testTimeout: 10000,

  // No coverage by default
  collectCoverage: process.env.COVERAGE === 'true',

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],

  // Coverage output directory
  coverageDirectory: '<rootDir>/coverage',

  // Files to ignore in tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
  ],
};
