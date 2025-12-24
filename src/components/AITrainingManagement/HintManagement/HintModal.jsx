/**
 * Component: HintModal
 * Purpose: Modal for creating/editing training hints
 * Part of: Easter Quest 2025 Frontend - AI Training Management
 *
 * Features:
 * - Create/edit hint metadata
 * - Select hint type and level
 * - Set effectiveness score
 *
 * @since 2025-11-20
 */

import React from 'react';

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

function HintModal({ hint, hintForm, games, onFormChange, onSave, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{hint ? '✏️ Edit Training Hint' : '➕ Create Training Hint'}</h3>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="hint-game">Game:</label>
            <select
              id="hint-game"
              value={hintForm.game_id}
              onChange={(e) => onFormChange({ ...hintForm, game_id: e.target.value })}
              className="form-control"
              disabled={hint !== null}
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
              onChange={(e) => onFormChange({ ...hintForm, hint_type: e.target.value })}
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
              onChange={(e) => onFormChange({ ...hintForm, hint_level: e.target.value })}
              className="form-control"
            >
              {Object.entries(HINT_LEVELS).map(([key, label]) => (
                <option key={key} value={key}>Level {key}: {label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="min-progress">
                Min Progress (%):
                <span className="field-help">Hint shows when progress ≥ this value</span>
              </label>
              <input
                type="number"
                id="min-progress"
                value={hintForm.min_progress !== undefined ? hintForm.min_progress : 0}
                onChange={(e) => onFormChange({ ...hintForm, min_progress: parseInt(e.target.value) || 0 })}
                className="form-control"
                min="0"
                max="100"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="max-progress">
                Max Progress (%):
                <span className="field-help">Hint shows when progress ≤ this value</span>
              </label>
              <input
                type="number"
                id="max-progress"
                value={hintForm.max_progress !== undefined ? hintForm.max_progress : 100}
                onChange={(e) => onFormChange({ ...hintForm, max_progress: parseInt(e.target.value) || 100 })}
                className="form-control"
                min="0"
                max="100"
                placeholder="100"
              />
            </div>
          </div>

          <div className="progress-examples">
            <strong>Common Ranges:</strong>
            <div className="example-chips">
              <button
                type="button"
                className="chip"
                onClick={() => onFormChange({ ...hintForm, min_progress: 0, max_progress: 24 })}
              >
                0-24% (Discovery)
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => onFormChange({ ...hintForm, min_progress: 25, max_progress: 49 })}
              >
                25-49% (Found Game)
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => onFormChange({ ...hintForm, min_progress: 50, max_progress: 74 })}
              >
                50-74% (Gameplay)
              </button>
              <button
                type="button"
                className="chip"
                onClick={() => onFormChange({ ...hintForm, min_progress: 75, max_progress: 100 })}
              >
                75-100% (Advanced)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="hint-content">Hint Content:</label>
            <textarea
              id="hint-content"
              value={hintForm.hint_content}
              onChange={(e) => onFormChange({ ...hintForm, hint_content: e.target.value })}
              className="form-control"
              rows="4"
              placeholder="Enter the hint content..."
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-success" onClick={onSave}>
            ✓ Save Hint
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default HintModal;
export { HINT_TYPES, HINT_LEVELS };
