/**
 * Component: EventStoryTab
 * Purpose: Edit event story and metadata
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

function EventStoryTab({
  packageFormData,
  onFormChange,
  onImageUpload,
  onClearImage,
  onSave
}) {
  return (
    <div className="event-story-tab">
      <div className="form-group">
        <label>Event Title *</label>
        <input
          type="text"
          value={packageFormData.title}
          onChange={(e) => onFormChange({ ...packageFormData, title: e.target.value })}
          placeholder="e.g., Faust - The Quest for Knowledge 2024"
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={packageFormData.description}
          onChange={(e) => onFormChange({ ...packageFormData, description: e.target.value })}
          rows="3"
        />
      </div>

      <div className="form-group">
        <label>Author</label>
        <input
          type="text"
          value={packageFormData.author}
          onChange={(e) => onFormChange({ ...packageFormData, author: e.target.value })}
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
          {packageFormData.image_data && (
            <div className="image-preview-wrapper">
              <img
                src={`data:image/png;base64,${packageFormData.image_data}`}
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
          value={packageFormData.story_html}
          onChange={(e) => onFormChange({ ...packageFormData, story_html: e.target.value })}
          rows="15"
          placeholder="Full HTML story text displayed on main game screen"
        />
        <small className="placeholder-hint">
          💡 <strong>Tip:</strong> Use{' '}
          <code className="placeholder-code">
            {'<img src="{{EVENT_IMAGE}}" alt="Event Image" />'}
          </code>
          {' '}to insert the uploaded image anywhere in your story.
        </small>
      </div>

      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            checked={packageFormData.is_active}
            onChange={(e) => onFormChange({ ...packageFormData, is_active: e.target.checked })}
          />
          Active (visible to users)
        </label>
      </div>

      <div className="form-actions">
        <button className="btn btn-success" onClick={onSave}>
          ✓ Save Changes
        </button>
      </div>
    </div>
  );
}

export default EventStoryTab;
