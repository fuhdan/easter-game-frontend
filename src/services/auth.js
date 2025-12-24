/**
 * Module: services/auth.js
 * Purpose: Authentication API endpoints
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides authentication functionality:
 * - Login with username/password
 * - Account activation
 * - Logout
 * - Token refresh
 * - Current user info
 *
 * @since 2025-11-20
 */

import { request } from './api';
import { logger } from '../utils/logger';

/**
 * Login user with credentials
 *
 * Supports 3 login scenarios:
 * 1. Normal login - returns user object
 * 2. Password change required - returns requiresPasswordChange flag
 * 3. Password change + OTP required - returns requiresPasswordChange + requiresOTP flags
 *
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.username - Username
 * @param {string} credentials.password - Password
 * @returns {Promise<Object>} Login response
 * @throws {APIError} 401 if credentials invalid, 429 if rate limited
 */
export const login = (credentials) => {
  // Trim username to prevent whitespace issues
  const sanitizedCredentials = {
    ...credentials,
    username: credentials.username?.trim() || credentials.username
  };

  logger.info('Attempting login for:', sanitizedCredentials.username);
  return request('POST', '/auth/login', sanitizedCredentials);
};

/**
 * Activate account for new users (scenarios 2 & 3)
 *
 * @param {Object} activationData - Account activation data
 * @param {string} activationData.username - Username
 * @param {string} activationData.old_password - Temporary password (scenario 2) or OTP (scenario 3)
 * @param {string} activationData.new_password - New password
 * @returns {Promise<Object>} Activation response with user object
 * @throws {APIError} 400 if validation fails, 401 if credentials invalid
 */
export const activateAccount = (activationData) => {
  logger.info('Activating account for:', activationData.username);
  return request('POST', '/users/change-password', activationData);
};

/**
 * Logout current user
 *
 * Clears HTTPOnly cookies on backend and invalidates session
 *
 * @returns {Promise<Object>} Logout response
 * @throws {APIError} If logout fails
 */
export const logout = () => request('POST', '/auth/logout');

/**
 * Refresh access token using refresh token
 *
 * Called automatically by api.js when a request returns 401
 * Can also be called manually to proactively refresh tokens
 *
 * @returns {Promise<Object>} Refresh response with new tokens
 * @throws {APIError} 401 if refresh token invalid/expired
 */
export const refresh = () => request('POST', '/auth/refresh');

/**
 * Get current authenticated user
 *
 * Also validates that the user is authenticated
 *
 * @returns {Promise<Object>} Current user object
 * @returns {number} user.id - User ID
 * @returns {string} user.username - Username
 * @returns {string} user.email - Email
 * @returns {number} user.team_id - Team ID
 * @returns {string} user.role - Role (player/admin/super_admin)
 * @throws {APIError} 401 if not authenticated
 */
export const me = () => request('GET', '/auth/me');

/**
 * Verify authentication token
 *
 * Alias for me() - checks if user is authenticated
 *
 * @returns {Promise<Object>} Current user object
 * @throws {APIError} 401 if not authenticated
 */
export const verify = () => request('GET', '/auth/me');
