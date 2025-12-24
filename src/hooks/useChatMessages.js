/**
 * Module: hooks/useChatMessages.js
 * Purpose: React hook for message management
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - Message array state management
 * - Add/remove messages
 * - Message history loading
 * - Auto-scroll to bottom
 * - Message filtering by mode
 * - Local storage persistence (optional)
 *
 * @since 2025-11-09
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';

/**
 * useChatMessages - Hook for managing chat messages
 *
 * @param {object} options - Configuration options
 * @param {number} options.maxMessages - Maximum messages to keep (default: 100)
 * @param {boolean} options.persistToStorage - Persist to localStorage (default: false)
 * @param {string} options.storageKey - localStorage key (default: 'chat_messages')
 * @returns {object} Message management interface
 *
 * @example
 * const {
 *   messages,
 *   addMessage,
 *   clearMessages,
 *   removeMessage,
 *   getMessageById
 * } = useChatMessages({ maxMessages: 50 });
 */
const useChatMessages = (options = {}) => {
  const {
    maxMessages = 100,
    persistToStorage = false,
    storageKey = 'chat_messages'
  } = options;

  // Load initial messages from storage if enabled
  const getInitialMessages = () => {
    if (persistToStorage) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        logger.error('chat_messages_load_storage_failed', {
          storageKey,
          errorMessage: error.message,
          module: 'useChatMessages'
        }, error);
      }
    }
    return [];
  };

  // Messages state
  const [messages, setMessages] = useState(getInitialMessages);

  // Auto-scroll ref (for message list container)
  const shouldAutoScroll = useRef(true);

  /**
   * Persist messages to localStorage
   */
  useEffect(() => {
    if (persistToStorage && messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (error) {
        logger.error('chat_messages_save_storage_failed', {
          storageKey,
          messageCount: messages.length,
          errorMessage: error.message,
          module: 'useChatMessages'
        }, error);
      }
    }
  }, [messages, persistToStorage, storageKey]);

  /**
   * Add a new message
   *
   * @param {object} message - Message object
   * @param {string|number} message.id - Unique message ID
   * @param {string} message.type - Message type ('user' | 'ai' | 'admin' | 'system')
   * @param {string} message.content - Message content
   * @param {string} message.timestamp - ISO timestamp
   * @param {object} message.metadata - Optional metadata
   * @returns {void}
   */
  const addMessage = useCallback((message) => {
    if (!message || !message.content) {
      logger.warn('chat_messages_invalid_message', {
        hasMessage: !!message,
        hasContent: !!message?.content,
        module: 'useChatMessages'
      });
      return;
    }

    setMessages(prev => {
      // Add message
      const newMessages = [...prev, {
        id: message.id || Date.now(),
        type: message.type || 'user',
        sender_type: message.sender_type || message.type,
        sender_name: message.sender_name,
        content: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
        metadata: message.metadata || {}
      }];

      // Limit to maxMessages
      if (newMessages.length > maxMessages) {
        return newMessages.slice(-maxMessages);
      }

      return newMessages;
    });
  }, [maxMessages]);

  /**
   * Add multiple messages at once
   *
   * @param {array} messageArray - Array of message objects
   * @returns {void}
   */
  const addMessages = useCallback((messageArray) => {
    if (!Array.isArray(messageArray) || messageArray.length === 0) {
      logger.warn('chat_messages_invalid_array', {
        isArray: Array.isArray(messageArray),
        length: messageArray?.length || 0,
        module: 'useChatMessages'
      });
      return;
    }

    setMessages(prev => {
      const newMessages = [...prev, ...messageArray.map(msg => ({
        id: msg.id || Date.now() + Math.random(),
        type: msg.type || 'user',
        sender_type: msg.sender_type || msg.type,
        sender_name: msg.sender_name,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
        metadata: msg.metadata || {}
      }))];

      // Limit to maxMessages
      if (newMessages.length > maxMessages) {
        return newMessages.slice(-maxMessages);
      }

      return newMessages;
    });
  }, [maxMessages]);

  /**
   * Remove a message by ID
   *
   * @param {string|number} messageId - Message ID to remove
   * @returns {void}
   */
  const removeMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  /**
   * Clear all messages
   *
   * @returns {void}
   */
  const clearMessages = useCallback(() => {
    setMessages([]);

    if (persistToStorage) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        logger.error('chat_messages_clear_storage_failed', {
          storageKey,
          errorMessage: error.message,
          module: 'useChatMessages'
        }, error);
      }
    }
  }, [persistToStorage, storageKey]);

  /**
   * Get message by ID
   *
   * @param {string|number} messageId - Message ID
   * @returns {object|null} Message object or null
   */
  const getMessageById = useCallback((messageId) => {
    return messages.find(msg => msg.id === messageId) || null;
  }, [messages]);

  /**
   * Filter messages by type
   *
   * @param {string} type - Message type ('user' | 'ai' | 'admin' | 'system')
   * @returns {array} Filtered messages
   */
  const filterMessagesByType = useCallback((type) => {
    return messages.filter(msg => msg.type === type);
  }, [messages]);

  /**
   * Get messages from specific sender
   *
   * @param {string} senderName - Sender name
   * @returns {array} Filtered messages
   */
  const getMessagesBySender = useCallback((senderName) => {
    return messages.filter(msg => msg.sender_name === senderName);
  }, [messages]);

  /**
   * Get last N messages
   *
   * @param {number} count - Number of messages to get
   * @returns {array} Last N messages
   */
  const getLastMessages = useCallback((count) => {
    return messages.slice(-count);
  }, [messages]);

  /**
   * Update message by ID
   *
   * @param {string|number} messageId - Message ID
   * @param {object} updates - Fields to update
   * @returns {void}
   */
  const updateMessage = useCallback((messageId, updates) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, ...updates }
        : msg
    ));
  }, []);

  /**
   * Check if should auto-scroll
   * Call this from message list component
   *
   * @param {HTMLElement} scrollContainer - Scroll container element
   * @returns {boolean} Should auto-scroll
   */
  const checkAutoScroll = useCallback((scrollContainer) => {
    if (!scrollContainer) return false;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    shouldAutoScroll.current = isNearBottom;
    return isNearBottom;
  }, []);

  /**
   * Scroll to bottom
   * Call this after adding message if shouldAutoScroll is true
   *
   * @param {HTMLElement} scrollContainer - Scroll container element
   * @param {boolean} smooth - Use smooth scrolling (default: true)
   * @returns {void}
   */
  const scrollToBottom = useCallback((scrollContainer, smooth = true) => {
    if (!scrollContainer) return;

    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  // Return hook interface
  return {
    // State
    messages,
    messageCount: messages.length,

    // Add/Remove
    addMessage,
    addMessages,
    removeMessage,
    clearMessages,
    updateMessage,

    // Query
    getMessageById,
    filterMessagesByType,
    getMessagesBySender,
    getLastMessages,

    // Auto-scroll helpers
    checkAutoScroll,
    scrollToBottom,
    shouldAutoScroll: shouldAutoScroll.current
  };
};

export default useChatMessages;
