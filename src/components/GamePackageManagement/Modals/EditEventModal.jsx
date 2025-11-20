/**
 * Component: EditEventModal
 * Purpose: Modal for editing event details
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - Edit event title, description, author
 * - Upload event image
 * - Edit story HTML
 * - Toggle active status
 *
 * @since 2025-11-20
 */

import React from 'react';

function EditEventModal({
  event,
  formData,
  onFormChange,
  onImageUpload,
  onClearImage,
  onSave,
  onClose
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <h3>✏️ Edit Event: {event.title}</h3>
        <div className="modal-body">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Author</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => onFormChange({ ...formData, author: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Event Image (optional)</label>
            <div className="image-upload-container">
              <input
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                className="image-upload-input"
              />
              {formData.image_data && (
                <div className="image-preview-wrapper">
                  <img
                    src={`data:image/png;base64,${formData.image_data}`}
                    alt="Preview"
                    className="image-upload-preview"
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={onClearImage}
                  >
                    🗑️ Remove Image
                  </button>
                </div>
              )}
              <small className="image-upload-hint">
                Max size: 2MB. Stored in database with event.
              </small>
            </div>
          </div>

          <div className="form-group">
            <label>Story HTML *</label>
            <textarea
              value={formData.story_html}
              onChange={(e) => onFormChange({ ...formData, story_html: e.target.value })}
              rows="10"
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => onFormChange({ ...formData, is_active: e.target.checked })}
              />
              Active
            </label>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-success" onClick={onSave}>
            ✓ Save Changes
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditEventModal;
