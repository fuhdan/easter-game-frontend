/**
 * Module: services/tokenRefreshManager.js
 * Purpose: Proactive token refresh management for long-lived sessions
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Handles automatic token refresh to prevent WebSocket disconnections
 * during long-lived sessions (e.g., overnight game panel usage).
 *
 * Strategy:
 * - Start timer when user logs in (based on known token lifetime)
 * - Refresh token 5 minutes before expiration (configurable)
 * - Reset timer after successful refresh
 * - Notify listeners (WebSocket, SSE) to reconnect with new token
 *
 * SECURITY NOTE: Works with HTTPOnly cookies - no token exposure to JavaScript
 *
 * @since 2025-12-26
 */

import { refresh as refreshTokenAPI } from './auth';
import { onTokenRefresh as onTokenRefreshAPI } from './api';
import { API_CONFIG } from '../config/apiConfig';
import { logger } from '../utils/logger';

/**
 * Configuration
 *
 * IMPORTANT: These values are fetched from backend configuration.
 * Default values used until backend config is loaded.
 */
const CONFIG = {
  // Access token lifetime in minutes (fetched from backend)
  ACCESS_TOKEN_LIFETIME_MINUTES: 30, // Default

  // Refresh buffer in minutes (fetched from backend)
  REFRESH_BUFFER_MINUTES: 5, // Default

  // Minimum time to wait before refreshing (prevent immediate refresh loops)
  MIN_REFRESH_INTERVAL_MS: 60000, // 1 minute

  // Debug mode
  DEBUG: process.env.NODE_ENV === 'development'
};

/**
 * Fetch configuration from backend
 *
 * @returns {Promise<Object>} Config object or null if failed
 */
