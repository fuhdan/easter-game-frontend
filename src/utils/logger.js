/**
 * Module: utils/logger.js
 * Purpose: Centralized logging utility with security, context enrichment
 * Part of: Easter Quest 2025 Frontend
 *
 * Features:
 * - Logging levels: DEBUG, INFO, WARN, ERROR, CRITICAL
 * - Automatic PII masking
 * - Context enrichment (correlation ID, timestamp, module)
 * - Environment-based filtering
 * - Sentry integration for errors
 * - Log buffer for debugging
 *
 * Usage:
 * import { logger } from './utils/logger';
 * logger.info('user_logged_in', { userId: 42, role: 'player' });
 * logger.error('api_request_failed', { endpoint: '/api/games' }, error);
 *
 * Security:
 * - Automatically masks PII (usernames, emails, tokens)
 * - Redacts sensitive data (passwords, secrets)
 * - Follows security_rules.md and frontend_security_rules.md
 *
 * @since 2025-12-22
 */

import log from 'loglevel';
import { sanitizeContext, containsSensitiveData } from './security';
import { getEnrichmentContext, extractModuleFromStack } from './context';
import logBuffer from './logBuffer';
import { captureSentryException, captureSentryMessage, addSentryBreadcrumb } from './sentry';

/**
 * Log levels (ordered by severity)
 */
export const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

/**
 * Log level names
 */
export const LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];

/**
 * Logger configuration
 */
const config = {
  // Minimum log level (logs below this level are ignored)
  level: process.env.NODE_ENV === 'production' ? LEVELS.INFO : LEVELS.DEBUG,

  // Enable console output (development only)
  enableConsole: process.env.NODE_ENV === 'development',

  // Enable Sentry error tracking (production only)
  enableSentry: process.env.NODE_ENV === 'production',

  // Enable log buffer (development only)
  enableBuffer: process.env.NODE_ENV === 'development',

  // Sampling rate for INFO logs in production (0.1 = 10%)
  infoSamplingRate: parseFloat(process.env.REACT_APP_LOG_INFO_SAMPLE_RATE || '0.1'),
};

/**
 * Initialize loglevel library
 */
log.setLevel(config.enableConsole ? 'trace' : 'silent');

/**
 * Core logging function
 *
 * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR, CRITICAL)
 * @param {string} eventName - Event name (snake_case, stable)
 * @param {object} context - Additional context data
 * @param {Error} error - Error object (optional)
 */
