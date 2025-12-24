/**
 * Component: GameModal
 * Purpose: Modal for creating/editing game content
 * Part of: Easter Quest 2025 Frontend - AI Training Management
 *
 * Features:
 * - Create/edit game metadata
 * - Select event and category
 * - Configure difficulty, points, order
 * - Set story and challenge text
 * - Manage game dependencies (prerequisites)
 *
 * @since 2025-11-20
 * @updated 2025-12-21 - Added dependency management
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';

function GameModal({ game, gameForm, events, categories, games, onFormChange, onSave, onClose }) {
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load existing dependencies when editing a game
  useEffect(() => {
    if (game && game.id) {
      loadDependencies();
    }
  }, [game]);

  /**
   * Load dependencies for the current game
   */
  async function loadDependencies() {
    try {
      setLoading(true);
      const response = await fetch(`/v1/admin/content/games/${game.id}/dependencies`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setDependencies(data.dependencies || []);
      }
    } catch (error) {
      logger.error('game_dependencies_load_failed', {
        gameId: game.id,
        errorMessage: error.message,
        module: 'GameModal'
      }, error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Add a dependency
   */
  async function handleAddDependency(prereqId) {
    if (!game || !game.id) return;

    try {
      const response = await fetch(`/v1/admin/content/games/${game.id}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ depends_on_game_id: parseInt(prereqId) })
      });

      if (response.ok) {
        await loadDependencies();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to add dependency');
      }
    } catch (error) {
      logger.error('game_dependency_add_failed', {
        gameId: game.id,
        prereqId,
        errorMessage: error.message,
        module: 'GameModal'
      }, error);
      alert('Failed to add dependency');
    }
  }

  /**
   * Remove a dependency
   */
  async function handleRemoveDependency(prereqId) {
    if (!game || !game.id) return;
    if (!window.confirm('Remove this prerequisite?')) return;

    try {
      const response = await fetch(`/v1/admin/content/games/${game.id}/dependencies/${prereqId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await loadDependencies();
      }
    } catch (error) {
      logger.error('game_dependency_remove_failed', {
        gameId: game.id,
        prereqId,
        errorMessage: error.message,
        module: 'GameModal'
      }, error);
      alert('Failed to remove dependency');
    }
  }

  /**
   * Get available games for prerequisites (same event, excluding self)
   */
  function getAvailablePrerequisites() {
    if (!gameForm.event_id || !games) return [];
    return games.filter(g =>
      g.event_id === gameForm.event_id &&
      g.id !== game?.id &&
      !dependencies.some(dep => dep.id === g.id)
    );
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <h3>{game ? '✏️ Edit Game' : '➕ Create New Game'}</h3>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="game-title">Title *</label>
            <input
              type="text"
              id="game-title"
              value={gameForm.title}
              onChange={(e) => onFormChange({ ...gameForm, title: e.target.value })}
              className="form-control"
              placeholder="Game name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="game-description">Description *</label>
            <textarea
              id="game-description"
              value={gameForm.description}
              onChange={(e) => onFormChange({ ...gameForm, description: e.target.value })}
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
              onChange={(e) => onFormChange({ ...gameForm, solution_password: e.target.value })}
              className="form-control"
              placeholder="Correct answer (e.g., margarete)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="game-story">Story Text</label>
            <textarea
              id="game-story"
              value={gameForm.story_text}
              onChange={(e) => onFormChange({ ...gameForm, story_text: e.target.value })}
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
              onChange={(e) => onFormChange({ ...gameForm, challenge_text: e.target.value })}
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
                onChange={(e) => onFormChange({ ...gameForm, event_id: parseInt(e.target.value) })}
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
                onChange={(e) => onFormChange({ ...gameForm, category_id: e.target.value ? parseInt(e.target.value) : null })}
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
                onChange={(e) => onFormChange({ ...gameForm, difficulty_level: e.target.value })}
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
              onChange={(e) => onFormChange({ ...gameForm, educational_purpose: e.target.value })}
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
              onChange={(e) => onFormChange({ ...gameForm, technical_skills: e.target.value })}
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
                onChange={(e) => onFormChange({ ...gameForm, points_value: parseInt(e.target.value) })}
                className="form-control"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="game-max-hints">Max Hints</label>
              <input
                type="number"
                id="game-max-hints"
                value={gameForm.max_hints !== undefined ? gameForm.max_hints : 0}
                onChange={(e) => onFormChange({ ...gameForm, max_hints: parseInt(e.target.value) })}
                className="form-control"
                min="0"
                title="Maximum number of AI hints available for this game (0 = no hints)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="game-hint-penalty">
                Hint Penalty Points
              </label>
              <input
                type="number"
                id="game-hint-penalty"
                value={gameForm.hint_penalty_points !== undefined && gameForm.hint_penalty_points !== null ? gameForm.hint_penalty_points : ''}
                onChange={(e) => onFormChange({
                  ...gameForm,
                  hint_penalty_points: e.target.value === '' ? null : parseInt(e.target.value)
                })}
                className="form-control"
                min="0"
                placeholder="Use system default (10)"
                title="Points deducted per hint used. Leave empty to use system default from config."
              />
            </div>

            <div className="form-group">
              <label htmlFor="game-order">Display Order</label>
              <input
                type="number"
                id="game-order"
                value={gameForm.order_index}
                onChange={(e) => onFormChange({ ...gameForm, order_index: parseInt(e.target.value) })}
                className="form-control"
                min="0"
              />
            </div>
          </div>

          {/* Prerequisites Section */}
          {game && game.id && (
            <div className="form-group" style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                🔗 Prerequisites (Games that must be completed first)
              </label>

              {loading ? (
                <p style={{ color: '#666', fontSize: '14px' }}>Loading dependencies...</p>
              ) : (
                <>
                  {/* Current Dependencies */}
                  {dependencies.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                        This game requires:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {dependencies.map(dep => (
                          <div key={dep.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            background: 'white',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px'
                          }}>
                            <span style={{ fontSize: '14px' }}>🔒 {dep.title}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDependency(dep.id)}
                              style={{
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              ✕ Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add New Dependency */}
                  {getAvailablePrerequisites().length > 0 ? (
                    <div>
                      <p style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                        Add prerequisite:
                      </p>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddDependency(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="form-control"
                        style={{ fontSize: '14px' }}
                      >
                        <option value="">Select a game...</option>
                        {getAvailablePrerequisites().map(g => (
                          <option key={g.id} value={g.id}>
                            {g.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : dependencies.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                      No other games in this event to use as prerequisites.
                    </p>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                      All available games are already prerequisites.
                    </p>
                  )}
                </>
              )}

              <small style={{ display: 'block', marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                Players must complete all prerequisites before this game becomes available.
                Dependencies are enforced per team.
              </small>
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-success" onClick={onSave}>
            ✓ Save Game
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameModal;
