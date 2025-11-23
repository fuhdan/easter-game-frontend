/**
 * Component: PlayerManagementTab
 * Purpose: Wrapper for PlayerManagement component as a Team Management tab
 * Part of: Easter Quest Frontend - Team Management Module
 *
 * Features:
 * - Standalone wrapper for PlayerManagement component
 * - Self-contained state management
 * - Notification system integration
 * - Admin and game_admin access only
 *
 * @module components/TeamManagement
 * @since 2025-11-23
 */

import React, { useState } from 'react';
import PlayerManagement from './PlayerManagement';
import './PlayerManagementTab.css';

/**
 * PlayerManagementTab component - Player management interface for admins
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - Current authenticated user (must be admin or game_admin)
 * @returns {JSX.Element} Player management tab content
 *
 * @example
 * <PlayerManagementTab user={currentUser} />
 */
function PlayerManagementTab({ user }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [notification, setNotification] = useState(null);

  /**
   * Show notification toast
   *
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   */
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  /**
   * Render notification toast if present
   */
  const renderNotification = () => {
    if (!notification) return null;

    const typeClasses = {
      success: 'notification-success',
      error: 'notification-error',
      warning: 'notification-warning',
      info: 'notification-info'
    };

    return (
      <div className={`notification-toast ${typeClasses[notification.type] || 'notification-info'}`}>
        <div className="notification-content">
          <span className="notification-message">{notification.message}</span>
          <button
            className="notification-close"
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="player-management-tab">
      {/* Notification Toast */}
      {renderNotification()}

      {/* Progress Bar (if loading) */}
      {loading && progress > 0 && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            {progress}%
          </div>
        </div>
      )}

      {/* Player Management Component */}
      <PlayerManagement
        players={players}
        setPlayers={setPlayers}
        showNotification={showNotification}
        loading={loading}
        setLoading={setLoading}
        setProgress={setProgress}
      />
    </div>
  );
}

export default PlayerManagementTab;
