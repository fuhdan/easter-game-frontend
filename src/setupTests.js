/**
 * Module: setupTests.js
 * Purpose: Jest test setup and global test configuration
 * Part of: Easter Quest Frontend Testing
 *
 * This file runs before each test file.
 * It sets up global test utilities and custom matchers.
 *
 * @since 2025-12-18
 */

// Import jest-dom for additional matchers like toBeInTheDocument()
import '@testing-library/jest-dom';

// Global test configuration

// Mock window.matchMedia (used by some responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver (used by lazy loading components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver (used by some UI components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
