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
import './GamePackageManagement.css';
import api from '../../services/api';
import AITrainingManagement from '../AITrainingManagement/AITrainingManagement';
import { marked } from 'marked';

function GamePackageManagement() {
  // State management
  const [events, setEvents] = useState([]);
  const [systemPrompts, setSystemPrompts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState(null); // null, 'view', 'edit'
  const [eventDetailTab, setEventDetailTab] = useState('story'); // story, games, hints, categories, prompts
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages'); // packages, guide

  // Modal states
  const [showCreatePackageModal, setShowCreatePackageModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showEditGameModal, setShowEditGameModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAdminGuide, setShowAdminGuide] = useState(false);
  const [adminGuideContent, setAdminGuideContent] = useState('');

  // Form data
  const [packageFormData, setPackageFormData] = useState({
    year: new Date().getFullYear(),
    title: '',
    story_html: '',
    description: '',
    author: '',
    is_active: true,
    image_path: '',
    image_data: ''
  });

  const [selectedGame, setSelectedGame] = useState(null);
  const [gameFormData, setGameFormData] = useState({});

  const [promptFormData, setPromptFormData] = useState({
    category: 'core_rules',
    name: '',
    content: '',
    description: '',
    priority: 100
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    color: '#005da0',
    icon: '🎮',
    order_index: 0
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  /**
   * Load all data on component mount
   */
  useEffect(() => {
    loadAllData();
  }, []);

  /**
   * Load events and system prompts
   */
  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load events with all games
      const eventsResponse = await api.aiTraining.getEvents();
      setEvents(eventsResponse);

      // Load system prompts
      const promptsResponse = await api.aiTraining.getSystemPrompts();
      setSystemPrompts(promptsResponse.prompts);

      // Load game categories
      const categoriesResponse = await api.aiTraining.getCategories();
      setCategories(categoriesResponse.categories || []);

      console.log(`Loaded ${eventsResponse.length} events, ${promptsResponse.prompts.length} prompts, ${categoriesResponse.categories?.length || 0} categories`);
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load game packages. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Convert image file to base64 string
   */
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data:image/...;base64, prefix
      const base64String = reader.result.split(',')[1];
      setPackageFormData({
        ...packageFormData,
        image_path: file.name,
        image_data: base64String
      });
    };
    reader.readAsDataURL(file);
  };

  /**
   * Clear uploaded image
   */
  const handleClearImage = () => {
    setPackageFormData({
      ...packageFormData,
      image_path: '',
      image_data: ''
    });
  };

  /**
   * Open create package modal
   */
  const handleCreatePackage = () => {
    setPackageFormData({
      year: new Date().getFullYear(),
      title: '',
      story_html: '',
      description: '',
      author: '',
      is_active: true,
      image_path: '',
      image_data: ''
    });
    setShowCreatePackageModal(true);
  };

  /**
   * Create new game package
   */
  const submitCreatePackage = async () => {
    try {
      if (!packageFormData.year || !packageFormData.title || !packageFormData.story_html) {
        alert('Please fill in Year, Title, and Story HTML');
        return;
      }

      // Create event
      await api.aiTraining.createEvent(packageFormData);

      alert('✅ Game package created successfully! Now add games and training hints.');
      setShowCreatePackageModal(false);
      await loadAllData();
    } catch (error) {
      console.error('Failed to create package:', error);
      alert(`❌ Failed to create package: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * View event details
   */
  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setViewMode('view');
    setEventDetailTab('story'); // Changed from 'details' to 'story'
    // Populate form data for viewing/editing
    setPackageFormData({
      year: event.year,
      title: event.title,
      story_html: event.story_html,
      description: event.description || '',
      author: event.author || '',
      is_active: event.is_active,
      image_path: event.image_path || '',
      image_data: event.image_data || ''
    });
  };

  /**
   * Edit event inline
   */
  const handleEditEventInline = (event) => {
    setSelectedEvent(event);
    setViewMode('edit');
    setEventDetailTab('story'); // Changed from 'details' to 'story'
    setPackageFormData({
      year: event.year,
      title: event.title,
      story_html: event.story_html,
      description: event.description || '',
      author: event.author || '',
      is_active: event.is_active,
      image_path: event.image_path || '',
      image_data: event.image_data || ''
    });
  };

  /**
   * Close event details view
   */
  const handleCloseEvent = async () => {
    setSelectedEvent(null);
    setViewMode(null);
    setEventDetailTab('story');
    // Reload events to get updated game counts
    await loadAllData();
  };

  /**
   * Open edit event modal (legacy - keeping for header button)
   */
  const handleEditEvent = async (event) => {
    setSelectedEvent(event);
    setPackageFormData({
      year: event.year,
      title: event.title,
      story_html: event.story_html,
      description: event.description || '',
      author: event.author || '',
      is_active: event.is_active,
      image_path: event.image_path || '',
      image_data: event.image_data || ''
    });
    setShowEditEventModal(true);
  };

  /**
   * Update event (from modal)
   */
  const submitEditEvent = async () => {
    try {
      await api.aiTraining.updateEvent(selectedEvent.id, packageFormData);

      alert('✅ Event updated successfully!');
      setShowEditEventModal(false);
      await loadAllData();
    } catch (error) {
      console.error('Failed to update event:', error);
      alert(`❌ Failed to update event: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Update event (from inline edit in Event Story tab)
   */
  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    try {
      await api.aiTraining.updateEvent(selectedEvent.id, packageFormData);

      alert('✅ Event updated successfully!');
      await loadAllData();

      // Refresh the selected event data
      const updatedEvents = await api.aiTraining.getEvents();
      const updatedEvent = updatedEvents.find(e => e.id === selectedEvent.id);
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
        setPackageFormData({
          year: updatedEvent.year,
          title: updatedEvent.title,
          story_html: updatedEvent.story_html,
          description: updatedEvent.description || '',
          author: updatedEvent.author || '',
          is_active: updatedEvent.is_active,
          image_path: updatedEvent.image_path || '',
          image_data: updatedEvent.image_data || ''
        });
      }
    } catch (error) {
      console.error('Failed to update event:', error);
      alert(`❌ Failed to update event: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Delete event (and all games)
   */
  const handleDeleteEvent = (event) => {
    setDeleteTarget({ type: 'event', data: event });
    setShowDeleteConfirmModal(true);
  };

  /**
   * Archive/Activate event
   */
  const handleToggleEventActive = async (event) => {
    try {
      const newStatus = !event.is_active;
      await api.aiTraining.updateEvent(event.id, { is_active: newStatus });

      alert(`✅ Event ${newStatus ? 'activated' : 'archived'} successfully!`);
      await loadAllData();
    } catch (error) {
      console.error('Failed to toggle event status:', error);
      alert(`❌ Failed to update event status`);
    }
  };

  /**
   * Confirm deletion
   */
  const confirmDelete = async () => {
    try {
      if (deleteTarget.type === 'event') {
        await api.aiTraining.deleteEvent(deleteTarget.data.id);
        alert('✅ Event and all its games deleted successfully!');
      } else if (deleteTarget.type === 'prompt') {
        await api.aiTraining.deleteSystemPrompt(deleteTarget.data.id);
        alert('✅ System prompt deleted successfully!');
      }

      setShowDeleteConfirmModal(false);
      setDeleteTarget(null);
      await loadAllData();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert(`❌ Failed to delete: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * View event details (games, hints)
   */
  const handleViewEventDetails = (event) => {
    setSelectedEvent(event);
    // Navigate to detailed view or expand inline
    // For now, just show alert with game count
    alert(`Event: ${event.title}\nGames: ${event.game_count}\nYear: ${event.year}`);
  };

  /**
   * Create/Edit system prompt
   */
  const handlePromptModal = (prompt = null) => {
    if (prompt) {
      setPromptFormData({
        id: prompt.id,
        category: prompt.category,
        name: prompt.name,
        content: prompt.content,
        description: prompt.description || '',
        priority: prompt.priority
      });
    } else {
      setPromptFormData({
        category: 'core_rules',
        name: '',
        content: '',
        description: '',
        priority: 100
      });
    }
    setShowPromptModal(true);
  };

  /**
   * Submit system prompt
   */
  const submitSystemPrompt = async () => {
    try {
      if (!promptFormData.category || !promptFormData.name || !promptFormData.content) {
        alert('Please fill in Category, Name, and Content');
        return;
      }

      if (promptFormData.id) {
        // Update existing
        await api.aiTraining.updateSystemPrompt(promptFormData.id, {
          content: promptFormData.content,
          description: promptFormData.description,
          priority: promptFormData.priority
        });
        alert('✅ System prompt updated successfully!');
      } else {
        // Create new
        await api.aiTraining.createSystemPrompt(promptFormData);
        alert('✅ System prompt created successfully!');
      }

      setShowPromptModal(false);
      await loadAllData();
    } catch (error) {
      console.error('Failed to save system prompt:', error);
      alert(`❌ Failed to save system prompt: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Delete system prompt
   */
  const handleDeletePrompt = (prompt) => {
    setDeleteTarget({ type: 'prompt', data: prompt });
    setShowDeleteConfirmModal(true);
  };

  /**
   * Toggle system prompt active status
   */
  const handleTogglePromptActive = async (prompt) => {
    try {
      const newStatus = !prompt.is_active;
      await api.aiTraining.updateSystemPrompt(prompt.id, { is_active: newStatus });

      alert(`✅ System prompt ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      await loadAllData();
    } catch (error) {
      console.error('Failed to toggle prompt status:', error);
      alert(`❌ Failed to update prompt status`);
    }
  };

  /**
   * Show admin guide
   */
  const handleShowAdminGuide = async () => {
    try {
      const guide = await api.aiTraining.getAdminGuide();
      setAdminGuideContent(guide.guide);
      setShowAdminGuide(true);
    } catch (error) {
      console.error('Failed to load admin guide:', error);
      alert('❌ Failed to load admin guide');
    }
  };

  /**
   * Category Management Handlers
   */
  const handleCategoryModal = (category = null) => {
    if (category) {
      // Edit mode
      setEditingCategory(category);
      setCategoryFormData({
        name: category.name,
        description: category.description || '',
        color: category.color || '#005da0',
        icon: category.icon || '🎮',
        order_index: category.order_index || 0
      });
    } else {
      // Create mode
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        description: '',
        color: '#005da0',
        icon: '🎮',
        order_index: categories.length
      });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        // Update
        await api.aiTraining.updateCategory(editingCategory.id, categoryFormData);
        alert('✅ Category updated successfully');
      } else {
        // Create
        await api.aiTraining.createCategory(categoryFormData);
        alert('✅ Category created successfully');
      }
      setShowCategoryModal(false);
      loadAllData();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert(`❌ Failed to save category: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?\n\nThis will fail if any games use this category.`)) {
      return;
    }

    try {
      await api.aiTraining.deleteCategory(category.id);
      alert('✅ Category deleted successfully');
      loadAllData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert(`❌ Failed to delete category: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleToggleCategoryActive = async (category) => {
    try {
      await api.aiTraining.updateCategory(category.id, { is_active: !category.is_active });
      loadAllData();
    } catch (error) {
      console.error('Failed to toggle category:', error);
      alert('❌ Failed to update category');
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
          <div className="packages-section">
          <div className="packages-header">
            <button className="btn btn-success" onClick={handleCreatePackage}>
              ➕ Create New Game Event
            </button>
            <button className="btn btn-outline" onClick={loadAllData}>
              🔄 Reload
            </button>
          </div>

          <div className="packages-grid">
            {events.map(event => (
              <div
                key={event.id}
                className={`package-card ${!event.is_active ? 'archived' : ''} ${selectedEvent?.id === event.id && viewMode ? 'selected' : ''}`}
              >
                <div className="card-header">
                  <div className="card-title">
                    <span className="year-badge">{event.year}</span>
                    <h4>{event.title}</h4>
                  </div>
                  <div className="card-status">
                    {event.is_active ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-secondary">Archived</span>
                    )}
                  </div>
                </div>

                <div className="card-body">
                  {event.description && (
                    <p className="description">{event.description}</p>
                  )}
                  {event.author && (
                    <p className="author">Author: {event.author}</p>
                  )}
                  <div className="card-stats">
                    <span>🎯 {event.game_count} Games</span>
                    <span>📅 Created: {new Date(event.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => handleViewEvent(event)}
                  >
                    📋 Game Details
                  </button>
                </div>
              </div>
            ))}

            {events.length === 0 && (
              <div className="empty-state">
                <p>No game packages found. Create your first package to get started!</p>
              </div>
            )}
          </div>

          {/* Event Details Section - shown when View or Edit is clicked */}
          {selectedEvent && viewMode && (
            <div className="event-details-section">
              <div className="event-details-header">
                <h3>
                  📋 Game Details: {selectedEvent.title} ({selectedEvent.year})
                </h3>
                <button className="btn btn-outline btn-sm" onClick={handleCloseEvent}>
                  ✕ Close
                </button>
              </div>

              {/* Event Detail Tabs */}
              <div className="event-detail-tabs">
                <button
                  className={`event-tab-btn ${eventDetailTab === 'story' ? 'active' : ''}`}
                  onClick={() => setEventDetailTab('story')}
                >
                  📖 Event Story
                </button>
                <button
                  className={`event-tab-btn ${eventDetailTab === 'games' ? 'active' : ''}`}
                  onClick={() => setEventDetailTab('games')}
                >
                  🎮 Games
                </button>
                <button
                  className={`event-tab-btn ${eventDetailTab === 'hints' ? 'active' : ''}`}
                  onClick={() => setEventDetailTab('hints')}
                >
                  💡 Training Hints
                </button>
                <button
                  className={`event-tab-btn ${eventDetailTab === 'categories' ? 'active' : ''}`}
                  onClick={() => setEventDetailTab('categories')}
                >
                  🏷️ Categories
                </button>
                <button
                  className={`event-tab-btn ${eventDetailTab === 'prompts' ? 'active' : ''}`}
                  onClick={() => setEventDetailTab('prompts')}
                >
                  🤖 System Prompts
                </button>
              </div>

              {/* Event Detail Content */}
              <div className="event-detail-content">
                {/* Event Story Tab */}
                {eventDetailTab === 'story' && (
                  <div className="story-content">
                    <h3>Edit Event Story</h3>
                    <div className="form-group">
                      <label>Title *</label>
                      <input
                        type="text"
                        value={packageFormData.title}
                        onChange={(e) => setPackageFormData({...packageFormData, title: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>Year *</label>
                      <input
                        type="number"
                        value={packageFormData.year}
                        onChange={(e) => setPackageFormData({...packageFormData, year: parseInt(e.target.value) || new Date().getFullYear()})}
                        min="2020"
                        max="2099"
                      />
                      <small style={{ color: '#666', fontSize: '0.9em' }}>
                        The year this event is for (e.g., 2024, 2025)
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={packageFormData.description}
                        onChange={(e) => setPackageFormData({...packageFormData, description: e.target.value})}
                        rows="3"
                      />
                    </div>

                    <div className="form-group">
                      <label>Author</label>
                      <input
                        type="text"
                        value={packageFormData.author}
                        onChange={(e) => setPackageFormData({...packageFormData, author: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>Event Image (optional)</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ padding: '5px' }}
                        />
                        {packageFormData.image_data && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={`data:image/png;base64,${packageFormData.image_data}`}
                              alt="Preview"
                              style={{ maxWidth: '200px', maxHeight: '150px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={handleClearImage}
                            >
                              🗑️ Remove Image
                            </button>
                          </div>
                        )}
                        <small style={{ color: '#666' }}>
                          Max size: 2MB. Stored in database with event.
                        </small>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Story HTML *</label>
                      <textarea
                        value={packageFormData.story_html}
                        onChange={(e) => setPackageFormData({...packageFormData, story_html: e.target.value})}
                        rows="15"
                        placeholder="Full HTML story text displayed on main game screen"
                      />
                      <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>
                        💡 <strong>Tip:</strong> Use{' '}
                        <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
                          {'<img src="{{EVENT_IMAGE}}" alt="Event Image" />'}
                        </code>
                        {' '}to insert the uploaded image anywhere in your story.
                      </small>
                    </div>

                    <div className="form-group checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={packageFormData.is_active}
                          onChange={(e) => setPackageFormData({...packageFormData, is_active: e.target.checked})}
                        />
                        Active (visible to users)
                      </label>
                    </div>

                    <div className="form-actions">
                      <button className="btn btn-success" onClick={handleUpdateEvent}>
                        ✓ Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Games Tab */}
                {eventDetailTab === 'games' && (
                  <div className="games-content">
                    <AITrainingManagement initialTab="games" showTabs={false} />
                  </div>
                )}

                {/* Training Hints Tab */}
                {eventDetailTab === 'hints' && (
                  <div className="hints-content">
                    <AITrainingManagement initialTab="hints" showTabs={false} />
                  </div>
                )}

                {/* Categories Tab */}
                {eventDetailTab === 'categories' && (
                  <div className="categories-content">
                    <div className="categories-header">
                      <button className="btn btn-success" onClick={() => handleCategoryModal()}>
                        ➕ Create New Category
                      </button>
                    </div>

                    <div className="categories-list">
                      {categories.map(category => (
                        <div key={category.id} className={`category-item ${!category.is_active ? 'inactive' : ''}`}>
                          <div className="category-badge" style={{ backgroundColor: category.color || '#005da0' }}>
                            {category.icon || '🎮'}
                          </div>
                          <div className="category-info-section">
                            <div className="category-name">{category.name}</div>
                            {category.description && (
                              <div className="category-description">{category.description}</div>
                            )}
                            <div className="category-meta">
                              Order: {category.order_index} |
                              {category.is_active ? ' Active' : ' Inactive'}
                            </div>
                          </div>
                          <div className="category-actions">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleCategoryModal(category)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className={`btn btn-sm ${category.is_active ? 'btn-warning' : 'btn-success'}`}
                              onClick={() => handleToggleCategoryActive(category)}
                            >
                              {category.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {categories.length === 0 && (
                      <div className="empty-state">
                        No categories found. Click "Create New Category" to add one.
                      </div>
                    )}
                  </div>
                )}

                {/* System Prompts Tab */}
                {eventDetailTab === 'prompts' && (
          <div className="prompts-section">
          <div className="prompts-header">
            <button className="btn btn-success" onClick={() => handlePromptModal()}>
              ➕ Create New System Prompt
            </button>
          </div>

          <div className="prompts-list">
            {/* Group by category - ordered */}
            {(() => {
              // Define the desired order
              const categoryOrder = ['core_rules', 'hint_strategy', 'game_story', 'company_context', 'response_templates'];

              // Group prompts by category
              const grouped = systemPrompts.reduce((acc, prompt) => {
                if (!acc[prompt.category]) acc[prompt.category] = [];
                acc[prompt.category].push(prompt);
                return acc;
              }, {});

              // Sort categories according to the defined order
              const sortedCategories = categoryOrder
                .filter(cat => grouped[cat]) // Only include categories that exist
                .map(cat => [cat, grouped[cat]]);

              return sortedCategories;
            })().map(([category, prompts]) => (
              <div key={category} className="prompt-category-group">
                <h4 className="category-header">{category}</h4>
                {prompts.map(prompt => (
                  <div key={prompt.id} className={`prompt-card ${!prompt.is_active ? 'inactive' : ''}`}>
                    <div className="prompt-header">
                      <div className="prompt-title">
                        <strong>{prompt.name}</strong>
                        <span className="priority-badge">Priority: {prompt.priority}</span>
                      </div>
                      <div className="prompt-status">
                        {prompt.is_active ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-secondary">Inactive</span>
                        )}
                      </div>
                    </div>

                    {prompt.description && (
                      <p className="prompt-description">{prompt.description}</p>
                    )}

                    <div className="prompt-content">
                      {prompt.content.substring(0, 200)}
                      {prompt.content.length > 200 && '...'}
                    </div>

                    <div className="prompt-meta">
                      <span>Version: {prompt.version}</span>
                      {prompt.times_used > 0 && (
                        <span>Used: {prompt.times_used} times</span>
                      )}
                    </div>

                    <div className="prompt-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePromptModal(prompt)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className={`btn btn-sm ${prompt.is_active ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleTogglePromptActive(prompt)}
                      >
                        {prompt.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeletePrompt(prompt)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {systemPrompts.length === 0 && (
              <div className="empty-state">
                <p>No system prompts found. Create prompts to control AI behavior!</p>
              </div>
            )}
          </div>
          </div>
                )}
              </div>
            </div>
          )}
          </div>
        )}

        {/* Admin Guide Tab */}
        {activeTab === 'guide' && (
          <div className="guide-section">
            <div className="guide-content">
              <h2>📖 Game Package Management - Admin Guide</h2>

              <section className="guide-section-item">
                <h3>📦 Game Event Packages</h3>
                <p>Game Event Packages are the central story containers for your Easter Quest. Each package represents a themed event (e.g., "Faust - The Quest for Knowledge 2024").</p>

                <h4>Creating a Game Event Package:</h4>
                <ol>
                  <li>Click <strong>"➕ Create New Package"</strong> in the Packages tab</li>
                  <li>Fill in the package details:
                    <ul>
                      <li><strong>Year:</strong> The year this event runs (e.g., 2024, 2025)</li>
                      <li><strong>Title:</strong> The event name shown to players</li>
                      <li><strong>Story HTML:</strong> The narrative introduction (supports HTML formatting)</li>
                      <li><strong>Description:</strong> Short summary for admin reference</li>
                      <li><strong>Author:</strong> Who created this event story</li>
                      <li><strong>Active Status:</strong> Toggle to activate/deactivate the event</li>
                    </ul>
                  </li>
                  <li>Click <strong>"✓ Save"</strong> to create the package</li>
                </ol>

                <h4>Adding an Event Image:</h4>
                <ol>
                  <li>View or edit a Game Event Package</li>
                  <li>Go to the <strong>📖 Event Story</strong> tab</li>
                  <li>Click <strong>"Choose File"</strong> under "Event Image"</li>
                  <li>Select an image (max 2MB, PNG/JPEG/GIF)</li>
                  <li>Preview the image before saving</li>
                  <li>In the Story HTML, use <code>{'<img src="{{EVENT_IMAGE}}" alt="Event Image" />'}</code> to place the image</li>
                  <li>Click <strong>"✓ Save Changes"</strong></li>
                </ol>

                <p><strong>💡 Tip:</strong> The <code>{'{{EVENT_IMAGE}}'}</code> placeholder allows you to position the image anywhere in your story HTML. You can add custom CSS classes for styling!</p>
              </section>

              <section className="guide-section-item">
                <h3>🎮 Games</h3>
                <p>Games are the individual challenges within a Game Event Package. Each game belongs to a category (Puzzle, Riddle, Network, Server, Python, SQL).</p>

                <h4>Adding Games to a Package:</h4>
                <ol>
                  <li>View a Game Event Package</li>
                  <li>Go to the <strong>🎮 Games</strong> tab</li>
                  <li>Click <strong>"➕ Add Game to Package"</strong></li>
                  <li>Fill in the game details:
                    <ul>
                      <li><strong>Game Type:</strong> Select from database categories</li>
                      <li><strong>Title:</strong> Shown to players after solving</li>
                      <li><strong>Description:</strong> Full details shown after solving</li>
                      <li><strong>Challenge Text:</strong> The riddle/question shown before solving (no spoilers!)</li>
                      <li><strong>Difficulty:</strong> Easy, Medium, Hard, Expert</li>
                      <li><strong>Points:</strong> Score value (10-100)</li>
                      <li><strong>Order Index:</strong> Display order (1, 2, 3...)</li>
                      <li><strong>Solution:</strong> Correct answer (case-insensitive)</li>
                    </ul>
                  </li>
                  <li>Click <strong>"✓ Save"</strong></li>
                </ol>

                <h4>Game Card Display Logic:</h4>
                <ul>
                  <li><strong>Before Solving:</strong> Shows category icon, challenge text, difficulty, and points</li>
                  <li><strong>After Solving:</strong> Reveals title, full description, and completion status</li>
                </ul>
              </section>

              <section className="guide-section-item">
                <h3>💡 Training Hints</h3>
                <p>Training Hints provide AI assistant guidance for specific games. These hints are used by the AI to help players without giving away solutions.</p>

                <h4>Adding Training Hints:</h4>
                <ol>
                  <li>View a Game Event Package</li>
                  <li>Go to the <strong>💡 Training Hints</strong> tab</li>
                  <li>Select a game from the dropdown</li>
                  <li>Enter progressive hints (start vague, get more specific)</li>
                  <li>Click <strong>"➕ Add Hint"</strong> for each hint level</li>
                </ol>

                <p><strong>Best Practices:</strong></p>
                <ul>
                  <li>First hint: General direction or concept</li>
                  <li>Second hint: Narrow down the approach</li>
                  <li>Third hint: Point to specific technique (but not the answer!)</li>
                </ul>
              </section>

              <section className="guide-section-item">
                <h3>🏷️ Categories</h3>
                <p>Categories organize games by type. Each category has a color and emoji icon for visual identification.</p>

                <h4>Default Categories:</h4>
                <ul>
                  <li>🧩 <strong>Puzzle:</strong> Logic puzzles and brain teasers</li>
                  <li>❓ <strong>Riddle:</strong> Word riddles and lateral thinking</li>
                  <li>🌐 <strong>Network:</strong> IT networking challenges</li>
                  <li>🖥️ <strong>Server:</strong> Server administration tasks</li>
                  <li>🐍 <strong>Python:</strong> Python programming challenges</li>
                  <li>🗄️ <strong>SQL:</strong> Database query challenges</li>
                </ul>

                <h4>Managing Categories:</h4>
                <ol>
                  <li>Go to the <strong>🏷️ Categories</strong> tab</li>
                  <li>Click <strong>"➕ Create New Category"</strong> to add custom categories</li>
                  <li>Edit or delete existing categories (cannot delete if games are using it)</li>
                </ol>
              </section>

              <section className="guide-section-item">
                <h3>🤖 System Prompts</h3>
                <p>System Prompts control the AI assistant's behavior, personality, and response style. Each event has its own set of prompts copied from default templates.</p>

                <h4>Prompt Categories (in order of priority):</h4>
                <ol>
                  <li><strong>core_rules:</strong> Fundamental AI behavior rules</li>
                  <li><strong>hint_strategy:</strong> How the AI should provide hints</li>
                  <li><strong>game_story:</strong> Story context and narrative tone</li>
                  <li><strong>company_context:</strong> Ypsomed-specific information</li>
                  <li><strong>response_templates:</strong> Example responses and formats</li>
                </ol>

                <h4>Creating/Editing Prompts:</h4>
                <ol>
                  <li>Open an event package</li>
                  <li>Go to the <strong>🤖 System Prompts</strong> tab</li>
                  <li>Click <strong>"➕ Create New System Prompt"</strong></li>
                  <li>Fill in:
                    <ul>
                      <li><strong>Name:</strong> Short identifier</li>
                      <li><strong>Category:</strong> Select from dropdown</li>
                      <li><strong>Priority:</strong> Lower number = higher priority (1-100)</li>
                      <li><strong>Content:</strong> The actual prompt text</li>
                      <li><strong>Description:</strong> What this prompt does</li>
                    </ul>
                  </li>
                  <li>Activate/deactivate prompts to test different behaviors</li>
                </ol>

                <p><strong>⚠️ Important:</strong> Only active prompts are sent to the AI. Use priority to control which prompts take precedence when multiple prompts in the same category exist. Prompts are event-specific - each event can have customized AI behavior.</p>
              </section>

              <section className="guide-section-item">
                <h3>🔄 Workflow Example</h3>
                <ol>
                  <li><strong>Create Package:</strong> "Easter Quest 2025 - Mystery Theme"</li>
                  <li><strong>Upload Image:</strong> Add a themed header image</li>
                  <li><strong>Write Story:</strong> Create engaging narrative with <code>{'{{EVENT_IMAGE}}'}</code></li>
                  <li><strong>Add Games:</strong> Create 10-15 challenges across different categories</li>
                  <li><strong>Add Hints:</strong> Provide 2-3 progressive hints per game</li>
                  <li><strong>Configure AI:</strong> Set system prompts for the event theme</li>
                  <li><strong>Activate:</strong> Toggle "Active" status on the package</li>
                  <li><strong>Test:</strong> Log in as a player and test the flow</li>
                </ol>
              </section>

              <section className="guide-section-item">
                <h3>📊 Best Practices</h3>
                <ul>
                  <li><strong>Challenge Text:</strong> Keep it mysterious but fair - no red herrings</li>
                  <li><strong>Difficulty Balance:</strong> Mix easy, medium, and hard games</li>
                  <li><strong>Point Values:</strong> Harder games should offer more points</li>
                  <li><strong>Hints:</strong> Never give away the solution directly</li>
                  <li><strong>Images:</strong> Keep under 2MB for fast loading</li>
                  <li><strong>Story HTML:</strong> Use semantic HTML for accessibility</li>
                  <li><strong>Active Status:</strong> Only one event should be active at a time</li>
                </ul>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* Create Package Modal */}
      {showCreatePackageModal && (
        <div className="modal-overlay" onClick={() => setShowCreatePackageModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h3>➕ Create New Game Package</h3>
            <div className="modal-body">
              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  value={packageFormData.year}
                  onChange={(e) => setPackageFormData({...packageFormData, year: parseInt(e.target.value)})}
                  placeholder="2025"
                />
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={packageFormData.title}
                  onChange={(e) => setPackageFormData({...packageFormData, title: e.target.value})}
                  placeholder="e.g., Faust - The Quest for Knowledge"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={packageFormData.description}
                  onChange={(e) => setPackageFormData({...packageFormData, description: e.target.value})}
                  placeholder="Short description for admin overview"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Author</label>
                <input
                  type="text"
                  value={packageFormData.author}
                  onChange={(e) => setPackageFormData({...packageFormData, author: e.target.value})}
                  placeholder="e.g., Goethe"
                />
              </div>

              <div className="form-group">
                <label>Event Image (optional)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ padding: '5px' }}
                  />
                  {packageFormData.image_data && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={`data:image/png;base64,${packageFormData.image_data}`}
                        alt="Preview"
                        style={{ maxWidth: '200px', maxHeight: '150px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={handleClearImage}
                      >
                        🗑️ Remove Image
                      </button>
                    </div>
                  )}
                  <small style={{ color: '#666' }}>
                    Max size: 2MB. Stored in database with event.
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label>Story HTML *</label>
                <textarea
                  value={packageFormData.story_html}
                  onChange={(e) => setPackageFormData({...packageFormData, story_html: e.target.value})}
                  placeholder="Full HTML story text displayed on main game screen"
                  rows="10"
                />
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={packageFormData.is_active}
                    onChange={(e) => setPackageFormData({...packageFormData, is_active: e.target.checked})}
                  />
                  Active (visible to users)
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={submitCreatePackage}>
                ✓ Create Package
              </button>
              <button className="btn btn-outline" onClick={() => setShowCreatePackageModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditEventModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEditEventModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h3>✏️ Edit Event: {selectedEvent.title}</h3>
            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={packageFormData.title}
                  onChange={(e) => setPackageFormData({...packageFormData, title: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={packageFormData.description}
                  onChange={(e) => setPackageFormData({...packageFormData, description: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Author</label>
                <input
                  type="text"
                  value={packageFormData.author}
                  onChange={(e) => setPackageFormData({...packageFormData, author: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Event Image (optional)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ padding: '5px' }}
                  />
                  {packageFormData.image_data && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={`data:image/png;base64,${packageFormData.image_data}`}
                        alt="Preview"
                        style={{ maxWidth: '200px', maxHeight: '150px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={handleClearImage}
                      >
                        🗑️ Remove Image
                      </button>
                    </div>
                  )}
                  <small style={{ color: '#666' }}>
                    Max size: 2MB. Stored in database with event.
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label>Story HTML *</label>
                <textarea
                  value={packageFormData.story_html}
                  onChange={(e) => setPackageFormData({...packageFormData, story_html: e.target.value})}
                  rows="10"
                />
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={packageFormData.is_active}
                    onChange={(e) => setPackageFormData({...packageFormData, is_active: e.target.checked})}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={submitEditEvent}>
                ✓ Save Changes
              </button>
              <button className="btn btn-outline" onClick={() => setShowEditEventModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Prompt Modal */}
      {showPromptModal && (
        <div className="modal-overlay" onClick={() => setShowPromptModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h3>{promptFormData.id ? '✏️ Edit' : '➕ Create'} System Prompt</h3>
            <div className="modal-body">
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={promptFormData.category}
                  onChange={(e) => setPromptFormData({...promptFormData, category: e.target.value})}
                  disabled={!!promptFormData.id}
                >
                  <option value="core_rules">Core Rules</option>
                  <option value="company_context">Company Context</option>
                  <option value="hint_strategy">Hint Strategy</option>
                  <option value="response_templates">Response Templates</option>
                  <option value="game_story">Game Story</option>
                </select>
              </div>

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={promptFormData.name}
                  onChange={(e) => setPromptFormData({...promptFormData, name: e.target.value})}
                  placeholder="e.g., progressive_hints"
                  disabled={!!promptFormData.id}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={promptFormData.description}
                  onChange={(e) => setPromptFormData({...promptFormData, description: e.target.value})}
                  placeholder="What does this prompt do?"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={promptFormData.content}
                  onChange={(e) => setPromptFormData({...promptFormData, content: e.target.value})}
                  placeholder="The actual prompt text for the AI..."
                  rows="8"
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <input
                  type="number"
                  value={promptFormData.priority}
                  onChange={(e) => setPromptFormData({...promptFormData, priority: parseInt(e.target.value)})}
                  placeholder="Lower = higher priority (default: 100)"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={submitSystemPrompt}>
                ✓ {promptFormData.id ? 'Save Changes' : 'Create Prompt'}
              </button>
              <button className="btn btn-outline" onClick={() => setShowPromptModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCategory ? '✏️ Edit' : '➕ Create'} Game Category</h3>
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                  placeholder="e.g., Puzzle, Network, SQL"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                  placeholder="Brief description of this category..."
                  rows="2"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Icon (Emoji)</label>
                  <input
                    type="text"
                    value={categoryFormData.icon}
                    onChange={(e) => setCategoryFormData({...categoryFormData, icon: e.target.value})}
                    placeholder="🎮"
                    maxLength="2"
                  />
                </div>

                <div className="form-group">
                  <label>Color (Hex)</label>
                  <input
                    type="color"
                    value={categoryFormData.color}
                    onChange={(e) => setCategoryFormData({...categoryFormData, color: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Order Index</label>
                  <input
                    type="number"
                    value={categoryFormData.order_index}
                    onChange={(e) => setCategoryFormData({...categoryFormData, order_index: parseInt(e.target.value)})}
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={handleSaveCategory}>
                ✓ {editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
              <button className="btn btn-outline" onClick={() => setShowCategoryModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && deleteTarget && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Confirm Deletion</h3>
            <div className="modal-body">
              {deleteTarget.type === 'event' && (
                <>
                  <p><strong>Event:</strong> {deleteTarget.data.title}</p>
                  <p><strong>Year:</strong> {deleteTarget.data.year}</p>
                  <p><strong>Games:</strong> {deleteTarget.data.game_count}</p>
                  <p className="warning-text">
                    ⚠️ This will permanently delete the event and ALL associated games, training hints, and progress records!
                  </p>
                </>
              )}
              {deleteTarget.type === 'prompt' && (
                <>
                  <p><strong>Prompt:</strong> {deleteTarget.data.name}</p>
                  <p><strong>Category:</strong> {deleteTarget.data.category}</p>
                  <p className="warning-text">
                    ⚠️ This will permanently delete the system prompt!
                  </p>
                </>
              )}
              <p className="warning-text">This action cannot be undone!</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={confirmDelete}>
                🗑️ Yes, Delete Permanently
              </button>
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirmModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Guide Modal */}
      {showAdminGuide && (
        <div className="modal-overlay" onClick={() => setShowAdminGuide(false)}>
          <div className="modal-content large guide-modal" onClick={(e) => e.stopPropagation()}>
            <h3>📖 Admin Guide - Game Management</h3>
            <div className="modal-body guide-content">
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: marked(adminGuideContent) }}
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
