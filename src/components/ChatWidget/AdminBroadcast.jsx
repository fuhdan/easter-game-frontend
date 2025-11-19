/**
 * Component: AdminBroadcast
 * Purpose: Display admin broadcast messages only
 * Part of: Easter Quest Frontend - Team Chat
 *
 * Features:
 * - Shows only broadcast messages from admins
 * - Auto-scroll to latest
 * - Sender names and timestamps
 * - Differentiated styling from team broadcasts
 *
 * @since 2025-11-15
 */

import React, { useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import './AdminBroadcast.css';

/**
 * AdminBroadcast - Admin broadcast message view
 *
 * @param {object} props
 * @param {object} props.user - Current user object
 * @returns {JSX.Element}
 */
const AdminBroadcast = ({ user }) => {
  const { teamBroadcastMessages, lastError, setLastError } = useChat();
  const messageListRef = useRef(null);

  // Filter to show only admin broadcast messages
  // Use useMemo to avoid re-filtering on every render
  const adminMessages = React.useMemo(() => {
    return teamBroadcastMessages.filter(msg => {
      return msg.sender_role === 'admin' || msg.sender_role === 'super_admin';
    });
  }, [teamBroadcastMessages]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (lastError) {
      const timer = setTimeout(() => {
        setLastError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastError, setLastError]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [adminMessages]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (adminMessages.length === 0) {
    return (
      <div className="admin-broadcast-empty">
        <div className="empty-state-icon">📢</div>
        <p className="empty-state-title">Admin Support</p>
        <p className="empty-state-text">
          No messages from admins yet.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-broadcast-container">
      <div className="admin-broadcast-header">
        <span className="admin-broadcast-icon">📢</span>
        <h4>Admin Announcements</h4>
        <span className="admin-broadcast-count">{adminMessages.length}</span>
      </div>

      <div ref={messageListRef} className="admin-broadcast-messages">
        {lastError && (
          <div className="admin-chat-error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{lastError.message}</span>
          </div>
        )}

        {adminMessages.map((message, index) => {
          return (
            <div
              key={message.id || index}
              className="admin-broadcast-message"
            >
              <div className="message-sender">
                {message.sender_display_name || message.sender_username}
                <span className="admin-badge" title="Admin">Admin</span>
              </div>

              <div className="message-content">{message.content}</div>

              <div className="message-footer">
                <span className="message-time">
                  {formatTime(message.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(AdminBroadcast);
