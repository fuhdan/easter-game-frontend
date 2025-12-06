/**
 * Component: ChatBody
 * Purpose: Chat message display area with multi-mode support
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - AI/Admin message display with timestamps
 * - Team chat views (broadcast and private)
 * - Team member list sidebar
 * - Admin contacts list (for players)
 * - Admin team list (for admins)
 * - Auto-scroll to latest messages
 * - AI context display (current game, team progress)
 * - Typing indicators
 * - Connection status messages
 *
 * @since 2025-11-09
 */

import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import TeamMemberList from './TeamMemberList';
import AdminTeamList from './AdminTeamList';
import PrivateConversation from './PrivateConversation';
import TeamBroadcast from './TeamBroadcast';
import './ChatBody.css';

/**
 * ChatBody component - Message display area with multi-mode support
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @param {number} props.user.id - User ID
 * @param {string} props.user.role - User role
 * @returns {JSX.Element} Chat message display area
 *
 * @example
 * <ChatBody user={currentUser} />
 */
const ChatBody = ({ user }) => {
  const { messages, chatMode, aiContext, isTyping, connectionStatus, selectedTeamMember, selectTeamMember, selectedTeam } = useChat();
  const messageListRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  /**
   * Check if user has scrolled away from bottom
   */
  const checkScrollPosition = () => {
    if (!messageListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  /**
   * Scroll message list to bottom
   *
   * @param {boolean} [smooth=true] - Use smooth scrolling
   */
  const scrollToBottom = (smooth = true) => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  };

  useEffect(() => {
    if (shouldAutoScroll.current) scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    scrollToBottom(false);
  }, [chatMode]);

  /**
   * Format timestamp to readable time
   *
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time (HH:MM AM/PM)
   */
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Render individual message with appropriate styling
   *
   * @param {Object} message - Message object
   * @param {string} message.id - Message ID
   * @param {string} message.type - Message type (user/ai/admin/system)
   * @param {string} message.content - Message content
   * @param {string} message.timestamp - Message timestamp
   * @param {Object} [message.metadata] - Optional metadata
   * @returns {JSX.Element} Rendered message
   */
  const renderMessage = (message) => {
    const { id, type, sender_type, sender_name, content, timestamp, metadata } = message;

    // Check if this is an error message
    const isError = type === 'system' && (
      content.startsWith('Error:') ||
      metadata?.error_type === 'general_error'
    );

    // Helper to get escalation status badge
    const getEscalationBadge = () => {
      // Check metadata for escalation status
      const status = metadata?.status;
      if (!status) return null;

      const statusConfig = {
        open: { label: 'New', emoji: '🔴', color: '#dc3545' },  // Red for new/open
        acknowledged: { label: 'Acknowledged', emoji: '👁️', color: '#007bff' },  // Blue for acknowledged
        resolved: { label: 'Solved', emoji: '✅', color: '#28a745' }  // Green for resolved/solved
      };

      const config = statusConfig[status] || statusConfig.open;

      return (
        <span
          className="escalation-status-badge"
          style={{
            backgroundColor: config.color,
            color: 'white',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            marginLeft: 'auto',  // Push to the far right
            display: 'inline-block'
          }}
          title={status === 'resolved' ? `Admin resolved this request` :
                 status === 'acknowledged' ? `Admin is working on this` :
                 `Waiting for admin response`}
        >
          {config.emoji} {config.label}
        </span>
      );
    };

    return (
      <div key={id} className={`chat-message chat-message-${type || sender_type}${isError ? ' chat-message-error' : ''}`}>
        {(type !== 'user' && sender_type !== 'user') && (
          <div className="message-header">
            <span className="message-sender">
              {type === 'ai' || sender_type === 'ai' ? 'AI Assistant' :
               type === 'admin' || sender_type === 'admin' ? `${sender_name || 'Admin'}` :
               'System'}
            </span>
          </div>
        )}

        <div className="message-content">{content}</div>

        <div className="message-footer">
          <span className="message-time">{formatTime(timestamp)}</span>
          {metadata?.processing_time_ms && (
            <span className="message-meta">{Math.round(metadata.processing_time_ms)}ms</span>
          )}
          {getEscalationBadge()}
        </div>
      </div>
    );
  };

  // Team chat UI
  if (chatMode === 'team') {
    // SECURITY: Check if user is admin
    const isAdmin = user && (user.role === 'admin' || user.role === 'game_admin');

    // Admin Team Chat: Show all teams with expandable members
    if (isAdmin) {
      return (
        <div className="chat-body chat-body-team" id="chat-body-content" role="tabpanel">
          <div className="team-chat-container">
            <AdminTeamList
              onSelectMember={(member) => {
                selectTeamMember(member);
              }}
              onSelectTeam={(team) => {
                console.log('[ChatBody] Admin selected team for broadcast:', team);
              }}
            />
            {selectedTeam ? (
              <TeamBroadcast user={user} selectedTeam={selectedTeam} />
            ) : selectedTeamMember ? (
              <PrivateConversation user={user} />
            ) : (
              <TeamBroadcast user={user} />
            )}
          </div>
        </div>
      );
    }

    // Regular Team Chat: Show own team members only
    return (
      <div className="chat-body chat-body-team" id="chat-body-content" role="tabpanel">
        <div className="team-chat-container">
          <div className="team-chat-sidebar">
            <TeamMemberList />
          </div>
          {selectedTeamMember ? (
            <PrivateConversation user={user} />
          ) : (
            <TeamBroadcast user={user} />
          )}
        </div>
      </div>
    );
  }

  // AI/Admin chat UI (existing)
  return (
    <div className="chat-body" id="chat-body-content" role="tabpanel">
      {chatMode === 'ai' && aiContext && (
        <div className="ai-context-info">
          <div className="ai-context-title">AI knows your status:</div>
          <div className="ai-context-details">
            {aiContext.hasActiveGame ? (
              <>Game: {aiContext.game} | Team: {aiContext.team} | Progress: {aiContext.progress}% | Hints: {aiContext.hints_used}</>
            ) : (
              <>Team: {aiContext.team} | Overall Progress: {aiContext.progress}% | No game started yet</>
            )}
          </div>
        </div>
      )}

      <div ref={messageListRef} className="chat-message-list" onScroll={checkScrollPosition}>
        {messages.length === 0 && (
          <div className="chat-empty-state">
            {connectionStatus === 'connected' ? (
              <>
                <div className="empty-state-icon">{chatMode === 'ai' ? 'AI' : chatMode === 'admin' ? 'Admin' : 'Team'}</div>
                <p className="empty-state-title">
                  {chatMode === 'ai' ? 'AI Assistant Ready' :
                   chatMode === 'admin' ? 'Admin Support' :
                   'Team Chat'}
                </p>
                <p className="empty-state-text">
                  {chatMode === 'ai' ? 'Ask me anything about the Easter Quest!' :
                   chatMode === 'admin' ? 'Message an admin for help' :
                   'Chat with your teammates'}
                </p>
              </>
            ) : (
              <>
                <div className="empty-state-icon">!</div>
                <p className="empty-state-title">Connecting...</p>
                <p className="empty-state-text">
                  {connectionStatus === 'connecting' ? 'Establishing connection...' : 'Connection lost. Reconnecting...'}
                </p>
              </>
            )}
          </div>
        )}

        {messages.map(renderMessage)}

        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
            <span className="typing-text">AI is thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBody;
