/**
 * Component: CurrentGame
 * Purpose: Display games and solution input
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const CurrentGame = ({ games, activeEvent, onSubmitSolution }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [solution, setSolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [gameProgress, setGameProgress] = useState({});

  useEffect(() => {
    loadCategories();
    loadGameProgress();
  }, []);

  /**
   * Load category data to display icons and colors.
   */
  async function loadCategories() {
    try {
      const response = await api.aiTraining.getCategories(true);
      setCategories(response.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  /**
   * Load game progress to determine which games are completed.
   */
  async function loadGameProgress() {
    try {
      const response = await api.games.getAll();
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
   * Get category details for a game.
   * Now using category fields directly from the game object.
   */
  function getCategoryForGame(game) {
    // If game has category info, use it directly
    if (game.category_name) {
      return {
        name: game.category_name,
        icon: game.category_icon || '🎮',
        color: game.category_color || '#005da0'
      };
    }
    // Fallback to looking up by name if available
    return categories.find(cat => cat.name === game.category_name) || null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!solution.trim() || !selectedGame) return;

    try {
      setSubmitting(true);
      setMessage(null);

      const result = await api.games.submitSolution(selectedGame.id, solution.trim());

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
          <p>{selectedGame.description}</p>

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

            return (
              <div
                key={game.id}
                onClick={() => setSelectedGame(game)}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  border: `2px solid ${category?.color || '#005da0'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isCompleted ? '#f0f8f0' : '#fff',
                  opacity: isCompleted ? 0.8 : 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isCompleted ? '#e0f0e0' : '#e8f4f8';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isCompleted ? '#f0f8f0' : '#fff';
                  e.currentTarget.style.transform = 'translateY(0)';
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

                    {/* Challenge text (always shown) */}
                    <p style={{
                      margin: isCompleted ? '8px 0 0 0' : '0',
                      fontSize: '15px',
                      fontWeight: isCompleted ? 'normal' : '500',
                      color: '#333'
                    }}>
                      {game.challenge_text || game.description}
                    </p>
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