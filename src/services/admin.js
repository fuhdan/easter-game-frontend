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
export const getStats = () => request('GET', '/admin/stats');

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
export const getTeamProgress = () => request('GET', '/admin/teams/progress');

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
export const getGameProgress = () => request('GET', '/admin/games/progress');

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
export const resetGame = (gameId) => request('POST', `/admin/games/${gameId}/reset`);

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
export const resetAllProgress = () => request('POST', '/admin/reset-all');

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
export const getSystemInfo = () => request('GET', '/admin/system');

/**
 * Export all data
 *
 * ADMIN ONLY
 *
 * @returns {Promise<Object>} Exported data
 * @throws {APIError} 403 if not admin
 */
export const exportAllData = () => request('GET', '/admin/export');

/**
 * Promote user to admin
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated user object
 * @throws {APIError} 403 if not super_admin, 404 if user not found
 */
export const promoteUser = (userId) => request('PUT', `/admin/users/${userId}/promote`);

/**
 * Demote admin user to player
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated user object
 * @throws {APIError} 403 if not super_admin, 404 if user not found
 */
export const demoteUser = (userId) => request('PUT', `/admin/users/${userId}/demote`);

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
export const updateGameContent = (gameId, content) => request('PUT', `/admin/games/${gameId}/content`, content);

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
  return request('POST', '/admin/reset-rate-limit', { target, identifier });
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
  return request('POST', '/admin/reset-rate-limit-bulk', { ips });
};

/**
 * Get game statistics overview
 *
 * ADMIN ONLY
 *
 * Returns aggregate statistics across all games for the active event.
 * Team-based analytics: Counts teams (not individuals) for completion rates.
 *
 * @returns {Promise<Object>} Game statistics overview
 * @returns {boolean} response.success - Success status
 * @returns {Object} response.stats - Statistics object
 * @returns {number} response.stats.total_games - Total games in active event
 * @returns {number} response.stats.avg_completion_rate - Average completion rate (%)
 * @returns {Object} response.stats.most_popular - Most completed game
 * @returns {Object} response.stats.most_difficult - Least completed game
 * @returns {Array<Object>} response.stats.games_needing_attention - Games with <50% completion
 * @throws {APIError} 403 if not admin
 * @throws {APIError} 404 if no active event found
 *
 * @example
 * const stats = await getGameStatistics();
 * console.log(`Avg completion: ${stats.stats.avg_completion_rate}%`);
 *
 * @since 2025-11-21
 */
export const getGameStatistics = () => {
  log.info('Fetching game statistics overview');
  return request('GET', '/admin/dashboard/games/stats');
};

/**
 * Get detailed analytics for each game
 *
 * ADMIN ONLY
 *
 * Returns per-game metrics including completion rates, avg times, hints used,
 * ratings, and teams needing help. All metrics are team-based.
 *
 * @returns {Promise<Object>} Per-game analytics
 * @returns {boolean} response.success - Success status
 * @returns {Array<Object>} response.games - Array of game analytics
 * @returns {number} response.games[].game_id - Game ID
 * @returns {string} response.games[].title - Game title
 * @returns {string} response.games[].category_name - Category name
 * @returns {string} response.games[].category_icon - Category icon
 * @returns {number} response.games[].difficulty_level - Difficulty (1-5)
 * @returns {number} response.games[].completion_rate - Completion rate (%)
 * @returns {number} response.games[].completed_teams - Teams that completed
 * @returns {number} response.games[].total_teams - Total active teams
 * @returns {number} response.games[].avg_time_minutes - Avg completion time
 * @returns {number} response.games[].total_hints_used - Total hints used
 * @returns {number} response.games[].avg_hints_per_team - Avg hints per team
 * @returns {number} response.games[].stuck_teams - Teams stuck (>4h in progress)
 * @returns {number} response.games[].avg_rating - Average rating (1-5)
 * @returns {number} response.games[].rating_count - Number of ratings
 * @returns {boolean} response.games[].needs_attention - Needs admin attention flag
 * @throws {APIError} 403 if not admin
 * @throws {APIError} 404 if no active event found
 *
 * @example
 * const analytics = await getPerGameAnalytics();
 * const needsHelp = analytics.games.filter(g => g.needs_attention);
 *
 * @since 2025-11-21
 */
export const getPerGameAnalytics = () => {
  log.info('Fetching per-game analytics');
  return request('GET', '/admin/dashboard/games/analytics');
};

/**
 * Get detailed admin view for a single game
 *
 * ADMIN ONLY
 *
 * Returns comprehensive breakdown including team completion status,
 * rating distribution, and recent comments. Does not expose solutions.
 *
 * @param {number} gameId - Game ID to get details for
 * @returns {Promise<Object>} Detailed game data
 * @returns {boolean} response.success - Success status
 * @returns {Object} response.game - Game information
 * @returns {number} response.game.id - Game ID
 * @returns {string} response.game.title - Game title
 * @returns {string} response.game.description - Game description
 * @returns {number} response.game.difficulty_level - Difficulty (1-5)
 * @returns {number} response.game.points_value - Points value
 * @returns {number} response.game.max_hints - Max hints available
 * @returns {Array<Object>} response.team_breakdown - Team completion breakdown
 * @returns {number} response.team_breakdown[].team_id - Team ID
 * @returns {string} response.team_breakdown[].team_name - Team name
 * @returns {number} response.team_breakdown[].completed - Members who completed
 * @returns {number} response.team_breakdown[].total_members - Total team members
 * @returns {number} response.team_breakdown[].completion_rate - Team completion % (0-100)
 * @returns {string} response.team_breakdown[].status - Team status (completed/not_started)
 * @returns {Object} response.rating_distribution - Rating distribution {1: count, 2: count, ...}
 * @returns {Array<Object>} response.comments - Recent 10 rating comments
 * @throws {APIError} 403 if not admin
 * @throws {APIError} 404 if game not found
 *
 * @example
 * const details = await getGameAdminDetails(5);
 * console.log(`${details.game.title}: ${details.team_breakdown.length} teams`);
 *
 * @since 2025-11-21
 */
export const getGameAdminDetails = (gameId) => {
  log.info(`Fetching admin details for game ${gameId}`);
  return request('GET', `/admin/dashboard/games/${gameId}/details`);
};
