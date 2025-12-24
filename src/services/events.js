/**
 * Module: services/events.js
 * Purpose: Event management API endpoints
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides event functionality:
 * - Get all events
 * - Get active event with story
 * - Get event games
 *
 * @since 2025-11-20
 */

import { request } from './api';
import { logger } from '../utils/logger';

/**
 * Get all events
 *
 * @returns {Promise<Array>} Array of event objects
 * @throws {APIError} 401 if not authenticated
 */
export const getAll = () => {
  logger.info('Fetching all events');
  return request('GET', '/events');
};

/**
 * Get currently active event with full story
 *
 * Returns the event that is currently active (within start/end dates)
 * Includes full story HTML for display
 *
 * @returns {Promise<Object>} Active event object
 * @returns {number} event.id - Event ID
 * @returns {number} event.year - Event year
 * @returns {string} event.name - Event name
 * @returns {string} event.story_html - Story HTML content
 * @returns {Array<string>} event.image_urls - Array of image URLs
 * @throws {APIError} 404 if no active event
 */
export const getActive = () => {
  logger.info('Fetching active event with story');
  return request('GET', '/events/active');
};

/**
 * Get event by year
 *
 * @param {number} year - Event year (e.g., 2025)
 * @returns {Promise<Object>} Event object
 * @throws {APIError} 404 if event not found
 */
export const getByYear = (year) => {
  logger.info(`Fetching event for year ${year}`);
  return request('GET', `/events/${year}`);
};

/**
 * Get all games for an event
 *
 * @param {number} eventId - Event ID
 * @returns {Promise<Array>} Array of game objects for the event
 * @throws {APIError} 404 if event not found
 */
export const getGames = (eventId) => {
  logger.info(`Fetching games for event ${eventId}`);
  return request('GET', `/events/${eventId}/games`);
};
