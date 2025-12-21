/**
 * Jest Configuration for Easter Quest Frontend
 *
 * This configuration extends react-scripts default Jest setup
 * with custom test paths and coverage settings.
 *
 * @since 2025-12-18
 */

module.exports = {
  // Use react-scripts default configuration
  preset: 'react-scripts',

  // Where to find tests
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx}',
    '<rootDir>/tests/**/*.spec.{js,jsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
  ],

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
  ],

  // Coverage thresholds (optional - uncomment to enforce)
  // coverageThresholds: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80,
  //   },
  // },

  // Module name mapper for CSS/assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },

  // Transform files
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Test environment
  testEnvironment: 'jsdom',
};
