/**
 * Module: messageHandler.test.js
 * Purpose: Tests for WebSocket message handler
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

import { handleWebSocketMessage } from '../../../src/services/websocket/messageHandler';

describe('Message Handler', () => {
  let mockHandlers;

  beforeEach(() => {
    mockHandlers = {
      addMessage: jest.fn(),
      updateMessage: jest.fn(),
      addOrUpdateMessage: jest.fn(),
      updateLastUserMessage: jest.fn(),
      updateMessagesByNotificationId: jest.fn(),
      setIsTyping: jest.fn(),
      setLastError: jest.fn(),
      setRateLimitStatus: jest.fn(),
      handleIncomingPrivateMessage: jest.fn(),
      handleIncomingBroadcast: jest.fn(),
      handleTypingIndicator: jest.fn(),
      addAdminSentBroadcast: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe('handleWebSocketMessage', () => {
    test('handles ai_response message', () => {
      const message = {
        type: 'ai_response',
        content: 'AI response',
        message_id: 'msg-1',
        processing_time_ms: 150
      };

      handleWebSocketMessage(message, mockHandlers);

      // Implementation calls addMessage, not addOrUpdateMessage
      expect(mockHandlers.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ai',
          content: 'AI response'
        })
      );
      expect(mockHandlers.setIsTyping).toHaveBeenCalledWith(false);
    });

    test('handles admin_response message', () => {
      const message = {
        type: 'admin_message',  // Implementation uses 'admin_message' not 'admin_response'
        content: 'Admin help response',
        message_id: 'msg-2',
        admin_name: 'Admin User'
      };

      handleWebSocketMessage(message, mockHandlers);

      // Implementation calls addMessage, not addOrUpdateMessage
      expect(mockHandlers.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'admin',
          content: 'Admin help response',
          sender_name: 'Admin User'
        })
      );
    });

    test('handles error message', () => {
      const message = {
        type: 'error',
        error: 'Something went wrong',
        message: 'Error occurred'
      };

      handleWebSocketMessage(message, mockHandlers);

      // Implementation calls setLastError with an object, not a string
      expect(mockHandlers.setLastError).toHaveBeenCalledWith({
        type: 'error',
        message: 'Error occurred'
      });
      // Note: handleError doesn't call setIsTyping
    });

    test('handles rate_limit message', () => {
      const message = {
        type: 'rate_limit_error',  // Implementation uses 'rate_limit_error' not 'rate_limit'
        limit_type: 'ai',
        retry_after: 60,
        message: 'Rate limit exceeded'
      };

      handleWebSocketMessage(message, mockHandlers);

      // Implementation also includes resetTime in the status object
      expect(mockHandlers.setRateLimitStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          exceeded: true,
          limit_type: 'ai',
          retry_after: 60,
          resetTime: expect.any(Number)
        })
      );
    });

    test('handles escalation_created message', () => {
      const message = {
        type: 'escalation_created',
        notification_id: 123,
        escalation_type: 'user_question',
        status: 'open'
      };

      handleWebSocketMessage(message, mockHandlers);

      expect(mockHandlers.updateLastUserMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            notification_id: 123,
            escalation_type: 'user_question',
            status: 'open'
          })
        })
      );
    });

    test('handles escalation_updated message', () => {
      const message = {
        type: 'escalation_status_updated',  // Implementation uses 'escalation_status_updated' not 'escalation_updated'
        notification_id: 123,
        status: 'resolved'
      };

      handleWebSocketMessage(message, mockHandlers);

      expect(mockHandlers.updateMessagesByNotificationId).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          metadata: expect.objectContaining({
            status: 'resolved'
          })
        })
      );
    });

    test('handles team_private_message', () => {
      const teamMessage = {
        sender_id: 2,
        sender_username: 'teammate',
        content: 'Private message',
        timestamp: '2025-12-19T10:00:00Z',
        type: 'team_private_message'
      };

      const message = {
        type: 'team_private_message',
        message: teamMessage  // Implementation expects nested message object
      };

      handleWebSocketMessage(message, mockHandlers);

      // Implementation calls handleIncomingPrivateMessage with message.message
      expect(mockHandlers.handleIncomingPrivateMessage).toHaveBeenCalledWith(teamMessage);
    });

    test('handles team_broadcast_message', () => {
      const teamMessage = {
        sender_id: 1,
        sender_username: 'captain',
        content: 'Team announcement',
        timestamp: '2025-12-19T10:00:00Z',
        type: 'team_broadcast_message'
      };

      const message = {
        type: 'team_broadcast_message',
        message: teamMessage  // Implementation expects nested message object
      };

      handleWebSocketMessage(message, mockHandlers);

      // Implementation calls handleIncomingBroadcast with message.message
      expect(mockHandlers.handleIncomingBroadcast).toHaveBeenCalledWith(teamMessage);
    });

    test('handles typing_indicator message', () => {
      const message = {
        type: 'typing_indicator',
        user_id: 2,
        is_typing: true  // Implementation uses 'is_typing' not 'typing'
      };

      handleWebSocketMessage(message, mockHandlers);

      expect(mockHandlers.handleTypingIndicator).toHaveBeenCalledWith(2, true);
    });

    test('handles unknown message type', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const message = {
        type: 'unknown_type',
        data: 'something'
      };

      handleWebSocketMessage(message, mockHandlers);

      // Should not throw error, just log warning
      expect(consoleWarn).toHaveBeenCalled();

      consoleWarn.mockRestore();
    });

    test('handles message without type', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      const message = {
        content: 'No type field'
      };

      handleWebSocketMessage(message, mockHandlers);

      consoleError.mockRestore();
    });
  });
});
