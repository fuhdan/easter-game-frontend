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

import { request } from './api';
import { logger } from '../utils/logger';

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
  logger.info('admin_reset_rate_limit', { target, identifier, module: 'admin' });
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
  logger.info('admin_bulk_reset_rate_limits', { count: ips.length, module: 'admin' });
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
  logger.debug('admin_fetch_game_stats', { module: 'admin' });
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
  logger.debug('admin_fetch_game_analytics', { module: 'admin' });
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
  logger.debug('admin_fetch_game_details', { gameId, module: 'admin' });
  return request('GET', `/admin/dashboard/games/${gameId}/details`);
};

// ============================================================================
// ADMIN USER MANAGEMENT (admin.db)
// ============================================================================

/**
 * List all admin users from admin.db
 *
 * SYSTEM_ADMIN ONLY
 *
 * Returns all admin users with their roles, status, and metadata.
 * Passwords and password hashes are never exposed.
 *
 * @returns {Promise<Array>} Array of admin user objects
 * @returns {number} users[].id - Admin user ID
 * @returns {string} users[].username - Admin username
 * @returns {string} users[].email - Admin email
 * @returns {string} users[].display_name - Admin display name
 * @returns {string} users[].role - Admin role (admin/game_admin/system_admin/content_admin)
 * @returns {boolean} users[].is_active - Whether admin account is active
 * @returns {boolean} users[].requires_password_change - Whether password change is required
 * @returns {string} users[].created_at - Account creation timestamp
 * @returns {string} users[].last_login - Last login timestamp
 * @throws {APIError} 403 if not system_admin
 *
 * @example
 * const admins = await listAdminUsers();
 * console.log(`${admins.length} admin users found`);
 *
 * @since 2026-03-18
 */
export const listAdminUsers = () => {
  logger.debug('admin_list_users', { module: 'admin' });
  return request('GET', '/admin/admin-users');
};

/**
 * Create a new admin user
 *
 * SYSTEM_ADMIN ONLY
 *
 * Creates a new admin user with initial password set to username.
 * The new admin will be forced to change their password on first login.
 *
 * @param {Object} data - Admin user data
 * @param {string} data.username - Username (3-50 chars, alphanumeric + underscore)
 * @param {string} data.email - Email address
 * @param {string} data.display_name - Display name (3-100 chars)
 * @param {string} data.role - Role (admin/game_admin/system_admin/content_admin)
 * @returns {Promise<Object>} Created admin user + initial password
 * @returns {number} response.id - New admin user ID
 * @returns {string} response.username - Username
 * @returns {string} response.email - Email
 * @returns {string} response.display_name - Display name
 * @returns {string} response.role - Role
 * @returns {boolean} response.requires_password_change - Always true
 * @returns {string} response.initial_password - Initial password (same as username)
 * @returns {string} response.message - Instructions message
 * @throws {APIError} 400 if username already exists or validation fails
 * @throws {APIError} 403 if not system_admin
 *
 * @example
 * const newAdmin = await createAdminUser({
 *   username: 'newadmin',
 *   email: 'admin@ypsomed.com',
 *   display_name: 'New Admin',
 *   role: 'game_admin'
 * });
 * alert(`Initial password: ${newAdmin.initial_password}`);
 *
 * @since 2026-03-18
 */
export const createAdminUser = (data) => {
  logger.info('admin_create_user', { username: data.username, role: data.role, module: 'admin' });
  return request('POST', '/admin/admin-users', data);
};

/**
 * Update admin user details
 *
 * SYSTEM_ADMIN ONLY
 *
 * Updates email, display_name, role, or is_active status.
 * Does not update password (use resetAdminPassword instead).
 *
 * @param {number} adminId - Admin user ID to update
 * @param {Object} data - Fields to update (all optional)
 * @param {string} [data.email] - New email address
 * @param {string} [data.display_name] - New display name
 * @param {string} [data.role] - New role (admin/game_admin/system_admin/content_admin)
 * @param {boolean} [data.is_active] - New active status
 * @returns {Promise<Object>} Updated admin user object
 * @throws {APIError} 404 if admin not found
 * @throws {APIError} 403 if not system_admin
 *
 * @example
 * await updateAdminUser(5, { role: 'system_admin', is_active: true });
 *
 * @since 2026-03-18
 */
export const updateAdminUser = (adminId, data) => {
  logger.info('admin_update_user', { adminId, updateFields: Object.keys(data), module: 'admin' });
  return request('PUT', `/admin/admin-users/${adminId}`, data);
};

/**
 * Reset admin user password
 *
 * SYSTEM_ADMIN ONLY
 *
 * Resets the admin's password to their username.
 * The admin will be forced to change their password on next login.
 *
 * @param {number} adminId - Admin user ID
 * @returns {Promise<Object>} Reset confirmation + reset password
 * @returns {boolean} response.success - Always true
 * @returns {string} response.reset_password - Reset password (username)
 * @returns {string} response.message - Instructions message
 * @throws {APIError} 404 if admin not found
 * @throws {APIError} 403 if not system_admin
 *
 * @example
 * const result = await resetAdminPassword(5);
 * console.log(`Password reset to: ${result.reset_password}`);
 *
 * @since 2026-03-18
 */