const fetchConfigFromBackend = async () => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/config/public`, {
      credentials: 'include' // Include cookies (not required for public endpoint, but harmless)
    });

    if (!response.ok) {
      logger.warn('fetch_auth_config_failed', {
        status: response.status,
        module: 'tokenRefreshManager'
      });
      return null;
    }

    const config = await response.json();

    logger.info('fetch_auth_config_success', {
      access_token_minutes: config.access_token_minutes,
      refresh_buffer_minutes: config.refresh_buffer_minutes,
      module: 'tokenRefreshManager'
    });

    return config;
  } catch (error) {
    logger.error('fetch_auth_config_error', {
      error: error.message,
      module: 'tokenRefreshManager'
    });
    return null;
  }
};

/**
 * Update CONFIG with values from backend
 *
 * @param {Object} backendConfig - Config from backend
 */
const updateConfigFromBackend = (backendConfig) => {
  if (!backendConfig) return;

  if (backendConfig.access_token_minutes) {
    CONFIG.ACCESS_TOKEN_LIFETIME_MINUTES = backendConfig.access_token_minutes;
  }

  if (backendConfig.refresh_buffer_minutes) {
    CONFIG.REFRESH_BUFFER_MINUTES = backendConfig.refresh_buffer_minutes;
  }

  logger.info('token_refresh_config_updated', {
    access_token_minutes: CONFIG.ACCESS_TOKEN_LIFETIME_MINUTES,
    refresh_buffer_minutes: CONFIG.REFRESH_BUFFER_MINUTES,
    module: 'tokenRefreshManager'
  });
};

/**
 * Token refresh manager state
 */
class TokenRefreshManager {
  constructor() {
    this.refreshTimer = null;
    this.lastRefreshTime = null;
    this.isRefreshing = false;
    this.listeners = new Set();
  }

  /**
   * Start proactive token refresh timer
   *
   * Called when user logs in or after successful token refresh
   * Fetches configuration from backend before starting timer
   */
  async start() {
    this.stop(); // Clear any existing timer

    // Fetch configuration from backend
    const backendConfig = await fetchConfigFromBackend();
    if (backendConfig) {
      updateConfigFromBackend(backendConfig);
    } else {
      logger.warn('token_refresh_using_default_config', {
        access_token_minutes: CONFIG.ACCESS_TOKEN_LIFETIME_MINUTES,
        refresh_buffer_minutes: CONFIG.REFRESH_BUFFER_MINUTES,
        module: 'tokenRefreshManager'
      });
    }

    const lifetimeMs = CONFIG.ACCESS_TOKEN_LIFETIME_MINUTES * 60 * 1000;
    const bufferMs = CONFIG.REFRESH_BUFFER_MINUTES * 60 * 1000;
    const refreshDelayMs = lifetimeMs - bufferMs;

    logger.info('token_refresh_timer_started', {
      lifetimeMinutes: CONFIG.ACCESS_TOKEN_LIFETIME_MINUTES,
      bufferMinutes: CONFIG.REFRESH_BUFFER_MINUTES,
      refreshDelayMs,
      refreshAtTime: new Date(Date.now() + refreshDelayMs).toISOString(),
      module: 'tokenRefreshManager'
    });

    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshDelayMs);
  }

  /**
   * Stop proactive token refresh timer
   *
   * Called when user logs out
   */
  stop() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
      logger.info('token_refresh_timer_stopped', { module: 'tokenRefreshManager' });
    }
  }

  /**
   * Manually trigger token refresh
   *
   * Can be called manually or by the timer
   */
  async refreshToken() {
    // Prevent concurrent refresh attempts
    if (this.isRefreshing) {
      logger.warn('token_refresh_already_in_progress', { module: 'tokenRefreshManager' });
      return;
    }

    // Prevent refresh loops (minimum 1 minute between refreshes)
    if (this.lastRefreshTime) {
      const timeSinceLastRefresh = Date.now() - this.lastRefreshTime;
      if (timeSinceLastRefresh < CONFIG.MIN_REFRESH_INTERVAL_MS) {
        logger.warn('token_refresh_too_soon', {
          timeSinceLastRefreshMs: timeSinceLastRefresh,
          minIntervalMs: CONFIG.MIN_REFRESH_INTERVAL_MS,
          module: 'tokenRefreshManager'
        });
        return;
      }
    }

    this.isRefreshing = true;

    try {
      logger.info('token_refresh_proactive_attempt', { module: 'tokenRefreshManager' });

      // Call the refresh API
      await refreshTokenAPI();

      this.lastRefreshTime = Date.now();

      logger.info('token_refresh_proactive_success', {
        nextRefreshAt: new Date(Date.now() + (CONFIG.ACCESS_TOKEN_LIFETIME_MINUTES * 60 * 1000) - (CONFIG.REFRESH_BUFFER_MINUTES * 60 * 1000)).toISOString(),
        module: 'tokenRefreshManager'
      });

      // Notify all listeners (WebSocket, SSE, etc.)
      this.notifyListeners();

      // Restart timer for next refresh
      this.start();

    } catch (error) {
      logger.error('token_refresh_proactive_failed', {
        error: error.message,
        status: error.status,
        module: 'tokenRefreshManager'
      });

      // If refresh fails with 401, user needs to re-login
      if (error.status === 401) {
        logger.warn('token_refresh_unauthorized_logout_required', { module: 'tokenRefreshManager' });
        // NOTE: Don't automatically log out - let the app handle it
        // when the next API request fails with 401
      } else {
        // Retry after a delay (e.g., network error)
        logger.info('token_refresh_retry_scheduled', {
          retryDelayMs: CONFIG.MIN_REFRESH_INTERVAL_MS,
          module: 'tokenRefreshManager'
        });
        this.refreshTimer = setTimeout(() => {
          this.refreshToken();
        }, CONFIG.MIN_REFRESH_INTERVAL_MS);
      }

    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Subscribe to token refresh events
   *
   * Listeners are called after successful token refresh
   *
   * @param {Function} callback - Function to call when tokens are refreshed
   * @returns {Function} Unsubscribe function
   */
  onTokenRefresh(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners that tokens were refreshed
   */
  notifyListeners() {
    logger.debug('token_refresh_notifying_listeners', {
      listenerCount: this.listeners.size,
      module: 'tokenRefreshManager'
    });

    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        logger.error('token_refresh_listener_error', {
          error: error.message,
          module: 'tokenRefreshManager'
        });
      }
    });
  }

  /**
   * Get current state (for debugging)
   */
  getState() {
    return {
      isRefreshing: this.isRefreshing,
      hasTimer: !!this.refreshTimer,
      lastRefreshTime: this.lastRefreshTime,
      listenerCount: this.listeners.size
    };
  }
}

// Singleton instance
const tokenRefreshManager = new TokenRefreshManager();

/**
 * Start proactive token refresh timer
 *
 * Call this when user logs in or after app initialization
 *
 * @returns {Promise<void>} Promise that resolves when config is loaded and timer is started
 */
export const startTokenRefresh = () => {
  return tokenRefreshManager.start();
};

/**
 * Stop proactive token refresh timer
 *
 * Call this when user logs out
 */
export const stopTokenRefresh = () => {
  tokenRefreshManager.stop();
};

/**
 * Manually trigger token refresh
 *
 * Can be called manually for testing or force refresh
 */
export const refreshTokenNow = () => {
  return tokenRefreshManager.refreshToken();
};

/**
 * Subscribe to token refresh events
 *
 * Listeners are called after successful token refresh
 * Use this to reconnect WebSocket, SSE, or other long-lived connections
 *
 * @param {Function} callback - Function to call when tokens are refreshed
 * @returns {Function} Unsubscribe function
 */
export const onTokenRefresh = (callback) => {
  return tokenRefreshManager.onTokenRefresh(callback);
};

/**
 * Get current state (for debugging)
 */
export const getTokenRefreshState = () => {
  return tokenRefreshManager.getState();
};

// DEVELOPMENT: Export manager for debugging
if (CONFIG.DEBUG) {
  window.__tokenRefreshManager = tokenRefreshManager;
}
