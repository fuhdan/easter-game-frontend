/**
 * Component: EventManagement
 * Purpose: Manage event stories for AI training
 * Part of: Easter Quest 2025 Frontend - AI Training Management
 *
 * Features:
 * - List all events
 * - Edit event stories
 * - Update event metadata
 *
 * @since 2025-11-20
 */

import React, { useState } from 'react';
import { updateEvent } from '../../../services';
import EventModal from './EventModal';
import { logger } from '../../../utils/logger';

function EventManagement({ events, onEventsChanged }) {
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    story_html: '',
    description: '',
    author: ''
  });

  /**
   * Open edit event modal
   */
  const _handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title || '',
      story_html: event.story_html || '',
      description: event.description || '',
      author: event.author || ''
    });
    setShowEventModal(true);
  };

  /**
   * Save event changes
   */
  const _handleSaveEvent = async () => {
    try {
      await updateEvent(editingEvent.id, eventForm);
      logger.info('event_updated', {
        eventId: editingEvent.id,
        eventTitle: eventForm.title,
        module: 'EventManagement'
      });

      setShowEventModal(false);
      setEditingEvent(null);

      // Notify parent to reload
      if (onEventsChanged) {
        onEventsChanged();
      }
    } catch (error) {
      logger.error('event_save_failed', {
        eventId: editingEvent.id,
        errorMessage: error.message,
        module: 'EventManagement'
      }, error);
      alert(`❌ Failed to save event: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Close modal
   */
  const _handleCloseModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
  };

  return (
    <>
      <div className="events-section">
        <div className="section-header">
          <h3>Event Story Management</h3>
        </div>

        <div className="events-list">
          {events.length === 0 ? (
            <div className="empty-state">
              <p>No events found.</p>
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="event-item">
                <div className="event-header">
                  <h4>{event.year} - {event.title}</h4>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => _handleEditEvent(event)}
                  >
                    ✏️ Edit Story
                  </button>
                </div>
                <div className="event-details">
                  {event.author && (
                    <p><strong>Author:</strong> {event.author}</p>
                  )}
                  {event.description && (
                    <p><strong>Description:</strong> {event.description}</p>
                  )}
                  <p><strong>Games:</strong> {event.game_count || 0}</p>
                  <p><strong>Status:</strong>
                    <span className={`status-badge ${event.is_active ? 'active' : 'inactive'}`}>
                      {event.is_active ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Event Modal */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          eventForm={eventForm}
          onFormChange={setEventForm}
          onSave={_handleSaveEvent}
          onClose={_handleCloseModal}
        />
      )}
    </>
  );
}

export default EventManagement;
