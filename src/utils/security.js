/**
 * Module: utils/security.js
 * Purpose: Security utilities for PII masking and sensitive data redaction
 * Part of: Easter Quest 2025 Frontend
 *
 * Features:
 * - Username masking (first 3 chars + ***)
 * - Email masking (first char + ***@***.***)
 * - Token masking (first 10 chars + ***)
 * - Sensitive data redaction from objects
 * - Sensitive data detection
 *
 * Security:
 * - Follows security_rules.md and frontend_security_rules.md
 * - Prevents logging of passwords, tokens, API keys
 * - GDPR-compliant PII masking
 *
 * @since 2025-12-22
 */

/**
 * Mask username (first 3 chars + ***)
 *
 * SECURITY: Masks usernames to protect user privacy (GDPR compliance)
 *
 * @param {string} username - Username to mask
 * @returns {string} Masked username (e.g., "joh***")
 *
 * @example
 * maskUsername('john_doe') // Returns: 'joh***'
 * maskUsername('ab') // Returns: '***'
 * maskUsername('') // Returns: '***'
 */
export function maskUsername(username) {
  if (!username || typeof username !== 'string') {
    return '***';
  }

  if (username.length < 3) {
    return '***';
  }

  return username.slice(0, 3) + '***';
}

/**
 * Mask email address (first char + ***@***.***)
 *
 * SECURITY: Masks emails to protect user privacy (GDPR compliance)
 *
 * @param {string} email - Email to mask
 * @returns {string} Masked email (e.g., "u***@***.***")
 *
 * @example
 * maskEmail('user@example.com') // Returns: 'u***@***.***'
 * maskEmail('a@b.c') // Returns: 'a***@***.***'
 * maskEmail('invalid') // Returns: '***@***.***'
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return '***@***.***';
  }

  return email[0] + '***@***.***';
}

/**
 * Mask token (first 10 chars + ***)
 *
 * SECURITY: Masks tokens to prevent exposure in logs
 *
 * @param {string} token - Token to mask (JWT, API key, etc.)
 * @returns {string} Masked token (e.g., "eyJhbGciOi***")
 *
 * @example
 * maskToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...') // Returns: 'eyJhbGciOi***'
 * maskToken('short') // Returns: '***'
 */
export function maskToken(token) {
  if (!token || typeof token !== 'string') {
    return '***';
  }

  if (token.length < 10) {
    return '***';
  }

  return token.slice(0, 10) + '***';
}

/**
 * List of sensitive keys that should be redacted
 *
 * SECURITY: These keys contain sensitive data that should NEVER be logged
 */
const SENSITIVE_KEYS = [
  'password',
  'passwd',
  'pwd',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'api_key',
  'apikey',
  'secret',
  'secretkey',
  'secret_key',
  'jwt',
  'authorization',
  'auth',
  'cookie',
  'session',
  'sessionid',
  'session_id',
  'credit_card',
  'creditcard',
  'cvv',
  'ssn',
  'social_security',
];

/**
 * Check if a key name is sensitive
 *
 * @param {string} key - Key name to check
 * @returns {boolean} True if key is sensitive
 */
function isSensitiveKey(key) {
  if (typeof key !== 'string') {
    return false;
  }

  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey));
}

/**
 * Redact sensitive keys from object
 *
 * SECURITY: Recursively redacts sensitive data from objects before logging
 * Replaces sensitive values with '[REDACTED]'
 *
 * @param {any} obj - Object to redact (can be nested)
 * @returns {any} Object with sensitive values redacted
 *
 * @example
 * redactSensitiveData({ username: 'john', password: 'secret' })
 * // Returns: { username: 'john', password: '[REDACTED]' }
 *
 * redactSensitiveData({ user: { token: 'abc123', name: 'John' } })
 * // Returns: { user: { token: '[REDACTED]', name: 'John' } }
 */
export function redactSensitiveData(obj) {
  // Handle null/undefined
  if (obj == null) {
    return obj;
  }

  // Handle primitive types
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item));
  }

  // Handle objects
  const redacted = {};

  for (const key of Object.keys(obj)) {
    if (isSensitiveKey(key)) {
      // SECURITY: Redact sensitive keys
      redacted[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recursively redact nested objects
      redacted[key] = redactSensitiveData(obj[key]);
    } else {
      // Keep non-sensitive values
      redacted[key] = obj[key];
    }
  }

  return redacted;
}

/**
 * Check if context contains sensitive data
 *
 * SECURITY: Detects if context object contains sensitive keys
 * Used to trigger warnings before logging
 *
 * @param {object} context - Context object to check
 * @returns {boolean} True if sensitive data detected
 *
 * @example
 * containsSensitiveData({ username: 'john' }) // Returns: false
 * containsSensitiveData({ password: 'secret' }) // Returns: true
 * containsSensitiveData({ user: { token: 'abc' } }) // Returns: true
 */
export function containsSensitiveData(context) {
  if (!context || typeof context !== 'object') {
    return false;
  }

  // Check top-level keys
  for (const key of Object.keys(context)) {
    if (isSensitiveKey(key)) {
      return true;
    }

    // Recursively check nested objects
    if (typeof context[key] === 'object' && context[key] !== null) {
      if (containsSensitiveData(context[key])) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Apply all PII masking to a context object
 *
 * SECURITY: Applies username, email, and token masking
 * Should be called before logging any context
 *
 * @param {object} context - Context object to mask
 * @returns {object} Context with PII masked
 *
 * @example
 * applyPIIMasking({
 *   username: 'john_doe',
 *   email: 'john@example.com',
 *   token: 'eyJhbGci...'
 * })
 * // Returns: {
 * //   username: 'joh***',
 * //   email: 'j***@***.***',
 * //   token: 'eyJhbGciOi***'
 * // }
 */
export function applyPIIMasking(context) {
  if (!context || typeof context !== 'object') {
    return context;
  }

  const masked = { ...context };

  // SECURITY: Mask username
  if (masked.username && typeof masked.username === 'string') {
    masked.username = maskUsername(masked.username);
  }

  // SECURITY: Mask email
  if (masked.email && typeof masked.email === 'string') {
    masked.email = maskEmail(masked.email);
  }

  // SECURITY: Mask token
  if (masked.token && typeof masked.token === 'string') {
    masked.token = maskToken(masked.token);
  }

  // Recursively mask nested objects
  for (const key of Object.keys(masked)) {
    if (typeof masked[key] === 'object' && masked[key] !== null && !Array.isArray(masked[key])) {
      masked[key] = applyPIIMasking(masked[key]);
    }
  }

  return masked;
}

/**
 * Sanitize context object for logging
 *
 * SECURITY: Combines PII masking and sensitive data redaction
 * This is the main function to call before logging
 *
 * @param {object} context - Context object to sanitize
 * @returns {object} Sanitized context (PII masked + sensitive data redacted)
 *
 * @example
 * sanitizeContext({
 *   username: 'john_doe',
 *   password: 'secret123',
 *   email: 'john@example.com'
 * })
 * // Returns: {
 * //   username: 'joh***',
 * //   password: '[REDACTED]',
 * //   email: 'j***@***.***'
 * // }
 */
export function sanitizeContext(context) {
  if (!context) {
    return context;
  }

  // Step 1: Mask PII (username, email, token)
  let sanitized = applyPIIMasking(context);

  // Step 2: Redact sensitive keys (password, secret, etc.)
  sanitized = redactSensitiveData(sanitized);

  return sanitized;
}
