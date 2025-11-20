/**
 * Component: GamePackageManagement
 * Purpose: Complete game package management (Event + Games + Training Hints)
 * Part of: Easter Quest 2025 Frontend - System Administration
 *
 * Features:
 * - Create entire game packages (year-based events)
 * - Edit events, games, and training hints together
 * - Delete/Archive complete packages
 * - Manage system prompts
 * - Visual organization by year/event
 *
 * A "Game Package" includes:
 * - 1 Event (story/theme for the year)
 * - Multiple Games (individual puzzles)
 * - Training Hints (AI knowledge per game)
 * - System Prompts (global AI behavior)
 *
 * @module components/GamePackageManagement
 * @since 2025-11-17
 */

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import './GamePackageManagement.css';
import {
  getEvents, getCategories, getSystemPrompts, getAdminGuide
} from '../../services';
import { useImageUpload } from './hooks/useImageUpload';
import { useEventOperations } from './hooks/useEventOperations';
import { usePackageForm } from './hooks/usePackageForm';
import PackagesList from './PackagesList/PackagesList';
import EventDetailsPanel from './EventDetails/EventDetailsPanel';
import AdminGuideContent from './AdminGuideContent';
import CreatePackageModal from './Modals/CreatePackageModal';
import DeleteConfirmModal from './Modals/DeleteConfirmModal';
import { marked } from 'marked';

