/**
 * Component: TeamBroadcast
 * Purpose: Display team broadcast messages (team channel)
 * Part of: Easter Quest Frontend - Team Chat
 *
 * Features:
 * - Shows all team channel messages
 * - Auto-scroll to latest
 * - Sender names and timestamps
 * - Differentiates own messages
 *
 * @since 2025-11-09
 */

import React, { useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import './TeamBroadcast.css';

/**
 * TeamBroadcast - Team channel message view
 *
 * @param {object} props
 * @param {object} props.user - Current user object
 * @param {object} props.selectedTeam - (Optional) Selected team for admin broadcast view
 * @returns {JSX.Element}
 */
const TeamBroadcast = ({ user, selectedTeam }) => {
  const { teamBroadcastMessages, clearBroadcastUnread, lastError, setLastError } = useChat();
  const messageListRef = useRef(null);

  // Filter to show team broadcast messages
  // Use useMemo to avoid re-filtering on every render
  const teamMessages = React.useMemo(() => {
    return teamBroadcastMessages.filter(msg => {
      // If a specific team is selected (admin view), show ALL broadcasts for that team
      if (selectedTeam) {
        return msg.team_id === selectedTeam.id;
      }

      // Regular user view: exclude admin messages
      if (msg.sender_role === 'admin' || msg.sender_role === 'game_admin') {
        return false;
      }

      return true;
    });
  }, [teamBroadcastMessages, selectedTeam]);

  // Clear unread count when component mounts
  useEffect(() => {
    clearBroadcastUnread();
  }, [clearBroadcastUnread]);

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
  }, [teamMessages]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine header text based on context
  const headerTitle = selectedTeam ? `Broadcasting to ${selectedTeam.name}` : 'Team Channel';
  const emptyTitle = selectedTeam ? `Ready to Broadcast to ${selectedTeam.name}` : 'Team Channel';
  const emptyText = selectedTeam
    ? `Type your message below to send it to all members of ${selectedTeam.name}`
    : 'Send a message to your entire team!';

  if (teamMessages.length === 0) {
    return (
      <div className="team-broadcast-empty">
        <div className="empty-state-icon">📢</div>
        <p className="empty-state-title">{emptyTitle}</p>
        <p className="empty-state-text">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="team-broadcast-container">
      <div className="team-broadcast-header">
        <span className="team-broadcast-icon">📢</span>
        <h4>{headerTitle}</h4>
        <span className="team-broadcast-count">{teamMessages.length}</span>
      </div>

      <div ref={messageListRef} className="team-broadcast-messages">
        {lastError && (
          <div className="team-chat-error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{lastError.message}</span>
          </div>
        )}

        {teamMessages.map((message, index) => {
          const isOwnMessage = message.sender_id === user?.id;
          const isAdminMessage = message.sender_role === 'admin' || message.sender_role === 'game_admin';

          return (
            <div
              key={message.id || index}
              className={`team-broadcast-message ${isOwnMessage ? 'own' : 'other'} ${isAdminMessage ? 'admin-message' : ''}`}
            >
              {!isOwnMessage && (
                <div className="message-sender">
                  {message.sender_display_name || message.sender_username}
                  {isAdminMessage && (
                    <span className="admin-badge" title="Admin">Admin</span>
                  )}
                </div>
              )}

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

export default TeamBroadcast;
