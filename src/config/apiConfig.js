/**
 * Module: config/apiConfig.js
 * Purpose: Centralized API configuration
 * Part of: Easter Quest 2025 Frontend
 *
 * Provides centralized API version management to ensure consistency
 * across all API calls in the application.
 *
 * @since 2025-12-04
 */

/**
 * API Version configuration
 * Change this in ONE place to update the entire app
 */
export const API_VERSION = 'v1';

/**
 * API Base URLs
 */
export const API_CONFIG = {
  // Full API base URL with version
  BASE_URL: `/api/${API_VERSION}`,

  // API version string
  VERSION: API_VERSION,

  // Commonly used endpoints (for convenience)
  ENDPOINTS: {
    AUTH: {
      LOGIN: `/api/${API_VERSION}/auth/login`,
      LOGOUT: `/api/${API_VERSION}/auth/logout`,
      REFRESH: `/api/${API_VERSION}/auth/refresh`,
      ME: `/api/${API_VERSION}/auth/me`,
    },
    USERS: `/api/${API_VERSION}/users`,
    TEAMS: `/api/${API_VERSION}/teams`,
    GAMES: `/api/${API_VERSION}/games`,
    ADMIN: `/api/${API_VERSION}/admin`,
    CHAT: `/api/${API_VERSION}/chat`,
  }
};

/**
 * Helper function to build API URL with version
 * @param {string} path - API path without /api/ prefix (e.g., '/auth/login' or 'auth/login')
 * @returns {string} Full API URL with version (e.g., '/api/v1/auth/login')
 */
export const buildApiUrl = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `/api/${API_VERSION}/${cleanPath}`;
};

/**
 * Default export for convenient imports
 */
export default API_CONFIG;
