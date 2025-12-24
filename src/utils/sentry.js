/**
 * Module: utils/sentry.js
 * Purpose: Sentry error tracking initialization
 * Part of: Easter Quest 2025 Frontend
 *
 * Features:
 * - Sentry SDK initialization for production error tracking
 * - Performance monitoring (optional)
 * - Sensitive data redaction from error events
 * - User context tracking
 *
 * Security:
 * - Redacts sensitive HTTP headers (Authorization, Cookie)
 * - Filters out sensitive data from error contexts
 * - Only enabled in production environment
 *
 * @since 2025-12-22
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

/**
 * Initialize Sentry for error tracking
 *
 * Only enabled in production environment
 * Requires REACT_APP_SENTRY_DSN environment variable
 *
 * @example
 * // In index.js:
 * import { initializeSentry } from './utils/sentry';
 * initializeSentry();
 */
export function initializeSentry() {
  // Only initialize in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Sentry] Skipping initialization (not in production)');
    return;
  }

  // Check for Sentry DSN
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (!dsn) {
    console.warn('[Sentry] REACT_APP_SENTRY_DSN not configured, error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn,

      // Environment
      environment: process.env.REACT_APP_ENVIRONMENT || 'production',

      // Performance monitoring
      integrations: [
        new BrowserTracing({
          // Trace all navigation and route changes
          tracingOrigins: ['localhost', /^\//],
        }),
      ],

      // Sample rate for performance monitoring (10% of transactions)
      tracesSampleRate: parseFloat(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE || '0.1'),

      // SECURITY: Filter sensitive data before sending to Sentry
      beforeSend: (event, hint) => {
        // Redact sensitive HTTP headers
        if (event.request?.headers) {
          // SECURITY: Never send authorization headers to Sentry
          delete event.request.headers.Authorization;
          delete event.request.headers.authorization;

          // SECURITY: Never send cookies to Sentry
          delete event.request.headers.Cookie;
          delete event.request.headers.cookie;

          // SECURITY: Never send API keys
          delete event.request.headers['X-API-Key'];
          delete event.request.headers['x-api-key'];
        }

        // Redact sensitive query parameters
        if (event.request?.query_string) {
          const params = new URLSearchParams(event.request.query_string);

          // Remove sensitive query params
          params.delete('token');
          params.delete('api_key');
          params.delete('password');
          params.delete('secret');

          event.request.query_string = params.toString();
        }

        // SECURITY: Redact sensitive context data
        if (event.contexts) {
          // Remove any password fields from context
          Object.keys(event.contexts).forEach(key => {
            const context = event.contexts[key];
            if (context && typeof context === 'object') {
              if (context.password) delete context.password;
              if (context.token) delete context.token;
              if (context.api_key) delete context.api_key;
              if (context.secret) delete context.secret;
            }
          });
        }

        // Log that we're sending error to Sentry (development debugging)
        if (process.env.NODE_ENV === 'development') {
          console.log('[Sentry] Sending error:', event.message || event.exception);
        }

        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',

        // Network errors (user's connection issues, not our bugs)
        'Network request failed',
        'Failed to fetch',
        'NetworkError',
        'Load failed',

        // Canceled requests (user navigated away)
        'The user aborted a request',
        'AbortError',

        // ResizeObserver errors (not critical)
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
      ],

      // Deny list for URLs (don't track errors from these sources)
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,

        // Development/localhost (shouldn't happen in production, but just in case)
        /localhost/i,
      ],
    });

    console.log('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Set user context in Sentry
 *
 * Call this after user logs in to associate errors with specific users
 *
 * @param {object} user - User object
 * @param {number} user.id - User ID
 * @param {string} user.username - Username (will be masked)
 * @param {string} user.email - Email (will be masked)
 * @param {string} user.role - User role
 *
 * @example
 * setSentryUser({
 *   id: 42,
 *   username: 'john_doe',
 *   email: 'john@example.com',
 *   role: 'player'
 * });
 */
export function setSentryUser(user) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  try {
    Sentry.setUser({
      id: user.id,
      // SECURITY: Mask username and email
      username: user.username ? user.username.slice(0, 3) + '***' : undefined,
      email: user.email ? user.email[0] + '***@***.***' : undefined,
      role: user.role,
    });
  } catch (error) {
    console.error('[Sentry] Failed to set user:', error);
  }
}

/**
 * Clear user context in Sentry
 *
 * Call this after user logs out
 *
 * @example
 * clearSentryUser();
 */
export function clearSentryUser() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  try {
    Sentry.setUser(null);
  } catch (error) {
    console.error('[Sentry] Failed to clear user:', error);
  }
}

/**
 * Set custom context in Sentry
 *
 * Add custom data to error reports
 *
 * @param {string} name - Context name
 * @param {object} data - Context data
 *
 * @example
 * setSentryContext('game', {
 *   gameId: 5,
 *   gameName: 'Easter Hunt 2025'
 * });
 */
export function setSentryContext(name, data) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  try {
    Sentry.setContext(name, data);
  } catch (error) {
    console.error('[Sentry] Failed to set context:', error);
  }
}

/**
 * Add breadcrumb to Sentry
 *
 * Breadcrumbs provide context about what happened before an error
 *
 * @param {string} message - Breadcrumb message
 * @param {string} category - Category (e.g., 'ui', 'navigation', 'api')
 * @param {string} level - Level ('debug', 'info', 'warning', 'error')
 * @param {object} data - Additional data
 *
 * @example
 * addSentryBreadcrumb('User clicked login button', 'ui', 'info');
 */
export function addSentryBreadcrumb(message, category = 'default', level = 'info', data = {}) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  try {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  } catch (error) {
    console.error('[Sentry] Failed to add breadcrumb:', error);
  }
}

/**
 * Manually capture exception in Sentry
 *
 * Use this for caught exceptions that you want to track
 *
 * @param {Error} error - Error object
 * @param {object} context - Additional context
 *
 * @example
 * try {
 *   // Some operation
 * } catch (error) {
 *   captureSentryException(error, { operation: 'loadGame', gameId: 5 });
 * }
 */
export function captureSentryException(error, context = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Sentry] Would capture exception:', error, context);
    return;
  }

  try {
    Sentry.withScope((scope) => {
      // Add context to this specific error
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });

      Sentry.captureException(error);
    });
  } catch (err) {
    console.error('[Sentry] Failed to capture exception:', err);
  }
}

/**
 * Manually capture message in Sentry
 *
 * Use this for non-exception errors or warnings you want to track
 *
 * @param {string} message - Message to capture
 * @param {string} level - Severity level ('fatal', 'error', 'warning', 'log', 'info', 'debug')
 * @param {object} context - Additional context
 *
 * @example
 * captureSentryMessage('API rate limit exceeded', 'warning', { endpoint: '/api/games' });
 */
export function captureSentryMessage(message, level = 'info', context = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Sentry] Would capture message:', message, level, context);
    return;
  }

  try {
    Sentry.withScope((scope) => {
      scope.setLevel(level);

      // Add context
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });

      Sentry.captureMessage(message, level);
    });
  } catch (error) {
    console.error('[Sentry] Failed to capture message:', error);
  }
}

/**
 * Sentry ErrorBoundary component
 *
 * Wrap your app with this to catch React component errors
 *
 * @example
 * import { SentryErrorBoundary } from './utils/sentry';
 *
 * <SentryErrorBoundary fallback={<ErrorFallback />}>
 *   <App />
 * </SentryErrorBoundary>
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

export default Sentry;