export const resetAdminPassword = (adminId) => {
  logger.info('admin_reset_password', { adminId, module: 'admin' });
  return request('POST', `/admin/admin-users/${adminId}/reset-password`);
};

/**
 * Delete admin user
 *
 * SYSTEM_ADMIN ONLY
 *
 * Permanently deletes an admin user account.
 * Safety checks:
 * - Cannot delete yourself
 * - Cannot delete the last admin
 *
 * @param {number} adminId - Admin user ID to delete
 * @returns {Promise<Object>} Deletion confirmation
 * @returns {boolean} response.success - Always true
 * @returns {string} response.message - Confirmation message
 * @throws {APIError} 400 if trying to delete yourself or last admin
 * @throws {APIError} 404 if admin not found
 * @throws {APIError} 403 if not system_admin
 *
 * @example
 * await deleteAdminUser(5);
 *
 * @since 2026-03-18
 */
export const deleteAdminUser = (adminId) => {
  logger.warn('admin_delete_user', { adminId, module: 'admin' });
  return request('DELETE', `/admin/admin-users/${adminId}`);
};

// ============================================================================
// ADMIN AUDIT LOGS
// ============================================================================

/**
 * Get admin audit logs with optional filters
 *
 * ANY ADMIN
 *
 * Returns paginated audit logs from admin.db with optional filtering.
 * All admin roles can view audit logs for transparency.
 *
 * @param {Object} [filters] - Optional filters
 * @param {number} [filters.admin_id] - Filter by specific admin ID
 * @param {number} [filters.event_year] - Filter by event year (e.g., 2025)
 * @param {string} [filters.action] - Filter by action type
 * @param {number} [filters.limit=100] - Max results (1-500, default 100)
 * @param {number} [filters.offset=0] - Pagination offset (default 0)
 * @returns {Promise<Object>} Audit logs with pagination info
 * @returns {Array<Object>} response.logs - Array of audit log entries
 * @returns {number} response.logs[].id - Log entry ID
 * @returns {number} response.logs[].admin_id - Admin user ID
 * @returns {string} response.logs[].admin_username - Admin username
 * @returns {string} response.logs[].action - Action type (created_admin_user, etc.)
 * @returns {number} response.logs[].event_year - Event year (nullable)
 * @returns {Object} response.logs[].details - Action details (JSON)
 * @returns {string} response.logs[].ip_address - IP address (nullable)
 * @returns {string} response.logs[].user_agent - User agent (nullable)
 * @returns {string} response.logs[].timestamp - Action timestamp
 * @returns {Object} response.pagination - Pagination metadata
 * @returns {number} response.pagination.limit - Requested limit
 * @returns {number} response.pagination.offset - Current offset
 * @returns {number} response.pagination.total_count - Total matching logs
 * @returns {number} response.pagination.returned_count - Logs in this response
 * @throws {APIError} 403 if not admin
 *
 * @example
 * const logs = await getAuditLogs({ event_year: 2025, limit: 50 });
 * console.log(`${logs.pagination.total_count} total logs`);
 *
 * @since 2026-03-18
 */
export const getAuditLogs = (filters = {}) => {
  logger.debug('admin_fetch_audit_logs', { filters, module: 'admin' });
  // Convert filters to query parameters
  const params = new URLSearchParams();
  if (filters.admin_id !== undefined) params.append('admin_id', filters.admin_id);
  if (filters.event_year !== undefined) params.append('event_year', filters.event_year);
  if (filters.action !== undefined) params.append('action', filters.action);
  if (filters.limit !== undefined) params.append('limit', filters.limit);
  if (filters.offset !== undefined) params.append('offset', filters.offset);

  const queryString = params.toString();
  const endpoint = `/admin/admin-audit-log${queryString ? `?${queryString}` : ''}`;
  return request('GET', endpoint);
};

/**
 * Get audit log statistics
 *
 * ANY ADMIN
 *
 * Returns aggregate statistics about audit logs including:
 * - Total log count
 * - Recent 24h activity count
 * - Breakdown by action type
 * - Breakdown by admin user
 *
 * @returns {Promise<Object>} Audit log statistics
 * @returns {number} response.total_count - Total audit log entries
 * @returns {number} response.recent_24h_count - Logs in last 24 hours
 * @returns {Array<Object>} response.by_action - Counts by action type
 * @returns {string} response.by_action[].action - Action type
 * @returns {number} response.by_action[].count - Count for this action
 * @returns {Array<Object>} response.by_admin - Counts by admin user
 * @returns {string} response.by_admin[].admin_username - Admin username
 * @returns {number} response.by_admin[].count - Count for this admin
 * @throws {APIError} 403 if not admin
 *
 * @example
 * const stats = await getAuditStats();
 * console.log(`${stats.recent_24h_count} actions in last 24h`);
 *
 * @since 2026-03-18
 */
export const getAuditStats = () => {
  logger.debug('admin_fetch_audit_stats', { module: 'admin' });
  return request('GET', '/admin/admin-audit-log/stats');
};
