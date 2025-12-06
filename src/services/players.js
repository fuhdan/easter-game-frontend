/**
 * Module: services/players.js
 * Purpose: Player management API endpoints
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides player management functionality:
 * - Get all players
 * - Create/update/delete players
 * - Bulk create players
 * - Import/export players
 * - Generate OTPs
 *
 * @since 2025-11-20
 */

import { request, log } from './api';

/**
 * Get all players
 *
 * ADMIN ONLY
 *
 * @returns {Promise<Array>} Array of player objects
 * @throws {APIError} 403 if not admin
 */
export const getAll = () => request('GET', '/players');

/**
 * Get player by ID
 *
 * ADMIN ONLY
 *
 * @param {number} id - Player ID
 * @returns {Promise<Object>} Player object
 * @throws {APIError} 403 if not admin, 404 if player not found
 */
export const getById = (id) => request('GET', `/players/${id}`);

/**
 * Create player
 *
 * ADMIN ONLY
 *
 * @param {Object} playerData - Player data
 * @param {string} playerData.name - Player name
 * @param {string} playerData.email - Email address
 * @param {number} [playerData.skill_level] - Skill level (1-5)
 * @returns {Promise<Object>} Created player object with ID
 * @throws {APIError} 400 if validation fails, 403 if not admin
 */
export const create = (playerData) => request('POST', '/players', playerData);

/**
 * Update player
 *
 * ADMIN ONLY
 *
 * @param {number} id - Player ID
 * @param {Object} playerData - Player data to update
 * @returns {Promise<Object>} Updated player object
 * @throws {APIError} 400 if validation fails, 403 if not admin, 404 if not found
 */
export const update = (id, playerData) => request('PUT', `/players/${id}`, playerData);

/**
 * Delete player
 *
 * ADMIN ONLY
 *
 * @param {number} id - Player ID
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {APIError} 403 if not admin, 404 if player not found
 */
export const deletePlayer = (id) => request('DELETE', `/players/${id}`);

/**
 * Bulk create players from CSV data
 *
 * ADMIN ONLY
 *
 * @param {Array<Object>} players - Array of player objects
 * @param {string} players[].name - Player name
 * @param {string} players[].email - Email address
 * @param {number} [players[].skill_level] - Skill level (1-5)
 * @returns {Promise<Object>} Creation results with success/error counts
 * @throws {APIError} 400 if validation fails, 403 if not admin
 */
export const bulkCreate = (players) => {
  log.info(`Uploading ${players.length} players`);
  return request('POST', '/players/bulk-create', { players });
};

/**
 * Import players from CSV
 *
 * ADMIN ONLY
 *
 * @param {string} csvData - CSV data string
 * @returns {Promise<Object>} Import results with success/error counts
 * @throws {APIError} 400 if invalid CSV format, 403 if not admin
 */
export const importPlayers = (csvData) => request('POST', '/players/import', { csvData });

/**
 * Export players as CSV
 *
 * ADMIN ONLY
 *
 * @returns {Promise<string>} CSV data
 * @throws {APIError} 403 if not admin
 */
export const exportPlayers = () => request('GET', '/players/export');

/**
 * Generate one-time password for player
 *
 * ADMIN ONLY
 *
 * Generates a secure OTP for new player account activation
 *
 * @param {number} playerId - Player ID
 * @returns {Promise<Object>} OTP object
 * @returns {string} otp.password - Generated OTP
 * @returns {string} otp.expires_at - Expiration timestamp
 * @throws {APIError} 403 if not admin, 404 if player not found
 */
export const generateOtp = (playerId) => {
  log.info(`Generating OTP for player ${playerId}`);
  return request('POST', `/players/${playerId}/generate-otp`);
};
