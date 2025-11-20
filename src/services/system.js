/**
 * Module: services/system.js
 * Purpose: System configuration and health check API endpoints
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides system functionality:
 * - Health checks
 * - Version info
 * - System configuration (super_admin)
 *
 * @since 2025-11-20
 */

import { request, log } from './api';

/**
 * Health check
 *
 * @returns {Promise<Object>} Health status
 * @returns {string} health.status - Status (ok/error)
 */
export const health = () => request('GET', '/api/health');

/**
 * Get system version
 *
 * @returns {Promise<Object>} Version information
 * @returns {string} version.version - Application version
 * @returns {string} version.build - Build number
 */
export const version = () => request('GET', '/api/version');

/**
 * Basic ping test
 *
 * @returns {Promise<Object>} Ping response
 * @returns {string} response.message - Pong message
 */
export const ping = () => request('GET', '/api/ping');

/**
 * Get system configuration
 *
 * SUPER_ADMIN ONLY
 *
 * @param {string|null} category - Optional category filter (ai/chat/game/system)
 * @returns {Promise<Array>} Array of configuration objects
 * @returns {string} config[].key - Configuration key
 * @returns {any} config[].value - Configuration value
 * @returns {string} config[].category - Category
 * @returns {string} config[].description - Description
 * @throws {APIError} 403 if not super_admin
 */
export const getConfig = (category = null) => {
  const url = category ? `/api/system/config?category=${category}` : '/api/system/config';
  log.info(`Fetching system configuration${category ? ` (category: ${category})` : ''}`);
  return request('GET', url);
};

/**
 * Update a configuration value
 *
 * SUPER_ADMIN ONLY
 *
 * @param {string} key - Configuration key
 * @param {any} value - New value
 * @returns {Promise<Object>} Updated configuration object
 * @throws {APIError} 400 if validation fails, 403 if not super_admin, 404 if key not found
 */
export const updateConfig = (key, value) => {
  log.info(`Updating configuration: ${key} = ${value}`);
  return request('PATCH', `/api/system/config/${key}`, { value });
};

/**
 * Reload configuration cache
 *
 * SUPER_ADMIN ONLY
 *
 * Forces reload of configuration from database into cache
 *
 * @returns {Promise<Object>} Reload confirmation
 * @throws {APIError} 403 if not super_admin
 */
export const reloadConfig = () => {
  log.info('Reloading configuration cache');
  return request('POST', '/api/system/config/reload');
};
