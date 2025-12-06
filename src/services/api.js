/**
 * Module: services/api.js
 * Purpose: Base API service with request handling and token refresh
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides core HTTP request functionality with:
 * - Automatic token refresh on 401 errors
 * - Retry logic for server errors
 * - Debug logging in development
 * - HTTPOnly cookie authentication
 *
 * @since 2025-11-20
 */

import { API_CONFIG } from '../config/apiConfig';

/**
 * Configuration
 */
const CONFIG = {
  BASE_URL: API_CONFIG.BASE_URL, // Versioned API base URL from centralized config
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  DEBUG: process.env.NODE_ENV === 'development'
};

/**
 * Debug logging
 */
const log = {
  info: (msg, data) => CONFIG.DEBUG && console.log(`🔵 [API] ${msg}`, data || ''),
  success: (msg, data) => CONFIG.DEBUG && console.log(`🟢 [API] ${msg}`, data || ''),
  error: (msg, error) => console.error(`🔴 [API] ${msg}`, error || ''),
  request: (method, url) => CONFIG.DEBUG && console.log(`📤 [${method}] ${url}`),
  response: (method, url, status) => CONFIG.DEBUG && console.log(`📥 [${method}] ${url} - ${status}`)
};

/**
 * Custom API Error
 */
export class APIError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }

  getUserMessage() {
    if (this.status === 401) return 'Please log in again';
    if (this.status === 403) return 'Permission denied';
    if (this.status === 404) return 'Resource not found';
    if (this.status === 429) {
      // Rate limit error - try to extract detailed message
      if (this.data && this.data.detail) {
        if (typeof this.data.detail === 'object' && this.data.detail.message) {
          return this.data.detail.message;
        } else if (typeof this.data.detail === 'string') {
          return this.data.detail;
        }
      }
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (this.status >= 500) return 'Server error - please try again';
    return this.message || 'An error occurred';
  }
}

/**
 * Token refresh mutex to prevent concurrent refresh attempts
 *
 * When multiple requests fail with 401 simultaneously, only one should
 * attempt to refresh the token. Others should wait for that refresh to complete.
 */
let refreshPromise = null;

/**
 * Event listeners for token refresh events.
 * Components (like SSE connections) can subscribe to reconnect after token refresh.
 */
const tokenRefreshListeners = new Set();

/**
 * Subscribe to token refresh events
 * @param {Function} callback - Function to call when tokens are refreshed
 * @returns {Function} Unsubscribe function
 */
export const onTokenRefresh = (callback) => {
  tokenRefreshListeners.add(callback);
  return () => tokenRefreshListeners.delete(callback);
};

/**
 * Notify all listeners that tokens were refreshed
 */
const notifyTokenRefresh = () => {
  tokenRefreshListeners.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('Token refresh listener error:', error);
    }
  });
};

/**
 * Build headers (without Authorization - using HTTPOnly cookies instead)
 *
 * SECURITY: Authentication via HTTPOnly cookies (automatic transmission).
 * No manual token handling required for browser clients.
 */
export const buildHeaders = (contentType = 'application/json') => {
  const headers = {};
  if (contentType) headers['Content-Type'] = contentType;
  return headers;
};

/**
 * Core request function with retry logic and automatic token refresh
 *
 * SECURITY: Uses credentials: 'include' to automatically send HTTPOnly cookies
 *
 * Token Refresh Flow:
 * 1. If request returns 401, attempt to refresh tokens
 * 2. If refresh succeeds, retry original request with new tokens
 * 3. If refresh fails, throw 401 (user must re-login)
 *
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @param {string} endpoint - API endpoint path
 * @param {Object|null} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Object>} Response data
 * @throws {APIError} If request fails
 */
