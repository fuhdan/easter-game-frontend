/**
 * Component: DeleteConfirmModal
 * Purpose: Confirmation modal for deletions
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - Confirm event deletion
 * - Confirm prompt deletion
 * - Display warning messages
 *
 * @since 2025-11-20
 */

import React from 'react';

function DeleteConfirmModal({ deleteTarget, onConfirm, onClose }) {
  if (!deleteTarget) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>⚠️ Confirm Deletion</h3>
        <div className="modal-body">
          {deleteTarget.type === 'event' && (
            <>
              <p><strong>Event:</strong> {deleteTarget.data.title}</p>
              <p><strong>Year:</strong> {deleteTarget.data.year}</p>
              <p><strong>Games:</strong> {deleteTarget.data.game_count}</p>
              <p className="warning-text">
                ⚠️ This will permanently delete the event and ALL associated games, training hints, and progress records!
              </p>
              <p className="warning-text">This action cannot be undone!</p>
            </>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={onConfirm}>
            🗑️ Yes, Delete Permanently
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
