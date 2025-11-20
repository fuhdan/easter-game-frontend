/**
 * Module: services/games.js
 * Purpose: Game management API endpoints
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides game functionality:
 * - Get games
 * - Submit solutions
 * - Request hints
 * - Rate games
 *
 * @since 2025-11-20
 */

import { request } from './api';

/**
 * Get all games
 *
 * @returns {Promise<Array>} Array of game objects
 * @throws {APIError} 401 if not authenticated
 */
export const getAll = () => request('GET', '/api/games');

/**
 * Get game by ID
 *
 * @param {number} id - Game ID
 * @returns {Promise<Object>} Game object with full details
 * @throws {APIError} 404 if game not found
 */
export const getById = (id) => request('GET', `/api/games/${id}`);

/**
 * Create new game
 *
 * ADMIN ONLY
 *
 * @param {Object} gameData - Game data
 * @param {string} gameData.name - Game name
 * @param {string} gameData.description - Game description
 * @param {string} gameData.game_type - Game type (puzzle/riddle/physical/trivia)
 * @param {Object} gameData.solution_data - Solution data (structure depends on game_type)
 * @param {Object} [gameData.hint_data] - Hint data
 * @returns {Promise<Object>} Created game object with ID
 * @throws {APIError} 400 if validation fails, 403 if not admin
 */
export const create = (gameData) => request('POST', '/api/games', gameData);

/**
 * Update game
 *
 * ADMIN ONLY
 *
 * @param {number} id - Game ID
 * @param {Object} gameData - Game data to update
 * @returns {Promise<Object>} Updated game object
 * @throws {APIError} 400 if validation fails, 403 if not admin, 404 if not found
 */
export const update = (id, gameData) => request('PUT', `/api/games/${id}`, gameData);

/**
 * Delete game
 *
 * ADMIN ONLY
 *
 * @param {number} id - Game ID
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {APIError} 403 if not admin, 404 if game not found
 */
export const deleteGame = (id) => request('DELETE', `/api/games/${id}`);

/**
 * Get game progress for a team
 *
 * @param {number} gameId - Game ID
 * @param {number} teamId - Team ID
 * @returns {Promise<Object>} Game progress object
 * @returns {string} progress.status - Status (not_started/in_progress/completed/failed)
 * @returns {number} progress.time_spent - Time spent in seconds
 * @returns {number} progress.hints_used - Number of hints used
 * @returns {number} progress.score - Score achieved
 * @throws {APIError} 403 if not authorized, 404 if not found
 */
export const getProgress = (gameId, teamId) => request('GET', `/api/games/${gameId}/progress/${teamId}`);

/**
 * Submit solution for a game
 *
 * @param {number} gameId - Game ID
 * @param {Object} solution - Solution data (structure depends on game_type)
 * @returns {Promise<Object>} Submission result
 * @returns {boolean} result.correct - Whether solution is correct
 * @returns {number} result.score - Score achieved
 * @returns {string} [result.feedback] - Feedback message
 * @throws {APIError} 400 if invalid solution format, 403 if not authorized, 404 if not found
 */
export const submitSolution = (gameId, solution) => request('POST', `/api/games/${gameId}/submit`, { solution });

/**
 * Request a hint for a game
 *
 * Uses one hint from the team's hint allowance
 *
 * @param {number} gameId - Game ID
 * @returns {Promise<Object>} Hint object
 * @returns {string} hint.text - Hint text
 * @returns {number} hint.level - Hint level (1-3)
 * @returns {number} hint.hints_remaining - Hints remaining for this game
 * @throws {APIError} 403 if no hints remaining, 404 if game not found
 */
export const useHint = (gameId) => request('POST', `/api/games/${gameId}/hint`);

/**
 * Rate a game
 *
 * Players can rate games after completion
 *
 * @param {number} gameId - Game ID
 * @param {number} rating - Rating (1-5 stars)
 * @param {string} [comment] - Optional comment
 * @returns {Promise<Object>} Rating confirmation
 * @throws {APIError} 400 if invalid rating, 403 if not completed, 404 if not found
 */
export const rate = (gameId, rating, comment) => request('POST', `/api/games/${gameId}/rate`, { rating, comment });

/**
 * Get all ratings for a game
 *
 * ADMIN ONLY
 *
 * @param {number} gameId - Game ID
 * @returns {Promise<Array>} Array of rating objects
 * @throws {APIError} 403 if not admin, 404 if game not found
 */
export const getRatings = (gameId) => request('GET', `/api/games/${gameId}/ratings`);
