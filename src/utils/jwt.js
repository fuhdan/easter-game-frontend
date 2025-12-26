/**
 * Module: utils/jwt.js
 * Purpose: JWT token utilities for client-side token management
 * Part of: Easter Quest 2025 Frontend Utilities
 *
 * Provides JWT token decoding and expiration tracking:
 * - Decode JWT tokens without verification (client-side only)
 * - Extract token expiration time
 * - Calculate time until token expires
 *
 * SECURITY NOTE: This is for client-side utility only.
 * Token verification happens on the backend.
 * Do NOT use this for authentication decisions.
 *
 * @since 2025-12-26
 */

import { logger } from './logger';

/**
 * Base64URL decode
 *
 * @param {string} str - Base64URL encoded string
 * @returns {string} Decoded string
 */
const base64UrlDecode = (str) => {
  // Replace URL-safe characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if needed
  const pad = base64.length % 4;
  if (pad) {
    base64 += '='.repeat(4 - pad);
  }

  // Decode base64
  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (error) {
    logger.error('base64_decode_error', { error: error.message });
    throw new Error('Failed to decode base64: ' + error.message);
  }
};

/**
 * Decode JWT token (without verification)
 *
 * SECURITY: This does NOT verify the token signature.
 * Backend verification is required for authentication.
 * Use this ONLY for reading token metadata (expiration, user info).
 *
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload, or null if invalid
 * @returns {number} payload.exp - Expiration timestamp (seconds since epoch)
 * @returns {number} payload.iat - Issued at timestamp
 * @returns {number} payload.user_id - User ID
 */
export const decodeJWT = (token) => {
  if (!token || typeof token !== 'string') {
    logger.warn('decode_jwt_invalid_input', { tokenType: typeof token });
    return null;
  }

  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.warn('decode_jwt_invalid_format', { parts: parts.length });
      return null;
    }

    // Decode payload (second part)
    const payload = JSON.parse(base64UrlDecode(parts[1]));

    logger.debug('jwt_decoded', {
      hasExp: !!payload.exp,
      hasIat: !!payload.iat,
      hasUserId: !!payload.user_id
    });

    return payload;
  } catch (error) {
    logger.error('decode_jwt_error', { error: error.message });
    return null;
  }
};

/**
 * Get token expiration time in milliseconds
 *
 * @param {string} token - JWT token
 * @returns {number|null} Expiration time in milliseconds since epoch, or null if invalid
 */
export const getTokenExpiration = (token) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  // JWT exp is in seconds, convert to milliseconds
  return payload.exp * 1000;
};

/**
 * Get time until token expires in milliseconds
 *
 * @param {string} token - JWT token
 * @returns {number|null} Milliseconds until expiration, or null if invalid
 *                        Returns negative value if already expired
 */
export const getTimeUntilExpiration = (token) => {
  const expirationTime = getTokenExpiration(token);
  if (!expirationTime) {
    return null;
  }

  return expirationTime - Date.now();
};

/**
 * Check if token is expired
 *
 * @param {string} token - JWT token
 * @param {number} bufferSeconds - Optional buffer in seconds (default: 0)
 *                                Consider token expired N seconds early
 * @returns {boolean} True if expired (or will expire within buffer)
 */
export const isTokenExpired = (token, bufferSeconds = 0) => {
  const timeUntilExpiration = getTimeUntilExpiration(token);
  if (timeUntilExpiration === null) {
    return true; // Invalid token is considered expired
  }

  const bufferMs = bufferSeconds * 1000;
  return timeUntilExpiration <= bufferMs;
};

/**
 * Get token from HTTPOnly cookie by making a request to backend
 *
 * NOTE: This is a workaround since JavaScript cannot read HTTPOnly cookies.
 * The backend must provide an endpoint that returns the current access token.
 *
 * @returns {Promise<string|null>} Access token or null if not available
 */
export const getAccessTokenFromCookie = async () => {
  try {
    // SECURITY: This assumes backend provides /auth/token endpoint
    // that returns the current access token from the HTTPOnly cookie
    const response = await fetch('/api/v1/auth/token', {
      credentials: 'include'
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    logger.error('get_access_token_error', { error: error.message });
    return null;
  }
};

/**
 * Calculate when to trigger proactive token refresh
 *
 * Refreshes token 5 minutes before expiration by default
 *
 * @param {string} token - JWT token
 * @param {number} refreshBufferSeconds - How many seconds before expiration to refresh (default: 300 = 5 minutes)
 * @returns {number|null} Milliseconds until refresh should be triggered, or null if invalid
 */
export const getTimeUntilRefresh = (token, refreshBufferSeconds = 300) => {
  const timeUntilExpiration = getTimeUntilExpiration(token);
  if (timeUntilExpiration === null) {
    return null;
  }

  const bufferMs = refreshBufferSeconds * 1000;
  const refreshTime = timeUntilExpiration - bufferMs;

  // If token expires in less than buffer time, refresh immediately
  return Math.max(refreshTime, 0);
};
