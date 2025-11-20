/**
 * Module: services/files.js
 * Purpose: File upload API endpoints
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides file upload functionality:
 * - CSV file uploads
 * - Image file uploads
 *
 * @since 2025-11-20
 */

import { request, buildHeaders } from './api';

/**
 * Upload CSV file
 *
 * ADMIN ONLY
 *
 * @param {File} file - CSV file to upload
 * @returns {Promise<Object>} Upload response
 * @returns {Array} response.data - Parsed CSV data
 * @throws {APIError} 400 if invalid CSV format, 403 if not admin
 */
export const uploadCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request('POST', '/api/files/csv', formData, {
    headers: buildHeaders(null) // No content-type for FormData
  });
};

/**
 * Upload image file
 *
 * ADMIN ONLY
 *
 * @param {File} file - Image file to upload (JPEG, PNG, GIF, WebP)
 * @returns {Promise<Object>} Upload response
 * @returns {string} response.url - Uploaded image URL
 * @returns {string} response.filename - Stored filename
 * @throws {APIError} 400 if invalid image format, 403 if not admin
 */
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return request('POST', '/api/files/image', formData, {
    headers: buildHeaders(null)
  });
};
