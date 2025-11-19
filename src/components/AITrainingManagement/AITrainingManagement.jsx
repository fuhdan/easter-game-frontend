/**
 * Component: AITrainingManagement
 * Purpose: Manage AI training content (hints and system prompts) for Easter Quest game
 * Part of: Easter Quest 2025 Frontend - System Administration
 *
 * Features:
 * - View all training hints organized by game
 * - Create, edit, delete training hints
 * - Manage hint levels (1-4: broad → almost direct)
 * - Bulk delete hints for old game years
 * - View embedded admin guide for creating new games
 * - Manage system prompts (core AI behavior rules)
 *
 * Security:
 * - Only accessible to super_admin role
 * - All changes confirmed via modal
 * - Validation on client and server
 *
 * @module components/AITrainingManagement
 * @since 2025-11-16
 */

import React, { useState, useEffect } from 'react';
import './AITrainingManagement.css';
import api from '../../services/api';

/**
 * Hint type display names
 */
const HINT_TYPES = {
  character_knowledge: 'Character Knowledge',
  url_pattern: 'URL Pattern',
  game_mechanics: 'Game Mechanics',
  technical_hint: 'Technical Hint',
  common_mistake: 'Common Mistake'
};

/**
 * Hint level descriptions
 */
const HINT_LEVELS = {
  1: 'Broad (Literary/Thematic)',
  2: 'Specific (Narrowing Search)',
  3: 'Very Specific (Almost There)',
  4: 'Almost Direct (Last Resort)'
};

