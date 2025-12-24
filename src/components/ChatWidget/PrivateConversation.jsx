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
import { logger } from '../../utils/logger';
import './PrivateConversation.css';

/**
 * PrivateConversation - 1-on-1 chat view
 *
 * @param {object} props
 * @param {object} props.user - Current user object
 * @param {object} [props.conversationWith] - Optional user to show conversation with
 *                                            (overrides selectedTeamMember)
 * @returns {JSX.Element}
 */
const PrivateConversation = ({ user, conversationWith }) => {
  const { selectedTeamMember, privateConversations, lastError, setLastError } = useChat();
  const messageListRef = useRef(null);

  // Use conversationWith prop if provided, otherwise use selectedTeamMember
  const otherParty = conversationWith || selectedTeamMember;

  const messages = otherParty
    ? (privateConversations[otherParty.id] || [])
    : [];

  // Log when conversation view changes
  useEffect(() => {
    if (otherParty) {
      logger.debug('private_conversation_opened', {
        otherUserId: otherParty.id,
        otherUsername: otherParty.username,
        isAdminChat: otherParty.role === 'admin' || otherParty.role === 'game_admin',
        messageCount: messages.length,
        module: 'PrivateConversation'
      });
    }
  }, [otherParty?.id]); // Only log when the conversation partner changes

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (lastError) {
      logger.warn('private_conversation_error_displayed', {
        errorMessage: lastError.message,
        otherUserId: otherParty?.id,
        module: 'PrivateConversation'
      });

      const timer = setTimeout(() => {
        logger.debug('private_conversation_error_dismissed', {
          module: 'PrivateConversation'
        });
        setLastError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastError, setLastError, otherParty?.id]);

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

  if (!otherParty) {
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

  // Check if the other party is an admin
  const isAdminChat = otherParty.role === 'admin' || otherParty.role === 'game_admin';

  return (
    <div className={`private-conversation-container ${isAdminChat ? 'admin-chat' : ''}`}>
      <div className={`private-conversation-header ${isAdminChat ? 'admin-chat-header' : ''}`}>
        <div className="member-info">
          <h4>{otherParty.display_name || otherParty.username}</h4>
          <span className="member-username">@{otherParty.username}</span>
          {isAdminChat && <span className="admin-badge-small">Admin</span>}
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
            <div className={`conversation-start-avatar ${isAdminChat ? 'admin-avatar' : ''}`}>
              {(otherParty.display_name || otherParty.username || '?').charAt(0).toUpperCase()}
            </div>
            <p>Start a conversation with {otherParty.display_name || otherParty.username}</p>
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
