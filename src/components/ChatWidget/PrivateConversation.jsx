/**
 * Component: PrivateConversation
 * Purpose: Display 1-on-1 conversation with a team member
 * Part of: Easter Quest Frontend - Team Chat
 *
 * Features:
 * - Shows conversation history
 * - Auto-scroll to latest
 * - Differentiates sent/received messages
 * - Shows timestamps
 *
 * @since 2025-11-09
 */

import React, { useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import './PrivateConversation.css';

/**
 * PrivateConversation - 1-on-1 chat view
 *
 * @param {object} props
 * @param {object} props.user - Current user object
 * @returns {JSX.Element}
 */
const PrivateConversation = ({ user }) => {
  const { selectedTeamMember, privateConversations, lastError, setLastError } = useChat();
  const messageListRef = useRef(null);

  const messages = selectedTeamMember
    ? (privateConversations[selectedTeamMember.id] || [])
    : [];

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
  }, [messages]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!selectedTeamMember) {
    return (
      <div className="private-conversation-empty">
        <div className="empty-state-icon">💬</div>
        <p className="empty-state-title">Private Messages</p>
        <p className="empty-state-text">
          Select a team member to start chatting
        </p>
      </div>
    );
  }

  return (
    <div className="private-conversation-container">
      <div className="private-conversation-header">
        <div className="member-info">
          <h4>{selectedTeamMember.display_name || selectedTeamMember.username}</h4>
          <span className="member-username">@{selectedTeamMember.username}</span>
        </div>
      </div>

      <div ref={messageListRef} className="private-conversation-messages">
        {lastError && (
          <div className="team-chat-error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{lastError.message}</span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="conversation-start">
            <div className="conversation-start-avatar">
              {(selectedTeamMember.display_name || selectedTeamMember.username || '?').charAt(0).toUpperCase()}
            </div>
            <p>Start a conversation with {selectedTeamMember.display_name || selectedTeamMember.username}</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender_id === user?.id;

            return (
              <div
                key={message.id || index}
                className={`private-message ${isOwnMessage ? 'own' : 'received'}`}
              >
                <div className="message-content">{message.content}</div>
                <div className="message-footer">
                  <span className="message-time">
                    {formatTime(message.created_at)}
                  </span>
                  {message.is_read && isOwnMessage && (
                    <span className="message-read">✓✓</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PrivateConversation;
