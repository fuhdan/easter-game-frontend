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

import { logger } from '../../utils/logger';

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
  logger.debug('ws_message_pong_received', {
    timestamp: message.timestamp,
    module: 'messageHandler'
  });
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
  logger.debug('ws_message_ai_response_received', {
    hasContent: !!message.content,
    contentLength: message.content?.length || 0,
    processingTime: message.processing_time_ms,
    hasProgressUpdate: !!message.progress_update,
    module: 'messageHandler'
  });

  const { addMessage, setIsTyping, loadAIContext, refreshGameProgress } = context;

  // Stop typing indicator
  if (setIsTyping) {
    setIsTyping(false);
  }

  // Validate message has content
  if (!message.content || message.content.trim().length === 0) {
    logger.warn('ws_message_ai_response_empty', {
      hasContent: !!message.content,
      trimmedLength: message.content?.trim().length,
      module: 'messageHandler'
    });
    return;
  }

  // Add AI message to chat
  if (addMessage) {
    logger.debug('ws_message_adding_ai_to_chat', {
      contentPreview: message.content.substring(0, 50) + '...',
      contentLength: message.content.length,
      module: 'messageHandler'
    });
    addMessage({
      id: generateMessageId(),  // BUGFIX: Always generate unique ID (conversation_id is session ID, not message ID)
      type: 'ai',
      sender_type: 'ai',
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
      metadata: {
        conversation_id: message.conversation_id,
        processing_time_ms: message.processing_time_ms,
        progress_update: message.progress_update  // AI-BASED PROGRESS TRACKING: Include progress update in metadata
      }
    });

    // BUGFIX: Refresh AI context banner after response (updates hints count, progress, etc.)
    if (loadAIContext) {
      logger.debug('ws_message_refreshing_ai_context', {
        reason: 'ai_response_received',
        module: 'messageHandler'
      });
      loadAIContext();
    }

    // AI-BASED PROGRESS TRACKING: Refresh game progress if AI updated it
    if (message.progress_update && refreshGameProgress) {
      logger.info('ws_message_refreshing_game_progress', {
        gameId: message.progress_update.game_id,
        aiEstimatedProgress: message.progress_update.ai_estimated_progress,
        updatedProgressPercentage: message.progress_update.updated_progress_percentage,
        module: 'messageHandler'
      });
      refreshGameProgress(message.progress_update.game_id);
    } else if (message.progress_update && !refreshGameProgress) {
      logger.warn('ws_message_refresh_function_unavailable', {
        functionName: 'refreshGameProgress',
        impact: 'Game Panel will not update automatically',
        module: 'messageHandler'
      });
    }
  } else {
    logger.error('ws_message_add_function_unavailable', {
      functionName: 'addMessage',
      module: 'messageHandler'
    });
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
  logger.debug('ws_message_admin_received', { module: 'messageHandler' });

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
  logger.warn('ws_message_security_warning', {
    warningMessage: message.message,
    module: 'messageHandler'
  });

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
  logger.warn('ws_message_rate_limit_exceeded', {
    limitType: message.limit_type,
    retryAfter: message.retry_after,
    module: 'messageHandler'
  });

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
  logger.info('ws_message_system_notification', {
    content: message.content,
    notificationType: message.type,
    module: 'messageHandler'
  });

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
  logger.debug('ws_message_team_private_received', {
    hasMessage: !!message.message,
    module: 'messageHandler'
  });

  const { handleIncomingPrivateMessage } = context;

  if (handleIncomingPrivateMessage) {
    handleIncomingPrivateMessage(message.message);
  } else {
    logger.warn('ws_message_context_function_unavailable', {
      functionName: 'handleIncomingPrivateMessage',
      module: 'messageHandler'
    });
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
  logger.debug('ws_message_team_broadcast_received', {
    hasMessage: !!message.message,
    module: 'messageHandler'
  });

  const { handleIncomingBroadcast } = context;

  if (handleIncomingBroadcast) {
    handleIncomingBroadcast(message.message);
  } else {
    logger.warn('ws_message_context_function_unavailable', {
      functionName: 'handleIncomingBroadcast',
      module: 'messageHandler'
    });
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
  logger.debug('ws_message_sent_confirmation', {
    success: message.success,
    hasMessage: !!message.message,
    hasTeamName: !!message.team_name,
    module: 'messageHandler'
  });

  // Check if this is an admin broadcast (admin sending to a team they're not part of)
  // Admin broadcasts include team_name in the response
  if (message.success && message.message && message.team_name) {
    const { addAdminSentBroadcast } = context;
    const sentMessage = message.message;

    logger.debug('ws_message_admin_broadcast_detected', {
      hasSentMessage: !!sentMessage,
      hasAddFunction: !!addAdminSentBroadcast,
      module: 'messageHandler'
    });

    // This is an admin broadcast - add to local state so admin can see their own message
    const isAdminBroadcast = sentMessage.sender_role === 'admin' ||
                              sentMessage.sender_role === 'game_admin';

    logger.debug('ws_message_checking_admin_role', {
      isAdminBroadcast,
      senderRole: sentMessage.sender_role,
      module: 'messageHandler'
    });

    if (isAdminBroadcast && addAdminSentBroadcast) {
      logger.debug('ws_message_adding_admin_broadcast', {
        messageId: sentMessage.id,
        module: 'messageHandler'
      });
      addAdminSentBroadcast(sentMessage);
    } else {
      logger.debug('ws_message_skipping_admin_broadcast', {
        isAdminBroadcast,
        hasAddFunction: !!addAdminSentBroadcast,
        module: 'messageHandler'
      });
    }
  } else {
    logger.debug('ws_message_not_admin_broadcast', {
      missingFields: {
        success: !message.success,
        message: !message.message,
        teamName: !message.team_name
      },
      module: 'messageHandler'
    });
  }

  // Note: Regular team broadcasts and private messages are already added via WebSocket events:
  // - team_broadcast_message: Sent to ALL team members (including sender)
  // - team_private_message: Sent to recipient AND sender
};

/**
 * Handle mode switched confirmation
 */
const handleModeSwitched = (message, context) => {
  logger.debug('ws_message_mode_switched', {
    mode: message.mode,
    module: 'messageHandler'
  });
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
  logger.debug('ws_message_stored', {
    messageId: message.message_id,
    module: 'messageHandler'
  });
  // Message already added to UI, this is backend confirmation
};

/**
 * Handle AI typing indicator
 *
 * @param {object} message - AI typing indicator
 * @param {boolean} message.typing - Typing status
 * @param {string} [message.sender_name] - Name of user asking AI (team-based AI chat)
 * @param {object} context - Chat context state and methods
 */
const handleAITyping = (message, context) => {
  logger.debug('ws_message_ai_typing', {
    typing: message.typing,
    senderName: message.sender_name,
    module: 'messageHandler'
  });

  const { setIsTyping } = context;

  if (setIsTyping) {
    // TEAM-BASED AI CHAT: Include sender name if available
    setIsTyping(message.typing === true ? (message.sender_name || true) : false);
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
  logger.error('ws_message_error_received', {
    errorMessage: message.message,
    module: 'messageHandler'
  });

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
  logger.debug('ws_message_new_escalation', {
    notificationId: message.notification_id,
    teamId: message.team_id,
    priority: message.priority,
    module: 'messageHandler'
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
  logger.debug('ws_message_escalation_created', {
    notificationId: message.notification_id,
    status: message.status,
    repeatCount: message.repeat_count,
    module: 'messageHandler'
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
    logger.warn('ws_message_context_function_unavailable', {
      functionName: 'updateLastUserMessage',
      impact: 'Cannot attach badge to user message',
      module: 'messageHandler'
    });
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
  logger.debug('ws_message_escalation_status_updated', {
    notificationId: message.notification_id,
    status: message.status,
    repeatCount: message.repeat_count,
    module: 'messageHandler'
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
    logger.warn('ws_message_context_function_unavailable', {
      functionName: 'updateMessagesByNotificationId',
      impact: 'Status update failed',
      module: 'messageHandler'
    });
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
  logger.debug('ws_message_handler_called', {
    messageType: message?.type,
    hasMessage: !!message,
    module: 'messageHandler'
  });

  if (!message || !message.type) {
    logger.error('ws_message_invalid', {
      hasMessage: !!message,
      hasType: !!message?.type,
      module: 'messageHandler'
    });
    return;
  }

  const handler = MESSAGE_HANDLERS[message.type];

  if (handler) {
    logger.debug('ws_message_handler_found', {
      messageType: message.type,
      module: 'messageHandler'
    });
    try {
      handler(message, context);
    } catch (error) {
      logger.error('ws_message_handler_error', {
        messageType: message.type,
        errorMessage: error.message,
        module: 'messageHandler'
      }, error);

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
    logger.warn('ws_message_unknown_type', {
      messageType: message.type,
      module: 'messageHandler'
    });
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
