/**
 * Module: test-utils.js
 * Purpose: Shared testing utilities and helpers
 * Part of: Easter Quest Frontend Testing
 *
 * Custom render functions, mock data factories, and helper functions
 * that can be reused across multiple test files.
 *
 * @since 2025-12-18
 */

import React from 'react';
import { render } from '@testing-library/react';
import PropTypes from 'prop-types';

/**
 * Custom render function that wraps components with common providers
 * (Auth, Router, Theme, etc.)
 *
 * Usage:
 *   import { renderWithProviders } from './test-utils';
 *   renderWithProviders(<MyComponent />);
 *
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Rendering options
 * @returns {Object} - Testing Library render result
 */
export function renderWithProviders(ui, options = {}) {
  // Example wrapper with multiple providers
  const AllTheProviders = ({ children }) => {
    return (
      // Add your providers here as needed:
      // <AuthProvider>
      //   <ThemeProvider>
      //     <Router>
      //       {children}
      //     </Router>
      //   </ThemeProvider>
      // </AuthProvider>
      <>{children}</>
    );
  };

  AllTheProviders.propTypes = {
    children: PropTypes.node.isRequired
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Mock user factory - creates mock user objects for testing
 *
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} - Mock user object
 */
export const createMockUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  display_name: 'Test User',
  email: 'test@example.com',
  team_id: 1,
  team_name: 'Team Alpha',
  role: 'player',
  is_active: true,
  ...overrides
});

/**
 * Mock admin user factory
 *
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} - Mock admin user object
 */
export const createMockAdmin = (overrides = {}) => ({
  id: 99,
  username: 'admin',
  display_name: 'Admin User',
  email: 'admin@example.com',
  team_id: null,
  team_name: null,
  role: 'admin',
  is_active: true,
  ...overrides
});

/**
 * Mock game factory - creates mock game objects
 *
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} - Mock game object
 */
export const createMockGame = (overrides = {}) => ({
  id: 1,
  name: 'Test Game',
  description: 'A test game for unit testing',
  game_type: 'quiz',
  difficulty: 'medium',
  points: 100,
  is_active: true,
  ...overrides
});

/**
 * Mock team factory
 *
 * @param {Object} overrides - Properties to override defaults
 * @returns {Object} - Mock team object
 */
export const createMockTeam = (overrides = {}) => ({
  id: 1,
  name: 'Team Alpha',
  leader_id: 1,
  is_active: true,
  member_count: 5,
  total_score: 0,
  ...overrides
});

/**
 * Wait for async operations to complete
 * Useful for testing async state updates
 *
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
export const wait = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock localStorage for tests
 */
export const mockLocalStorage = (() => {
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
    }
  };
})();

/**
 * Mock fetch response helper
 *
 * Usage:
 *   global.fetch = jest.fn(() => mockFetchResponse({ data: 'test' }));
 *
 * @param {*} data - Response data
 * @param {boolean} ok - Response ok status
 * @param {number} status - HTTP status code
 * @returns {Promise}
 */
export const mockFetchResponse = (data, ok = true, status = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: {
      get: (name) => {
        const headers = {
          'content-type': 'application/json',
        };
        return headers[name.toLowerCase()] || null;
      },
    },
  });
};

/**
 * Helper to find element by data-testid
 *
 * @param {HTMLElement} container - Container element
 * @param {string} testId - Test ID to find
 * @returns {HTMLElement}
 */
export const getByTestId = (container, testId) => {
  return container.querySelector(`[data-testid="${testId}"]`);
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
