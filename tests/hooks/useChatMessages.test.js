/**
 * Module: useChatMessages.test.js
 * Purpose: Tests for useChatMessages hook
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import { renderHook, act } from '@testing-library/react';
import useChatMessages from '../../src/hooks/useChatMessages';

describe('useChatMessages', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('initializes with empty messages', () => {
      const { result } = renderHook(() => useChatMessages());
      expect(result.current.messages).toEqual([]);
      expect(result.current.messageCount).toBe(0);
    });

    test('loads messages from localStorage when persistToStorage is true', () => {
      const stored = [{ id: 1, content: 'test', type: 'user', timestamp: '2025-01-01' }];
      localStorage.setItem('chat_messages', JSON.stringify(stored));

      const { result } = renderHook(() => useChatMessages({ persistToStorage: true }));
      expect(result.current.messages).toEqual(stored);
      expect(result.current.messageCount).toBe(1);
    });

    test('uses custom storageKey', () => {
      const stored = [{ id: 1, content: 'custom', type: 'user' }];
      localStorage.setItem('custom_key', JSON.stringify(stored));

      const { result } = renderHook(() =>
        useChatMessages({ persistToStorage: true, storageKey: 'custom_key' })
      );
      expect(result.current.messages).toEqual(stored);
    });

    test('handles invalid localStorage data gracefully', () => {
      localStorage.setItem('chat_messages', 'invalid json');

      const { result } = renderHook(() => useChatMessages({ persistToStorage: true }));
      expect(result.current.messages).toEqual([]);
    });

    test('handles non-array localStorage data', () => {
      localStorage.setItem('chat_messages', JSON.stringify({ not: 'array' }));

      const { result } = renderHook(() => useChatMessages({ persistToStorage: true }));
      expect(result.current.messages).toEqual([]);
    });
  });

  describe('addMessage', () => {
    test('adds message with all properties', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({
          id: 1,
          type: 'user',
          content: 'Hello',
          timestamp: '2025-01-01',
          sender_name: 'John',
          metadata: { foo: 'bar' }
        });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toMatchObject({
        id: 1,
        type: 'user',
        content: 'Hello',
        sender_name: 'John',
        metadata: { foo: 'bar' }
      });
    });

    test('generates ID if not provided', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ content: 'Test' });
      });

      expect(result.current.messages[0].id).toBeDefined();
      expect(typeof result.current.messages[0].id).toBe('number');
    });

    test('uses default type "user" if not provided', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ content: 'Test' });
      });

      expect(result.current.messages[0].type).toBe('user');
    });

    test('generates timestamp if not provided', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ content: 'Test' });
      });

      expect(result.current.messages[0].timestamp).toBeDefined();
    });

    test('does not add message without content', () => {
      const { result } = renderHook(() => useChatMessages());
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      act(() => {
        result.current.addMessage({});
      });

      expect(result.current.messages).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('limits messages to maxMessages', () => {
      const { result } = renderHook(() => useChatMessages({ maxMessages: 3 }));

      act(() => {
        result.current.addMessage({ content: 'Message 1' });
        result.current.addMessage({ content: 'Message 2' });
        result.current.addMessage({ content: 'Message 3' });
        result.current.addMessage({ content: 'Message 4' });
      });

      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[0].content).toBe('Message 2');
      expect(result.current.messages[2].content).toBe('Message 4');
    });

    test('persists to localStorage when enabled', () => {
      const { result } = renderHook(() => useChatMessages({ persistToStorage: true }));

      act(() => {
        result.current.addMessage({ id: 1, content: 'Test' });
      });

      const stored = JSON.parse(localStorage.getItem('chat_messages'));
      expect(stored).toHaveLength(1);
      expect(stored[0].content).toBe('Test');
    });

    test('copies sender_type from type if not provided', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ content: 'Test', type: 'admin' });
      });

      expect(result.current.messages[0].sender_type).toBe('admin');
    });
  });

  describe('addMessages', () => {
    test('adds multiple messages at once', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessages([
          { content: 'Message 1' },
          { content: 'Message 2' },
          { content: 'Message 3' }
        ]);
      });

      expect(result.current.messages).toHaveLength(3);
    });

    test('limits total messages to maxMessages', () => {
      const { result } = renderHook(() => useChatMessages({ maxMessages: 5 }));

      act(() => {
        result.current.addMessages([
          { content: 'M1' },
          { content: 'M2' },
          { content: 'M3' },
          { content: 'M4' },
          { content: 'M5' },
          { content: 'M6' },
          { content: 'M7' }
        ]);
      });

      expect(result.current.messages).toHaveLength(5);
      expect(result.current.messages[0].content).toBe('M3');
    });

    test('does not add empty array', () => {
      const { result } = renderHook(() => useChatMessages());
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      act(() => {
        result.current.addMessages([]);
      });

      expect(result.current.messages).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('does not add non-array', () => {
      const { result } = renderHook(() => useChatMessages());
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      act(() => {
        result.current.addMessages('not array');
      });

      expect(result.current.messages).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('removeMessage', () => {
    test('removes message by ID', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ id: 1, content: 'Message 1' });
        result.current.addMessage({ id: 2, content: 'Message 2' });
      });

      act(() => {
        result.current.removeMessage(1);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe(2);
    });

    test('does nothing if ID not found', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ id: 1, content: 'Message 1' });
      });

      act(() => {
        result.current.removeMessage(999);
      });

      expect(result.current.messages).toHaveLength(1);
    });
  });

  describe('clearMessages', () => {
    test('clears all messages', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ content: 'Message 1' });
        result.current.addMessage({ content: 'Message 2' });
      });

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toHaveLength(0);
    });

    test('clears localStorage when enabled', () => {
      const { result } = renderHook(() => useChatMessages({ persistToStorage: true }));

      act(() => {
        result.current.addMessage({ content: 'Test' });
      });

      expect(localStorage.getItem('chat_messages')).toBeTruthy();

      act(() => {
        result.current.clearMessages();
      });

      expect(localStorage.getItem('chat_messages')).toBeNull();
    });

    test('handles localStorage clear errors', () => {
      const { result } = renderHook(() => useChatMessages({ persistToStorage: true }));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock localStorage.removeItem to throw
      const originalRemove = Storage.prototype.removeItem;
      Storage.prototype.removeItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      act(() => {
        result.current.clearMessages();
      });

      expect(consoleSpy).toHaveBeenCalled();

      // Restore
      Storage.prototype.removeItem = originalRemove;
      consoleSpy.mockRestore();
    });
  });

  describe('getMessageById', () => {
    test('returns message by ID', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ id: 1, content: 'Message 1' });
        result.current.addMessage({ id: 2, content: 'Message 2' });
      });

      const msg = result.current.getMessageById(2);
      expect(msg.content).toBe('Message 2');
    });

    test('returns null if not found', () => {
      const { result } = renderHook(() => useChatMessages());

      const msg = result.current.getMessageById(999);
      expect(msg).toBeNull();
    });
  });

  describe('filterMessagesByType', () => {
    test('filters messages by type', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ content: 'User 1', type: 'user' });
        result.current.addMessage({ content: 'AI 1', type: 'ai' });
        result.current.addMessage({ content: 'User 2', type: 'user' });
      });

      const userMessages = result.current.filterMessagesByType('user');
      expect(userMessages).toHaveLength(2);
      expect(userMessages.every(m => m.type === 'user')).toBe(true);
    });

    test('returns empty array if no matches', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ content: 'User 1', type: 'user' });
      });

      const adminMessages = result.current.filterMessagesByType('admin');
      expect(adminMessages).toHaveLength(0);
    });
  });

  describe('getMessagesBySender', () => {
    test('filters messages by sender name', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ content: 'M1', sender_name: 'Alice' });
        result.current.addMessage({ content: 'M2', sender_name: 'Bob' });
        result.current.addMessage({ content: 'M3', sender_name: 'Alice' });
      });

      const aliceMessages = result.current.getMessagesBySender('Alice');
      expect(aliceMessages).toHaveLength(2);
      expect(aliceMessages.every(m => m.sender_name === 'Alice')).toBe(true);
    });

    test('returns empty array if no matches', () => {
      const { result } = renderHook(() => useChatMessages());

      const messages = result.current.getMessagesBySender('Unknown');
      expect(messages).toHaveLength(0);
    });
  });

  describe('getLastMessages', () => {
    test('returns last N messages', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ id: 1, content: 'M1' });
        result.current.addMessage({ id: 2, content: 'M2' });
        result.current.addMessage({ id: 3, content: 'M3' });
        result.current.addMessage({ id: 4, content: 'M4' });
      });

      const last2 = result.current.getLastMessages(2);
      expect(last2).toHaveLength(2);
      expect(last2[0].id).toBe(3);
      expect(last2[1].id).toBe(4);
    });

    test('returns all messages if count > length', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ content: 'M1' });
        result.current.addMessage({ content: 'M2' });
      });

      const last10 = result.current.getLastMessages(10);
      expect(last10).toHaveLength(2);
    });
  });

  describe('updateMessage', () => {
    test('updates message by ID', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ id: 1, content: 'Original', metadata: { status: 'sent' } });
      });

      act(() => {
        result.current.updateMessage(1, { content: 'Updated', metadata: { status: 'delivered' } });
      });

      expect(result.current.messages[0].content).toBe('Updated');
      expect(result.current.messages[0].metadata.status).toBe('delivered');
    });

    test('does nothing if ID not found', () => {
      const { result } = renderHook(() => useChatMessages());

      act(() => {
        result.current.addMessage({ id: 1, content: 'Original' });
      });

      act(() => {
        result.current.updateMessage(999, { content: 'Updated' });
      });

      expect(result.current.messages[0].content).toBe('Original');
    });
  });

  describe('checkAutoScroll', () => {
    test('returns true if near bottom', () => {
      const { result } = renderHook(() => useChatMessages());

      const mockContainer = {
        scrollTop: 900,
        scrollHeight: 1000,
        clientHeight: 100
      };

      const shouldScroll = result.current.checkAutoScroll(mockContainer);
      expect(shouldScroll).toBe(true);
    });

    test('returns false if not near bottom', () => {
      const { result } = renderHook(() => useChatMessages());

      const mockContainer = {
        scrollTop: 0,
        scrollHeight: 1000,
        clientHeight: 100
      };

      const shouldScroll = result.current.checkAutoScroll(mockContainer);
      expect(shouldScroll).toBe(false);
    });

    test('returns false if no container', () => {
      const { result } = renderHook(() => useChatMessages());

      const shouldScroll = result.current.checkAutoScroll(null);
      expect(shouldScroll).toBe(false);
    });
  });

  describe('scrollToBottom', () => {
    test('scrolls container to bottom with smooth behavior', () => {
      const { result } = renderHook(() => useChatMessages());

      const mockScrollTo = jest.fn();
      const mockContainer = {
        scrollHeight: 1000,
        scrollTo: mockScrollTo
      };

      result.current.scrollToBottom(mockContainer);

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 1000,
        behavior: 'smooth'
      });
    });

    test('scrolls without smooth behavior when specified', () => {
      const { result } = renderHook(() => useChatMessages());

      const mockScrollTo = jest.fn();
      const mockContainer = {
        scrollHeight: 1000,
        scrollTo: mockScrollTo
      };

      result.current.scrollToBottom(mockContainer, false);

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 1000,
        behavior: 'auto'
      });
    });

    test('does nothing if no container', () => {
      const { result } = renderHook(() => useChatMessages());

      // Should not throw
      result.current.scrollToBottom(null);
    });
  });

  describe('persistence edge cases', () => {
    test('handles localStorage setItem errors gracefully', () => {
      const { result } = renderHook(() => useChatMessages({ persistToStorage: true }));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock localStorage.setItem to throw
      const originalSet = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Storage full');
      });

      act(() => {
        result.current.addMessage({ content: 'Test' });
      });

      expect(consoleSpy).toHaveBeenCalled();

      // Restore
      Storage.prototype.setItem = originalSet;
      consoleSpy.mockRestore();
    });
  });

  describe('return interface', () => {
    test('exposes all required methods and state', () => {
      const { result } = renderHook(() => useChatMessages());

      expect(result.current).toHaveProperty('messages');
      expect(result.current).toHaveProperty('messageCount');
      expect(result.current).toHaveProperty('addMessage');
      expect(result.current).toHaveProperty('addMessages');
      expect(result.current).toHaveProperty('removeMessage');
      expect(result.current).toHaveProperty('clearMessages');
      expect(result.current).toHaveProperty('updateMessage');
      expect(result.current).toHaveProperty('getMessageById');
      expect(result.current).toHaveProperty('filterMessagesByType');
      expect(result.current).toHaveProperty('getMessagesBySender');
      expect(result.current).toHaveProperty('getLastMessages');
      expect(result.current).toHaveProperty('checkAutoScroll');
      expect(result.current).toHaveProperty('scrollToBottom');
      expect(result.current).toHaveProperty('shouldAutoScroll');
    });
  });
});
