/**
 * Module: config/apiConfig.js
 * Purpose: Centralized API configuration
 * Part of: Easter Quest 2025 Frontend
 *
 * Provides centralized API version management to ensure consistency
 * across all API calls in the application.
 *
 * Environment Variables:
 *   REACT_APP_API_BASE_URL - API base URL (default: /api/v1)
 *     - Docker (nginx): /api/v1 (relative)
 *     - Standalone dev: http://localhost:8000/v1 (absolute)
 *
 * @since 2025-12-04
 */

/**
 * API Version configuration
 * Change this in ONE place to update the entire app
 */
export const API_VERSION = 'v1';

/**
 * API Base URL - reads from environment variable with fallback
 * Default: /api/v1 (relative URL for production/nginx routing)
 */
const getApiBaseUrl = () => {
  // Read from environment variable (set in docker-compose or .env files)
  const envBaseUrl = process.env.REACT_APP_API_BASE_URL;

  if (envBaseUrl) {
    return envBaseUrl;
  }

  // Fallback to default relative URL
  return `/api/${API_VERSION}`;
};

/**
 * API Base URLs
 */
export const API_CONFIG = {
  // Full API base URL with version (from env var or default)
  BASE_URL: getApiBaseUrl(),

  // API version string
  VERSION: API_VERSION,

  // Commonly used endpoints (for convenience)
  ENDPOINTS: {
    AUTH: {
      LOGIN: `${getApiBaseUrl()}/auth/login`,
      LOGOUT: `${getApiBaseUrl()}/auth/logout`,
      REFRESH: `${getApiBaseUrl()}/auth/refresh`,
      ME: `${getApiBaseUrl()}/auth/me`,
    },
    USERS: `${getApiBaseUrl()}/users`,
    TEAMS: `${getApiBaseUrl()}/teams`,
    GAMES: `${getApiBaseUrl()}/games`,
    ADMIN: `${getApiBaseUrl()}/admin`,
    CHAT: `${getApiBaseUrl()}/chat`,
  }
};

/**
 * Helper function to build API URL
 * @param {string} path - API path (e.g., '/auth/login' or 'auth/login')
 * @returns {string} Full API URL (e.g., '/api/v1/auth/login' or 'http://localhost:8000/v1/auth/login')
 */
export const buildApiUrl = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const baseUrl = getApiBaseUrl();

  // If baseUrl already ends with the path, return as-is
  if (baseUrl.endsWith(cleanPath)) {
    return baseUrl;
  }

  // Ensure no double slashes
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Default export for convenient imports
 */
export default API_CONFIG;