function logEvent(level, eventName, context = {}, error = null) {
  // Check if we should log this level
  const levelValue = LEVELS[level];
  if (levelValue < config.level) {
    return; // Skip logs below configured level
  }

  // SECURITY: Check for sensitive data
  if (containsSensitiveData(context)) {
    // Only show warning in development mode
    if (config.enableConsole && process.env.NODE_ENV === 'development') {
      console.debug('[Logger] Sensitive data detected in log context, sanitizing...');
    }
  }

  // SECURITY: Sanitize context (mask PII + redact sensitive data)
  const sanitized = sanitizeContext(context);

  // Enrich with automatic context
  const enriched = {
    ...getEnrichmentContext(),
    ...sanitized,
    level,
    eventName,
    module: context.module || extractModuleFromStack(),
  };

  // Add error details if provided
  if (error instanceof Error) {
    enriched.error = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  // Add to log buffer (development only)
  if (config.enableBuffer) {
    logBuffer.add({
      level,
      eventName,
      context: enriched,
      timestamp: enriched.timestamp,
      error,
    });
  }

  // Console output (development only)
  if (config.enableConsole) {
    logToConsole(level, eventName, enriched, error);
  }

  // Sentry (production, errors only)
  if (config.enableSentry && (level === 'ERROR' || level === 'CRITICAL')) {
    logToSentry(level, eventName, enriched, error);
  }

  // Sentry breadcrumb (production, all levels for context)
  if (config.enableSentry) {
    addSentryBreadcrumb(
      eventName,
      enriched.module || 'default',
      level.toLowerCase(),
      enriched
    );
  }
}

/**
 * Console transport (development)
 *
 * Outputs colorized, formatted logs to browser console
 *
 * @param {string} level - Log level
 * @param {string} eventName - Event name
 * @param {object} context - Log context
 * @param {Error} error - Error object
 */
function logToConsole(level, eventName, context, error) {
  const emoji = {
    DEBUG: '🔍',
    INFO: '🔵',
    WARN: '⚠️',
    ERROR: '🔴',
    CRITICAL: '🚨',
  }[level];

  const module = context.module || 'unknown';
  const message = `${emoji} [${level}] [${module}] ${eventName}`;

  // Filter out internal context fields for cleaner console output
  const { timestamp, environment, correlationId, sessionId, userId, userRole, page, browser, level: _, eventName: __, module: ___, ...displayContext } = context;

  switch (level) {
    case 'DEBUG':
      log.debug(message, displayContext);
      break;

    case 'INFO':
      log.info(message, displayContext);
      break;

    case 'WARN':
      log.warn(message, displayContext);
      if (error) {
        log.warn('  ↳ Error:', error);
      }
      break;

    case 'ERROR':
      log.error(message, displayContext);
      if (error) {
        log.error('  ↳ Error:', error);
      }
      break;

    case 'CRITICAL':
      // Extra emphasis for critical errors
      log.error(`${emoji} ${emoji} ${emoji} [CRITICAL] [${module}] ${eventName}`);
      log.error(displayContext);
      if (error) {
        log.error('  ↳ Error:', error);
        log.error('  ↳ Stack:', error.stack);
      }
      break;

    default:
      log.log(message, displayContext);
  }
}

/**
 * Sentry transport (production)
 *
 * Sends errors to Sentry for tracking
 *
 * @param {string} level - Log level
 * @param {string} eventName - Event name
 * @param {object} context - Log context
 * @param {Error} error - Error object
 */
function logToSentry(level, eventName, context, error) {
  const severity = level === 'CRITICAL' ? 'fatal' : 'error';

  if (error instanceof Error) {
    // Capture exception with context
    captureSentryException(error, {
      event: {
        eventName,
        ...context,
      },
    });
  } else {
    // Capture message (error without exception object)
    captureSentryMessage(eventName, severity, context);
  }
}

/**
 * Public API
 *
 * Usage:
 * logger.debug('event_name', { context })
 * logger.info('event_name', { context })
 * logger.warn('event_name', { context })
 * logger.error('event_name', { context }, error)
 * logger.critical('event_name', { context }, error)
 */
export const logger = {
  /**
   * DEBUG level - Development debugging
   *
   * Use for verbose debugging information
   * Only logged in development environment
   *
   * @param {string} eventName - Event name (snake_case)
   * @param {object} context - Additional context
   *
   * @example
   * logger.debug('user_form_validation_started', { formData: { username } });
   */
  debug: (eventName, context = {}) => {
    logEvent('DEBUG', eventName, context);
  },

  /**
   * INFO level - Informational events
   *
   * Use for normal application operations
   * User actions, API calls, page loads
   *
   * In production: sampled (10% by default)
   *
   * @param {string} eventName - Event name (snake_case)
   * @param {object} context - Additional context
   *
   * @example
   * logger.info('user_logged_in', { userId: 42, role: 'player' });
   */
  info: (eventName, context = {}) => {
    // Sampling in production
    if (config.enableSentry && Math.random() > config.infoSamplingRate) {
      return; // Skip this log (not sampled)
    }

    logEvent('INFO', eventName, context);
  },

  /**
   * WARN level - Warning conditions
   *
   * Use for recoverable errors, warnings
   * Validation failures, deprecated API usage, rate limits
   *
   * @param {string} eventName - Event name (snake_case)
   * @param {object} context - Additional context
   * @param {Error} [error] - Error object (optional)
   *
   * @example
   * logger.warn('api_rate_limit_warning', { endpoint: '/api/chat', remaining: 2 });
   */
  warn: (eventName, contextOrError, error = null) => {
    const context = contextOrError instanceof Error ? {} : contextOrError;
    const err = contextOrError instanceof Error ? contextOrError : error;
    logEvent('WARN', eventName, context, err);
  },

  /**
   * ERROR level - Error conditions
   *
   * Use for application errors
   * API failures, network errors, component errors
   *
   * Sent to Sentry in production
   *
   * @param {string} eventName - Event name (snake_case)
   * @param {object|Error} contextOrError - Context object or Error
   * @param {Error} [error] - Error object (if first param is context)
   *
   * @example
   * logger.error('api_request_failed', { endpoint: '/api/games' }, error);
   * logger.error('api_request_failed', error); // Also valid
   */
  error: (eventName, contextOrError, error = null) => {
    const context = contextOrError instanceof Error ? {} : contextOrError;
    const err = contextOrError instanceof Error ? contextOrError : error;
    logEvent('ERROR', eventName, context, err);
  },

  /**
   * CRITICAL level - Critical failures
   *
   * Use for system-level failures
   * Authentication system down, data corruption, security incidents
   *
   * Always sent to Sentry in production (marked as 'fatal')
   *
   * @param {string} eventName - Event name (snake_case)
   * @param {object|Error} contextOrError - Context object or Error
   * @param {Error} [error] - Error object (if first param is context)
   *
   * @example
   * logger.critical('auth_system_failure', { error: 'JWT verification failed' }, error);
   */
  critical: (eventName, contextOrError, error = null) => {
    const context = contextOrError instanceof Error ? {} : contextOrError;
    const err = contextOrError instanceof Error ? contextOrError : error;
    logEvent('CRITICAL', eventName, context, err);
  },

  /**
   * Get buffered logs (development only)
   *
   * @returns {Array<object>} Array of log entries
   *
   * @example
   * const logs = logger.getBuffer();
   */
  getBuffer: () => {
    return logBuffer.getAll();
  },

  /**
   * Clear log buffer (development only)
   *
   * @example
   * logger.clearBuffer();
   */
  clearBuffer: () => {
    logBuffer.clear();
  },

  /**
   * Get buffer statistics (development only)
   *
   * @returns {object} Buffer statistics
   *
   * @example
   * const stats = logger.getStats();
   * // { totalEntries: 150, bufferedEntries: 100, countByLevel: { ... } }
   */
  getStats: () => {
    return logBuffer.getStats();
  },

  /**
   * Export logs as JSON (development only)
   *
   * @returns {string} JSON string of all logs
   *
   * @example
   * const json = logger.exportLogs();
   * // Download or send to support
   */
  exportLogs: () => {
    return logBuffer.toJSON();
  },

  /**
   * Set log level dynamically
   *
   * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR, CRITICAL)
   *
   * @example
   * logger.setLevel('DEBUG'); // Enable debug logs
   */
  setLevel: (level) => {
    if (LEVELS[level] !== undefined) {
      config.level = LEVELS[level];
    }
  },

  /**
   * Get current log level
   *
   * @returns {string} Current log level
   */
  getLevel: () => {
    return LEVEL_NAMES[config.level];
  },
};

// Export default for convenience
export default logger;
