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
import { getAllGames, submitSolution } from '../../services';

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
const CurrentGame = ({ games, activeEvent, onSubmitSolution }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [solution, setSolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [gameProgress, setGameProgress] = useState({});

  useEffect(() => {
    loadGameProgress();
  }, []);

  /**
   * Load game progress to determine which games are completed
   *
   * Fetches user's progress for all games to mark completed games
   * and prevent re-submission.
   *
   * Also applies sequential unlock logic - only the first incomplete
   * game is available, all games after it are locked.
   *
   * @async
   * @returns {Promise<void>}
   */
  async function loadGameProgress() {
    try {
      const response = await getAllGames();
      const progressMap = {};
      if (response && response.games) {
        response.games.forEach(game => {
          if (game.progress) {
            progressMap[game.id] = game.progress;
          }
        });
      }
      setGameProgress(progressMap);
    } catch (err) {
      console.error('Failed to load game progress:', err);
    }
  }

  /**
   * Check if a game is locked based on sequential progression
   *
   * Games must be completed in order. A game is locked if any
   * previous game (lower order_index) is not completed.
   *
   * @param {Object} game - Game to check
   * @param {number} game.order_index - Game's position in sequence
   * @returns {boolean} True if game is locked
   */
  function isGameLocked(game) {
    if (!games || !gameProgress) return false;

    // Find all games with lower order_index
    const previousGames = games.filter(g => g.order_index < game.order_index);

    // Game is locked if any previous game is not completed
    return previousGames.some(prevGame => {
      const progress = gameProgress[prevGame.id];
      return !progress || progress.status !== 'completed';
    });
  }

  /**
   * Get category details for a game
   *
   * Extracts category information (name, icon, color) from the game object.
   * Falls back to category lookup if direct fields are not available.
   *
   * @param {Object} game - Game object
   * @param {string} [game.category_name] - Category name from game
   * @param {string} [game.category_icon] - Category icon emoji
   * @param {string} [game.category_color] - Category color hex
   * @returns {Object|null} Category object with name, icon, and color
   * @returns {string} return.name - Category name
   * @returns {string} return.icon - Category icon emoji
   * @returns {string} return.color - Category color (hex)
   *
   * @example
   * const category = getCategoryForGame(game);
   * // Returns: { name: 'Puzzle', icon: '🧩', color: '#FF5733' }
   */
  function getCategoryForGame(game) {
    // Games have embedded category info - use it directly
    if (game.category_name) {
      return {
        name: game.category_name,
        icon: game.category_icon || '🎮',
        color: game.category_color || '#005da0'
      };
    }
    // No category info available
    return null;
  }

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

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setSolution('');
        // Reload progress to update completed status
        loadGameProgress();
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

  if (!games || games.length === 0) {
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
          <p>{selectedGame.challenge_text || selectedGame.description}</p>

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
            <p><small>Points: {selectedGame.points_value} | Max Hints: {selectedGame.max_hints}</small></p>
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
        🎮 Games ({games.length})
      </div>
      <div className="card-body">
        <p style={{ marginBottom: '15px' }}>
          Select a game to answer:
        </p>

        <div className="games-list">
          {games.map((game) => {
            const category = getCategoryForGame(game);
            const progress = gameProgress[game.id];
            const isCompleted = progress && progress.status === 'completed';
            const isLocked = isGameLocked(game);

            return (
              <div
                key={game.id}
                onClick={() => !isLocked && setSelectedGame(game)}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  border: `2px solid ${category?.color || '#005da0'}`,
                  borderRadius: '8px',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  background: isLocked ? '#f8f9fa' : (isCompleted ? '#f0f8f0' : '#fff'),
                  opacity: isLocked ? 0.5 : (isCompleted ? 0.8 : 1)
                }}
                onMouseEnter={(e) => {
                  if (!isLocked) {
                    e.currentTarget.style.background = isCompleted ? '#e0f0e0' : '#e8f4f8';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLocked) {
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
                    {/* Show title and description only if completed */}
                    {isCompleted && (
                      <>
                        <h4 style={{ margin: '0 0 8px 0', color: '#28a745' }}>
                          ✅ {game.order_index}. {game.title}
                        </h4>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                          {game.description.substring(0, 100)}
                          {game.description.length > 100 ? '...' : ''}
                        </p>
                      </>
                    )}

                    {/* Locked game message or challenge text */}
                    {isLocked ? (
                      <p style={{
                        margin: '0',
                        fontSize: '15px',
                        fontStyle: 'italic',
                        color: '#6c757d'
                      }}>
                        🔒 Complete previous games to unlock Game {game.order_index}
                      </p>
                    ) : (
                      <p style={{
                        margin: isCompleted ? '8px 0 0 0' : '0',
                        fontSize: '15px',
                        fontWeight: isCompleted ? 'normal' : '500',
                        color: '#333'
                      }}>
                        {game.challenge_text || game.description}
                      </p>
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
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: category?.color || '#005da0' }}>
                      {game.points_value} pts
                    </div>
                    {isCompleted && (
                      <div style={{ fontSize: '12px', color: '#28a745', marginTop: '4px', fontWeight: '600' }}>
                        COMPLETED
                      </div>
                    )}
                    {isLocked && (
                      <div style={{ fontSize: '12px', color: '#721c24', marginTop: '4px', fontWeight: '600' }}>
                        🔒 LOCKED
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