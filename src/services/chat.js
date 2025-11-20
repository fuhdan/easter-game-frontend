/**
 * Module: services/chat.js
 * Purpose: Chat system API endpoints
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides chat functionality:
 * - Send messages to AI assistant
 * - Send messages to admin
 * - Get chat history
 * - Mark messages as read
 * - Admin chat operations
 *
 * @since 2025-11-20
 */

import { request, log } from './api';

/**
 * Send message to AI assistant
 *
 * @param {string} message - Message text
 * @param {Object} [context] - Additional context for AI
 * @returns {Promise<Object>} AI response
 * @returns {string} response.message - AI response message
 * @returns {string} response.message_id - Message ID
 * @throws {APIError} 400 if message invalid, 429 if rate limited
 */
export const sendToAI = (message, context) => {
  log.info('Sending message to AI assistant');
  return request('POST', '/api/chat/ai', { message, context });
};

/**
 * Send message to admin
 *
 * Escalates chat to human admin support
 *
 * @param {string} message - Message text
 * @returns {Promise<Object>} Response
 * @returns {string} response.message_id - Message ID
 * @throws {APIError} 400 if message invalid, 429 if rate limited
 */
export const sendToAdmin = (message) => {
  log.info('Sending message to admin');
  return request('POST', '/api/chat/admin', { message });
};

/**
 * Get chat history
 *
 * @returns {Promise<Array>} Array of message objects
 * @returns {string} message.id - Message ID
 * @returns {string} message.sender_type - Sender type (user/ai/admin)
 * @returns {string} message.content - Message content
 * @returns {string} message.timestamp - Timestamp
 * @throws {APIError} 401 if not authenticated
 */
export const getHistory = () => request('GET', '/api/chat/history');

/**
 * Mark messages as read
 *
 * @param {Array<string>} messageIds - Array of message IDs to mark as read
 * @returns {Promise<Object>} Success confirmation
 * @throws {APIError} 401 if not authenticated
 */
export const markAsRead = (messageIds) => request('PUT', '/api/chat/read', { messageIds });

/**
 * Get admin chat messages
 *
 * ADMIN ONLY
 *
 * @returns {Promise<Array>} Array of admin chat messages from all users
 * @throws {APIError} 403 if not admin
 */
export const getAdminMessages = () => request('GET', '/api/admin/chat/messages');

/**
 * Reply to user message
 *
 * ADMIN ONLY
 *
 * @param {number} userId - User ID to reply to
 * @param {string} message - Reply message
 * @returns {Promise<Object>} Response confirmation
 * @throws {APIError} 403 if not admin, 404 if user not found
 */
export const replyToUser = (userId, message) => request('POST', `/admin/chat/reply/${userId}`, { message });
