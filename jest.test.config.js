/**
 * Standalone Jest Configuration for Docker Tests
 *
 * This config works with npx jest (not react-scripts test)
 * and properly finds tests in the tests/ directory.
 *
 * @since 2025-12-19
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Where to find tests
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx}',
    '<rootDir>/tests/**/*.spec.{js,jsx}',
  ],

  // Root directory
  rootDir: '.',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

  // Module paths
  modulePaths: ['<rootDir>/src'],

  // Transform files with babel
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.js' }],
  },

  // Module name mappers for CSS and assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
  ],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|vfile|unist-.*|unified|bail|is-plain-obj|trough|remark-.*|mdast-.*|micromark.*|decode-named-character-reference|character-entities)/)',
  ],
};
