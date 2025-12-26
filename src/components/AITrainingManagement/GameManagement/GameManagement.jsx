/**
 * Component: GameManagement
 * Purpose: Manage game content for AI training
 * Part of: Easter Quest 2025 Frontend - AI Training Management
 *
 * Features:
 * - List all games
 * - Create/edit/delete games
 * - Manage game metadata (difficulty, category, points, etc.)
 *
 * @since 2025-11-20
 */

import React, { useState } from 'react';
import { createGame, updateGame, deleteGame } from '../../../services';
import GameModal from './GameModal';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';
import { logger } from '../../../utils/logger';

function GameManagement({ games, events, categories, onGamesChanged }) {
  const [editingGame, setEditingGame] = useState(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showGameDeleteModal, setShowGameDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);

  const [gameForm, setGameForm] = useState({
    event_id: null,
    category_id: null,
    title: '',
    description: '',
    solution_password: '',
    challenge_text: '',
    ai_progress_guide: '',
    technical_skills: '',
    difficulty_level: 'medium',
    max_hints: 0,
    hint_penalty_points: null,
    points_value: 100,
    order_index: 0
  });

  /**
   * Open create game modal
   */
  const _handleCreateGame = () => {
    setEditingGame(null);
    setGameForm({
      event_id: null,
      category_id: null,
      title: '',
      description: '',
      solution_password: '',
      challenge_text: '',
      ai_progress_guide: '',
      technical_skills: '',
      difficulty_level: 'medium',
      max_hints: 0,
      hint_penalty_points: null,
      points_value: 100,
      order_index: games.length
    });
    setShowGameModal(true);
  };

  /**
   * Open edit game modal
   */
  const _handleEditGame = (game) => {
    setEditingGame(game);
    setGameForm({
      event_id: game.event_id,
      category_id: game.category_id || (categories.length > 0 ? categories[0].id : null),
      title: game.title,
      description: game.description,
      solution_password: game.solution_password,
      challenge_text: game.challenge_text || '',
      ai_progress_guide: game.ai_progress_guide || '',
      technical_skills: game.technical_skills || '',
      difficulty_level: game.difficulty_level || 'medium',
      max_hints: game.max_hints,
      hint_penalty_points: game.hint_penalty_points !== undefined ? game.hint_penalty_points : null,
      points_value: game.points_value,
      order_index: game.order_index
    });
    setShowGameModal(true);
  };

  /**
   * Save game (create or update)
   */
  const _handleSaveGame = async () => {
    try {
      if (editingGame) {
        // Update existing game
        await updateGame(editingGame.id, gameForm);
        logger.info('game_updated', {
          gameId: editingGame.id,
          gameTitle: gameForm.title,
          module: 'GameManagement'
        });
      } else {
        // Create new game
        await createGame(gameForm);
        logger.info('game_created', {
          gameTitle: gameForm.title,
          difficulty: gameForm.difficulty_level,
          module: 'GameManagement'
        });
      }

      setShowGameModal(false);
      setEditingGame(null);

      // Notify parent to reload
      if (onGamesChanged) {
        onGamesChanged();
      }
    } catch (error) {
      logger.error('game_save_failed', {
        isUpdate: !!editingGame,
        gameId: editingGame?.id,
        errorMessage: error.message,
        module: 'GameManagement'
      }, error);
      alert(`❌ Failed to save game: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Close game modal
   */
  const _handleCloseGameModal = () => {
    setShowGameModal(false);
    setEditingGame(null);
  };

  /**
   * Open delete game confirmation
   */
  const _handleDeleteGame = (game) => {
    setGameToDelete(game);
    setShowGameDeleteModal(true);
  };

  /**
   * Confirm delete game
   */
  const _confirmDeleteGame = async () => {
    try {
      await deleteGame(gameToDelete.id);
      logger.info('game_deleted', {
        gameId: gameToDelete.id,
        gameTitle: gameToDelete.title,
        module: 'GameManagement'
      });

      setShowGameDeleteModal(false);
      setGameToDelete(null);

      // Notify parent to reload
      if (onGamesChanged) {
        onGamesChanged();
      }
    } catch (error) {
      logger.error('game_delete_failed', {
        gameId: gameToDelete.id,
        errorMessage: error.message,
        module: 'GameManagement'
      }, error);
      alert(`❌ Failed to delete game: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Close delete modal
   */
  const _handleCloseDeleteModal = () => {
    setShowGameDeleteModal(false);
    setGameToDelete(null);
  };

  return (
    <>
      <div className="games-section">
        <div className="section-header">
          <h3>Game Content Management</h3>
          <button className="btn btn-primary" onClick={_handleCreateGame}>
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

                {game.ai_progress_guide && (
                  <div className="game-education">
                    <strong>🎓 Technical Skills:</strong> {game.technical_skills}
                  </div>
                )}

                {game.technical_skills && (
                  <div className="game-skills">
                    <strong>🔧 Skills:</strong> {game.technical_skills}
                  </div>
                )}

                <div className="game-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => _handleEditGame(game)}>
                    ✏️ Edit
                  </button>
                  <button className="btn btn-sm btn-outline danger" onClick={() => _handleDeleteGame(game)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Game Modal */}
      {showGameModal && (
        <GameModal
          game={editingGame}
          gameForm={gameForm}
          events={events}
          categories={categories}
          games={games}
          onFormChange={setGameForm}
          onSave={_handleSaveGame}
          onClose={_handleCloseGameModal}
        />
      )}

      {/* Delete Game Confirmation Modal */}
      {showGameDeleteModal && gameToDelete && (
        <DeleteConfirmModal
          title="Delete Game"
          itemName={gameToDelete.title}
          itemDetails={[
            { label: 'Category', value: gameToDelete.category?.name || 'Uncategorized' },
            { label: 'Points', value: `${gameToDelete.points_value} points` }
          ]}
          warningMessage="This will soft-delete the game (set to inactive). Associated hints and progress records will be preserved."
          onConfirm={_confirmDeleteGame}
          onClose={_handleCloseDeleteModal}
        />
      )}
    </>
  );
}

export default GameManagement;
