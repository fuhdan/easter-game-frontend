/**
 * Component: ChatBody
 * Purpose: Chat message display area
 */

import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import TeamMemberList from './TeamMemberList';
import AdminContacts from './AdminContacts';
import AdminTeamList from './AdminTeamList';
import PrivateConversation from './PrivateConversation';
import TeamBroadcast from './TeamBroadcast';
import AdminBroadcast from './AdminBroadcast';
import './ChatBody.css';

const ChatBody = ({ user }) => {
  const { messages, chatMode, aiContext, isTyping, connectionStatus, selectedTeamMember, selectTeamMember, selectedTeam, viewingAdminBroadcast } = useChat();
  const messageListRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  const checkScrollPosition = () => {
    if (!messageListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
  };

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

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message) => {
    const { id, type, sender_type, sender_name, content, timestamp, metadata } = message;

    // Check if this is an error message
    const isError = type === 'system' && (
      content.startsWith('Error:') ||
      metadata?.error_type === 'general_error'
    );

    // Helper to get escalation status badge
    const getEscalationBadge = () => {
      if (!metadata?.escalation_status) return null;

      const status = metadata.escalation_status;
      const statusConfig = {
        open: { label: 'Open', emoji: '🔵', color: '#3498db' },
        acknowledged: { label: 'Acknowledged', emoji: '👁️', color: '#f39c12' },
        resolved: { label: 'Resolved', emoji: '✅', color: '#27ae60' }
      };

      const config = statusConfig[status] || statusConfig.open;

      return (
        <span
          className="escalation-status-badge"
          style={{
            backgroundColor: config.color,
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            marginLeft: '8px',
            display: 'inline-block'
          }}
          title={metadata.resolved_at ? `Resolved ${formatTime(metadata.resolved_at)}` :
                 metadata.acknowledged_at ? `Acknowledged ${formatTime(metadata.acknowledged_at)}` :
                 'Waiting for admin response'}
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
    const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

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
            <AdminContacts />
          </div>
          {selectedTeamMember ? (
            <PrivateConversation user={user} />
          ) : viewingAdminBroadcast ? (
            <AdminBroadcast user={user} />
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
            Game: {aiContext.game} | Team: {aiContext.team} | Progress: {aiContext.progress}% | Hints: {aiContext.hints_used}
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
