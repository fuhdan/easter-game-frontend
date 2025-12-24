/**
 * Module: services/teams.js
 * Purpose: Team management API endpoints
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides team management functionality:
 * - Get all teams
 * - Create teams using balancing algorithm
 * - Update/delete teams
 * - Team member management
 * - Team name updates (team leaders)
 *
 * @since 2025-11-20
 */

import { request } from './api';
import { logger } from '../utils/logger';

/**
 * Get all teams
 *
 * @returns {Promise<Array>} Array of team objects
 * @throws {APIError} 401 if not authenticated
 */
export const getAllTeams = () => request('GET', '/teams');

/**
 * Get team by ID
 *
 * @param {number} id - Team ID
 * @returns {Promise<Object>} Team object
 * @throws {APIError} 404 if team not found
 */
export const getById = (id) => request('GET', `/teams/${id}`);

/**
 * Get current user's team members
 *
 * @returns {Promise<Object>} Team object with members
 * @throws {APIError} 401 if not authenticated, 404 if no team
 */
export const getMyTeamPlayers = () => request('GET', '/teams/my');

/**
 * Create teams using backend algorithm
 *
 * ADMIN ONLY
 *
 * Uses backend team balancing algorithm to distribute players fairly
 *
 * @param {Array<Object>} players - Array of player objects
 * @param {string} players[].name - Player name
 * @param {number} players[].skill_level - Skill level (1-5)
 * @param {string} players[].role - Role preference
 * @param {Object} config - Team creation configuration
 * @param {number} config.num_teams - Number of teams to create
 * @param {string} config.balancing_strategy - Balancing strategy (skill/random/manual)
 * @returns {Promise<Object>} Created teams with assignments
 * @throws {APIError} 400 if validation fails, 403 if not admin
 */
export const create = (players, config) => {
  logger.info(`Creating teams for ${players.length} players`);
  return request('POST', '/teams/create', { players, config });
};

/**
 * Update team
 *
 * ADMIN ONLY
 *
 * @param {number} id - Team ID
 * @param {Object} teamData - Team data to update
 * @param {string} [teamData.name] - Team name
 * @param {number} [teamData.leader_id] - Team leader user ID
 * @returns {Promise<Object>} Updated team object
 * @throws {APIError} 400 if validation fails, 403 if not admin, 404 if not found
 */
export const update = (id, teamData) => request('PUT', `/teams/${id}`, teamData);

/**
 * Delete team
 *
 * ADMIN ONLY
 *
 * @param {number} id - Team ID
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {APIError} 403 if not admin, 404 if team not found
 */
export const deleteTeam = (id) => request('DELETE', `/teams/${id}`);

/**
 * Reset all teams
 *
 * ADMIN ONLY
 *
 * Deletes all teams and unassigns all players
 *
 * @returns {Promise<Object>} Reset confirmation
 * @throws {APIError} 403 if not admin
 */
export const reset = () => {
  logger.info('Resetting all teams');
  return request('DELETE', '/teams/reset');
};

/**
 * Export teams as CSV
 *
 * ADMIN ONLY
 *
 * @returns {Promise<string>} CSV data
 * @throws {APIError} 403 if not admin
 */
export const exportTeams = () => request('GET', '/teams/export', null, {
  headers: { 'Accept': 'text/csv' }
});

/**
 * Add member to team
 *
 * ADMIN ONLY
 *
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID to add
 * @returns {Promise<Object>} Updated team object
 * @throws {APIError} 400 if user already in team, 403 if not admin, 404 if not found
 */
export const addMember = (teamId, userId) => request('POST', `/teams/${teamId}/members`, { userId });

/**
 * Remove member from team
 *
 * ADMIN ONLY
 *
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID to remove
 * @returns {Promise<Object>} Updated team object
 * @throws {APIError} 403 if not admin, 404 if not found
 */
export const removeMember = (teamId, userId) => request('DELETE', `/teams/${teamId}/members/${userId}`);

/**
 * Set team captain
 *
 * ADMIN ONLY
 *
 * @param {number} teamId - Team ID
 * @param {number} userId - User ID to make captain
 * @returns {Promise<Object>} Updated team object
 * @throws {APIError} 400 if user not in team, 403 if not admin, 404 if not found
 */
export const setCaptain = (teamId, userId) => request('PUT', `/teams/${teamId}/captain`, { userId });

/**
 * Update team name
 *
 * TEAM LEADERS ONLY
 *
 * Team leaders can update their own team's name
 *
 * @param {string} name - New team name (3-50 chars)
 * @returns {Promise<Object>} Updated team object
 * @throws {APIError} 400 if validation fails, 403 if not team leader, 409 if name exists
 */
export const updateMyTeamName = (name) => {
  logger.info('Updating team name to:', name);
  return request('PUT', '/teams/my-team/name', { name });
};

/**
 * Get progress overview for current user's team
 *
 * Team-based gameplay:
 * - Returns aggregate team stats (not individual members)
 * - Shows completed games, total score, progress percentage
 * - Current user's active game highlighted in response
 *
 * @returns {Promise<Object>} Team progress data
 * @returns {Object} return.team - Team information
 * @returns {number} return.team.id - Team ID
 * @returns {string} return.team.name - Team name
 * @returns {number} return.team.member_count - Number of team members
 * @returns {Object} return.summary - Progress summary
 * @returns {number} return.summary.total_score - Team's total score
 * @returns {number} return.summary.completed_games - Games completed by team
 * @returns {number} return.summary.total_games - Total games in event
 * @returns {number} return.summary.progress_percentage - Completion % (0-100)
 * @returns {Array<Object>} return.games - Per-game progress data
 * @throws {APIError} 401 if not authenticated
 * @throws {APIError} 403 if user not assigned to a team
 * @throws {APIError} 404 if no active event found
 *
 * @example
 * const progress = await getMyTeamProgress();
 * console.log(`Team ${progress.team.name}: ${progress.summary.progress_percentage}% complete`);
 *
 * @since 2025-11-21
 */
export const getMyTeamProgress = () => {
  logger.info('Fetching team progress');
  return request('GET', '/teams/me/progress');
};
