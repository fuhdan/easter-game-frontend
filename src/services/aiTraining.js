/**
 * Module: services/aiTraining.js
 * Purpose: AI training data management API endpoints
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides AI training management functionality:
 * - Training hints CRUD
 * - System prompts management
 * - Event management
 * - Game categories management
 * - Admin guide
 *
 * @since 2025-11-20
 */

import { request } from './api';
import { logger } from '../utils/logger';

/**
 * Get all training hints (with optional filters)
 *
 * SUPER_ADMIN ONLY
 *
 * @param {Object} filters - Filter options
 * @param {number} [filters.game_id] - Filter by game ID
 * @param {string} [filters.hint_type] - Filter by hint type
 * @param {number} [filters.hint_level] - Filter by hint level
 * @returns {Promise<Array>} Array of training hint objects
 * @throws {APIError} 403 if not super_admin
 */
export const getHints = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.game_id) params.append('game_id', filters.game_id);
  if (filters.hint_type) params.append('hint_type', filters.hint_type);
  if (filters.hint_level) params.append('hint_level', filters.hint_level);

  const url = `/admin/ai/training-hints${params.toString() ? '?' + params.toString() : ''}`;
  logger.info('Fetching AI training hints', filters);
  return request('GET', url);
};

/**
 * Get training hints organized by game
 *
 * SUPER_ADMIN ONLY
 *
 * @returns {Promise<Object>} Hints organized by game
 * @throws {APIError} 403 if not super_admin
 */
export const getHintsByGame = () => {
  logger.info('Fetching AI training hints by game');
  return request('GET', '/admin/ai/training-hints/by-game');
};

/**
 * Create new training hint
 *
 * SUPER_ADMIN ONLY
 *
 * @param {Object} hintData - Hint data
 * @param {number} hintData.game_id - Game ID
 * @param {string} hintData.hint_type - Hint type
 * @param {number} hintData.hint_level - Hint level (1-3)
 * @param {string} hintData.content - Hint content
 * @returns {Promise<Object>} Created hint object with ID
 * @throws {APIError} 400 if validation fails, 403 if not super_admin
 */
export const createHint = (hintData) => {
  logger.info('Creating AI training hint', hintData);
  return request('POST', '/admin/ai/training-hints', hintData);
};

/**
 * Update existing training hint
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} hintId - Hint ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated hint object
 * @throws {APIError} 400 if validation fails, 403 if not super_admin, 404 if not found
 */
export const updateHint = (hintId, updates) => {
  logger.info(`Updating AI training hint ${hintId}`, updates);
  return request('PUT', `/admin/ai/training-hints/${hintId}`, updates);
};

/**
 * Delete training hint
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} hintId - Hint ID
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {APIError} 403 if not super_admin, 404 if hint not found
 */
export const deleteHint = (hintId) => {
  logger.info(`Deleting AI training hint ${hintId}`);
  return request('DELETE', `/admin/ai/training-hints/${hintId}`);
};

/**
 * Bulk delete hints for a game (cleanup old year)
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} gameId - Game ID
 * @returns {Promise<Object>} Deletion confirmation with count
 * @throws {APIError} 403 if not super_admin
 */
export const bulkDeleteHints = (gameId) => {
  logger.info(`Bulk deleting AI training hints for game ${gameId}`);
  return request('POST', '/admin/ai/training-hints/bulk-delete', { game_id: gameId });
};

/**
 * Get system prompts
 *
 * SUPER_ADMIN ONLY
 *
 * @returns {Promise<Array>} Array of system prompt objects
 * @throws {APIError} 403 if not super_admin
 */
export const getSystemPrompts = () => {
  logger.info('Fetching AI system prompts');
  return request('GET', '/admin/ai/system-prompts');
};

/**
 * Create system prompt
 *
 * SUPER_ADMIN ONLY
 *
 * @param {Object} promptData - Prompt data
 * @param {string} promptData.name - Prompt name
 * @param {string} promptData.content - Prompt content
 * @param {number} promptData.priority - Priority (higher = used first)
 * @returns {Promise<Object>} Created prompt object with ID
 * @throws {APIError} 400 if validation fails, 403 if not super_admin
 */
export const createSystemPrompt = (promptData) => {
  logger.info('Creating AI system prompt', promptData);
  return request('POST', '/admin/ai/system-prompts', promptData);
};

/**
 * Update system prompt
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} promptId - Prompt ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated prompt object
 * @throws {APIError} 400 if validation fails, 403 if not super_admin, 404 if not found
 */
export const updateSystemPrompt = (promptId, updates) => {
  logger.info(`Updating AI system prompt ${promptId}`, updates);
  return request('PUT', `/admin/ai/system-prompts/${promptId}`, updates);
};

/**
 * Delete system prompt
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} promptId - Prompt ID
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {APIError} 403 if not super_admin, 404 if prompt not found
 */
export const deleteSystemPrompt = (promptId) => {
  logger.info(`Deleting AI system prompt ${promptId}`);
  return request('DELETE', `/admin/ai/system-prompts/${promptId}`);
};

/**
 * Get admin guide
 *
 * SUPER_ADMIN ONLY
 *
 * @returns {Promise<Object>} Admin guide content
 * @returns {string} guide.content - Markdown content
 * @throws {APIError} 403 if not super_admin
 */
