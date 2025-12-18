/**
 * Module: services/websocket/messageHandler.js
 * Purpose: Route and handle incoming WebSocket messages
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - Message routing by type
 * - Handler functions for each message type
 * - Context-based state updates
 * - Error handling for malformed messages
 *
 * @since 2025-11-09
 */

/**
 * Generate unique message ID
 * Uses timestamp + counter to avoid collisions
 */
let messageCounter = 0;
const generateMessageId = () => {
  messageCounter = (messageCounter + 1) % 10000;
  return `msg-${Date.now()}-${messageCounter}`;
};

/**
 * Handle pong (heartbeat response)
 *
 * @param {object} message - Pong message
 * @param {object} context - Chat context state and methods
 * @private
 */
const handlePong = (message, context) => {
  console.log('[MessageHandler] Pong received:', message.timestamp);
  // Heartbeat handled by ChatWebSocket class
  // No action needed in context
};

/**
 * Handle AI response message
 *
 * @param {object} message - AI response message
 * @param {string} message.content - AI response content
 * @param {string} message.conversation_id - Conversation ID
 * @param {number} message.processing_time_ms - AI processing time
 * @param {object} context - Chat context state and methods
 */
const handleAIResponse = (message, context) => {
  console.log('[MessageHandler] AI response received:', {
    hasContent: !!message.content,
    contentLength: message.content?.length || 0,
    processingTime: message.processing_time_ms
  });

  const { addMessage, setIsTyping } = context;

  // Stop typing indicator
  if (setIsTyping) {
    setIsTyping(false);
  }

  // Validate message has content
  if (!message.content || message.content.trim().length === 0) {
    console.warn('[MessageHandler] AI response has empty content, skipping display');
    return;
  }

  // Add AI message to chat
  if (addMessage) {
    console.log('[MessageHandler] Adding AI message to chat:', message.content.substring(0, 50) + '...');
    addMessage({
      id: generateMessageId(),  // BUGFIX: Always generate unique ID (conversation_id is session ID, not message ID)
      type: 'ai',
      sender_type: 'ai',
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
      metadata: {
        conversation_id: message.conversation_id,
        processing_time_ms: message.processing_time_ms
      }
    });
  } else {
    console.error('[MessageHandler] addMessage function not available in context!');
  }
};

/**
 * Handle admin message
 *
 * @param {object} message - Admin message
 * @param {string} message.content - Admin response content
 * @param {string} message.admin_name - Admin name (optional)
 * @param {object} context - Chat context state and methods
 */
