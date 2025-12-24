/**
 * Hook: useEventOperations
 * Purpose: Handle event CRUD operations for game package management
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - View event details with full data (story_html, image_data)
 * - Edit events (inline and modal)
 * - Delete events with confirmation
 * - Toggle event active status
 * - Close event details view
 *
 * @since 2025-11-20
 */

import { useState } from 'react';
import { getEvent, updateEvent, deleteEvent } from '../../../services';
import { logger } from '../../../utils/logger';

/**
 * Custom hook for event operations
 *
 * Provides all event-related CRUD operations with state management.
 * Handles viewing, editing, deleting, and toggling event status.
 *
 * @param {Function} loadAllData - Callback to reload all events data
 * @returns {Object} Event operation utilities
 *
 * @example
 * const {
 *   selectedEvent,
 *   viewMode,
 *   eventDetailTab,
 *   packageFormData,
 *   setPackageFormData,
 *   handleViewEvent,
 *   handleCloseEvent,
 *   handleUpdateEvent,
 *   // ... other handlers
 * } = useEventOperations(loadAllData);
 */
export function useEventOperations(loadAllData) {
  // State management
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState(null); // null, 'view', 'edit'
  const [eventDetailTab, setEventDetailTab] = useState('story');
  const [packageFormData, setPackageFormData] = useState({
    year: new Date().getFullYear(),
    title: '',
    story_html: '',
    description: '',
    author: '',
    is_active: true,
    show_points: true,
    show_dependencies: true,
    image_path: '',
    image_data: ''
  });
  const [deleteTarget, setDeleteTarget] = useState(null);

  /**
   * View event details
   * Fetches full event data including story_html and image_data
   *
   * @param {Object} event - Event object to view
   *
   * @example
   * handleViewEvent(eventItem);
   */
  const handleViewEvent = async (event) => {
    try {
      // Fetch full event details from the API (includes story_html and image_data)
      const fullEventData = await getEvent(event.id);
      logger.debug('event_full_data_loaded', { eventId: event.id, hasStoryHtml: !!fullEventData.story_html, module: 'useEventOperations' });

      setSelectedEvent(fullEventData);
      setViewMode('view');
      setEventDetailTab('story');

      // Populate form data for viewing/editing with full data
      setPackageFormData({
        year: fullEventData.year,
        title: fullEventData.title,
        story_html: fullEventData.story_html || '',
        description: fullEventData.description || '',
        author: fullEventData.author || '',
        is_active: fullEventData.is_active,
        show_points: fullEventData.show_points !== false,
        show_dependencies: fullEventData.show_dependencies !== false,
        image_path: fullEventData.image_path || '',
        image_data: fullEventData.image_data || ''
      });
    } catch (error) {
      logger.error('event_details_load_failed', { eventId: event.id, errorMessage: error.message, module: 'useEventOperations' }, error);
      alert('Failed to load event details. Please try again.');
    }
  };

  /**
   * Edit event inline (switch to edit mode)
   *
   * @param {Object} event - Event object to edit
   *
   * @example
   * handleEditEventInline(selectedEvent);
   */
  const handleEditEventInline = (event) => {
    setSelectedEvent(event);
    setViewMode('edit');
    setEventDetailTab('story');
    setPackageFormData({
      year: event.year,
      title: event.title,
      story_html: event.story_html,
      description: event.description || '',
      author: event.author || '',
      is_active: event.is_active,
      show_points: event.show_points !== false,
      show_dependencies: event.show_dependencies !== false,
      image_path: event.image_path || '',
      image_data: event.image_data || ''
    });
  };

  /**
   * Close event details view
   * Reloads data to get updated game counts
   *
   * @example
   * handleCloseEvent();
   */
  const handleCloseEvent = async () => {
    setSelectedEvent(null);
    setViewMode(null);
    setEventDetailTab('story');
    // Reload events to get updated game counts
    await loadAllData();
  };

  /**
   * Update event (from inline edit in Event Story tab)
   *
   * @example
   * handleUpdateEvent();
   */
  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    try {
      await updateEvent(selectedEvent.id, packageFormData);

      alert('✅ Event updated successfully!');
      await loadAllData();

      // Refresh the selected event data
      const fullEventData = await getEvent(selectedEvent.id);
      if (fullEventData) {
        setSelectedEvent(fullEventData);
        setPackageFormData({
          year: fullEventData.year,
          title: fullEventData.title,
          story_html: fullEventData.story_html,
          description: fullEventData.description || '',
          author: fullEventData.author || '',
          is_active: fullEventData.is_active,
          show_points: fullEventData.show_points !== false,
          show_dependencies: fullEventData.show_dependencies !== false,
          image_path: fullEventData.image_path || '',
          image_data: fullEventData.image_data || ''
        });
      }
    } catch (error) {
      logger.error('event_update_failed', { eventId: selectedEvent.data.id, errorMessage: error.message, module: 'useEventOperations' }, error);
      alert(`❌ Failed to update event: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Delete event (sets up delete confirmation)
   *
   * @param {Object} event - Event object to delete
   *
   * @example
   * handleDeleteEvent(eventItem);
   */
  const handleDeleteEvent = (event) => {
    setDeleteTarget({ type: 'event', data: event });
  };

  /**
   * Toggle event active status (archive/activate)
   *
   * @param {Object} event - Event object to toggle
   *
   * @example
   * handleToggleEventActive(eventItem);
   */
  const handleToggleEventActive = async (event) => {
    try {
      const newStatus = !event.is_active;
      await updateEvent(event.id, { is_active: newStatus });

      alert(`✅ Event ${newStatus ? 'activated' : 'archived'} successfully!`);
      await loadAllData();
    } catch (error) {
      logger.error('event_toggle_failed', { eventId: event.id, errorMessage: error.message, module: 'useEventOperations' }, error);
      alert(`❌ Failed to update event status`);
    }
  };

  /**
   * Confirm deletion (events only - prompts/categories handled by child components)
   *
   * @example
   * confirmDelete();
   */
  const confirmDelete = async () => {
    try {
      if (deleteTarget && deleteTarget.type === 'event') {
        await deleteEvent(deleteTarget.data.id);
        logger.info('event_deleted', { eventId: deleteTarget.data.id, eventTitle: deleteTarget.data.title, module: 'useEventOperations' });
      }

      setDeleteTarget(null);
      await loadAllData();
    } catch (error) {
      logger.error('event_delete_failed', { errorMessage: error.message, module: 'useEventOperations' }, error);
      alert(`❌ Failed to delete: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Reset delete target (cancel deletion)
   *
   * @example
   * resetDeleteTarget();
   */
  const resetDeleteTarget = () => {
    setDeleteTarget(null);
  };

  return {
    // State
    selectedEvent,
    viewMode,
    eventDetailTab,
    packageFormData,
    deleteTarget,

    // Setters
    setSelectedEvent,
    setViewMode,
    setEventDetailTab,
    setPackageFormData,

    // Operations
    handleViewEvent,
    handleEditEventInline,
    handleCloseEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    handleToggleEventActive,
    confirmDelete,
    resetDeleteTarget
  };
}
