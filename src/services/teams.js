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

import { request, log } from './api';

/**
 * Get all teams
 *
 * @returns {Promise<Array>} Array of team objects
 * @throws {APIError} 401 if not authenticated
 */
export const getAllTeams = () => request('GET', '/api/teams');

/**
 * Get team by ID
 *
 * @param {number} id - Team ID
 * @returns {Promise<Object>} Team object
 * @throws {APIError} 404 if team not found
 */
export const getById = (id) => request('GET', `/api/teams/${id}`);

/**
 * Get current user's team members
 *
 * @returns {Promise<Object>} Team object with members
 * @throws {APIError} 401 if not authenticated, 404 if no team
 */
export const getMyTeamPlayers = () => request('GET', '/api/teams/my');

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
  log.info(`Creating teams for ${players.length} players`);
  console.log('FRONTEND: Players being sent:', players.slice(0, 2));
  console.log('FRONTEND: Config being sent:', config);
  console.log('FRONTEND: Request payload:', JSON.stringify({ players, config }, null, 2));
  return request('POST', '/api/teams/create', { players, config });
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
export const update = (id, teamData) => request('PUT', `/api/teams/${id}`, teamData);

/**
 * Delete team
 *
 * ADMIN ONLY
 *
 * @param {number} id - Team ID
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {APIError} 403 if not admin, 404 if team not found
 */
export const deleteTeam = (id) => request('DELETE', `/api/teams/${id}`);

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
  log.info('Resetting all teams');
  return request('DELETE', '/api/teams/reset');
};

/**
 * Export teams as CSV
 *
 * ADMIN ONLY
 *
 * @returns {Promise<string>} CSV data
 * @throws {APIError} 403 if not admin
 */
export const exportTeams = () => request('GET', '/api/teams/export', null, {
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
export const addMember = (teamId, userId) => request('POST', `/api/teams/${teamId}/members`, { userId });

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
export const removeMember = (teamId, userId) => request('DELETE', `/api/teams/${teamId}/members/${userId}`);

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
export const setCaptain = (teamId, userId) => request('PUT', `/api/teams/${teamId}/captain`, { userId });

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
  log.info('Updating team name to:', name);
  return request('PUT', '/api/teams/my-team/name', { name });
};