export const getAdminGuide = () => {
  logger.info('Fetching AI training admin guide');
  return request('GET', '/admin/ai/admin-guide');
};

/**
 * Get all events
 *
 * SUPER_ADMIN ONLY
 *
 * @returns {Promise<Array>} Array of event objects
 * @throws {APIError} 403 if not super_admin
 */
export const getEvents = () => {
  logger.info('Fetching all events');
  return request('GET', '/admin/content/events');
};

/**
 * Get event by ID
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Event object
 * @throws {APIError} 403 if not super_admin, 404 if not found
 */
export const getEvent = (eventId) => {
  logger.info(`Fetching event ${eventId}`);
  return request('GET', `/admin/content/events/${eventId}`);
};

/**
 * Create new event
 *
 * SUPER_ADMIN ONLY
 *
 * @param {Object} eventData - Event data
 * @param {number} eventData.year - Event year
 * @param {string} eventData.name - Event name
 * @param {string} eventData.story_html - Story HTML content
 * @returns {Promise<Object>} Created event object with ID
 * @throws {APIError} 400 if validation fails, 403 if not super_admin
 */
export const createEvent = (eventData) => {
  logger.info('Creating new event', eventData);
  return request('POST', '/admin/content/events', eventData);
};

/**
 * Update event
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} eventId - Event ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated event object
 * @throws {APIError} 400 if validation fails, 403 if not super_admin, 404 if not found
 */
export const updateEvent = (eventId, updates) => {
  logger.info(`Updating event ${eventId}`, updates);
  return request('PUT', `/admin/content/events/${eventId}`, updates);
};

/**
 * Delete event
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {APIError} 403 if not super_admin, 404 if event not found
 */
export const deleteEvent = (eventId) => {
  logger.info(`Deleting event ${eventId}`);
  return request('DELETE', `/admin/content/events/${eventId}`);
};

/**
 * Get game categories
 *
 * SUPER_ADMIN ONLY
 *
 * @param {boolean} activeOnly - Filter to active categories only
 * @returns {Promise<Array>} Array of category objects
 * @throws {APIError} 403 if not super_admin
 */
export const getCategories = (activeOnly = false) => {
  const url = `/admin/content/categories${activeOnly ? '?active_only=true' : ''}`;
  logger.info('Fetching game categories');
  return request('GET', url);
};

/**
 * Create game category
 *
 * SUPER_ADMIN ONLY
 *
 * @param {Object} categoryData - Category data
 * @param {string} categoryData.name - Category name
 * @param {string} [categoryData.description] - Category description
 * @returns {Promise<Object>} Created category object with ID
 * @throws {APIError} 400 if validation fails, 403 if not super_admin
 */
export const createCategory = (categoryData) => {
  logger.info('Creating game category', categoryData);
  return request('POST', '/admin/content/categories', categoryData);
};

/**
 * Update game category
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} categoryId - Category ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated category object
 * @throws {APIError} 400 if validation fails, 403 if not super_admin, 404 if not found
 */
export const updateCategory = (categoryId, updates) => {
  logger.info(`Updating game category ${categoryId}`, updates);
  return request('PUT', `/admin/content/categories/${categoryId}`, updates);
};

/**
 * Delete game category
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} categoryId - Category ID
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {APIError} 403 if not super_admin, 404 if category not found
 */
export const deleteCategory = (categoryId) => {
  logger.info(`Deleting game category ${categoryId}`);
  return request('DELETE', `/admin/content/categories/${categoryId}`);
};

/**
 * Get all games with full content
 *
 * SUPER_ADMIN ONLY
 *
 * @param {boolean} includeInactive - Include inactive games
 * @returns {Promise<Array>} Array of game objects
 * @throws {APIError} 403 if not super_admin
 */
export const getAllGames = (includeInactive = false) => {
  const url = `/admin/content/games${includeInactive ? '?include_inactive=true' : ''}`;
  logger.info('Fetching all games with full content');
  return request('GET', url);
};

/**
 * Get single game with full content
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} gameId - Game ID
 * @returns {Promise<Object>} Game object with full content
 * @throws {APIError} 403 if not super_admin, 404 if not found
 */
export const getGame = (gameId) => {
  logger.info(`Fetching game ${gameId} with full content`);
  return request('GET', `/admin/content/games/${gameId}`);
};

/**
 * Create new game
 *
 * SUPER_ADMIN ONLY
 *
 * @param {Object} gameData - Game data
 * @returns {Promise<Object>} Created game object with ID
 * @throws {APIError} 400 if validation fails, 403 if not super_admin
 */
export const createGame = (gameData) => {
  logger.info('Creating new game', gameData);
  return request('POST', '/admin/content/games', gameData);
};

/**
 * Update game content
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} gameId - Game ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated game object
 * @throws {APIError} 400 if validation fails, 403 if not super_admin, 404 if not found
 */
export const updateGame = (gameId, updates) => {
  logger.info(`Updating game ${gameId}`, updates);
  return request('PUT', `/admin/content/games/${gameId}`, updates);
};

/**
 * Delete game (soft delete)
 *
 * SUPER_ADMIN ONLY
 *
 * @param {number} gameId - Game ID
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {APIError} 403 if not super_admin, 404 if game not found
 */
export const deleteGame = (gameId) => {
  logger.info(`Deleting game ${gameId}`);
  return request('DELETE', `/admin/content/games/${gameId}`);
};
