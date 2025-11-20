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
import {
  getEvents, getEvent, createEvent, updateEvent, deleteEvent,
  getCategories, getSystemPrompts, getAdminGuide
} from '../../services';
import PackagesList from './PackagesList/PackagesList';
import EventDetailsPanel from './EventDetails/EventDetailsPanel';
import CreatePackageModal from './Modals/CreatePackageModal';
import EditEventModal from './Modals/EditEventModal';
import DeleteConfirmModal from './Modals/DeleteConfirmModal';
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
   * View event details
   * Fetches full event data including story_html and image_data
   */
  const handleViewEvent = async (event) => {
    try {
      // Fetch full event details from the API (includes story_html and image_data)
      const fullEventData = await getEvent(event.id);
      console.log('handleViewEvent - full event data:', fullEventData);

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
        image_path: fullEventData.image_path || '',
        image_data: fullEventData.image_data || ''
      });
    } catch (error) {
      console.error('Failed to load event details:', error);
      alert('Failed to load event details. Please try again.');
    }
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
      await updateEvent(selectedEvent.id, packageFormData);

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
      await updateEvent(selectedEvent.id, packageFormData);

      alert('✅ Event updated successfully!');
      await loadAllData();

      // Refresh the selected event data
      const updatedEvents = await getEvents();
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
      await updateEvent(event.id, { is_active: newStatus });

      alert(`✅ Event ${newStatus ? 'activated' : 'archived'} successfully!`);
      await loadAllData();
    } catch (error) {
      console.error('Failed to toggle event status:', error);
      alert(`❌ Failed to update event status`);
    }
  };

  /**
   * Confirm deletion (events only - prompts/categories handled by child components)
   */
  const confirmDelete = async () => {
    try {
      if (deleteTarget.type === 'event') {
        await deleteEvent(deleteTarget.data.id);
        console.log(`✅ Event deleted: ${deleteTarget.data.id}`);
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
              packageFormData={packageFormData}
              categories={categories}
              systemPrompts={systemPrompts}
              onTabChange={setEventDetailTab}
              onClose={handleCloseEvent}
              onFormChange={setPackageFormData}
              onImageUpload={handleImageUpload}
              onClearImage={handleClearImage}
              onSaveEvent={handleUpdateEvent}
              onCategoriesChanged={loadAllData}
              onPromptsChanged={loadAllData}
            />
          )}
          </>
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
        <CreatePackageModal
          formData={packageFormData}
          onFormChange={setPackageFormData}
          onImageUpload={handleImageUpload}
          onClearImage={handleClearImage}
          onSave={submitCreatePackage}
          onClose={() => setShowCreatePackageModal(false)}
        />
      )}

      {/* Edit Event Modal */}
      {showEditEventModal && selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          formData={packageFormData}
          onFormChange={setPackageFormData}
          onImageUpload={handleImageUpload}
          onClearImage={handleClearImage}
          onSave={submitEditEvent}
          onClose={() => setShowEditEventModal(false)}
        />
      )}


      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <DeleteConfirmModal
          deleteTarget={deleteTarget}
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteConfirmModal(false)}
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
