/**
 * Component: HintManagement
 * Purpose: Manage AI training hints for games
 * Part of: Easter Quest 2025 Frontend - AI Training Management
 *
 * Features:
 * - List all hints for a selected game
 * - Create/edit/delete individual hints
 * - Bulk delete all hints for a game (cleanup)
 * - Hint levels and types management
 *
 * @since 2025-11-20
 */

import React, { useState, useEffect } from 'react';
import { createHint, updateHint, deleteHint, bulkDeleteHints } from '../../../services';
import HintModal, { HINT_TYPES, HINT_LEVELS } from './HintModal';
import HintsList from './HintsList';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';
import { logger } from '../../../utils/logger';

function HintManagement({ games, onHintsChanged }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [hints, setHints] = useState([]);
  const [editingHint, setEditingHint] = useState(null);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [hintToDelete, setHintToDelete] = useState(null);
  const [gameToCleanup, setGameToCleanup] = useState(null);

  const [hintForm, setHintForm] = useState({
    game_id: '',
    hint_type: 'character_knowledge',
    hint_level: 1,
    hint_content: '',
    min_progress: 0,
    max_progress: 100
  });

  /**
   * Initialize selected game
   */
  useEffect(() => {
    if (games.length > 0 && !selectedGame) {
      setSelectedGame(games[0].id);
    }
  }, [games, selectedGame]);

  /**
   * Load hints when selected game changes
   */
  useEffect(() => {
    if (selectedGame && games.length > 0) {
      _loadHints();
    }
  }, [selectedGame, games]);

  /**
   * Load hints for selected game
   */
  const _loadHints = () => {
    const game = games.find(g => g.id === selectedGame);
    if (game) {
      setHints(game.hints || []);
    }
  };

  /**
   * Open create hint modal
   */
  const _handleCreateHint = () => {
    setEditingHint(null);
    setHintForm({
      game_id: selectedGame,
      hint_type: 'character_knowledge',
      hint_level: 1,
      hint_content: '',
      min_progress: 0,
      max_progress: 100
    });
    setShowHintModal(true);
  };

  /**
   * Open edit hint modal
   */
  const _handleEditHint = (hint) => {
    setEditingHint(hint);
    setHintForm({
      game_id: hint.game_id,
      hint_type: hint.hint_type,
      hint_level: hint.hint_level,
      hint_content: hint.hint_content,
      min_progress: hint.min_progress !== undefined ? hint.min_progress : 0,
      max_progress: hint.max_progress !== undefined ? hint.max_progress : 100
    });
    setShowHintModal(true);
  };

  /**
   * Save hint (create or update)
   */
  const _handleSaveHint = async () => {
    try {
      const hintData = {
        ...hintForm,
        game_id: parseInt(hintForm.game_id),
        hint_level: parseInt(hintForm.hint_level)
      };

      if (editingHint) {
        // Update existing hint
        await updateHint(editingHint.id, hintData);
        logger.info('hint_updated', {
          hintId: editingHint.id,
          hintType: hintData.hint_type,
          hintLevel: hintData.hint_level,
          module: 'HintManagement'
        });
      } else {
        // Create new hint
        await createHint(hintData);
        logger.info('hint_created', {
          gameId: hintData.game_id,
          hintType: hintData.hint_type,
          hintLevel: hintData.hint_level,
          module: 'HintManagement'
        });
      }

      setShowHintModal(false);
      setEditingHint(null);

      // Notify parent to reload
      if (onHintsChanged) {
        onHintsChanged();
      }
    } catch (error) {
      logger.error('hint_save_failed', {
        isUpdate: !!editingHint,
        hintId: editingHint?.id,
        errorMessage: error.message,
        module: 'HintManagement'
      }, error);
      alert(`❌ Failed to save hint: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Close hint modal
   */
  const _handleCloseHintModal = () => {
    setShowHintModal(false);
    setEditingHint(null);
  };

  /**
   * Open delete hint confirmation
   */
  const _handleDeleteHint = (hint) => {
    setHintToDelete(hint);
    setShowDeleteModal(true);
  };

  /**
   * Confirm delete hint
   */
  const _confirmDeleteHint = async () => {
    try {
      await deleteHint(hintToDelete.id);
      logger.info('hint_deleted', {
        hintId: hintToDelete.id,
        hintType: hintToDelete.hint_type,
        module: 'HintManagement'
      });

      setShowDeleteModal(false);
      setHintToDelete(null);

      // Notify parent to reload
      if (onHintsChanged) {
        onHintsChanged();
      }
    } catch (error) {
      logger.error('hint_delete_failed', {
        hintId: hintToDelete.id,
        errorMessage: error.message,
        module: 'HintManagement'
      }, error);
      alert(`❌ Failed to delete hint: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Close delete modal
   */
  const _handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setHintToDelete(null);
  };

  /**
   * Open bulk delete confirmation
   */
  const _handleBulkDelete = (gameId) => {
    const game = games.find(g => g.id === gameId);
    setGameToCleanup(game);
    setShowBulkDeleteModal(true);
  };

  /**
   * Confirm bulk delete
   */
  const _confirmBulkDelete = async () => {
    try {
      await bulkDeleteHints(gameToCleanup.id);
      logger.info('hints_bulk_deleted', {
        gameId: gameToCleanup.id,
        gameTitle: gameToCleanup.title,
        hintsCount: gameToCleanup.hints?.length || 0,
        module: 'HintManagement'
      });

      setShowBulkDeleteModal(false);
      setGameToCleanup(null);

      // Notify parent to reload
      if (onHintsChanged) {
        onHintsChanged();
      }
    } catch (error) {
      logger.error('hints_bulk_delete_failed', {
        gameId: gameToCleanup.id,
        errorMessage: error.message,
        module: 'HintManagement'
      }, error);
      alert(`❌ Failed to bulk delete hints: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Close bulk delete modal
   */
  const _handleCloseBulkDeleteModal = () => {
    setShowBulkDeleteModal(false);
    setGameToCleanup(null);
  };

  /**
   * Toggle hint active/inactive status
   */
  const _handleToggleActive = async (hint) => {
    try {
      await updateHint(hint.id, { is_active: !hint.is_active });
      logger.info('hint_toggled', {
        hintId: hint.id,
        newStatus: !hint.is_active ? 'active' : 'inactive',
        module: 'HintManagement'
      });

      // Notify parent to reload
      if (onHintsChanged) {
        onHintsChanged();
      }
    } catch (error) {
      logger.error('hint_toggle_failed', {
        hintId: hint.id,
        errorMessage: error.message,
        module: 'HintManagement'
      }, error);
      alert(`❌ Failed to toggle hint: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <>
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
                {game.title} ({game.hints?.length || 0} hints)
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={_handleCreateHint}>
            ➕ Add Hint
          </button>
          {selectedGame && (
            <button
              className="btn btn-outline danger"
              onClick={() => _handleBulkDelete(selectedGame)}
            >
              🗑️ Cleanup Game
            </button>
          )}
        </div>

        {/* Hints List */}
        <HintsList
          hints={hints}
          onEdit={_handleEditHint}
          onDelete={_handleDeleteHint}
          onToggleActive={_handleToggleActive}
        />
      </div>

      {/* Create/Edit Hint Modal */}
      {showHintModal && (
        <HintModal
          hint={editingHint}
          hintForm={hintForm}
          games={games}
          onFormChange={setHintForm}
          onSave={_handleSaveHint}
          onClose={_handleCloseHintModal}
        />
      )}

      {/* Delete Hint Confirmation Modal */}
      {showDeleteModal && hintToDelete && (
        <DeleteConfirmModal
          title="Delete Hint"
          itemDetails={[
            { label: 'Hint Type', value: HINT_TYPES[hintToDelete.hint_type] },
            { label: 'Level', value: hintToDelete.hint_level },
            { label: 'Content', value: hintToDelete.hint_content }
          ]}
          warningMessage="This action cannot be undone. Are you sure?"
          onConfirm={_confirmDeleteHint}
          onClose={_handleCloseDeleteModal}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && gameToCleanup && (
        <DeleteConfirmModal
          title="Cleanup Old Game Year"
          itemName={gameToCleanup.title}
          itemDetails={[
            { label: 'Current Hints', value: `${gameToCleanup.hints?.length || 0} hints` }
          ]}
          warningMessage={`This will permanently delete ALL ${gameToCleanup.hints?.length || 0} training hints for this game. This action cannot be undone!`}
          onConfirm={_confirmBulkDelete}
          onClose={_handleCloseBulkDeleteModal}
        />
      )}
    </>
  );
}

export default HintManagement;
