/**
 * Component: PackageCard
 * Purpose: Individual game package card display
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - Display package info (year, title, author)
 * - Show stats (game count, created date)
 * - View details button
 *
 * @since 2025-11-20
 */

import React from 'react';

function PackageCard({ event, isSelected, onView }) {
  return (
    <div
      className={`package-card ${!event.is_active ? 'archived' : ''} ${isSelected ? 'selected' : ''}`}
    >
      <div className="card-header">
        <div className="card-title">
          <span className="year-badge">{event.year}</span>
          <h4>{event.title}</h4>
        </div>
        <div className="card-status">
          {event.is_active ? (
            <span className="badge badge-success">Active</span>
          ) : (
            <span className="badge badge-secondary">Archived</span>
          )}
        </div>
      </div>

      <div className="card-body">
        {event.description && (
          <p className="description">{event.description}</p>
        )}
        {event.author && (
          <p className="author">Author: {event.author}</p>
        )}
        <div className="card-stats">
          <span>🎯 {event.game_count} Games</span>
          <span>📅 Created: {new Date(event.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="card-actions">
        <button
          className="btn btn-info btn-sm"
          onClick={() => onView(event)}
        >
          📋 Game Details
        </button>
      </div>
    </div>
  );
}

export default PackageCard;