function GamePackageManagement() {
  // State management for data loading
  const [events, setEvents] = useState([]);
  const [systemPrompts, setSystemPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages'); // packages, guide

  // Modal states
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showAdminGuide, setShowAdminGuide] = useState(false);
  const [adminGuideContent, setAdminGuideContent] = useState('');

  /**
   * Load events and system prompts
   */
  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load events with all games
      const eventsResponse = await getEvents();
      setEvents(eventsResponse);

      // Load system prompts
      const promptsResponse = await getSystemPrompts();
      setSystemPrompts(promptsResponse.prompts);

      // Load game categories
      const categoriesResponse = await getCategories();
      setCategories(categoriesResponse.categories || []);

      console.log(`Loaded ${eventsResponse.length} events, ${promptsResponse.prompts.length} prompts, ${categoriesResponse.categories?.length || 0} categories`);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load game packages. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  // Custom hooks (must be called after loadAllData is defined)
  const { handleImageUpload, clearImage, imageData, setImageData } = useImageUpload();

  const {
    selectedEvent,
    viewMode,
    eventDetailTab,
    packageFormData: eventFormData,
    deleteTarget,
    setEventDetailTab,
    setPackageFormData: setEventFormData,
    handleViewEvent,
    handleEditEventInline,
    handleCloseEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    handleToggleEventActive,
    confirmDelete,
    resetDeleteTarget
  } = useEventOperations(loadAllData);

  const {
    showCreatePackageModal,
    packageFormData: createFormData,
    setPackageFormData: setCreateFormData,
    handleCreatePackage,
    submitCreatePackage,
    closeCreatePackageModal
  } = usePackageForm(loadAllData, imageData);

  /**
   * Load all data on component mount
   */
  useEffect(() => {
    loadAllData();
  }, []);

  /**
   * Sync image data from hook to create form data
   */
  useEffect(() => {
    setCreateFormData(prev => ({
      ...prev,
      image_path: imageData.image_path,
      image_data: imageData.image_data
    }));
  }, [imageData, setCreateFormData]);

  /**
   * Sync image data from hook to edit form data (eventFormData)
   * CRITICAL: Without this, uploaded images won't be sent to API when editing!
   */
  useEffect(() => {
    if (viewMode === 'view' || viewMode === 'edit') {
      setEventFormData(prev => ({
        ...prev,
        image_path: imageData.image_path,
        image_data: imageData.image_data
      }));
    }
  }, [imageData, viewMode, setEventFormData]);

  /**
   * Load existing image data when opening an event for viewing/editing
   */
  useEffect(() => {
    if (selectedEvent && (viewMode === 'view' || viewMode === 'edit')) {
      // If event has existing image, populate the imageData state
      if (selectedEvent.image_data) {
        setImageData({
          image_path: selectedEvent.image_path || '',
          image_data: selectedEvent.image_data
        });
      } else {
        // Clear image data if event has no image
        setImageData({
          image_path: '',
          image_data: ''
        });
      }
    }
  }, [selectedEvent, viewMode, setImageData]);

  /**
   * Wrapper for delete event that also shows confirmation modal
   */
  const handleDeleteEventWithModal = (event) => {
    handleDeleteEvent(event);
    setShowDeleteConfirmModal(true);
  };

  /**
   * Show admin guide
   */
  const handleShowAdminGuide = async () => {
    try {
      const guide = await getAdminGuide();
      setAdminGuideContent(guide.guide);
      setShowAdminGuide(true);
    } catch (error) {
      console.error('Failed to load admin guide:', error);
      alert('❌ Failed to load admin guide');
    }
  };


  // Loading state
  if (loading) {
    return <div className="loading">Loading game packages...</div>;
  }

  return (
    <div className="game-package-card">
      <div className="card-header">
        <div className="header-title">
          📦 Game Event
        </div>
        <div className="header-actions">
          <button
            className={`btn-header-action ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            📦 Packages
          </button>
          <button
            className={`btn-header-action ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            📖 Admin Guide
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Game Packages Tab */}
        {activeTab === 'packages' && (
          <>
          <PackagesList
            events={events}
            selectedEvent={selectedEvent}
            viewMode={viewMode}
            onCreatePackage={handleCreatePackage}
            onViewEvent={handleViewEvent}
            onReload={loadAllData}
          />

          {/* Event Details Section - shown when View or Edit is clicked */}
          {selectedEvent && viewMode && (
            <EventDetailsPanel
              selectedEvent={selectedEvent}
              eventDetailTab={eventDetailTab}
              packageFormData={eventFormData}
              categories={categories}
              systemPrompts={systemPrompts}
              onTabChange={setEventDetailTab}
              onClose={handleCloseEvent}
              onFormChange={setEventFormData}
              onImageUpload={handleImageUpload}
              onClearImage={clearImage}
              onSaveEvent={handleUpdateEvent}
              onCategoriesChanged={loadAllData}
              onPromptsChanged={loadAllData}
            />
          )}
          </>
        )}

        {/* Admin Guide Tab */}
        {activeTab === 'guide' && <AdminGuideContent />}
      </div>

      {/* Create Package Modal */}
      {showCreatePackageModal && (
        <CreatePackageModal
          formData={createFormData}
          onFormChange={setCreateFormData}
          onImageUpload={handleImageUpload}
          onClearImage={clearImage}
          onSave={submitCreatePackage}
          onClose={closeCreatePackageModal}
        />
      )}


      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && deleteTarget && (
        <DeleteConfirmModal
          deleteTarget={deleteTarget}
          onConfirm={async () => {
            await confirmDelete();
            setShowDeleteConfirmModal(false);
          }}
          onClose={() => {
            resetDeleteTarget();
            setShowDeleteConfirmModal(false);
          }}
        />
      )}

      {/* Admin Guide Modal */}
      {showAdminGuide && (
        <div className="modal-overlay" onClick={() => setShowAdminGuide(false)}>
          <div className="modal-content large guide-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📖 Admin Guide - Game Management</h3>
            <div className="modal-body guide-content">
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{
                  // SECURITY: Sanitize markdown-converted HTML to prevent XSS attacks
                  __html: DOMPurify.sanitize(marked(adminGuideContent), {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'img', 'div', 'span', 'a', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'],
                    ALLOWED_ATTR: ['class', 'src', 'alt', 'href', 'target', 'rel', 'id']
                  })
                }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowAdminGuide(false)}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GamePackageManagement;
