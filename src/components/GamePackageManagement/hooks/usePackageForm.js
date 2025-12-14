/**
 * Hook: usePackageForm
 * Purpose: Handle package creation form and modal state
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - Package creation modal state
 * - Package form initialization
 * - Package creation submission
 * - Form data management
 *
 * @since 2025-11-20
 */

import { useState } from 'react';
import { createEvent } from '../../../services';

/**
 * Custom hook for package creation form management
 *
 * Provides package creation modal state and form handling.
 * Manages form data initialization and submission to API.
 *
 * @param {Function} loadAllData - Callback to reload all events data
 * @param {Object} imageData - Current image data from useImageUpload hook
 * @returns {Object} Package form utilities
 *
 * @example
 * const {
 *   showCreatePackageModal,
 *   packageFormData,
 *   setPackageFormData,
 *   handleCreatePackage,
 *   submitCreatePackage,
 *   closeCreatePackageModal
 * } = usePackageForm(loadAllData, imageData);
 */
export function usePackageForm(loadAllData, imageData = {}) {
  const [showCreatePackageModal, setShowCreatePackageModal] = useState(false);
  const [packageFormData, setPackageFormData] = useState({
    year: new Date().getFullYear(),
    title: '',
    story_html: '',
    description: '',
    author: '',
    is_active: true,
    show_points: true,
    image_path: imageData.image_path || '',
    image_data: imageData.image_data || ''
  });

  /**
   * Open create package modal
   * Resets form data to default values
   *
   * @example
   * handleCreatePackage();
   */
  const handleCreatePackage = () => {
    setPackageFormData({
      year: new Date().getFullYear(),
      title: '',
      story_html: '',
      description: '',
      author: '',
      is_active: true,
      show_points: true,
      image_path: imageData.image_path || '',
      image_data: imageData.image_data || ''
    });
    setShowCreatePackageModal(true);
  };

  /**
   * Create new game package
   * Validates required fields and submits to API
   *
   * @example
   * submitCreatePackage();
   */
  const submitCreatePackage = async () => {
    try {
      if (!packageFormData.year || !packageFormData.title || !packageFormData.story_html) {
        alert('Please fill in Year, Title, and Story HTML');
        return;
      }

      // Create event
      await createEvent(packageFormData);

      alert('✅ Game package created successfully! Now add games and training hints.');
      setShowCreatePackageModal(false);
      await loadAllData();
    } catch (error) {
      console.error('Failed to create package:', error);
      alert(`❌ Failed to create package: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Close create package modal
   *
   * @example
   * closeCreatePackageModal();
   */
  const closeCreatePackageModal = () => {
    setShowCreatePackageModal(false);
  };

  return {
    // State
    showCreatePackageModal,
    packageFormData,

    // Setters
    setPackageFormData,

    // Operations
    handleCreatePackage,
    submitCreatePackage,
    closeCreatePackageModal
  };
}
