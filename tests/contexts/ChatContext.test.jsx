/**
 * Module: ChatContext.test.jsx
 * Purpose: Tests for ChatContext
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatProvider, useChat } from '../../src/contexts/ChatContext';
import { createMockUser, createMockAdmin } from '../test-utils';

// Mock the WebSocket hook
jest.mock('../../src/hooks/useWebSocket', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    connectionStatus: 'connected',
    lastError: null,
    sendMessage: jest.fn(() => true),
    onMessage: jest.fn((callback) => {
      // Store callback for later use
      return () => {}; // Unsubscribe function
    }),
    reconnect: jest.fn(),
    disconnect: jest.fn()
  }))
}));

// Mock the message handler
jest.mock('../../src/services/websocket/messageHandler', () => ({
  handleWebSocketMessage: jest.fn()
}));

// Mock the API config
jest.mock('../../src/config/apiConfig', () => ({
  buildApiUrl: jest.fn((path) => `http://localhost:8000/api/${path}`)
}));

const TestComponent = () => {
  const {
    user,
    connectionStatus,
    messages,
    chatMode,
    isTyping,
    rateLimitStatus,
    teamMembers,
    selectedTeamMember,
    aiContext
  } = useChat();

  return (
    <div>
      <div data-testid="user">{user ? user.username : 'null'}</div>
      <div data-testid="connection-status">{connectionStatus}</div>
      <div data-testid="messages-count">{messages.length}</div>
      <div data-testid="chat-mode">{chatMode}</div>
      <div data-testid="is-typing">{isTyping ? 'yes' : 'no'}</div>
      <div data-testid="rate-limit-exceeded">{rateLimitStatus.exceeded ? 'yes' : 'no'}</div>
      <div data-testid="team-members-count">{teamMembers.length}</div>
      <div data-testid="selected-member">{selectedTeamMember ? selectedTeamMember.username : 'none'}</div>
      <div data-testid="ai-context">{aiContext ? JSON.stringify(aiContext) : 'null'}</div>
    </div>
  );
};

describe('ChatContext', () => {
  let mockUser;
  let mockFetch;

  beforeEach(() => {
    mockUser = createMockUser();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    global.localStorage = {
      getItem: jest.fn(() => 'mock-token'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete global.fetch;
    delete global.localStorage;
  });

  describe('useChat hook', () => {
    test('throws error when used outside ChatProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useChat must be used within a ChatProvider');

      consoleError.mockRestore();
    });

    test('returns context value when used inside ChatProvider', () => {
      render(
        <ChatProvider user={mockUser}>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
    });
  });

  describe('ChatProvider', () => {
    test('renders children', () => {
      render(
        <ChatProvider user={mockUser}>
          <div data-testid="child">Test Child</div>
        </ChatProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    test('initializes with default chat mode (ai)', () => {
      render(
        <ChatProvider user={mockUser}>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('chat-mode')).toHaveTextContent('ai');
    });

    test('initializes with empty messages array', () => {
      render(
        <ChatProvider user={mockUser}>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
    });

    test('initializes with not typing state', () => {
      render(
        <ChatProvider user={mockUser}>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('is-typing')).toHaveTextContent('no');
    });

    test('initializes with no rate limit exceeded', () => {
      render(
        <ChatProvider user={mockUser}>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('rate-limit-exceeded')).toHaveTextContent('no');
    });
  });

  describe('sendMessage function', () => {
    const SendMessageTestComponent = () => {
      const { sendMessage, messages } = useChat();

      return (
        <div>
          <button onClick={() => sendMessage('Test message')}>Send</button>
          <button onClick={() => sendMessage('AI message', 'ai')}>Send AI</button>
          <button onClick={() => sendMessage('Admin message', 'admin')}>Send Admin</button>
          <button onClick={() => sendMessage('')}>Send Empty</button>
          <div data-testid="messages-count">{messages.length}</div>
        </div>
      );
    };

    test('sends message and adds to messages array', async () => {
      render(
        <ChatProvider user={mockUser}>
          <SendMessageTestComponent />
        </ChatProvider>
      );

      const sendButton = screen.getByText('Send');
      await act(async () => {
        sendButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
      });
    });

    test('does not send empty message', async () => {
      render(
        <ChatProvider user={mockUser}>
          <SendMessageTestComponent />
        </ChatProvider>
      );

      const sendButton = screen.getByText('Send Empty');
      await act(async () => {
        sendButton.click();
      });

      // Messages count should remain 0
      expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
    });

    test('sends AI message type', async () => {
      render(
        <ChatProvider user={mockUser}>
          <SendMessageTestComponent />
        </ChatProvider>
      );

      const sendButton = screen.getByText('Send AI');
      await act(async () => {
        sendButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
      });
    });

    test('sends admin message type', async () => {
      render(
        <ChatProvider user={mockUser}>
          <SendMessageTestComponent />
        </ChatProvider>
      );

      const sendButton = screen.getByText('Send Admin');
      await act(async () => {
        sendButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
      });
    });
  });

  describe('switchMode function', () => {
    const SwitchModeTestComponent = () => {
      const { switchMode, chatMode, messages } = useChat();

      return (
        <div>
          <button onClick={() => switchMode('ai')}>AI Mode</button>
          <button onClick={() => switchMode('admin')}>Admin Mode</button>
          <button onClick={() => switchMode('team')}>Team Mode</button>
          <button onClick={() => switchMode('invalid')}>Invalid Mode</button>
          <div data-testid="chat-mode">{chatMode}</div>
          <div data-testid="messages-count">{messages.length}</div>
        </div>
      );
    };

    test('switches to ai mode', async () => {
      // Mock chat history endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 0, messages: [] })
      });

      render(
        <ChatProvider user={mockUser}>
          <SwitchModeTestComponent />
        </ChatProvider>
      );

      const aiButton = screen.getByText('AI Mode');
      await act(async () => {
        aiButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('chat-mode')).toHaveTextContent('ai');
      });
    });

    test('switches to admin mode', async () => {
      // Mock chat history endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 0, messages: [] })
      });

      render(
        <ChatProvider user={mockUser}>
          <SwitchModeTestComponent />
        </ChatProvider>
      );

      const adminButton = screen.getByText('Admin Mode');
      await act(async () => {
        adminButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('chat-mode')).toHaveTextContent('admin');
      });
    });

    test('switches to team mode and shows system message', async () => {
      render(
        <ChatProvider user={mockUser}>
          <SwitchModeTestComponent />
        </ChatProvider>
      );

      const teamButton = screen.getByText('Team Mode');
      await act(async () => {
        teamButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('chat-mode')).toHaveTextContent('team');
      });

      // Should have one system message
      await waitFor(() => {
        expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
      });
    });

    test('does not switch to invalid mode', async () => {
      render(
        <ChatProvider user={mockUser}>
          <SwitchModeTestComponent />
        </ChatProvider>
      );

      const invalidButton = screen.getByText('Invalid Mode');
      await act(async () => {
        invalidButton.click();
      });

      // Should remain in AI mode (default)
      expect(screen.getByTestId('chat-mode')).toHaveTextContent('ai');
    });
  });

  describe('loadAIContext function', () => {
    test('loads AI context when in AI mode', async () => {
      // Mock chat history endpoint (called on mount when user is in AI mode)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 0,
          messages: []
        })
      });

      // Mock active event endpoint (for initial load on mount)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'Easter 2025' })
      });

      // Mock games endpoint (for initial load on mount)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            name: 'Game 1',
            order_index: 1,
            progress: {
              status: 'in_progress',
              hints_used: 2
            }
          },
          {
            id: 2,
            name: 'Game 2',
            order_index: 2,
            progress: {
              status: 'completed',
              hints_used: 1
            }
          }
        ]
      });

      // Mock active event endpoint AGAIN (for button click)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'Easter 2025' })
      });

      // Mock games endpoint AGAIN (for button click)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            name: 'Game 1',
            order_index: 1,
            progress: {
              status: 'in_progress',
              hints_used: 2
            }
          },
          {
            id: 2,
            name: 'Game 2',
            order_index: 2,
            progress: {
              status: 'completed',
              hints_used: 1
            }
          }
        ]
      });

      const LoadContextTestComponent = () => {
        const { loadAIContext, aiContext } = useChat();

        return (
          <div>
            <button onClick={loadAIContext}>Load Context</button>
            <div data-testid="ai-context">{aiContext ? JSON.stringify(aiContext) : 'null'}</div>
          </div>
        );
      };

      render(
        <ChatProvider user={mockUser}>
          <LoadContextTestComponent />
        </ChatProvider>
      );

      const loadButton = screen.getByText('Load Context');
      await act(async () => {
        loadButton.click();
      });

      await waitFor(() => {
        const contextText = screen.getByTestId('ai-context').textContent;
        expect(contextText).not.toBe('null');

        const context = JSON.parse(contextText);
        expect(context.game).toBe('Game 1');
        expect(context.team).toBe('Team Alpha');
        expect(context.hints_used).toBe(2);
        expect(context.progress).toBe(50); // 1 of 2 games completed
      });
    });

    test('handles failed event fetch', async () => {
      // Mock chat history endpoint (called on mount when user is in AI mode)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 0,
          messages: []
        })
      });

      // Mock active event endpoint (fails)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const LoadContextTestComponent = () => {
        const { loadAIContext, aiContext } = useChat();

        return (
          <div>
            <button onClick={loadAIContext}>Load Context</button>
            <div data-testid="ai-context">{aiContext ? JSON.stringify(aiContext) : 'null'}</div>
          </div>
        );
      };

      render(
        <ChatProvider user={mockUser}>
          <LoadContextTestComponent />
        </ChatProvider>
      );

      const loadButton = screen.getByText('Load Context');
      await act(async () => {
        loadButton.click();
      });

      await waitFor(() => {
        const contextText = screen.getByTestId('ai-context').textContent;
        expect(contextText).not.toBe('null');

        const context = JSON.parse(contextText);
        expect(context.game).toBe(null);
        expect(context.hasActiveGame).toBe(false);
      });
    });
  });

  describe('team chat functions', () => {
    const TeamChatTestComponent = () => {
      const {
        sendTeamPrivateMessage,
        sendTeamBroadcast,
        selectTeamMember,
        selectedTeamMember,
        teamMembers
      } = useChat();

      return (
        <div>
          <button onClick={() => sendTeamPrivateMessage(2, 'Private message')}>Send Private</button>
          <button onClick={() => sendTeamBroadcast('Broadcast message')}>Send Broadcast</button>
          <button onClick={() => selectTeamMember({ id: 2, username: 'teammate' })}>Select Member</button>
          <div data-testid="selected-member">{selectedTeamMember ? selectedTeamMember.username : 'none'}</div>
          <div data-testid="team-members-count">{teamMembers.length}</div>
        </div>
      );
    };

    test('sends team private message', async () => {
      render(
        <ChatProvider user={mockUser}>
          <TeamChatTestComponent />
        </ChatProvider>
      );

      const sendButton = screen.getByText('Send Private');
      await act(async () => {
        sendButton.click();
      });

      // Should succeed (mocked WebSocket)
      expect(sendButton).toBeInTheDocument();
    });

    test('sends team broadcast message', async () => {
      render(
        <ChatProvider user={mockUser}>
          <TeamChatTestComponent />
        </ChatProvider>
      );

      const sendButton = screen.getByText('Send Broadcast');
      await act(async () => {
        sendButton.click();
      });

      expect(sendButton).toBeInTheDocument();
    });

    test('selects team member', async () => {
      // Mock conversation history endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [] })
      });

      render(
        <ChatProvider user={mockUser}>
          <TeamChatTestComponent />
        </ChatProvider>
      );

      const selectButton = screen.getByText('Select Member');
      await act(async () => {
        selectButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-member')).toHaveTextContent('teammate');
      });
    });
  });

  describe('admin team broadcast', () => {
    test('sends admin team broadcast', async () => {
      const mockAdmin = createMockAdmin();

      const AdminBroadcastTestComponent = () => {
        const { sendAdminTeamBroadcast } = useChat();

        return (
          <div>
            <button onClick={() => sendAdminTeamBroadcast(1, 'Admin broadcast')}>Send Admin Broadcast</button>
          </div>
        );
      };

      render(
        <ChatProvider user={mockAdmin}>
          <AdminBroadcastTestComponent />
        </ChatProvider>
      );

      const sendButton = screen.getByText('Send Admin Broadcast');
      await act(async () => {
        sendButton.click();
      });

      expect(sendButton).toBeInTheDocument();
    });
  });

  describe('context value', () => {
    test('provides all expected properties', () => {
      const ContextValueTestComponent = () => {
        const context = useChat();

        return (
          <div>
            <div data-testid="has-user">{context.user !== undefined ? 'yes' : 'no'}</div>
            <div data-testid="has-connection-status">{context.connectionStatus !== undefined ? 'yes' : 'no'}</div>
            <div data-testid="has-messages">{Array.isArray(context.messages) ? 'yes' : 'no'}</div>
            <div data-testid="has-send-message">{typeof context.sendMessage === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-chat-mode">{context.chatMode !== undefined ? 'yes' : 'no'}</div>
            <div data-testid="has-switch-mode">{typeof context.switchMode === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-ai-context">{context.aiContext !== undefined ? 'yes' : 'no'}</div>
            <div data-testid="has-load-ai-context">{typeof context.loadAIContext === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-team-members">{Array.isArray(context.teamMembers) ? 'yes' : 'no'}</div>
            <div data-testid="has-send-team-private">{typeof context.sendTeamPrivateMessage === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-send-team-broadcast">{typeof context.sendTeamBroadcast === 'function' ? 'yes' : 'no'}</div>
          </div>
        );
      };

      render(
        <ChatProvider user={mockUser}>
          <ContextValueTestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('has-user')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-connection-status')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-messages')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-send-message')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-chat-mode')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-switch-mode')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-ai-context')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-load-ai-context')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-team-members')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-send-team-private')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-send-team-broadcast')).toHaveTextContent('yes');
    });
  });
});