const handleAdminMessage = (message, context) => {
  console.log('[MessageHandler] Admin message received');

  const { addMessage } = context;

  if (addMessage) {
    addMessage({
      id: message.message_id || generateMessageId(),
      type: 'admin',
      sender_type: 'admin',
      sender_name: message.admin_name || 'Admin',
      content: message.content,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Handle security warning (prompt injection detected)
 *
 * @param {object} message - Security warning message
 * @param {string} message.message - Warning message
 * @param {object} message.details - Detection details
 * @param {array} message.flagged - Flagged patterns
 * @param {object} context - Chat context state and methods
 */
const handleSecurityWarning = (message, context) => {
  console.warn('[MessageHandler] Security warning:', message.message);

  const { addMessage, setLastError, setIsTyping } = context;

  // SECURITY: Stop typing indicator when security warning received
  if (setIsTyping) {
    setIsTyping(false);
  }

  // Add system message to chat
  if (addMessage) {
    addMessage({
      id: generateMessageId(),
      type: 'system',
      sender_type: 'system',
      content: `Security Warning: ${message.message}`,
      timestamp: new Date().toISOString(),
      metadata: {
        warning_type: 'security',
        details: message.details,
        flagged: message.flagged
      }
    });
  }

  // Set error state
  if (setLastError) {
    setLastError({
      type: 'security_warning',
      message: message.message,
      details: message.details
    });
  }
};

/**
 * Handle rate limit error
 *
 * @param {object} message - Rate limit error message
 * @param {string} message.message - Error message
 * @param {string} message.limit_type - 'ai' or 'chat'
 * @param {number} message.retry_after - Seconds until retry allowed
 * @param {object} context - Chat context state and methods
 */
const handleRateLimitError = (message, context) => {
  console.warn('[MessageHandler] Rate limit exceeded:', message.limit_type);

  const { addMessage, setRateLimitStatus, setIsTyping } = context;

  // Stop typing indicator when rate limit error received
  if (setIsTyping) {
    setIsTyping(false);
  }

  // Add system message
  if (addMessage) {
    addMessage({
      id: generateMessageId(),
      type: 'system',
      sender_type: 'system',
      content: `Rate Limit: ${message.message}`,
      timestamp: new Date().toISOString(),
      metadata: {
        error_type: 'rate_limit',
        limit_type: message.limit_type,
        retry_after: message.retry_after
      }
    });
  }

  // Update rate limit status
  if (setRateLimitStatus) {
    setRateLimitStatus({
      exceeded: true,
      limit_type: message.limit_type,
      retry_after: message.retry_after,
      resetTime: Date.now() + (message.retry_after * 1000)
    });
  }
};

/**
 * Handle system notification
 *
 * @param {object} message - System notification
 * @param {string} message.content - Notification content
 * @param {string} message.type - Notification type (info, warning, error)
 * @param {object} context - Chat context state and methods
 */
const handleSystemNotification = (message, context) => {
  console.log('[MessageHandler] System notification:', message.content);

  const { addMessage } = context;

  if (addMessage) {
    addMessage({
      id: generateMessageId(),
      type: 'system',
      sender_type: 'system',
      content: message.content,
      timestamp: new Date().toISOString(),
      metadata: {
        notification_type: message.type || 'info'
      }
    });
  }
};

/**
 * Handle team private message (Phase 4 - Team Chat)
 *
 * @param {object} message - Team private message
 * @param {object} message.message - TeamMessage object
 * @param {object} context - Chat context state and methods
 */
const handleTeamPrivateMessage = (message, context) => {
  console.log('[MessageHandler] Team private message received');

  const { handleIncomingPrivateMessage } = context;

  if (handleIncomingPrivateMessage) {
    handleIncomingPrivateMessage(message.message);
  } else {
    console.warn('[MessageHandler] handleIncomingPrivateMessage not available in context');
  }
};

/**
 * Handle team broadcast message (Phase 4 - Team Chat)
 *
 * @param {object} message - Team broadcast message
 * @param {object} message.message - TeamMessage object
 * @param {object} context - Chat context state and methods
 */
const handleTeamBroadcastMessage = (message, context) => {
  console.log('[MessageHandler] Team broadcast message received');

  const { handleIncomingBroadcast } = context;

  if (handleIncomingBroadcast) {
    handleIncomingBroadcast(message.message);
  } else {
    console.warn('[MessageHandler] handleIncomingBroadcast not available in context');
  }
};

/**
 * Handle typing indicator (Phase 4 - Team Chat)
 *
 * @param {object} message - Typing indicator
 * @param {number} message.user_id - User ID
 * @param {string} message.display_name - Display name
 * @param {boolean} message.is_typing - Typing status
 * @param {object} context - Chat context state and methods
 */
const handleTypingIndicator = (message, context) => {
  const { handleTypingIndicator: onTyping } = context;

  if (onTyping) {
    onTyping(message.user_id, message.is_typing);
  }
};

/**
 * Handle message sent confirmation (Phase 4 - Team Chat)
 *
 * @param {object} message - Message sent confirmation
 * @param {object} message.message - Sent TeamMessage object
 * @param {object} message.success - Success status
 * @param {string} message.team_name - Target team name (for admin broadcasts)
 * @param {object} context - Chat context state and methods
 */
const handleMessageSent = (message, context) => {
  console.log('[MessageHandler] Message sent confirmation:', message);
  console.log('[MessageHandler] message.success:', message.success, 'message.message:', message.message, 'message.team_name:', message.team_name);

  // Check if this is an admin broadcast (admin sending to a team they're not part of)
  // Admin broadcasts include team_name in the response
  if (message.success && message.message && message.team_name) {
    const { addAdminSentBroadcast } = context;
    const sentMessage = message.message;
    console.log('[MessageHandler] Admin broadcast detected, sentMessage:', sentMessage);
    console.log('[MessageHandler] addAdminSentBroadcast available:', !!addAdminSentBroadcast);

    // This is an admin broadcast - add to local state so admin can see their own message
    const isAdminBroadcast = sentMessage.sender_role === 'admin' ||
                              sentMessage.sender_role === 'game_admin';
    console.log('[MessageHandler] isAdminBroadcast:', isAdminBroadcast, 'sender_role:', sentMessage.sender_role);

    if (isAdminBroadcast && addAdminSentBroadcast) {
      console.log('[MessageHandler] Adding admin broadcast to local state:', sentMessage);
      addAdminSentBroadcast(sentMessage);
    } else {
      console.log('[MessageHandler] NOT adding - isAdminBroadcast:', isAdminBroadcast, 'addAdminSentBroadcast:', !!addAdminSentBroadcast);
    }
  } else {
    console.log('[MessageHandler] Not an admin broadcast - missing fields');
  }

  // Note: Regular team broadcasts and private messages are already added via WebSocket events:
  // - team_broadcast_message: Sent to ALL team members (including sender)
  // - team_private_message: Sent to recipient AND sender
};

/**
 * Handle mode switched confirmation
 */
const handleModeSwitched = (message, context) => {
  console.log('[MessageHandler] Mode switched:', message.mode);
  // Mode already switched on client, this is just confirmation
};

/**
 * Handle message stored confirmation
 *
 * @param {object} message - Message stored confirmation
 * @param {string} message.message_id - Stored message ID
 * @param {object} context - Chat context state and methods
 */
const handleMessageStored = (message, context) => {
  console.log('[MessageHandler] Message stored:', message.message_id);
  // Message already added to UI, this is backend confirmation
};

/**
 * Handle AI typing indicator
 *
 * @param {object} message - AI typing indicator
 * @param {boolean} message.typing - Typing status
 * @param {object} context - Chat context state and methods
 */
const handleAITyping = (message, context) => {
  console.log('[MessageHandler] AI typing:', message.typing);

  const { setIsTyping } = context;

  if (setIsTyping) {
    setIsTyping(message.typing === true);
  }
};

/**
 * Handle generic error message
 *
 * @param {object} message - Error message
 * @param {string} message.message - Error message text
 * @param {object} context - Chat context state and methods
 */
const handleError = (message, context) => {
  console.error('[MessageHandler] Error received:', message.message);

  const { addMessage, setLastError } = context;

  // Add system error message to chat
  if (addMessage) {
    addMessage({
      id: generateMessageId(),
      type: 'system',
      sender_type: 'system',
      content: `Error: ${message.message}`,
      timestamp: new Date().toISOString(),
      metadata: {
        error_type: 'general_error'
      }
    });
  }

  // Set error state
  if (setLastError) {
    setLastError({
      type: 'error',
      message: message.message
    });
  }
};

/**
 * Handle new escalation notification (for admins)
 *
 * @param {object} message - New escalation message
 * @param {number} message.notification_id - Notification ID
 * @param {number} message.team_id - Team ID
 * @param {string} message.escalation_type - Type of escalation
 * @param {string} message.priority - Priority level
 * @param {object} context - Chat context state and methods
 */
const handleNewEscalation = (message, context) => {
  console.log('[MessageHandler] New escalation for admin:', {
    notification_id: message.notification_id,
    team_id: message.team_id,
    priority: message.priority
  });

  // This is sent to admins via WebSocket when a new escalation is created
  // The admin notification dashboard handles this via SSE, so we can safely ignore it here
  // Just log it to prevent "unknown message type" warnings
};

/**
 * Handle escalation created notification (for users)
 *
 * @param {object} message - Escalation created message
 * @param {string} message.escalation_type - Type of escalation
 * @param {number} message.notification_id - Created notification ID
 * @param {string} message.status - Notification status (open, acknowledged, resolved)
 * @param {number} message.repeat_count - Number of times triggered
 * @param {object} context - Chat context state and methods
 */
const handleEscalationCreated = (message, context) => {
  console.log('[MessageHandler] Escalation created:', {
    notification_id: message.notification_id,
    status: message.status,
    repeat_count: message.repeat_count
  });

  const { updateLastUserMessage } = context;

  // Add escalation status to the user's actual message (not a separate system message)
  if (updateLastUserMessage) {
    updateLastUserMessage({
      metadata: {
        notification_id: message.notification_id,
        status: message.status,
        escalation_type: message.escalation_type
      }
    });
  } else {
    console.warn('[MessageHandler] updateLastUserMessage not available - cannot attach badge to user message');
  }
};

/**
 * Handle escalation status update
 *
 * @param {object} message - Status update message
 * @param {number} message.notification_id - Notification ID
 * @param {string} message.status - New status (acknowledged, resolved)
 * @param {number} message.repeat_count - Number of times triggered
 * @param {object} context - Chat context state and methods
 */
const handleEscalationStatusUpdated = (message, context) => {
  console.log('[MessageHandler] Escalation status updated:', {
    notification_id: message.notification_id,
    status: message.status,
    repeat_count: message.repeat_count
  });

  const { updateMessagesByNotificationId } = context;

  // Update ALL messages with this notification_id (multiple users may have sent the same message)
  if (updateMessagesByNotificationId) {
    updateMessagesByNotificationId(message.notification_id, {
      metadata: {
        status: message.status
      }
    });
  } else {
    console.warn('[MessageHandler] updateMessagesByNotificationId not available - status update failed');
  }
};

/**
 * Message type to handler mapping
 *
 * IMPORTANT: Add new message types here as they are implemented
 */
const MESSAGE_HANDLERS = {
  // Existing handlers (Phase 1-3)
  'pong': handlePong,
  'mode_switched': handleModeSwitched,
  'message_stored': handleMessageStored,
  'ai_typing': handleAITyping,
  'ai_response': handleAIResponse,
  'admin_message': handleAdminMessage,
  'security_warning': handleSecurityWarning,
  'rate_limit_error': handleRateLimitError,
  'rate_limit_exceeded': handleRateLimitError,  // Backend sends this variant
  'system_notification': handleSystemNotification,
  'error': handleError,  // Generic error messages
  'new_escalation': handleNewEscalation,  // New escalation notification (for admins)
  'escalation_created': handleEscalationCreated,  // Escalation created confirmation (for users)
  'escalation_status_updated': handleEscalationStatusUpdated,  // Status updates for escalations

  // Team chat handlers (Phase 4)
  'team_private_message': handleTeamPrivateMessage,
  'team_broadcast_message': handleTeamBroadcastMessage,
  'typing_indicator': handleTypingIndicator,
  'message_sent': handleMessageSent
};

/**
 * Main message routing function
 *
 * @param {object} message - WebSocket message
 * @param {string} message.type - Message type
 * @param {object} context - Chat context state and methods
 *
 * @example
 * handleWebSocketMessage(
 *   { type: 'ai_response', content: 'Hello!' },
 *   { addMessage, setIsTyping }
 * );
 */
export const handleWebSocketMessage = (message, context) => {
  console.log('[MessageHandler] handleWebSocketMessage called with:', message.type, message);

  if (!message || !message.type) {
    console.error('[MessageHandler] Invalid message:', message);
    return;
  }

  const handler = MESSAGE_HANDLERS[message.type];

  if (handler) {
    console.log('[MessageHandler] Found handler for:', message.type);
    try {
      handler(message, context);
    } catch (error) {
      console.error(`[MessageHandler] Error handling ${message.type}:`, error);

      // Set error in context if available
      if (context.setLastError) {
        context.setLastError({
          type: 'handler_error',
          message: `Failed to handle ${message.type}`,
          error
        });
      }
    }
  } else {
    console.warn('[MessageHandler] Unknown message type:', message.type);
  }
};

/**
 * Get list of supported message types
 *
 * @returns {string[]} Array of message type strings
 */
export const getSupportedMessageTypes = () => {
  return Object.keys(MESSAGE_HANDLERS);
};

export default handleWebSocketMessage;
