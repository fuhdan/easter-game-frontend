/**
 * Hook: useImageUpload
 * Purpose: Handle image upload and validation for event packages
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - File size validation (max 2MB)
 * - File type validation (images only)
 * - Base64 conversion
 * - Image clearing functionality
 *
 * @since 2025-11-20
 */

import { useState } from 'react';

/**
 * Custom hook for handling image uploads
 *
 * Provides image upload functionality with validation and base64 conversion.
 * Enforces 2MB size limit and image-only file types.
 *
 * @returns {Object} Image upload utilities
 * @returns {Function} handleImageUpload - Handle file input change
 * @returns {Function} clearImage - Clear uploaded image
 * @returns {Object} imageData - Current image data { image_path, image_data }
 * @returns {Function} setImageData - Set image data directly
 *
 * @example
 * const { handleImageUpload, clearImage, imageData } = useImageUpload();
 *
 * <input
 *   type="file"
 *   accept="image/*"
 *   onChange={handleImageUpload}
 * />
 */
export function useImageUpload() {
  const [imageData, setImageData] = useState({
    image_path: '',
    image_data: ''
  });

  /**
   * Handle image file upload
   *
   * Validates file size and type, then converts to base64 string.
   * Shows alerts for validation errors.
   *
   * @param {Event} event - File input change event
   *
   * @example
   * <input type="file" onChange={handleImageUpload} />
   */
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // SECURITY: Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('❌ Image size must be less than 2MB');
      return;
    }

    // SECURITY: Check file type (images only)
    if (!file.type.startsWith('image/')) {
      alert('❌ Please select an image file');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data:image/...;base64, prefix
      const base64String = reader.result.split(',')[1];
      setImageData({
        image_path: file.name,
        image_data: base64String
      });
    };
    reader.onerror = () => {
      alert('❌ Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  /**
   * Clear uploaded image
   *
   * Resets image data to empty state.
   *
   * @example
   * <button onClick={clearImage}>Clear Image</button>
   */
  const clearImage = () => {
    setImageData({
      image_path: '',
      image_data: ''
    });
  };

  return {
    handleImageUpload,
    clearImage,
    imageData,
    setImageData
  };
}
