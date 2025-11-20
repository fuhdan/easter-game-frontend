/**
 * Component: HintsList
 * Purpose: Display list of training hints for a game
 * Part of: Easter Quest 2025 Frontend - AI Training Management
 *
 * Features:
 * - Display hint cards with type and level badges
 * - Show hint content and metadata
 * - Edit and delete actions
 * - Empty state when no hints exist
 *
 * @since 2025-11-20
 */

import React from 'react';
import { HINT_TYPES } from './HintModal';

/**
 * HintsList component - Display list of training hints
 *
 * @param {Object} props - Component props
 * @param {Array} props.hints - Array of hint objects
 * @param {Function} props.onEdit - Callback when edit button is clicked
 * @param {Function} props.onDelete - Callback when delete button is clicked
 * @returns {JSX.Element} Hints list or empty state
 *
 * @example
 * <HintsList
 *   hints={gameHints}
 *   onEdit={handleEditHint}
 *   onDelete={handleDeleteHint}
 * />
 */
function HintsList({ hints, onEdit, onDelete }) {
  // Empty state
  if (hints.length === 0) {
    return (
      <div className="hints-list">
        <div className="empty-state">
          <p>No training hints for this game yet.</p>
          <p>Click "Add Hint" to create one.</p>
        </div>
      </div>
    );
  }

  // Hints list
  return (
    <div className="hints-list">
      {hints.map(hint => (
        <div key={hint.id} className="hint-item">
          {/* Hint Header - Type and Level Badges */}
          <div className="hint-header">
            <span className={`hint-type-badge type-${hint.hint_type}`}>
              {HINT_TYPES[hint.hint_type] || hint.hint_type}
            </span>
            <span className={`hint-level-badge level-${hint.hint_level}`}>
              Level {hint.hint_level}
            </span>
          </div>

          {/* Hint Content */}
          <div className="hint-content">
            {hint.hint_content}
          </div>

          {/* Hint Metadata */}
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

          {/* Hint Actions */}
          <div className="hint-actions">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onEdit(hint)}
              aria-label={`Edit hint ${hint.id}`}
            >
              ✏️ Edit
            </button>
            <button
              className="btn btn-sm btn-outline danger"
              onClick={() => onDelete(hint)}
              aria-label={`Delete hint ${hint.id}`}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default HintsList;