function AITrainingManagement({ initialTab = 'events', showTabs = true }) {
  // State management
  const [activeTab, setActiveTab] = useState(initialTab); // 'events', 'games', 'hints'
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [hints, setHints] = useState([]);
  const [systemPrompts, setSystemPrompts] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [adminGuide, setAdminGuide] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editing state - Hints
  const [editingHint, setEditingHint] = useState(null);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [hintToDelete, setHintToDelete] = useState(null);
  const [gameToCleanup, setGameToCleanup] = useState(null);

  // Editing state - Games
  const [editingGame, setEditingGame] = useState(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showGameDeleteModal, setShowGameDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);

  // Editing state - Events
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Form state for creating/editing hints
  const [hintForm, setHintForm] = useState({
    game_id: '',
    hint_type: 'character_knowledge',
    hint_level: 1,
    hint_content: '',
    effectiveness_score: null
  });

  // Form state for creating/editing games
  const [gameForm, setGameForm] = useState({
    event_id: null,
    category_id: null,
    title: '',
    description: '',
    solution_password: '',
    story_text: '',
    challenge_text: '',
    educational_purpose: '',
    technical_skills: '',
    difficulty_level: 'medium',
    max_hints: 0,
    points_value: 100,
    order_index: 0
  });

  // Form state for editing events
  const [eventForm, setEventForm] = useState({
    title: '',
    story_html: '',
    description: '',
    author: ''
  });

  /**
   * Load all data on component mount
   */
  useEffect(() => {
    loadAllData();
  }, []);

  /**
   * Reload hints when selected game changes
   */
  useEffect(() => {
    if (activeTab === 'hints' && games.length > 0) {
      loadHints();
    }
  }, [selectedGame, activeTab]);

  /**
   * Fetch all data from backend
   */
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load games, events, categories, prompts, and hints in parallel
      const [gamesData, hintsData, eventsData, categoriesData, promptsData] = await Promise.all([
        api.games.getAll(false),
        api.aiTraining.getHintsByGame(),
        api.aiTraining.getEvents(),
        api.aiTraining.getCategories(),
        api.aiTraining.getSystemPrompts()
      ]);

      // Merge game data with hint counts
      const gamesWithHints = (gamesData.games || []).map(game => {
        const hintData = hintsData.games?.find(g => g.game_id === game.id);
        return {
          ...game,
          hints: hintData?.hints || []
        };
      });

      setGames(gamesWithHints);
      setEvents(eventsData || []);
      setCategories(categoriesData.categories || []);
      setSystemPrompts(promptsData.prompts || []);

      // Select first game by default
      if (gamesWithHints.length > 0) {
        setSelectedGame(gamesWithHints[0].id);
      }

      console.log(`Loaded ${gamesWithHints.length} games, ${eventsData?.length || 0} events, ${categoriesData.categories?.length || 0} categories`);
    } catch (error) {
      console.error('Failed to load AI training data:', error);
      setError('Failed to load AI training data. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load hints for selected game
   */
  const loadHints = () => {
    const game = games.find(g => g.id === selectedGame);
    if (game) {
      setHints(game.hints || []);
    } else {
      setHints([]);
    }
  };

  /**
   * Load system prompts
   */
  const loadSystemPrompts = async () => {
    try {
      const data = await api.aiTraining.getSystemPrompts();
      setSystemPrompts(data.prompts || []);
    } catch (error) {
      console.error('Failed to load system prompts:', error);
      setError('Failed to load system prompts.');
    }
  };

  /**
   * Load admin guide
   */
  const loadAdminGuide = async () => {
    try {
      const data = await api.aiTraining.getAdminGuide();
      setAdminGuide(data.guide || '');
    } catch (error) {
      console.error('Failed to load admin guide:', error);
      setError('Failed to load admin guide.');
    }
  };

  /**
   * Load events
   */
  const loadEvents = async () => {
    try {
      const data = await api.aiTraining.getEvents();
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to load events:', error);
      setError('Failed to load events.');
    }
  };

  /**
   * Load categories
   */
  const loadCategories = async () => {
    try {
      const data = await api.aiTraining.getCategories();
      setCategories(data.categories || []);
      console.log(`Loaded ${data.categories?.length || 0} categories`);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError('Failed to load categories.');
    }
  };

  /**
   * Handle tab change
   */
  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'prompts') {
      await loadSystemPrompts();
    } else if (tab === 'events') {
      await Promise.all([loadEvents(), loadCategories()]);
    } else if (tab === 'games') {
      await Promise.all([loadEvents(), loadCategories()]);
    } else if (tab === 'guide') {
      await loadAdminGuide();
    }
  };

  /**
   * Open create hint modal
   */
  const handleCreateHint = () => {
    setEditingHint(null);
    setHintForm({
      game_id: selectedGame || '',
      hint_type: 'character_knowledge',
      hint_level: 1,
      hint_content: '',
      effectiveness_score: null
    });
    setShowHintModal(true);
  };

  /**
   * Open edit hint modal
   */
  const handleEditHint = (hint) => {
    setEditingHint(hint);
    setHintForm({
      game_id: hint.game_id,
      hint_type: hint.hint_type,
      hint_level: hint.hint_level,
      hint_content: hint.hint_content,
      effectiveness_score: hint.effectiveness_score
    });
    setShowHintModal(true);
  };

  /**
   * Save hint (create or update)
   */
  const handleSaveHint = async () => {
    try {
      if (editingHint) {
        // Update existing hint
        await api.aiTraining.updateHint(editingHint.id, {
          hint_content: hintForm.hint_content,
          hint_type: hintForm.hint_type,
          hint_level: parseInt(hintForm.hint_level),
          effectiveness_score: hintForm.effectiveness_score ? parseInt(hintForm.effectiveness_score) : null
        });
        console.log(`✅ Training hint updated: ${editingHint.id}`);
      } else {
        // Create new hint
        await api.aiTraining.createHint({
          game_id: parseInt(hintForm.game_id),
          hint_type: hintForm.hint_type,
          hint_level: parseInt(hintForm.hint_level),
          hint_content: hintForm.hint_content,
          effectiveness_score: hintForm.effectiveness_score ? parseInt(hintForm.effectiveness_score) : null
        });
        console.log(`✅ Training hint created`);
      }

      // Reload data
      await loadAllData();
      setShowHintModal(false);
      setEditingHint(null);
    } catch (error) {
      console.error('Failed to save hint:', error);
      alert(`❌ Failed to save hint: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Open delete confirmation modal
   */
  const handleDeleteHint = (hint) => {
    setHintToDelete(hint);
    setShowDeleteModal(true);
  };

  /**
   * Confirm delete hint
   */
  const confirmDeleteHint = async () => {
    try {
      await api.aiTraining.deleteHint(hintToDelete.id);
      console.log(`✅ Training hint deleted: ${hintToDelete.id}`);

      // Reload data
      await loadAllData();
      setShowDeleteModal(false);
      setHintToDelete(null);
    } catch (error) {
      console.error('Failed to delete hint:', error);
      alert(`❌ Failed to delete hint: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Open bulk delete confirmation modal
   */
  const handleBulkDelete = (gameId) => {
    const game = games.find(g => g.game_id === gameId);
    setGameToCleanup(game);
    setShowBulkDeleteModal(true);
  };

  /**
   * Confirm bulk delete
   */
  const confirmBulkDelete = async () => {
    try {
      const result = await api.aiTraining.bulkDeleteHints(gameToCleanup.id);
      console.log(`✅ Bulk deleted ${result.deleted_count} hints`);

      // Reload data
      await loadAllData();
      setShowBulkDeleteModal(false);
      setGameToCleanup(null);

      alert(`✅ Successfully deleted ${result.deleted_count} training hints for "${gameToCleanup.title}"`);
    } catch (error) {
      console.error('Failed to bulk delete hints:', error);
      alert(`❌ Failed to bulk delete hints: ${error.response?.data?.detail || error.message}`);
    }
  };

  // ==============================================================================
  // GAME MANAGEMENT HANDLERS
  // ==============================================================================

  /**
   * Open create game modal
   */
  const handleCreateGame = () => {
    setEditingGame(null);
    setGameForm({
      title: '',
      description: '',
      solution_password: '',
      story_text: '',
      challenge_text: '',
      game_type: 'puzzle',
      educational_purpose: '',
      technical_skills: '',
      difficulty_level: 'medium',
      max_hints: 0,
      points_value: 100,
      order_index: games.length
    });
    setShowGameModal(true);
  };

  /**
   * Open edit game modal
   */
  const handleEditGame = (game) => {
    setEditingGame(game);
    setGameForm({
      event_id: game.event_id,
      category_id: game.category_id || (categories.length > 0 ? categories[0].id : null),
      title: game.title,
      description: game.description,
      solution_password: game.solution_password,
      story_text: game.story_text || '',
      challenge_text: game.challenge_text || '',
      educational_purpose: game.educational_purpose || '',
      technical_skills: game.technical_skills || '',
      difficulty_level: game.difficulty_level || 'medium',
      max_hints: game.max_hints,
      points_value: game.points_value,
      order_index: game.order_index
    });
    setShowGameModal(true);
  };

  /**
   * Save game (create or update)
   */
  const handleSaveGame = async () => {
    try {
      if (editingGame) {
        // Update existing game
        await api.games.update(editingGame.id, gameForm);
        console.log(`✅ Game updated: ${editingGame.id}`);
      } else {
        // Create new game
        await api.games.create(gameForm);
        console.log(`✅ Game created`);
      }

      // Reload data
      await loadAllData();
      setShowGameModal(false);
      setEditingGame(null);
    } catch (error) {
      console.error('Failed to save game:', error);
      alert(`❌ Failed to save game: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Open delete game confirmation
   */
  const handleDeleteGame = (game) => {
    setGameToDelete(game);
    setShowGameDeleteModal(true);
  };

  /**
   * Confirm delete game
   */
  const confirmDeleteGame = async () => {
    try {
      await api.games.delete(gameToDelete.id);
      console.log(`✅ Game deleted: ${gameToDelete.id}`);

      // Reload data
      await loadAllData();
      setShowGameDeleteModal(false);
      setGameToDelete(null);
    } catch (error) {
      console.error('Failed to delete game:', error);
      alert(`❌ Failed to delete game: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Open edit event modal
   */
  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title || '',
      story_html: event.story_html || '',
      description: event.description || '',
      author: event.author || ''
    });
    setShowEventModal(true);
  };

  /**
   * Save event changes
   */
  const handleSaveEvent = async () => {
    try {
      await api.aiTraining.updateEvent(editingEvent.id, eventForm);
      console.log(`✅ Event updated: ${editingEvent.id}`);

      // Reload events
      await loadEvents();
      setShowEventModal(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Failed to save event:', error);
      alert(`❌ Failed to save event: ${error.response?.data?.detail || error.message}`);
    }
  };

  // Loading state
  if (loading) {
    return <div className="loading">Loading AI training management...</div>;
  }

  // Error state
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="ai-training-management">
      {/* Main Card */}
      <div className="ai-training-card">
        <div className="card-header">
          🤖 AI Training Content Management
          <div className="header-actions">
            <button className="btn-header-action" onClick={loadAllData}>
              🔄 Reload
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Tab Navigation - Only show if showTabs is true */}
          {showTabs && (
            <div className="tab-navigation">
              <button
                className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => handleTabChange('events')}
              >
                📖 Event Story
              </button>
              <button
                className={`tab-btn ${activeTab === 'games' ? 'active' : ''}`}
                onClick={() => handleTabChange('games')}
              >
                🎮 Games
              </button>
              <button
                className={`tab-btn ${activeTab === 'hints' ? 'active' : ''}`}
                onClick={() => handleTabChange('hints')}
              >
                💡 Training Hints
              </button>
            </div>
          )}

          {/* Games Tab */}
          {activeTab === 'games' && (
            <div className="games-section">
              <div className="section-header">
                <h3>Game Content Management</h3>
                <button className="btn btn-primary" onClick={handleCreateGame}>
                  ➕ Create New Game
                </button>
              </div>

              <div className="games-list">
                {games.length === 0 ? (
                  <div className="empty-state">
                    <p>No games created yet.</p>
                    <p>Click "Create New Game" to add one.</p>
                  </div>
                ) : (
                  games.map(game => (
                    <div key={game.id} className="game-item">
                      <div className="game-header">
                        <h4>{game.title}</h4>
                        <span className={`difficulty-badge ${game.difficulty_level}`}>
                          {game.difficulty_level || 'medium'}
                        </span>
                      </div>

                      <div className="game-meta">
                        <span className="game-type">{game.category?.name || 'Uncategorized'}</span>
                        <span className="game-order">Order: {game.order_index}</span>
                        <span className="game-points">{game.points_value} points</span>
                      </div>

                      <div className="game-description">{game.description}</div>

                      {game.educational_purpose && (
                        <div className="game-education">
                          <strong>🎓 Learning Goal:</strong> {game.educational_purpose}
                        </div>
                      )}

                      {game.technical_skills && (
                        <div className="game-skills">
                          <strong>🔧 Skills:</strong> {game.technical_skills}
                        </div>
                      )}

                      <div className="game-actions">
                        <button className="btn btn-sm btn-primary" onClick={() => handleEditGame(game)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-sm btn-outline danger" onClick={() => handleDeleteGame(game)}>
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Training Hints Tab */}
          {activeTab === 'hints' && (
            <div className="hints-section">
              {/* Game Selection */}
              <div className="game-selector">
                <label htmlFor="game-select">Select Game:</label>
                <select
                  id="game-select"
                  value={selectedGame || ''}
                  onChange={(e) => setSelectedGame(parseInt(e.target.value))}
                  className="game-select"
                >
                  {games.map(game => (
                    <option key={game.id} value={game.id}>
                      {game.title} ({game.hints.length} hints)
                    </option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={handleCreateHint}>
                  ➕ Add Hint
                </button>
                {selectedGame && (
                  <button
                    className="btn btn-outline danger"
                    onClick={() => handleBulkDelete(selectedGame)}
                  >
                    🗑️ Cleanup Game
                  </button>
                )}
              </div>

              {/* Hints List */}
              <div className="hints-list">
                {hints.length === 0 ? (
                  <div className="empty-state">
                    <p>No training hints for this game yet.</p>
                    <p>Click "Add Hint" to create one.</p>
                  </div>
                ) : (
                  hints.map(hint => (
                    <div key={hint.id} className="hint-item">
                      <div className="hint-header">
                        <span className={`hint-type-badge type-${hint.hint_type}`}>
                          {HINT_TYPES[hint.hint_type] || hint.hint_type}
                        </span>
                        <span className={`hint-level-badge level-${hint.hint_level}`}>
                          Level {hint.hint_level}
                        </span>
                      </div>
                      <div className="hint-content">
                        {hint.hint_content}
                      </div>
                      <div className="hint-meta">
                        {hint.effectiveness_score !== null && (
                          <span className="effectiveness">
                            Effectiveness: {hint.effectiveness_score}%
                          </span>
                        )}
                        <span className="status">
                          {hint.review_status} • {hint.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="hint-actions">
                        <button className="btn btn-sm btn-primary" onClick={() => handleEditHint(hint)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-sm btn-outline danger" onClick={() => handleDeleteHint(hint)}>
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Event Story Tab */}
          {activeTab === 'events' && (
            <div className="events-section">
              <div className="section-header">
                <h3>Event Story Management</h3>
              </div>

              <div className="events-list">
                {events.length === 0 ? (
                  <div className="empty-state">
                    <p>No events found.</p>
                  </div>
                ) : (
                  events.map(event => (
                    <div key={event.id} className="event-item">
                      <div className="event-header">
                        <h4>{event.year} - {event.title}</h4>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEditEvent(event)}
                        >
                          ✏️ Edit Story
                        </button>
                      </div>
                      <div className="event-details">
                        {event.author && (
                          <p><strong>Author:</strong> {event.author}</p>
                        )}
                        {event.description && (
                          <p><strong>Description:</strong> {event.description}</p>
                        )}
                        <p><strong>Games:</strong> {event.game_count || 0}</p>
                        <p><strong>Status:</strong>
                          <span className={`status-badge ${event.is_active ? 'active' : 'inactive'}`}>
                            {event.is_active ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Hint Modal */}
      {showHintModal && (
        <div className="modal-overlay" onClick={() => setShowHintModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingHint ? '✏️ Edit Training Hint' : '➕ Create Training Hint'}</h3>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="hint-game">Game:</label>
                <select
                  id="hint-game"
                  value={hintForm.game_id}
                  onChange={(e) => setHintForm({ ...hintForm, game_id: e.target.value })}
                  className="form-control"
                  disabled={editingHint !== null}
                >
                  {games.map(game => (
                    <option key={game.id} value={game.id}>
                      {game.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="hint-type">Hint Type:</label>
                <select
                  id="hint-type"
                  value={hintForm.hint_type}
                  onChange={(e) => setHintForm({ ...hintForm, hint_type: e.target.value })}
                  className="form-control"
                >
                  {Object.entries(HINT_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="hint-level">Hint Level:</label>
                <select
                  id="hint-level"
                  value={hintForm.hint_level}
                  onChange={(e) => setHintForm({ ...hintForm, hint_level: e.target.value })}
                  className="form-control"
                >
                  {Object.entries(HINT_LEVELS).map(([key, label]) => (
                    <option key={key} value={key}>Level {key}: {label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="hint-content">Hint Content:</label>
                <textarea
                  id="hint-content"
                  value={hintForm.hint_content}
                  onChange={(e) => setHintForm({ ...hintForm, hint_content: e.target.value })}
                  className="form-control"
                  rows="4"
                  placeholder="Enter the hint content..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="effectiveness-score">Effectiveness Score (0-100, optional):</label>
                <input
                  type="number"
                  id="effectiveness-score"
                  value={hintForm.effectiveness_score || ''}
                  onChange={(e) => setHintForm({ ...hintForm, effectiveness_score: e.target.value })}
                  className="form-control"
                  min="0"
                  max="100"
                  placeholder="Leave empty if unknown"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={handleSaveHint}>
                ✓ Save Hint
              </button>
              <button className="btn btn-outline" onClick={() => setShowHintModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Hint Confirmation Modal */}
      {showDeleteModal && hintToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Confirm Delete</h3>
            <div className="modal-body">
              <p><strong>Hint Type:</strong> {HINT_TYPES[hintToDelete.hint_type]}</p>
              <p><strong>Level:</strong> {hintToDelete.hint_level}</p>
              <p><strong>Content:</strong> {hintToDelete.hint_content}</p>
              <p className="warning-text">
                ⚠️ This action cannot be undone. Are you sure?
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline danger" onClick={confirmDeleteHint}>
                🗑️ Delete
              </button>
              <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && gameToCleanup && (
        <div className="modal-overlay" onClick={() => setShowBulkDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Cleanup Old Game Year</h3>
            <div className="modal-body">
              <p><strong>Game:</strong> {gameToCleanup.title}</p>
              <p><strong>Hints to Delete:</strong> {gameToCleanup.hints.length}</p>
              <p className="warning-text">
                ⚠️ This will delete ALL training hints for this game.
                Use this when transitioning to a new game year.
                This action cannot be undone!
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline danger" onClick={confirmBulkDelete}>
                🗑️ Delete All {gameToCleanup.hints.length} Hints
              </button>
              <button className="btn btn-outline" onClick={() => setShowBulkDeleteModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Game Modal */}
      {showGameModal && (
        <div className="modal-overlay" onClick={() => setShowGameModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h3>{editingGame ? '✏️ Edit Game' : '➕ Create New Game'}</h3>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="game-title">Title *</label>
                <input
                  type="text"
                  id="game-title"
                  value={gameForm.title}
                  onChange={(e) => setGameForm({ ...gameForm, title: e.target.value })}
                  className="form-control"
                  placeholder="Game name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="game-description">Description *</label>
                <textarea
                  id="game-description"
                  value={gameForm.description}
                  onChange={(e) => setGameForm({ ...gameForm, description: e.target.value })}
                  className="form-control"
                  rows="2"
                  placeholder="Short description"
                />
              </div>

              <div className="form-group">
                <label htmlFor="game-solution">Solution/Password *</label>
                <input
                  type="text"
                  id="game-solution"
                  value={gameForm.solution_password}
                  onChange={(e) => setGameForm({ ...gameForm, solution_password: e.target.value })}
                  className="form-control"
                  placeholder="Correct answer (e.g., margarete)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="game-story">Story Text</label>
                <textarea
                  id="game-story"
                  value={gameForm.story_text}
                  onChange={(e) => setGameForm({ ...gameForm, story_text: e.target.value })}
                  className="form-control"
                  rows="4"
                  placeholder="Main story/theme text shown on game screen (e.g., Faust summary)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="game-challenge">Challenge Text</label>
                <textarea
                  id="game-challenge"
                  value={gameForm.challenge_text}
                  onChange={(e) => setGameForm({ ...gameForm, challenge_text: e.target.value })}
                  className="form-control"
                  rows="3"
                  placeholder="Initial challenge/instructions (e.g., 'Find the female main character...')"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="game-event">Event</label>
                  <select
                    id="game-event"
                    value={gameForm.event_id || ''}
                    onChange={(e) => setGameForm({ ...gameForm, event_id: parseInt(e.target.value) })}
                    className="form-control"
                    required
                  >
                    <option value="">Select Event...</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.year} - {event.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="game-category">Category</label>
                  <select
                    id="game-category"
                    value={gameForm.category_id || ''}
                    onChange={(e) => setGameForm({ ...gameForm, category_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="form-control"
                  >
                    <option value="">No Category</option>
                    {categories.filter(cat => !cat.event_id || cat.event_id === gameForm.event_id).map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="game-difficulty">Difficulty</label>
                  <select
                    id="game-difficulty"
                    value={gameForm.difficulty_level}
                    onChange={(e) => setGameForm({ ...gameForm, difficulty_level: e.target.value })}
                    className="form-control"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="game-education">Educational Purpose</label>
                <textarea
                  id="game-education"
                  value={gameForm.educational_purpose}
                  onChange={(e) => setGameForm({ ...gameForm, educational_purpose: e.target.value })}
                  className="form-control"
                  rows="2"
                  placeholder="What players learn (e.g., 'Shows why SSL is essential')"
                />
              </div>

              <div className="form-group">
                <label htmlFor="game-skills">Technical Skills Required</label>
                <input
                  type="text"
                  id="game-skills"
                  value={gameForm.technical_skills}
                  onChange={(e) => setGameForm({ ...gameForm, technical_skills: e.target.value })}
                  className="form-control"
                  placeholder="e.g., tcpdump, Wireshark, Python"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="game-points">Points</label>
                  <input
                    type="number"
                    id="game-points"
                    value={gameForm.points_value}
                    onChange={(e) => setGameForm({ ...gameForm, points_value: parseInt(e.target.value) })}
                    className="form-control"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="game-order">Display Order</label>
                  <input
                    type="number"
                    id="game-order"
                    value={gameForm.order_index}
                    onChange={(e) => setGameForm({ ...gameForm, order_index: parseInt(e.target.value) })}
                    className="form-control"
                    min="0"
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={handleSaveGame}>
                ✓ Save Game
              </button>
              <button className="btn btn-outline" onClick={() => setShowGameModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEventModal && editingEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h3>✏️ Edit Event Story - {editingEvent.year}</h3>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="event-title">Event Title</label>
                <input
                  type="text"
                  id="event-title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="form-control"
                  placeholder="e.g., Faust - The Quest for Knowledge"
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-author">Author</label>
                <input
                  type="text"
                  id="event-author"
                  value={eventForm.author}
                  onChange={(e) => setEventForm({ ...eventForm, author: e.target.value })}
                  className="form-control"
                  placeholder="e.g., Johann Wolfgang von Goethe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-description">Description (Optional)</label>
                <textarea
                  id="event-description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="form-control"
                  rows="3"
                  placeholder="Brief description of the event theme"
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-story">Story HTML</label>
                <textarea
                  id="event-story"
                  value={eventForm.story_html}
                  onChange={(e) => setEventForm({ ...eventForm, story_html: e.target.value })}
                  className="form-control"
                  rows="20"
                  placeholder="Full HTML story content..."
                  style={{ fontFamily: 'monospace', fontSize: '0.9em' }}
                />
                <small className="form-hint">
                  This is the main story HTML that will be displayed to players.
                  Can include HTML tags for formatting.
                </small>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={handleSaveEvent}>
                ✓ Save Event
              </button>
              <button className="btn btn-outline" onClick={() => setShowEventModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Game Confirmation Modal */}
      {showGameDeleteModal && gameToDelete && (
        <div className="modal-overlay" onClick={() => setShowGameDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Delete Game</h3>
            <div className="modal-body">
              <p><strong>Game:</strong> {gameToDelete.title}</p>
              <p><strong>Category:</strong> {gameToDelete.category?.name || 'Uncategorized'}</p>
              <p className="warning-text">
                ⚠️ This will soft-delete the game (set to inactive).
                Associated hints and progress records will be preserved.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline danger" onClick={confirmDeleteGame}>
                🗑️ Delete Game
              </button>
              <button className="btn btn-outline" onClick={() => setShowGameDeleteModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AITrainingManagement;
