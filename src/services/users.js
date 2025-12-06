/**
 * Module: services/users.js
 * Purpose: User management API endpoints
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides user management functionality:
 * - Get all users (admin)
 * - Create/update/delete users (admin)
 * - Bulk create users (admin)
 * - Update current user profile
 * - Change password
 *
 * @since 2025-11-20
 */

import { request } from './api';

/**
 * Get all users
 *
 * ADMIN ONLY
 *
 * @returns {Promise<Array>} Array of user objects
 * @throws {APIError} 403 if not admin
 */
export const getAll = () => request('GET', '/users');

/**
 * Get user by ID
 *
 * ADMIN ONLY
 *
 * @param {number} id - User ID
 * @returns {Promise<Object>} User object
 * @throws {APIError} 403 if not admin, 404 if user not found
 */
export const getById = (id) => request('GET', `/users/${id}`);

/**
 * Create new user
 *
 * ADMIN ONLY
 *
 * @param {Object} userData - User data
 * @param {string} userData.username - Username (3-32 chars, alphanumeric + underscore)
 * @param {string} userData.email - Email address
 * @param {string} userData.password - Password (min 8 chars)
 * @param {string} [userData.role] - Role (player/admin/super_admin), defaults to player
 * @param {number} [userData.team_id] - Team ID
 * @returns {Promise<Object>} Created user object with ID
 * @throws {APIError} 400 if validation fails, 403 if not admin, 409 if username/email exists
 */
export const create = (userData) => request('POST', '/users', userData);

/**
 * Update user
 *
 * ADMIN ONLY
 *
 * @param {number} id - User ID
 * @param {Object} userData - Updated user data
 * @param {string} [userData.username] - Username
 * @param {string} [userData.email] - Email address
 * @param {string} [userData.role] - Role
 * @param {number} [userData.team_id] - Team ID
 * @returns {Promise<Object>} Updated user object
 * @throws {APIError} 400 if validation fails, 403 if not admin, 404 if user not found
 */
export const update = (id, userData) => request('PUT', `/users/${id}`, userData);

/**
 * Delete user
 *
 * ADMIN ONLY
 *
 * @param {number} id - User ID
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {APIError} 403 if not admin, 404 if user not found, 409 if user is team leader
 */
export const deleteUser = (id) => request('DELETE', `/users/${id}`);

/**
 * Bulk create users from CSV data
 *
 * ADMIN ONLY
 *
 * @param {Array<Object>} users - Array of user objects
 * @param {string} users[].username - Username
 * @param {string} users[].email - Email address
 * @param {string} [users[].password] - Optional password, auto-generated if not provided
 * @param {string} [users[].role] - Role, defaults to player
 * @returns {Promise<Object>} Creation results with success/error counts
 * @throws {APIError} 400 if validation fails, 403 if not admin
 */
export const bulkCreate = (users) => request('POST', '/users/bulk-create', { users });

/**
 * Get current user profile
 *
 * @returns {Promise<Object>} Current user object
 * @throws {APIError} 401 if not authenticated
 */
export const getCurrentUser = () => request('GET', '/users/me');

/**
 * Update current user profile
 *
 * Users can only update their own profile
 *
 * @param {Object} profileData - Profile data to update
 * @param {string} [profileData.email] - Email address
 * @returns {Promise<Object>} Updated user object
 * @throws {APIError} 400 if validation fails, 401 if not authenticated
 */
export const updateProfile = (profileData) => request('PUT', '/users/me', profileData);

/**
 * Change password for current user
 *
 * @param {Object} passwordData - Password change data
 * @param {string} passwordData.old_password - Current password
 * @param {string} passwordData.new_password - New password (min 8 chars)
 * @returns {Promise<Object>} Success confirmation
 * @throws {APIError} 400 if validation fails, 401 if old password incorrect
 */
export const changePassword = (passwordData) => request('PUT', '/users/me/password', passwordData);
