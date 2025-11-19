import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import './ChatToggleButton.css';

const ChatToggleButton = ({ isOpen, onClick }) => {
  const { connectionStatus, getTotalUnreadCount } = useChat();
  const unreadCount = isOpen ? 0 : getTotalUnreadCount();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'var(--success)';
      case 'connecting': return 'var(--warning)';
      case 'disconnected': return 'var(--danger)';
      default: return 'var(--medium-gray)';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <button
      className={`chat-toggle-button ${isOpen ? 'open' : ''}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      title="Smart Help Center"
    >
      <img
        src="/assets/ypsomed-logo.png"
        alt="Ypsomed Logo"
        className="ypsomed-logo-img"
      />

      {!isOpen && unreadCount > 0 && (
        <span className="chat-toggle-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      <span
        className="chat-toggle-status"
        style={{ background: getStatusColor() }}
        title={getStatusText()}
      />
    </button>
  );
};

export default ChatToggleButton;
