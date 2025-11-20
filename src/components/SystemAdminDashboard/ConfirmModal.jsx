/**
 * Component: ConfirmModal
 * Purpose: Confirmation modal for configuration changes
 * Part of: Easter Quest 2025 Frontend - System Administration
 *
 * Features:
 * - Display change details (key, old value, new value)
 * - Confirm/Cancel actions
 * - Warning message
 *
 * @since 2025-11-20
 */

import React from 'react';

/**
 * ConfirmModal - Configuration change confirmation dialog
 *
 * @param {Object} props
 * @param {Object} props.pendingChange - Pending configuration change
 * @param {Object} props.pendingChange.config - Configuration being changed
 * @param {string} props.pendingChange.newValue - New value to apply
 * @param {Function} props.onConfirm - Confirm button callback
 * @param {Function} props.onClose - Close/Cancel callback
 * @returns {JSX.Element}
 *
 * @example
 * <ConfirmModal
 *   pendingChange={{ config: {...}, newValue: "42" }}
 *   onConfirm={handleConfirmChange}
 *   onClose={() => setShowModal(false)}
 * />
 */
function ConfirmModal({ pendingChange, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>⚠️ Confirm Configuration Change</h3>
        <div className="modal-body">
          <p><strong>Key:</strong> {pendingChange.config.key}</p>
          <p><strong>Current Value:</strong> {pendingChange.config.value}</p>
          <p><strong>New Value:</strong> {pendingChange.newValue}</p>
          <p className="warning-text">
            ⚠️ This change will take effect immediately for all users. Are you sure?
          </p>
        </div>
        <div className="modal-actions">
          <button className="btn btn-success" onClick={onConfirm}>
            ✓ Confirm Change
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
