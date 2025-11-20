/**
 * Component: EventModal
 * Purpose: Modal for editing event story and metadata
 * Part of: Easter Quest 2025 Frontend - AI Training Management
 *
 * Features:
 * - Edit event title, author, description
 * - Edit story HTML content
 * - Form validation
 *
 * @since 2025-11-20
 */

import React from 'react';

function EventModal({ event, eventForm, onFormChange, onSave, onClose }) {
  if (!event) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <h3>✏️ Edit Event Story - {event.year}</h3>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="event-title">Event Title</label>
            <input
              type="text"
              id="event-title"
              value={eventForm.title}
              onChange={(e) => onFormChange({ ...eventForm, title: e.target.value })}
              className="form-control"
              placeholder="e.g., Faust - The Quest for Knowledge"
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-author">Author</label>
            <input
              type="text"
              id="event-author"
              value={eventForm.author}
              onChange={(e) => onFormChange({ ...eventForm, author: e.target.value })}
              className="form-control"
              placeholder="e.g., Johann Wolfgang von Goethe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-description">Description (Optional)</label>
            <textarea
              id="event-description"
              value={eventForm.description}
              onChange={(e) => onFormChange({ ...eventForm, description: e.target.value })}
              className="form-control"
              rows="3"
              placeholder="Brief description of the event theme"
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-story">Story HTML</label>
            <textarea
              id="event-story"
              value={eventForm.story_html}
              onChange={(e) => onFormChange({ ...eventForm, story_html: e.target.value })}
              className="form-control"
              rows="20"
              placeholder="Full HTML story content..."
              style={{ fontFamily: 'monospace', fontSize: '0.9em' }}
            />
            <small className="form-hint">
              This is the main story HTML that will be displayed to players.
              Can include HTML tags for formatting.
            </small>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-success" onClick={onSave}>
            ✓ Save Event
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventModal;
