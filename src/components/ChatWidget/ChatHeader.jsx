/**
 * Component: ChatHeader
 * Purpose: Chat widget header with mode selector and connection status
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - Chat mode switcher (AI / Admin / Team)
 * - Connection status indicator
 * - Unread message badges per mode
 * - Close button for chat widget
 * - Role-based mode visibility (admin mode only for admins)
 *
 * @since 2025-11-09
 */

import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import './ChatHeader.css';

/**
 * ChatHeader component - Header with mode selector and connection status
 *
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback function to close chat widget
 * @returns {JSX.Element} Chat header with mode buttons and status
 *
 * @example
 * <ChatHeader onClose={() => setChatOpen(false)} />
 */
const ChatHeader = ({ onClose }) => {
  const { chatMode, switchMode, connectionStatus, unreadCounts, user } = useChat();

  // SECURITY: Check if user is admin/super_admin to hide admin mode button
  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

  // Calculate team chat unread count
  const teamUnreadCount = unreadCounts
    ? unreadCounts.broadcast + Object.values(unreadCounts.private).reduce((sum, count) => sum + count, 0)
    : 0;

  /**
   * Get color for connection status indicator
   *
   * @returns {string} CSS variable for status color
   */
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'var(--success)';
      case 'connecting': return 'var(--warning)';
      case 'disconnected': return 'var(--danger)';
      default: return 'var(--medium-gray)';
    }
  };

  /**
   * Get text label for connection status
   *
   * @returns {string} Status text
   */
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <div className="chat-header">
      {/* Flexible Row: Everything wraps together */}
      <div className="chat-header-row">
        <div className="chat-header-left">
          <h3 id="chat-header-title" className="chat-header-title">
            Smart Help Center
          </h3>
          <div className="chat-connection-status" title={getStatusText()}>
            <span className="chat-connection-dot" style={{ background: getStatusColor() }} />
            <span className="chat-connection-text">{getStatusText()}</span>
          </div>
        </div>

        <div className="chat-mode-selector" role="tablist">
          <button
            className={`chat-mode-btn ${chatMode === 'ai' ? 'active' : ''}`}
            onClick={() => switchMode('ai')}
            role="tab"
            aria-selected={chatMode === 'ai'}
          >
            AI Assistant
          </button>

          {/* Only show Admin mode for non-admin users (players and team captains) */}
          {!isAdmin && (
            <button
              className={`chat-mode-btn ${chatMode === 'admin' ? 'active' : ''}`}
              onClick={() => switchMode('admin')}
              role="tab"
              aria-selected={chatMode === 'admin'}
            >
              Admin
            </button>
          )}

          <button
            className={`chat-mode-btn ${chatMode === 'team' ? 'active' : ''}`}
            onClick={() => switchMode('team')}
            role="tab"
            aria-selected={chatMode === 'team'}
          >
            Team Chat
            {teamUnreadCount > 0 && chatMode !== 'team' && (
              <span className="chat-mode-badge unread">{teamUnreadCount > 99 ? '99+' : teamUnreadCount}</span>
            )}
          </button>
        </div>

        <button className="chat-close-button" onClick={onClose} aria-label="Close chat">
          &times;
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
