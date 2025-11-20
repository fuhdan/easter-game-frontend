/**
 * Module: services/admin.js
 * Purpose: Admin dashboard and management API endpoints
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides admin functionality:
 * - Dashboard statistics
 * - Team and game progress
 * - Game resets
 * - User management
 * - Rate limit management
 * - System information
 *
 * @since 2025-11-20
 */

import { request, log } from './api';

/**
 * Get dashboard statistics
 *
 * ADMIN ONLY
 *
 * @returns {Promise<Object>} Dashboard statistics
 * @returns {number} stats.total_users - Total users
 * @returns {number} stats.total_teams - Total teams
 * @returns {number} stats.total_games - Total games
 * @returns {number} stats.active_players - Active players
 * @returns {number} stats.completed_games - Completed games
 * @throws {APIError} 403 if not admin
 */
export const getStats = () => request('GET', '/api/admin/stats');

/**
 * Get team progress
 *
 * ADMIN ONLY
 *
 * @returns {Promise<Array>} Array of team progress objects
 * @returns {number} progress[].team_id - Team ID
 * @returns {string} progress[].team_name - Team name
 * @returns {number} progress[].games_completed - Games completed
 * @returns {number} progress[].total_score - Total score
 * @throws {APIError} 403 if not admin
 */
export const getTeamProgress = () => request('GET', '/api/admin/teams/progress');

/**
 * Get overall game progress
 *
 * ADMIN ONLY
 *
 * @returns {Promise<Array>} Array of game progress objects
 * @returns {number} progress[].game_id - Game ID
 * @returns {string} progress[].game_name - Game name
 * @returns {number} progress[].teams_completed - Teams that completed
 * @returns {number} progress[].avg_time - Average completion time
 * @throws {APIError} 403 if not admin
 */
export const getGameProgress = () => request('GET', '/api/admin/games/progress');

/**
 * Reset a specific game
 *
 * ADMIN ONLY
 *
 * Resets progress for all teams on this game
 *
 * @param {number} gameId - Game ID
 * @returns {Promise<Object>} Reset confirmation
 * @throws {APIError} 403 if not admin, 404 if game not found
 */
export const resetGame = (gameId) => request('POST', `/api/admin/games/${gameId}/reset`);

/**
 * Reset all progress for all teams
 *
 * ADMIN ONLY
 *
 * Nuclear option - clears all game progress for all teams
 *
 * @returns {Promise<Object>} Reset confirmation
 * @throws {APIError} 403 if not admin
 */
export const resetAllProgress = () => request('POST', '/api/admin/reset-all');

/**
 * Get system information
 *
 * ADMIN ONLY
 *
 * @returns {Promise<Object>} System information
 * @returns {string} info.version - Application version
 * @returns {string} info.environment - Environment (dev/prod)
 * @returns {Object} info.database - Database info
 * @returns {Object} info.redis - Redis info
 * @throws {APIError} 403 if not admin
 */
export const getSystemInfo = () => request('GET', '/api/admin/system');

/**
 * Export all data
 *
 * ADMIN ONLY
 *
 * @returns {Promise<Object>} Exported data
 * @throws {APIError} 403 if not admin
 */
export const exportAllData = () => request('GET', '/api/admin/export');

/**
 * Promote user to admin
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated user object
 * @throws {APIError} 403 if not super_admin, 404 if user not found
 */
export const promoteUser = (userId) => request('PUT', `/api/admin/users/${userId}/promote`);

/**
 * Demote admin user to player
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated user object
 * @throws {APIError} 403 if not super_admin, 404 if user not found
 */
export const demoteUser = (userId) => request('PUT', `/api/admin/users/${userId}/demote`);

/**
 * Update game content
 *
 * ADMIN ONLY
 *
 * @param {number} gameId - Game ID
 * @param {Object} content - Game content to update
 * @returns {Promise<Object>} Updated game object
 * @throws {APIError} 400 if validation fails, 403 if not admin, 404 if not found
 */
export const updateGameContent = (gameId, content) => request('PUT', `/api/admin/games/${gameId}/content`, content);

/**
 * Reset rate limit for specific target
 *
 * ADMIN ONLY
 *
 * @param {string} target - Target type (ai/chat/login/etc)
 * @param {string} identifier - Identifier (IP address, user ID, etc)
 * @returns {Promise<Object>} Reset confirmation
 * @throws {APIError} 403 if not admin
 */
export const resetRateLimit = (target, identifier) => {
  log.info(`Resetting ${target} rate limit for: ${identifier}`);
  return request('POST', '/api/admin/reset-rate-limit', { target, identifier });
};

/**
 * Bulk reset rate limits
 *
 * ADMIN ONLY
 *
 * @param {Array<string>} ips - Array of IP addresses
 * @returns {Promise<Object>} Reset confirmation with counts
 * @throws {APIError} 403 if not admin
 */
export const resetRateLimitBulk = (ips) => {
  log.info(`Bulk resetting rate limits for ${ips.length} IP(s)`);
  return request('POST', '/api/admin/reset-rate-limit-bulk', { ips });
};
