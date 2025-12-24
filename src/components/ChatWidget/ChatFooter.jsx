/**
 * Component: ChatFooter
 * Purpose: Chat input area with multi-mode message sending
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - Auto-growing textarea input
 * - Character counter (2000 char limit)
 * - Send button with loading state
 * - Rate limit countdown display
 * - Multi-line support (Shift+Enter for newline, Enter to send)
 * - Context-aware sending (AI/Admin/Team/Private)
 * - Connection status validation
 * - Error handling and user feedback
 *
 * @since 2025-11-09
 */

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { logger } from '../../utils/logger';
import './ChatFooter.css';

/**
 * ChatFooter component - Input area with send functionality
 *
 * @returns {JSX.Element} Chat input footer with textarea and send button
 *
 * @example
 * <ChatFooter />
 */
const ChatFooter = () => {
  const {
    sendMessage,
    chatMode,
    connectionStatus,
    rateLimitStatus,
    setRateLimitStatus,
    sendTeamPrivateMessage,
    sendTeamBroadcast,
    sendAdminTeamBroadcast,
    selectedTeamMember,
    selectedTeam,
    user,
    showingAdminNotifications,
    selectedAdminContact
  } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const textareaRef = useRef(null);

  const MAX_LENGTH = 2000;

  // Countdown timer for rate limit
  useEffect(() => {
    if (!rateLimitStatus.exceeded || !rateLimitStatus.resetTime) {
      setRemainingSeconds(0);
      return;
    }

    // Calculate initial remaining time
    const updateRemainingTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((rateLimitStatus.resetTime - now) / 1000));
      setRemainingSeconds(remaining);

      // Auto-clear rate limit when countdown reaches 0
      if (remaining <= 0 && rateLimitStatus.exceeded) {
        logger.debug('chat_footer_rate_limit_cleared', {
          limitType: rateLimitStatus.limit_type,
          module: 'ChatFooter'
        });
        setRateLimitStatus({
          exceeded: false,
          limit_type: null,
          retry_after: 0,
          resetTime: null
        });
      }
    };

    // Update immediately
    updateRemainingTime();

    // Update every second
    const intervalId = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(intervalId);
  }, [rateLimitStatus, setRateLimitStatus]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputValue]);

  /**
   * Handle textarea input change with character limit
   *
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setInputValue(value);
    }
  };

  /**
   * Handle sending message (context-aware)
   * Supports AI/Admin/Team modes with different send methods
   *
   * @returns {Promise<void>}
   */
  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (rateLimitStatus.exceeded) return;
    if (connectionStatus !== 'connected') return;

    setIsSending(true);

    try {
      let success = false;

      // Team chat mode
      if (chatMode === 'team') {
        if (selectedTeamMember) {
          // Private message to specific member
          success = sendTeamPrivateMessage(selectedTeamMember.id, trimmed);
        } else if (selectedTeam) {
          // Admin broadcast to specific team
          success = sendAdminTeamBroadcast(selectedTeam.id, trimmed);
        } else {
          // Regular team broadcast (user's own team)
          success = sendTeamBroadcast(trimmed);
        }
      } else {
        // AI/Admin mode
        success = sendMessage(trimmed);
      }

      if (success) {
        setInputValue('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } catch (error) {
      logger.error('chat_footer_send_failed', {
        chatMode,
        hasSelectedMember: !!selectedTeamMember,
        hasSelectedAdmin: !!selectedAdminContact,
        errorMessage: error.message,
        module: 'ChatFooter'
      }, error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSendDisabled = () => {
    return (
      !inputValue.trim() ||
      isSending ||
      connectionStatus !== 'connected' ||
      rateLimitStatus.exceeded
    );
  };

  const getPlaceholder = () => {
    if (rateLimitStatus.exceeded && remainingSeconds > 0) {
      return `Rate limit exceeded. Wait ${remainingSeconds}s...`;
    }
    if (connectionStatus !== 'connected') {
      return 'Connecting...';
    }

    if (chatMode === 'team') {
      // Team chat mode - show who the message is going to
      if (selectedTeamMember) {
        return `Message ${selectedTeamMember.display_name || selectedTeamMember.username}...`;
      } else if (selectedTeam) {
        return `Broadcast to ${selectedTeam.name}...`;
      } else {
        return 'Message your team...';
      }
    }

    switch (chatMode) {
      case 'ai': return 'Ask AI for help with your current game...';
      case 'admin': return 'Message admin for support...';
      default: return 'Type your message...';
    }
  };

  const getModeStatus = () => {
    switch (chatMode) {
      case 'ai': return 'AI mode - Smart context-aware assistance';
      case 'admin': return 'Admin mode - Direct human support';
      case 'team': return 'Team mode - Chat with teammates';
      default: return '';
    }
  };

  // Show read-only message when viewing Admin Notifications or Admin Contact (one-way channels)
  if (chatMode === 'team' && (showingAdminNotifications || selectedAdminContact)) {
    return (
      <div className="chat-footer chat-footer-readonly">
        <div className="admin-notifications-footer">
          <span className="readonly-icon">ℹ️</span>
          <span className="readonly-text">
            {selectedAdminContact
              ? 'Admin messages are one-way. Click on your team name to send messages.'
              : 'Admin notifications are one-way. Click on your team name to send messages.'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-footer">
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder={getPlaceholder()}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={connectionStatus !== 'connected' || rateLimitStatus.exceeded}
          rows={1}
          aria-label="Message input"
          maxLength={MAX_LENGTH}
        />

        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={isSendDisabled()}
          aria-label="Send message"
          title="Send message (Enter)"
        >
          {isSending ? '...' : '>'}
        </button>
      </div>

      <div className="chat-footer-info">
        <span className="chat-mode-status">{getModeStatus()}</span>

        {inputValue.length > MAX_LENGTH * 0.8 && (
          <span className="chat-char-counter">
            {inputValue.length} / {MAX_LENGTH}
          </span>
        )}

        {rateLimitStatus.exceeded && remainingSeconds > 0 && (
          <span className="chat-rate-limit-warning">
            Rate limit: wait {remainingSeconds}s
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatFooter;
