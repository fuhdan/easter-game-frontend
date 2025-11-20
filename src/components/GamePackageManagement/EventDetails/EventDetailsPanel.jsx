/**
 * Component: EventDetailsPanel
 * Purpose: Event details panel with tab navigation
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - Tab navigation for event management
 * - Story, Games, Hints, Categories, Prompts tabs
 * - Close button
 *
 * @since 2025-11-20
 */

import React from 'react';
import EventStoryTab from './EventStoryTab';
import GamesTab from './GamesTab';
import HintsTab from './HintsTab';
import CategoriesTab from './CategoriesTab';
import PromptsTab from './PromptsTab';

function EventDetailsPanel({
  selectedEvent,
  eventDetailTab,
  packageFormData,
  categories,
  systemPrompts,
  onTabChange,
  onClose,
  onFormChange,
  onImageUpload,
  onClearImage,
  onSaveEvent,
  onCategoriesChanged,
  onPromptsChanged
}) {
  return (
    <div className="event-details-section">
      <div className="event-details-header">
        <h3>
          📋 Game Details: {selectedEvent.title} ({selectedEvent.year})
        </h3>
        <button className="btn btn-outline btn-sm" onClick={onClose}>
          ✕ Close
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="event-tabs">
        <button
          className={`tab-btn ${eventDetailTab === 'story' ? 'active' : ''}`}
          onClick={() => onTabChange('story')}
        >
          📖 Event Story
        </button>
        <button
          className={`tab-btn ${eventDetailTab === 'games' ? 'active' : ''}`}
          onClick={() => onTabChange('games')}
        >
          🎮 Games
        </button>
        <button
          className={`tab-btn ${eventDetailTab === 'hints' ? 'active' : ''}`}
          onClick={() => onTabChange('hints')}
        >
          💡 Training Hints
        </button>
        <button
          className={`tab-btn ${eventDetailTab === 'categories' ? 'active' : ''}`}
          onClick={() => onTabChange('categories')}
        >
          🏷️ Categories
        </button>
        <button
          className={`tab-btn ${eventDetailTab === 'prompts' ? 'active' : ''}`}
          onClick={() => onTabChange('prompts')}
        >
          🤖 System Prompts
        </button>
      </div>

      {/* Tab Content */}
      <div className="event-tab-content">
        {eventDetailTab === 'story' && (
          <EventStoryTab
            packageFormData={packageFormData}
            onFormChange={onFormChange}
            onImageUpload={onImageUpload}
            onClearImage={onClearImage}
            onSave={onSaveEvent}
          />
        )}

        {eventDetailTab === 'games' && <GamesTab />}

        {eventDetailTab === 'hints' && <HintsTab />}

        {eventDetailTab === 'categories' && (
          <CategoriesTab
            categories={categories}
            onCategoriesChanged={onCategoriesChanged}
          />
        )}

        {eventDetailTab === 'prompts' && (
          <PromptsTab
            systemPrompts={systemPrompts}
            onPromptsChanged={onPromptsChanged}
          />
        )}
      </div>
    </div>
  );
}

export default EventDetailsPanel;
