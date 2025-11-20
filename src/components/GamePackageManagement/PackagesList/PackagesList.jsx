/**
 * Component: PackagesList
 * Purpose: Display grid of game packages
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - Grid display of packages
 * - Create new package button
 * - Reload button
 *
 * @since 2025-11-20
 */

import React from 'react';
import PackageCard from './PackageCard';

function PackagesList({ events, selectedEvent, viewMode, onCreatePackage, onViewEvent, onReload }) {
  return (
    <div className="packages-section">
      <div className="packages-header">
        <button className="btn btn-success" onClick={onCreatePackage}>
          ➕ Create New Game Event
        </button>
        <button className="btn btn-outline" onClick={onReload}>
          🔄 Reload
        </button>
      </div>

      <div className="packages-grid">
        {events.map(event => (
          <PackageCard
            key={event.id}
            event={event}
            isSelected={selectedEvent?.id === event.id && viewMode}
            onView={onViewEvent}
          />
        ))}

        {events.length === 0 && (
          <div className="empty-state">
            <p>No game packages found. Create your first package to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PackagesList;
