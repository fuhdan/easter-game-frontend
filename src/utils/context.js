/**
 * Module: utils/context.js
 * Purpose: Context enrichment utilities for logging
 * Part of: Easter Quest 2025 Frontend
 *
 * Features:
 * - Correlation ID generation and management
 * - Session context extraction
 * - Module name extraction from stack trace
 * - User context retrieval
 *
 * @since 2025-12-22
 */

/**
 * Current correlation ID for request tracing
 * Shared across all logs in the same request/session
 */
let currentCorrelationId = null;

/**
 * Generate a correlation ID (UUID v4 format)
 *
 * Used for request tracing - allows correlating all logs from the same request
 *
 * @returns {string} UUID v4 correlation ID
 *
 * @example
 * generateCorrelationId() // Returns: 'a1b2c3d4-e5f6-4789-y012-3456789abcde'
 */
export function generateCorrelationId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get current correlation ID (or generate new one if not set)
 *
 * @returns {string} Current correlation ID
 *
 * @example
 * const correlationId = getCorrelationId();
 * // Use same ID for all logs in this request
 */
export function getCorrelationId() {
  if (!currentCorrelationId) {
    currentCorrelationId = generateCorrelationId();
  }
  return currentCorrelationId;
}

/**
 * Set correlation ID (for request tracing)
 *
 * Call this at the start of each API request to set a new correlation ID
 * All subsequent logs will use this ID until it's changed
 *
 * @param {string} id - Correlation ID to set
 *
 * @example
 * setCorrelationId('a1b2c3d4-...');
 * logger.info('api_request_sent', { ... }); // Will use this correlation ID
 */
export function setCorrelationId(id) {
  currentCorrelationId = id;
}

/**
 * Clear correlation ID (reset to null)
 *
 * Call this after a request completes to ensure next request gets a new ID
 */
export function clearCorrelationId() {
  currentCorrelationId = null;
}

/**
 * Get or create session ID
 *
 * Session ID persists for the duration of the browser session
 * Stored in sessionStorage
 *
 * @returns {string} Session ID
 */
export function getSessionId() {
  try {
    let sessionId = sessionStorage.getItem('sessionId');

    if (!sessionId) {
      sessionId = generateCorrelationId();
      sessionStorage.setItem('sessionId', sessionId);
    }

    return sessionId;
  } catch (error) {
    // SessionStorage might not be available (private browsing, etc.)
    return 'unknown';
  }
}

/**
 * Get current user ID from localStorage
 *
 * NOTE: This assumes the auth system stores user info in localStorage
 * Adjust based on actual auth implementation
 *
 * @returns {number|null} User ID or null if not logged in
 */
export function getCurrentUserId() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.id || null;
    }
  } catch (error) {
    // localStorage not available or invalid JSON
    return null;
  }

  return null;
}

/**
 * Get current user role from localStorage
 *
 * @returns {string|null} User role ('admin', 'game_admin', 'player') or null
 */
export function getCurrentUserRole() {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.role || null;
    }
  } catch (error) {
    return null;
  }

  return null;
}

/**
 * Get session context for logging
 *
 * Returns session information (session ID, user ID, user role)
 *
 * @returns {object} Session context
 *
 * @example
 * getSessionContext()
 * // Returns: {
 * //   sessionId: 'abc123...',
 * //   userId: 42,
 * //   userRole: 'player'
 * // }
 */
export function getSessionContext() {
  return {
    sessionId: getSessionId(),
    userId: getCurrentUserId(),
    userRole: getCurrentUserRole(),
  };
}

/**
 * Extract module name from stack trace
 *
 * Attempts to determine which file/component is logging
 * Used for automatic module tagging
 *
 * @returns {string} Module name or 'unknown'
 *
 * @example
 * extractModuleFromStack() // Returns: 'ChatWidget' or 'api' or 'unknown'
 */
export function extractModuleFromStack() {
  try {
    const stack = new Error().stack;

    if (!stack) {
      return 'unknown';
    }

    // Stack trace format varies by browser, try to extract filename
    const lines = stack.split('\n');

    // Skip first 3 lines (this function, logger function, caller)
    for (let i = 3; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];

      // Try to match filename patterns
      // Examples:
      // - "at ChatWidget (http://localhost:3000/static/js/bundle.js:1234:56)"
      // - "at http://localhost:3000/static/js/bundle.js:1234:56"
      // - "ChatWidget@http://localhost:3000/static/js/bundle.js:1234:56"

      // Try to extract component/function name
      const functionMatch = line.match(/at\s+(\w+)/);
      if (functionMatch && functionMatch[1] !== 'Object') {
        return functionMatch[1];
      }

      // Try to extract filename
      const fileMatch = line.match(/\/([^/]+?)\.js/);
      if (fileMatch) {
        return fileMatch[1];
      }
    }

    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Get browser information
 *
 * Returns browser name and version for debugging
 *
 * @returns {object} Browser info
 */
export function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  // Detect browser
  if (ua.includes('Firefox/')) {
    browserName = 'Firefox';
    const match = ua.match(/Firefox\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    browserName = 'Chrome';
    const match = ua.match(/Chrome\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    const match = ua.match(/Version\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.includes('Edg/')) {
    browserName = 'Edge';
    const match = ua.match(/Edg\/(\d+\.\d+)/);
    if (match) browserVersion = match[1];
  }

  return {
    name: browserName,
    version: browserVersion,
    userAgent: ua,
  };
}

/**
 * Get page context
 *
 * Returns current page URL and path
 *
 * @returns {object} Page context
 */
export function getPageContext() {
  return {
    url: window.location.href,
    path: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
}

/**
 * Get full enrichment context
 *
 * Returns all context information for logging
 * Called automatically by logger
 *
 * @returns {object} Full context
 *
 * @example
 * getEnrichmentContext()
 * // Returns: {
 * //   timestamp: '2025-12-22T10:30:45.123Z',
 * //   environment: 'development',
 * //   correlationId: 'abc123...',
 * //   sessionId: 'xyz789...',
 * //   userId: 42,
 * //   userRole: 'player',
 * //   page: { url: '...', path: '...' },
 * //   browser: { name: 'Chrome', version: '120.0' }
 * // }
 */
export function getEnrichmentContext() {
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    correlationId: getCorrelationId(),
    ...getSessionContext(),
    page: getPageContext(),
    browser: getBrowserInfo(),
  };
}
