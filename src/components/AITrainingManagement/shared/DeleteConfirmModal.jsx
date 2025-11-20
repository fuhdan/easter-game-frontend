/**
 * Component: DeleteConfirmModal
 * Purpose: Reusable delete confirmation modal
 * Part of: Easter Quest 2025 Frontend - AI Training Management
 *
 * Features:
 * - Confirm deletion with warning
 * - Customizable title and message
 * - Callback on confirm
 *
 * @since 2025-11-20
 */

import React from 'react';

function DeleteConfirmModal({ title, itemName, itemDetails, warningMessage, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>⚠️ {title || 'Confirm Deletion'}</h3>
        <div className="modal-body">
          {itemName && <p><strong>Item:</strong> {itemName}</p>}
          {itemDetails && itemDetails.map((detail, index) => (
            <p key={index}><strong>{detail.label}:</strong> {detail.value}</p>
          ))}
          <p className="warning-text">
            ⚠️ {warningMessage || 'This action cannot be undone!'}
          </p>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline danger" onClick={onConfirm}>
            🗑️ Delete
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