export const request = async (method, endpoint, data = null, options = {}) => {
  const url = `${CONFIG.BASE_URL}${endpoint}`;
  log.request(method, url);

  const config = {
    method,
    credentials: 'include',  // SECURITY: Send HTTPOnly cookies with every request
    headers: buildHeaders(),
    ...options
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  let lastError;

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, config);
      log.response(method, url, response.status);

      const responseData = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new APIError(
          responseData?.message || `HTTP ${response.status}`,
          response.status,
          responseData
        );
      }

      return responseData;

    } catch (error) {
      lastError = error;
      log.error(`Attempt ${attempt} failed:`, error.message);

      // Handle 401 with automatic token refresh (with mutex)
      if (error.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
        log.info('401 Unauthorized - attempting token refresh');

        try {
          // MUTEX: Check if a refresh is already in progress
          if (!refreshPromise) {
            log.info('Starting token refresh (no refresh in progress)');

            // Start the refresh and store the promise
            // eslint-disable-next-line no-loop-func
            refreshPromise = fetch(`${CONFIG.BASE_URL}/auth/refresh`, {
              method: 'POST',
              credentials: 'include'
            })
            // eslint-disable-next-line no-loop-func
            .then(async (response) => {
              if (!response.ok) {
                // Clear the promise on failure
                refreshPromise = null;
                throw new APIError(`Refresh failed: HTTP ${response.status}`, response.status);
              }
              // Clear the promise on success
              refreshPromise = null;
              log.success('Token refresh completed successfully');
              return response;
            })
            // eslint-disable-next-line no-loop-func
            .catch((err) => {
              // Clear the promise on error
              refreshPromise = null;
              throw err;
            });
          } else {
            log.info('Token refresh already in progress - waiting for it to complete');
          }

          // Wait for the refresh to complete (either this one or an existing one)
          await refreshPromise;

          log.success('Token refresh successful - retrying original request');

          // Notify listeners (e.g., SSE connections) to reconnect with new tokens
          notifyTokenRefresh();

          // Retry original request with new tokens (don't count as retry attempt)
          const retryResponse = await fetch(url, config);
          const retryData = retryResponse.headers.get('content-type')?.includes('application/json')
            ? await retryResponse.json()
            : await retryResponse.text();

          if (!retryResponse.ok) {
            throw new APIError(
              retryData?.message || `HTTP ${retryResponse.status}`,
              retryResponse.status,
              retryData
            );
          }

          return retryData;

        } catch (refreshError) {
          log.error('Token refresh failed:', refreshError);

          // Dispatch auth-error event for AuthContext to handle
          window.dispatchEvent(new CustomEvent('auth-error', {
            detail: { error, refreshError }
          }));

          // If refresh fails, throw original 401 error
          // Frontend should redirect to login
          throw error;
        }
      }

      // Retry logic for 5xx errors
      if (attempt < CONFIG.MAX_RETRIES && error.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
      } else {
        break;
      }
    }
  }

  throw lastError;
};

/**
 * Utility functions for API handling
 */
export const utils = {
  /**
   * Handle login response based on scenario
   * @param {Object} response - Login response from backend
   * @returns {Object} Processed response with scenario info
   */
  processLoginResponse: (response) => {
    // Scenario 1: Successful login
    if (response.success === true) {
      log.success('Login successful - user authenticated');
      return {
        success: true,
        scenario: 1,
        user: response.user,
        message: response.message
      };
    }

    // Scenarios 2 & 3: Password change required
    if (response.success === false) {
      const user = response.user || {};

      if (user.requiresOTP === true) {
        log.info('Login requires password change + OTP (Scenario 3)');
        return {
          success: false,
          scenario: 3,
          username: user.username,
          requiresPasswordChange: true,
          requiresOTP: true,
          message: response.message
        };
      } else if (user.requiresPasswordChange === true) {
        log.info('Login requires password change only (Scenario 2)');
        return {
          success: false,
          scenario: 2,
          username: user.username,
          requiresPasswordChange: true,
          requiresOTP: false,
          message: response.message
        };
      }
    }

    // Fallback
    return {
      success: false,
      scenario: 0,
      message: response.message || 'Login failed'
    };
  },

  /**
   * Handle API errors consistently across components
   */
  handleError: (error, showNotification) => {
    const message = error instanceof APIError
      ? error.getUserMessage()
      : 'An unexpected error occurred';

    log.error('API Error:', error);
    if (showNotification) {
      showNotification(message, 'error');
    }

    return message;
  },

  /**
   * Check if user is authenticated (async - checks session with backend)
   *
   * SECURITY: Cannot read HTTPOnly cookies from JavaScript.
   * Instead, verify session by calling /api/auth/me endpoint.
   */
  isAuthenticated: async () => {
    try {
      await request('GET', '/auth/me');
      return true;
    } catch (error) {
      return false;
    }
  }
};

export { log, CONFIG };
