/**
 * Component: CurrentGame
 * Purpose: Game selection and solution submission interface
 * Part of: Easter Quest Frontend
 *
 * Features:
 * - Display all available games with category badges
 * - Game selection from dropdown
 * - Solution input and validation
 * - Submission feedback (correct/incorrect)
 * - Progress tracking per game
 * - Category icons and colors
 *
 * @since 2025-08-27
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { submitSolution, startGame } from '../../services';
import { getMyTeamProgress } from '../../services/teams';
import { useChat } from '../../contexts/ChatContext';

/**
 * CurrentGame component - Game selection and solution submission
 *
 * @param {Object} props - Component props
 * @param {Array} props.games - Available games for current event
 * @param {Object} props.activeEvent - Current active event object
 * @param {Function} props.onSubmitSolution - Callback after successful submission
 * @returns {JSX.Element} Game selection interface or solution form
 *
 * @example
 * <CurrentGame
 *   games={eventGames}
 *   activeEvent={currentEvent}
 *   onSubmitSolution={reloadData}
 * />
 */
const CurrentGame = ({ games, activeEvent, showPoints = true, user, onSubmitSolution }) => {
  // Admin users can view games but not play them
  const isAdmin = user && user.role === 'admin';

  // Get chat context to refresh AI context banner when game state changes
  const { loadAIContext } = useChat();

  // DEBUG: Log to verify loadAIContext is available
  useEffect(() => {
    logger.debug('CurrentGame mounted - loadAIContext available:', !!loadAIContext);
  }, [loadAIContext]);

  const [selectedGame, setSelectedGame] = useState(null);
  const [solution, setSolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [startingGameId, setStartingGameId] = useState(null);

  // Use team progress data which includes both team status and user status
  const [teamProgressGames, setTeamProgressGames] = useState([]);

  useEffect(() => {
    loadGameProgress();
  }, []);

  // Reload game progress when games prop changes (e.g., after teammate starts/completes game)
  useEffect(() => {
    if (games && games.length > 0) {
      loadGameProgress();
      // BUGFIX: Also refresh AI context when games change (e.g., teammate completes game)
      if (loadAIContext) {
        loadAIContext();
      }
    }
  }, [games, loadAIContext]);

  /**
   * Load team progress to determine game availability and user status
   *
   * Uses /teams/me/progress which returns:
   * - status: Team-wide status (in_progress if ANY team member started)
   * - user_status: This user's individual status
   *
   * Admin users skip this since they don't have teams.
   *
   * @async
   * @returns {Promise<void>}
   */
  async function loadGameProgress() {
    // Skip for admin users (no team)
    if (isAdmin) {
      return;
    }

    try {
      const response = await getMyTeamProgress();
      if (response && response.games) {
        logger.debug('=== Team Progress Games ===');
        response.games.forEach(game => {
          logger.debug(`Game ${game.game_id}: ${game.game_title}`);
          logger.debug('  team status:', game.status);
          logger.debug('  user status:', game.user_status);
          logger.debug('---');
        });
        logger.debug('===========================');

        setTeamProgressGames(response.games);
      }
    } catch (err) {
      logger.error('Failed to load team progress:', err);
    }
  }

  /**
   * Check if a game is locked based on team progress status
   *
   * @param {Object} game - Game from team progress API
   * @param {string} game.status - Team-wide status (locked/not_started/in_progress/completed)
   * @returns {boolean} True if game is locked
   */
  function isGameLocked(game) {
    return game.status === 'locked';
  }

  /**
   * Get locked game message
   *
   * @returns {string} Lock message
   */
  function getLockedMessage() {
    return '🔒 Complete previous games first';
  }

  /**
   * Get category details for a game
   *
   * @param {Object} game - Game object from team progress API
   * @param {string} game.category_name - Flat category name from API
   * @param {string} game.category_icon - Flat category icon from API
   * @param {string} game.category_color - Flat category color from API
   * @returns {Object|null} Category object with name, icon, and color
   */
  function getCategoryForGame(game) {
    if (game.category_name) {
      return {
        name: game.category_name,
        icon: game.category_icon || '🎮',
        color: game.category_color || '#005da0'
      };
    }
    return null;
  }

  /**
   * Handle starting a game from the game list
   *
   * Calls the backend to create a GameProgress record with in_progress status.
   * Reloads progress and triggers parent refresh to update Team Progress panel.
   *
   * @param {number} gameId - ID of the game to start
   * @param {Event} e - Click event (to stop propagation)
   * @returns {Promise<void>}
   */
  const handleStartGame = async (gameId, e) => {
    e.stopPropagation(); // Prevent clicking the game card

    // SECURITY: Check if any game is already in progress for this user
    const hasActiveGame = teamProgressGames.some(
      game => game.user_status === 'in_progress'
    );

    if (hasActiveGame) {
      setMessage({
        type: 'error',
        text: 'You already have an active game! Complete it first.'
      });
      setTimeout(() => setMessage(null), 5000);
      return;
    }

    try {
      setStartingGameId(gameId);
      setMessage(null); // Clear any previous messages

      const result = await startGame(gameId);

      if (result.success) {
        // Reload progress to get the new status
        await loadGameProgress();
        // Trigger parent refresh to update Team Progress immediately
        if (onSubmitSolution) {
          onSubmitSolution();
        }
        // BUGFIX: Refresh AI context banner to show current game
        logger.debug('🎯 [CurrentGame] Game started successfully, calling loadAIContext', {
          gameId,
          hasLoadAIContext: !!loadAIContext
        });
        if (loadAIContext) {
          logger.debug('🎯 [CurrentGame] Calling loadAIContext NOW');
          loadAIContext();
          logger.debug('🎯 [CurrentGame] loadAIContext called');
        } else {
          logger.error('🎯 [CurrentGame] loadAIContext is NOT available!');
        }
      }
    } catch (err) {
      logger.error('Failed to start game:', err);

      // Show dependency error message if game is locked
      if (err.message && err.message.includes('locked')) {
        setMessage({
          type: 'error',
          text: err.message
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to start game. Please try again.'
        });
      }

      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setStartingGameId(null);
    }
  };

  /**
   * Handle solution form submission
   *
   * Submits user's answer to the backend, displays result message,
   * and reloads progress on success.
   *
   * @param {Event} e - Form submission event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!solution.trim() || !selectedGame) return;

    try {
      setSubmitting(true);
      setMessage(null);

      const result = await submitSolution(selectedGame.id, solution.trim());

      if (result.correct) {
        setMessage({ type: 'success', text: result.message });
        setSolution('');
        // Reload progress to update completed status
        loadGameProgress();
        // BUGFIX: Refresh AI context banner to show updated progress
        if (loadAIContext) {
          loadAIContext();
        }
        setTimeout(() => {
          setSelectedGame(null);
          onSubmitSolution();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit solution' });
    } finally {
      setSubmitting(false);
    }
  };

  // Use team progress games (has team status + user status + lock info)
  const gamesToRender = teamProgressGames.length > 0 ? teamProgressGames : [];

  if (gamesToRender.length === 0) {
    return (
      <div className="profile-card">
        <div className="card-header">
          🎮 Games
        </div>
        <div className="card-body">
          <p>No games available for this event.</p>
        </div>
      </div>
    );
  }

  // If a game is selected, show the solution form
  if (selectedGame) {
    return (
      <div className="profile-card">
        <div className="card-header">
          🎮 {selectedGame.title}
          <button
            onClick={() => setSelectedGame(null)}
            style={{
              float: 'right',
              padding: '5px 10px',
              background: '#ccc',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Games
          </button>
        </div>
        <div className="card-body">
          <p><strong>Question:</strong></p>
          <p>{selectedGame.challenge_text}</p>

          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div>
              <label htmlFor="solution"><strong>Your Answer:</strong></label>
              <input
                id="solution"
                type="text"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Enter your answer..."
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </div>

            {message && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  borderRadius: '4px',
                  background: message.type === 'success' ? '#d4edda' : '#f8d7da',
                  color: message.type === 'success' ? '#155724' : '#721c24'
                }}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !solution.trim()}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                background: '#005da0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting || !solution.trim() ? 'not-allowed' : 'pointer',
                opacity: submitting || !solution.trim() ? 0.6 : 1
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </form>

          <div style={{ marginTop: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
            <p><small><strong>Game Info:</strong></small></p>
            <p><small>
              {showPoints && <>Points: {selectedGame.points_value} | </>}
              Max Hints: {selectedGame.max_hints}
            </small></p>
            {selectedGame.difficulty_level && <p><small>Difficulty: {selectedGame.difficulty_level}</small></p>}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the list of games
  return (
    <div className="profile-card">
      <div className="card-header">
        🎮 Games ({gamesToRender.length})
      </div>
      <div className="card-body">
        {isAdmin ? (
          <div style={{
            marginBottom: '15px',
            padding: '10px 15px',
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '6px',
            color: '#155724'
          }}>
            <strong>Admin View:</strong> You can preview all game questions below. Admins cannot play games.
          </div>
        ) : (
          <p style={{ marginBottom: '15px' }}>
            Select a game to answer:
          </p>
        )}

        {/* Error message display */}
        {message && (
          <div
            style={{
              marginBottom: '15px',
              padding: '12px 15px',
              borderRadius: '6px',
              background: message.type === 'success' ? '#d4edda' : '#f8d7da',
              border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              color: message.type === 'success' ? '#155724' : '#721c24'
            }}
          >
            {message.text}
          </div>
        )}

        <div className="games-list">
          {gamesToRender.map((game) => {
            const category = getCategoryForGame(game);
            // Use user_status for individual user's progress
            const isCompleted = game.user_status === 'completed';
            const isStarted = game.user_status === 'in_progress' || game.user_status === 'completed';
            const isLocked = isGameLocked(game);
            const isStartingThisGame = startingGameId === game.game_id;

            // Admin view: all games appear locked (not clickable) but show real content
            const isAdminLocked = isAdmin;
            const effectivelyLocked = isAdmin ? true : isLocked;

            return (
              <div
                key={game.game_id}
                onClick={() => !isAdmin && !isLocked && isStarted && setSelectedGame(game)}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  border: `2px solid ${category?.color || '#005da0'}`,
                  borderRadius: '8px',
                  cursor: effectivelyLocked ? 'not-allowed' : (isStarted ? 'pointer' : 'default'),
                  transition: 'all 0.2s',
                  background: effectivelyLocked ? '#f8f9fa' : (isCompleted ? '#f0f8f0' : '#fff'),
                  opacity: isAdminLocked ? 0.7 : (isLocked ? 0.5 : (isCompleted ? 0.8 : 1))
                }}
                onMouseEnter={(e) => {
                  if (!effectivelyLocked && isStarted) {
                    e.currentTarget.style.background = isCompleted ? '#e0f0e0' : '#e8f4f8';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!effectivelyLocked && isStarted) {
                    e.currentTarget.style.background = isCompleted ? '#f0f8f0' : '#fff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  {/* Category Icon */}
                  <div
                    style={{
                      fontSize: '32px',
                      width: '50px',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: category?.color || '#005da0',
                      borderRadius: '8px',
                      flexShrink: 0
                    }}
                  >
                    {category?.icon || '🎮'}
                  </div>

                  {/* Game Content */}
                  <div style={{ flex: 1 }}>
                    {/* Game title */}
                    <h4 style={{ margin: '0 0 8px 0', color: isCompleted ? '#28a745' : '#333' }}>
                      {isCompleted && '✅ '}Game {game.order_index}
                    </h4>

                    {/* Admin view: show all questions with lock icon */}
                    {isAdmin ? (
                      <>
                        <p style={{
                          margin: '0',
                          fontSize: '15px',
                          color: '#333'
                        }}>
                          {game.game_challenge_text}
                        </p>
                        <p style={{
                          margin: '8px 0 0 0',
                          fontSize: '12px',
                          fontStyle: 'italic',
                          color: '#6c757d'
                        }}>
                          🔒 Admin preview only
                        </p>
                      </>
                    ) : isLocked ? (
                      /* Regular user: locked game */
                      <>
                        <p style={{
                          margin: '0 0 8px 0',
                          fontSize: '15px',
                          fontStyle: 'italic',
                          color: '#6c757d'
                        }}>
                          {getLockedMessage()}
                        </p>
                      </>
                    ) : (
                      /* Regular user: unlocked game */
                      <>
                        <p style={{
                          margin: '0 0 12px 0',
                          fontSize: '15px',
                          fontWeight: isCompleted ? 'normal' : '500',
                          color: '#333',
                          filter: isStarted ? 'none' : 'blur(5px)',
                          userSelect: isStarted ? 'auto' : 'none',
                          transition: 'filter 0.3s ease'
                        }}>
                          {game.game_challenge_text}
                        </p>

                        {/* Start Challenge Button - Only show if not started */}
                        {!isStarted && (
                          <button
                            onClick={(e) => handleStartGame(game.game_id, e)}
                            disabled={isStartingThisGame}
                            style={{
                              padding: '8px 20px',
                              fontSize: '14px',
                              fontWeight: '600',
                              background: 'linear-gradient(135deg, #005da0, #004271)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: isStartingThisGame ? 'not-allowed' : 'pointer',
                              opacity: isStartingThisGame ? 0.6 : 1,
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            onMouseEnter={(e) => {
                              if (!isStartingThisGame) {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                            }}
                          >
                            {isStartingThisGame ? '🎯 Starting...' : '🎯 Start Challenge'}
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Difficulty and Status */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {game.difficulty_level && (
                      <div
                        style={{
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background:
                            game.difficulty_level === 'easy' ? '#d4edda' :
                            game.difficulty_level === 'medium' ? '#fff3cd' :
                            game.difficulty_level === 'hard' ? '#f8d7da' : '#e9ecef',
                          color:
                            game.difficulty_level === 'easy' ? '#155724' :
                            game.difficulty_level === 'medium' ? '#856404' :
                            game.difficulty_level === 'hard' ? '#721c24' : '#495057',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          marginBottom: '8px'
                        }}
                      >
                        {game.difficulty_level}
                      </div>
                    )}
                    {showPoints && (
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: category?.color || '#005da0' }}>
                        {game.points_value} pts
                      </div>
                    )}
                    {!isAdmin && isCompleted && (
                      <div style={{ fontSize: '12px', color: '#28a745', marginTop: '4px', fontWeight: '600' }}>
                        COMPLETED
                      </div>
                    )}
                    {(isAdmin || isLocked) && (
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px', fontWeight: '600' }}>
                        🔒 {isAdmin ? 'PREVIEW' : 'LOCKED'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CurrentGame;