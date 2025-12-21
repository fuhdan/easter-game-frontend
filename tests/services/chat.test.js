/**
 * Module: chat.test.js
 * Purpose: Tests for chat service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

import { mockFetchResponse } from '../test-utils';

const chatService = {
  getMessages: async (sessionType = 'ai', limit = 50) => {
    const response = await fetch(
      `http://localhost:8000/api/chat/messages?session_type=${sessionType}&limit=${limit}`,
      {
        headers: { 'Authorization': 'Bearer token' }
      }
    );
    return response.json();
  },
  sendMessage: async (content, messageType = 'ai') => {
    const response = await fetch('http://localhost:8000/api/chat/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, message_type: messageType })
    });
    return response.json();
  }
};

describe('Chat Service', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete global.fetch;
  });

  describe('getMessages', () => {
    test('fetches AI messages', async () => {
      const mockMessages = {
        count: 2,
        messages: [
          { id: 1, content: 'Hello', sender_type: 'user' },
          { id: 2, content: 'Hi there!', sender_type: 'ai' }
        ]
      };
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockMessages));

      const result = await chatService.getMessages('ai', 50);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/chat/messages?session_type=ai&limit=50',
        expect.any(Object)
      );

      expect(result.count).toBe(2);
      expect(result.messages).toHaveLength(2);
    });

    test('fetches admin messages', async () => {
      const mockMessages = {
        count: 1,
        messages: [
          { id: 1, content: 'Need help', sender_type: 'user' }
        ]
      };
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockMessages));

      const result = await chatService.getMessages('admin', 50);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/chat/messages?session_type=admin&limit=50',
        expect.any(Object)
      );

      expect(result.count).toBe(1);
    });

    test('respects limit parameter', async () => {
      const mockMessages = { count: 0, messages: [] };
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockMessages));

      await chatService.getMessages('ai', 10);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
    });
  });

  describe('sendMessage', () => {
    test('sends AI message', async () => {
      const mockResponse = {
        success: true,
        message_id: 1
      };
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const result = await chatService.sendMessage('Hello AI', 'ai');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/chat/send',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            content: 'Hello AI',
            message_type: 'ai'
          })
        })
      );

      expect(result.success).toBe(true);
    });

    test('sends admin message', async () => {
      const mockResponse = {
        success: true,
        message_id: 2
      };
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const result = await chatService.sendMessage('Need admin help', 'admin');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            content: 'Need admin help',
            message_type: 'admin'
          })
        })
      );

      expect(result.success).toBe(true);
    });

    test('handles send error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        chatService.sendMessage('Test', 'ai')
      ).rejects.toThrow('Network error');
    });
  });
});
