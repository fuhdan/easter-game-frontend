/**
 * Component: AdminNotificationsView
 * Purpose: Display admin broadcast messages (one-way notifications)
 * Part of: Easter Quest Frontend - Team Chat
 *
 * Features:
 * - Shows admin broadcasts to the team (read-only)
 * - Admin badge on each message
 * - Auto-scroll to latest
 * - Timestamps for each message
 *
 * Security:
 * - One-way communication only (users cannot reply in this channel)
 *
 * @since 2025-12-07
 */

import React, { useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { logger } from '../../utils/logger';
import './AdminNotificationsView.css';

/**
 * AdminNotificationsView - Read-only admin broadcast messages
 *
 * @returns {JSX.Element}
 */
const AdminNotificationsView = () => {
  const { adminNotifications } = useChat();
  const messageListRef = useRef(null);

  // Log when view is opened
  useEffect(() => {
    logger.info('admin_notifications_view_opened', {
      notificationCount: adminNotifications.length,
      module: 'AdminNotificationsView'
    });
  }, []); // Only log on mount

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageListRef.current && adminNotifications.length > 0) {
      logger.debug('admin_notifications_auto_scrolled', {
        notificationCount: adminNotifications.length,
        module: 'AdminNotificationsView'
      });
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [adminNotifications]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (adminNotifications.length === 0) {
    return (
      <div className="admin-notifications-empty">
        <div className="empty-state-icon">
          <span className="admin-icon">👑</span>
        </div>
        <p className="empty-state-title">Admin Notifications</p>
        <p className="empty-state-text">
          No announcements from administrators yet.
          <br />
          Important messages will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-notifications-container">
      <div className="admin-notifications-header">
        <span className="admin-notifications-icon">👑</span>
        <h4>Admin Notifications</h4>
        <span className="admin-notifications-count">{adminNotifications.length}</span>
      </div>

      <div className="admin-notifications-info">
        <span className="info-icon">ℹ️</span>
        <span>These are one-way announcements from administrators.</span>
      </div>

      <div ref={messageListRef} className="admin-notifications-messages">
        {adminNotifications.map((message, index) => {
          // Check if we need a date separator
          const showDateSeparator = index === 0 ||
            formatDate(message.created_at) !== formatDate(adminNotifications[index - 1].created_at);

          return (
            <React.Fragment key={message.id || index}>
              {showDateSeparator && (
                <div className="date-separator">
                  <span>{formatDate(message.created_at)}</span>
                </div>
              )}
              <div className="admin-notification-message">
                <div className="message-header">
                  <span className="admin-badge">
                    <span className="badge-icon">👑</span>
                    Admin
                  </span>
                  <span className="sender-name">
                    {message.sender_display_name || message.sender_username}
                  </span>
                </div>
                <div className="message-content">{message.content}</div>
                <div className="message-footer">
                  <span className="message-time">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(AdminNotificationsView);
