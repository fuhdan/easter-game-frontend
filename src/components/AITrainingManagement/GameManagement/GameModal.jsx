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
 * - Manage rewards (SSH keys, tokens, etc.)
 * - Collapsible sections for better organization
 *
 * @since 2025-11-20
 * @updated 2026-02-26 - Added reward management and collapsible sections
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import { getRewardsByGame, createReward, updateReward, deleteReward } from '../../../services/rewards';

function GameModal({ game, gameForm, events, categories, games, onFormChange, onSave, onClose }) {
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reward management state
  const [rewards, setRewards] = useState([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm, setRewardForm] = useState({
    reward_type: 'ssh_key',
    display_name: '',
    description: '',
    is_active: true,
    api_url: '',
    api_bearer_token: ''
  });

  // Collapsible sections state (with smart defaults)
  const [expandedSections, setExpandedSections] = useState({
    basic: true,           // Always expanded
    config: true,          // Expanded by default
    scoring: false,         // Collapsed by default
    prerequisites: false,  // Collapsed by default
    solution: false,        // Collapsed by default
    rewards: false         // Collapsed by default
  });

  // Load existing dependencies and rewards when editing a game
  useEffect(() => {
    if (game && game.id) {
      loadDependencies();
      loadRewards();
    }
  }, [game]);

  /**
   * Toggle section expand/collapse
   */
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  /**
   * Load dependencies for the current game
   */
  async function loadDependencies() {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/content/games/${game.id}/dependencies`, {
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
      const response = await fetch(`/api/v1/admin/content/games/${game.id}/dependencies`, {
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
      const response = await fetch(`/api/v1/admin/content/games/${game.id}/dependencies/${prereqId}`, {
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

  /**
   * Load rewards for the current game
   */
  async function loadRewards() {
    if (!game || !game.id) return;

    try {
      setLoadingRewards(true);
      const data = await getRewardsByGame(game.id);
      setRewards(data.rewards || []);
    } catch (error) {
      logger.error('game_rewards_load_failed', {
        gameId: game.id,
        errorMessage: error.message,
        module: 'GameModal'
      }, error);
    } finally {
      setLoadingRewards(false);
    }
  }

  /**
   * Open create reward modal
   */
  function handleCreateReward() {
    setEditingReward(null);
    setRewardForm({
      reward_type: 'ssh_key',
      display_name: '',
      description: '',
      is_active: true,
      api_url: '',
      api_bearer_token: ''
    });
    setShowRewardModal(true);
  }

  /**
   * Open edit reward modal
   */
  function handleEditReward(reward) {
    setEditingReward(reward);
    setRewardForm({
      reward_type: reward.reward_type,
      display_name: reward.display_name,
      description: reward.description,
      is_active: reward.is_active,
      api_url: reward.api_url || '',
      api_bearer_token: '' // Don't pre-fill token for security
    });
    setShowRewardModal(true);
  }

  /**
   * Save reward (create or update)
   */
  async function handleSaveReward() {
    if (!game || !game.id) {
      alert('Please save the game first before adding rewards');
      return;
    }

    try {
      const rewardData = {
        ...rewardForm,
        game_id: game.id,
        // Only include api_bearer_token if it's not empty
        ...(rewardForm.api_bearer_token ? { api_bearer_token: rewardForm.api_bearer_token } : {})
      };

      if (editingReward) {
        // Update existing reward
        await updateReward(editingReward.id, rewardData);
        logger.info('reward_updated', {
          rewardId: editingReward.id,
          gameId: game.id,
          module: 'GameModal'
        });
      } else {
        // Create new reward
        await createReward(rewardData);
        logger.info('reward_created', {
          gameId: game.id,
          rewardType: rewardForm.reward_type,
          module: 'GameModal'
        });
      }

      setShowRewardModal(false);
      setEditingReward(null);
      await loadRewards();
    } catch (error) {
      logger.error('reward_save_failed', {
        isUpdate: !!editingReward,
        rewardId: editingReward?.id,
        errorMessage: error.message,
        module: 'GameModal'
      }, error);
      alert(`Failed to save reward: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Delete reward
   */
  async function handleDeleteReward(reward) {
    if (!window.confirm(`Delete reward "${reward.display_name}"?`)) return;

    try {
      await deleteReward(reward.id);
      logger.info('reward_deleted', {
        rewardId: reward.id,
        gameId: game.id,
        module: 'GameModal'
      });
      await loadRewards();
    } catch (error) {
      logger.error('reward_delete_failed', {
        rewardId: reward.id,
        errorMessage: error.message,
        module: 'GameModal'
      }, error);
      alert(`Failed to delete reward: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Render collapsible section header
   */
  const SectionHeader = ({ icon, title, sectionKey, count = null }) => (
    <div
      onClick={() => toggleSection(sectionKey)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 15px',
        background: expandedSections[sectionKey] ? '#005da0' : '#f8f9fa',
        color: expandedSections[sectionKey] ? 'white' : '#333',
        borderRadius: '6px',
        cursor: 'pointer',
        marginBottom: expandedSections[sectionKey] ? '15px' : '10px',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        fontWeight: 'bold',
        fontSize: '14px'
      }}
    >
      <span>
        {icon} {title}
        {count !== null && count > 0 && (
          <span style={{
            marginLeft: '8px',
            padding: '2px 8px',
            background: expandedSections[sectionKey] ? 'rgba(255,255,255,0.2)' : '#e9ecef',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'normal'
          }}>
            {count}
          </span>
        )}
      </span>
      <span style={{ fontSize: '12px' }}>
        {expandedSections[sectionKey] ? '▼' : '▶'}
      </span>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <h3>{game ? '✏️ Edit Game' : '➕ Create New Game'}</h3>
        <div className="modal-body">

          {/* SECTION 1: Basic Information (always expanded) */}
          <SectionHeader icon="📝" title="Basic Information" sectionKey="basic" />
          {expandedSections.basic && (
            <div style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label htmlFor="game-title">Title *</label>
                <input
                  type="text"
                  id="game-title"
                  value={gameForm.title}
                  onChange={(e) => onFormChange({ ...gameForm, title: e.target.value })}
                  className="form-control"
                  placeholder="Game name"
                  required
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
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="game-challenge">Challenge Text *</label>
                <textarea
                  id="game-challenge"
                  value={gameForm.challenge_text}
                  onChange={(e) => onFormChange({ ...gameForm, challenge_text: e.target.value })}
                  className="form-control"
                  rows="3"
                  placeholder="Initial challenge/instructions (e.g., 'Find the female main character...')"
                  required
                />
                <small className="form-hint" style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginTop: '4px' }}>
                  💡 This text is shown to players when they start the game.
                </small>
              </div>
            </div>
          )}

          {/* SECTION 2: Game Configuration */}
          <SectionHeader icon="⚙️" title="Game Configuration" sectionKey="config" />
          {expandedSections.config && (
            <div style={{ marginBottom: '20px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="game-event">📅 Event *</label>
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
                  <label htmlFor="game-category">📂 Category</label>
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
                  <label htmlFor="game-difficulty">🎚️ Difficulty</label>
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
                <label htmlFor="game-skills">🔧 Technical Skills Required</label>
                <input
                  type="text"
                  id="game-skills"
                  value={gameForm.technical_skills}
                  onChange={(e) => onFormChange({ ...gameForm, technical_skills: e.target.value })}
                  className="form-control"
                  placeholder="e.g., tcpdump, Wireshark, Python"
                />
              </div>
            </div>
          )}

          {/* SECTION 3: Scoring & Progression */}
          <SectionHeader icon="🎯" title="Scoring & Progression" sectionKey="scoring" />
          {expandedSections.scoring && (
            <div style={{ marginBottom: '20px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="game-points">💯 Points</label>
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
                  <label htmlFor="game-max-hints">💡 Max Hints</label>
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
                    ⚠️ Hint Penalty Points
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
                  <label htmlFor="game-order">🔢 Display Order</label>
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
            </div>
          )}

          {/* SECTION 4: Prerequisites */}
          {game && game.id && (
            <>
              <SectionHeader
                icon="🔗"
                title="Prerequisites"
                sectionKey="prerequisites"
                count={dependencies.length}
              />
              {expandedSections.prerequisites && (
                <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
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
                    💡 Players must complete all prerequisites before this game becomes available.
                    Dependencies are enforced per team.
                  </small>
                </div>
              )}
            </>
          )}

          {/* SECTION 5: Solution & AI Security */}
          <SectionHeader icon="🔐" title="Solution & AI Security" sectionKey="solution" />
          {expandedSections.solution && (
            <div style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label htmlFor="game-solution">🔑 Solution/Password *</label>
                <input
                  type="text"
                  id="game-solution"
                  value={gameForm.solution_password}
                  onChange={(e) => onFormChange({ ...gameForm, solution_password: e.target.value })}
                  className="form-control"
                  placeholder="Correct answer (e.g., margarete)"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="game-solution-keywords">
                  🛡️ Solution Keywords (AI Security)
                </label>
                <textarea
                  id="game-solution-keywords"
                  value={gameForm.solution_keywords || ''}
                  onChange={(e) => onFormChange({ ...gameForm, solution_keywords: e.target.value })}
                  className="form-control"
                  rows="2"
                  placeholder="e.g., margarete, gretchen, faust (comma-separated or JSON array)"
                />
                <small className="form-hint" style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginTop: '4px' }}>
                  🛡️ <strong>AI Response Filter:</strong> Keywords to block in AI responses to prevent solution leakage.
                  Enter comma-separated words (e.g., <code>keyword1, solution_part, answer</code>) or JSON array.
                  <strong>Optional</strong> - only needed if AI might accidentally reveal the answer.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="game-ai-progress">🤖 AI Progress Guide</label>
                <textarea
                  id="game-ai-progress"
                  value={gameForm.ai_progress_guide}
                  onChange={(e) => onFormChange({ ...gameForm, ai_progress_guide: e.target.value })}
                  className="form-control"
                  rows="6"
                  placeholder="AI progress estimation stages (e.g., '0-25%: Learning character, 25-50%: Found real name, 50-100%: Playing game')"
                />
                <small className="form-hint" style={{ fontSize: '12px', color: '#6c757d', display: 'block', marginTop: '4px' }}>
                  💡 Define progress stages to help the AI estimate player understanding and provide appropriate hints.
                </small>
              </div>
            </div>
          )}

          {/* SECTION 6: Rewards */}
          {game && game.id && (
            <>
              <SectionHeader
                icon="🎁"
                title="Rewards (SSH Keys, Tokens, etc.)"
                sectionKey="rewards"
                count={rewards.length}
              />
              {expandedSections.rewards && (
                <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f8ff', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <button
                      type="button"
                      onClick={handleCreateReward}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}
                    >
                      ➕ Add Reward
                    </button>
                  </div>

                  {loadingRewards ? (
                    <p style={{ color: '#666', fontSize: '14px' }}>Loading rewards...</p>
                  ) : rewards.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {rewards.map(reward => (
                        <div key={reward.id} style={{
                          padding: '12px',
                          background: 'white',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                                {reward.display_name}
                                <span style={{
                                  marginLeft: '8px',
                                  padding: '2px 6px',
                                  background: '#e7f3ff',
                                  borderRadius: '3px',
                                  fontSize: '11px',
                                  fontWeight: 'normal'
                                }}>
                                  {reward.reward_type}
                                </span>
                                {!reward.is_active && (
                                  <span style={{
                                    marginLeft: '4px',
                                    padding: '2px 6px',
                                    background: '#ffc107',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: 'normal'
                                  }}>
                                    inactive
                                  </span>
                                )}
                                {reward.api_url && (
                                  <span style={{
                                    marginLeft: '4px',
                                    padding: '2px 6px',
                                    background: '#28a745',
                                    color: 'white',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: 'normal'
                                  }}>
                                    📡 webhook
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {reward.description}
                              </div>
                              {reward.api_url && (
                                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                  📡 Webhook: {reward.api_url}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleEditReward(reward)}
                                style={{
                                  background: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 'bold'
                                }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReward(reward)}
                                style={{
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 'bold'
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic', margin: 0 }}>
                      No rewards configured for this game yet. Click "Add Reward" to create one.
                    </p>
                  )}

                  <small style={{ display: 'block', marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                    💡 Rewards are automatically granted to teams when they complete this game.
                    Supports SSH keys, API tokens, passwords, certificates, URLs, and secret text.
                  </small>
                </div>
              )}
            </>
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

      {/* Create/Edit Reward Modal */}
      {showRewardModal && (
        <div className="modal-overlay" onClick={() => setShowRewardModal(false)} style={{ zIndex: 10001 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>{editingReward ? '✏️ Edit Reward' : '➕ Create New Reward'}</h3>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="reward-type">🎁 Type *</label>
                <select
                  id="reward-type"
                  value={rewardForm.reward_type}
                  onChange={(e) => setRewardForm({ ...rewardForm, reward_type: e.target.value })}
                  className="form-control"
                  disabled={!!editingReward} // Can't change type when editing
                >
                  <option value="ssh_key">🔑 SSH Key</option>
                  <option value="api_token">🎫 API Token</option>
                  <option value="password">🔐 Password</option>
                  <option value="certificate">📜 Certificate</option>
                  <option value="url">🔗 URL</option>
                  <option value="secret_text">📝 Secret Text</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reward-name">📌 Display Name *</label>
                <input
                  type="text"
                  id="reward-name"
                  value={rewardForm.display_name}
                  onChange={(e) => setRewardForm({ ...rewardForm, display_name: e.target.value })}
                  className="form-control"
                  placeholder="e.g., SSH Private Key for Server Access"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reward-description">📄 Description *</label>
                <textarea
                  id="reward-description"
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  className="form-control"
                  rows="3"
                  placeholder="Instructions on how to use this reward"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={rewardForm.is_active}
                    onChange={(e) => setRewardForm({ ...rewardForm, is_active: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  ✅ Active
                </label>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                  📡 Webhook Configuration (Optional)
                </label>

                <div className="form-group">
                  <label htmlFor="reward-api-url">🌐 Webhook URL (HTTPS only)</label>
                  <input
                    type="text"
                    id="reward-api-url"
                    value={rewardForm.api_url}
                    onChange={(e) => setRewardForm({ ...rewardForm, api_url: e.target.value })}
                    className="form-control"
                    placeholder="https://your-server.com/api/provision"
                  />
                  <small style={{ fontSize: '11px', color: '#6c757d', display: 'block', marginTop: '4px' }}>
                    POST endpoint to call when reward is unlocked. Must use HTTPS.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="reward-api-token">🔑 Bearer Token</label>
                  <input
                    type="password"
                    id="reward-api-token"
                    value={rewardForm.api_bearer_token}
                    onChange={(e) => setRewardForm({ ...rewardForm, api_bearer_token: e.target.value })}
                    className="form-control"
                    placeholder={editingReward ? "Leave empty to keep existing token" : "your-secret-bearer-token"}
                    autoComplete="off"
                  />
                  <small style={{ fontSize: '11px', color: '#6c757d', display: 'block', marginTop: '4px' }}>
                    {editingReward
                      ? "Leave empty to keep existing token. Fill to update it."
                      : "Authentication token for webhook endpoint. Will be encrypted in database."
                    }
                  </small>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={handleSaveReward}>
                ✓ Save Reward
              </button>
              <button className="btn btn-outline" onClick={() => setShowRewardModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameModal;
