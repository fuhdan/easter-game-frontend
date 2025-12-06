/**
 * Context: ChatContext
 * Purpose: React Context for chat system state management
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - Multi-mode chat support (AI assistant, admin support, team chat)
 * - WebSocket connection management
 * - Message history and state
 * - Private conversations and team broadcasts
 * - Unread message tracking
 * - Rate limit status tracking
 * - AI context management
 * - Real-time message handling
 *
 * Chat Modes:
 * - 'ai': AI assistant chat (default)
 * - 'admin': Human admin support chat
 * - 'team': Team communication (broadcast and private messages)
 *
 * Usage:
 * - Wrap App with ChatProvider
 * - Use useChat() hook in components
 *
 * @since 2025-11-09
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import { handleWebSocketMessage } from '../services/websocket/messageHandler';
import { buildApiUrl } from '../config/apiConfig';

const ChatContext = createContext();

/**
 * Generate a unique message ID
 * Uses timestamp + counter to avoid collisions
 */
let messageCounter = 0;
const generateMessageId = () => {
  messageCounter = (messageCounter + 1) % 10000;
  return `msg-${Date.now()}-${messageCounter}`;
};

/**
 * Hook to access chat context
 *
 * @returns {Object} Chat context value with all chat state and methods
 * @throws {Error} If used outside ChatProvider
 *
 * @example
 * const {
 *   connectionStatus,
 *   messages,
 *   sendMessage,
 *   chatMode,
 *   switchMode
 * } = useChat();
 */
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
}

/**
 * Chat context provider component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.user - Current authenticated user object
 * @param {number} props.user.id - User ID
 * @param {string} props.user.username - Username
 * @param {string} props.user.role - User role (player/admin/super_admin)
 * @param {number} props.user.team_id - Team ID
 * @returns {React.Component} ChatContext.Provider
 */
export function ChatProvider({ children, user }) {
  // User prop passed from App.jsx instead of using AuthContext
  const { connectionStatus, lastError: wsError, sendMessage: wsSend, onMessage, reconnect: wsReconnect, disconnect } = useWebSocket(null, {
    autoConnect: !!user, reconnectInterval: 1000, maxReconnectInterval: 30000, heartbeatInterval: 30000
  });

  const [messages, setMessages] = useState([]);
  const [chatMode, setChatMode] = useState('ai');
  const [isTyping, setIsTyping] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [aiContext, setAIContext] = useState(null);
  const [rateLimitStatus, setRateLimitStatus] = useState({ exceeded: false, limit_type: null, retry_after: 0, resetTime: null });

  // Team chat state
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null); // For private chat
  const [selectedTeam, setSelectedTeam] = useState(null); // For team broadcast (admin view)
  const [teamBroadcastMessages, setTeamBroadcastMessages] = useState([]);
  const [privateConversations, setPrivateConversations] = useState({}); // { userId: [messages] }
  const [unreadCounts, setUnreadCounts] = useState({ broadcast: 0, private: {} }); // Track unread messages

  const addMessage = useCallback((message) => { setMessages(prev => [...prev, message]); }, []);
  const clearMessages = useCallback(() => { setMessages([]); }, []);
  const updateMessage = useCallback((messageId, updates) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);
  const addOrUpdateMessage = useCallback((message) => {
    setMessages(prev => {
      const existingIndex = prev.findIndex(msg => msg.id === message.id);
      if (existingIndex >= 0) {
        // Update existing message
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...message };
        return updated;
      } else {
        // Add new message
        return [...prev, message];
      }
    });
  }, []);

  // Update the most recent user message (for adding escalation status)
  const updateLastUserMessage = useCallback((updates) => {
    setMessages(prev => {
      // Find the last user message (sender_type === 'user' or type === 'user')
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].sender_type === 'user' || prev[i].type === 'user') {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            ...updates,
            metadata: { ...updated[i].metadata, ...updates.metadata }
          };
          return updated;
        }
      }
      return prev; // No user message found
    });
  }, []);

  // Update all messages with a specific notification_id
  const updateMessagesByNotificationId = useCallback((notificationId, updates) => {
    setMessages(prev => prev.map(msg => {
      if (msg.metadata?.notification_id === notificationId) {
        return {
          ...msg,
          ...updates,
          metadata: { ...msg.metadata, ...updates.metadata }
        };
      }
      return msg;
    }));
  }, []);

  // Team chat handlers
  const handleIncomingPrivateMessage = useCallback((message) => {
    console.log('[ChatContext] Private message:', message);
    // Add to private conversation
    const otherUserId = message.sender_id === user?.id ? message.recipient_id : message.sender_id;
    setPrivateConversations(prev => ({
      ...prev,
      [otherUserId]: [...(prev[otherUserId] || []), message]
    }));

    // Increment unread count if not currently viewing this conversation
    if (message.sender_id !== user?.id) {
      setUnreadCounts(prev => ({
        ...prev,
        private: {
          ...prev.private,
          [otherUserId]: (prev.private[otherUserId] || 0) + 1
        }
      }));
    }
  }, [user]);

  const handleIncomingBroadcast = useCallback((message) => {
    console.log('[ChatContext] Broadcast message:', message);
    console.log('[ChatContext] Message sender_id:', message.sender_id, 'Current user id:', user?.id);
    setTeamBroadcastMessages(prev => [...prev, message]);

    // Increment broadcast unread count if message is from someone else
    if (message.sender_id !== user?.id) {
      console.log('[ChatContext] Incrementing broadcast unread count');
      setUnreadCounts(prev => ({
        ...prev,
        broadcast: prev.broadcast + 1
      }));
    } else {
      console.log('[ChatContext] Not incrementing - message from self');
    }
  }, [user]);


  useEffect(() => {
    console.log('[ChatContext] Setting up message handler');
    if (!onMessage) {
      console.log('[ChatContext] onMessage not available, skipping handler setup');
      return;
    }

    const unsubscribe = onMessage((data) => {
      console.log('[ChatContext] Message received in listener:', data.type);
      handleWebSocketMessage(data, {
        addMessage,
        updateMessage,
        addOrUpdateMessage,
        updateLastUserMessage,
        updateMessagesByNotificationId,
        setIsTyping,
        setLastError,
        setRateLimitStatus,
        handleIncomingPrivateMessage,
        handleIncomingBroadcast,
        handleTypingIndicator: (userId, typing) => console.log('[Typing]:', userId, typing)
      });
    });

    console.log('[ChatContext] Message handler registered');
    return () => {
      console.log('[ChatContext] Cleaning up message handler');
      unsubscribe();
    };
  }, [onMessage, addMessage, updateMessage, addOrUpdateMessage, updateLastUserMessage, updateMessagesByNotificationId, handleIncomingPrivateMessage, handleIncomingBroadcast]);

  const sendMessage = useCallback((content, messageType = null) => {
    if (!content || !content.trim()) return false;

    // Use explicit messageType if provided, otherwise use chatMode
    const effectiveMessageType = messageType || chatMode;

    // Only allow 'ai' or 'admin' message types
    if (effectiveMessageType !== 'ai' && effectiveMessageType !== 'admin') {
      return false;
    }

    addMessage({
      id: generateMessageId(),
      type: 'user',
      sender_type: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    });
    if (effectiveMessageType === 'ai') setIsTyping(true);
    return wsSend('user_message', { content: content.trim(), message_type: effectiveMessageType });
  }, [chatMode, wsSend, addMessage]);

  // Load AI/Admin chat history
  const loadChatHistory = useCallback(async (sessionType) => {
    if (!user || sessionType === 'team') return;

    try {
      console.log(`[ChatContext] Loading ${sessionType} chat history...`);
      const response = await fetch(`${buildApiUrl('chat/messages')}?session_type=${sessionType}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[ChatContext] Loaded ${data.count} messages from ${sessionType} session`);

        // Convert to UI message format
        // Note: The messages endpoint now includes notification_id, status, and escalation_type
        // directly in the response for user messages that triggered escalations
        const uiMessages = data.messages.map(msg => ({
          id: msg.id.toString(),
          type: msg.sender_type,
          sender_type: msg.sender_type,
          sender_name: msg.sender_type === 'ai' ? 'AI' : 'Admin',
          content: msg.content,
          timestamp: msg.created_at,
          metadata: {
            ...(msg.processing_time_ms ? { processing_time_ms: msg.processing_time_ms } : {}),
            ...(msg.notification_id ? {
              notification_id: msg.notification_id,
              status: msg.status,
              escalation_type: msg.escalation_type
            } : {})
          }
        }));

        setMessages(uiMessages);
      } else {
        console.error(`[ChatContext] Failed to load ${sessionType} history:`, response.status);
      }
    } catch (error) {
      console.error(`[ChatContext] Error loading ${sessionType} history:`, error);
    }
  }, [user]);

  const switchMode = useCallback((mode) => {
    if (!['ai', 'admin', 'team'].includes(mode)) return;
    setChatMode(mode);
    wsSend('mode_switch', { mode });

    // Load message history for AI and Admin modes FIRST
    if (mode === 'ai' || mode === 'admin') {
      loadChatHistory(mode);
    } else {
      // For team mode, clear messages and show system message
      clearMessages();
      const modeText = 'Team Chat';
      addMessage({
        id: generateMessageId(),
        type: 'system',
        sender_type: 'system',
        content: 'Switched to ' + modeText + ' mode',
        timestamp: new Date().toISOString()
      });
    }
  }, [chatMode, wsSend, addMessage, clearMessages, loadChatHistory]);

  const loadAIContext = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch active event
      const eventResponse = await fetch(buildApiUrl('events/active'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!eventResponse.ok) {
        console.error('[ChatContext] Failed to fetch active event');
        setAIContext({ game: null, team: user.team_name || 'Unknown', progress: 0, hints_used: 0, hasActiveGame: false });
        return;
      }

      const event = await eventResponse.json();

      // Fetch games with progress for this event
      const gamesResponse = await fetch(buildApiUrl(`events/${event.id}/games`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!gamesResponse.ok) {
        console.error('[ChatContext] Failed to fetch games');
        setAIContext({ game: null, team: user.team_name || 'Unknown', progress: 0, hints_used: 0, hasActiveGame: false });
        return;
      }

      const games = await gamesResponse.json();

      // Calculate overall progress
      const completedGames = games.filter(g => g.progress && g.progress.status === 'completed').length;
      const totalGames = games.length;
      const progressPercentage = totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0;

      // Find current game with priority:
      // 1. Game with "in_progress" status
      // 2. Most recently active game (not_started or in_progress)
      // SECURITY: Only show game info if user has actually started a game
      let currentGame = games.find(g => g.progress && g.progress.status === 'in_progress');

      if (!currentGame) {
        // Find most recently active game (any with progress that's not completed)
        currentGame = games.find(g => g.progress && g.progress.status !== 'completed');
      }

      // Get hints used and game name (using order_index like TeamProgress does)
      let hintsUsed = 0;
      let gameName = null;  // null means no active game
      let hasActiveGame = false;

      if (currentGame && currentGame.progress) {
        // Only set game info if there's actual progress
        hintsUsed = currentGame.progress.hints_used || 0;
        // Use "Game X" format like in TeamProgress component
        gameName = currentGame.order_index ? `Game ${currentGame.order_index}` : 'Game';
        hasActiveGame = true;
      }

      setAIContext({
        game: gameName,
        team: user.team_name || 'Unknown',
        progress: progressPercentage,
        hints_used: hintsUsed,
        hasActiveGame: hasActiveGame  // Add flag to indicate if game is active
      });

    } catch (error) {
      console.error('[ChatContext] Error loading AI context:', error);
      setAIContext({ game: null, team: user.team_name || 'Unknown', progress: 0, hints_used: 0, hasActiveGame: false });
    }
  }, [user]);

  useEffect(() => { if (chatMode === 'ai' && user) loadAIContext(); }, [chatMode, user, loadAIContext]);

  // Load initial history when component mounts (AI mode is default)
  const hasLoadedInitialHistory = useRef(false);
  useEffect(() => {
    if (user && chatMode === 'ai' && !hasLoadedInitialHistory.current) {
      console.log('[ChatContext] Loading initial AI history on mount');
      loadChatHistory('ai');
      hasLoadedInitialHistory.current = true;
    }
  }, [user, chatMode, loadChatHistory]);

  // Disconnect WebSocket when user logs out
  const prevUserRef = useRef(user);
  useEffect(() => {
    // If user was previously logged in and is now null (logged out)
    if (prevUserRef.current && !user && disconnect) {
      console.log('[ChatContext] User logged out, permanently disconnecting WebSocket');
      disconnect();
      // The WebSocket will not auto-reconnect because autoConnect is based on !!user
    }

    prevUserRef.current = user;
  }, [user, disconnect]);

  // Load team broadcast history
  const loadBroadcastHistory = useCallback(async () => {
    if (!user) return;

    try {
      console.log('[ChatContext] Loading team broadcast history...');
      const response = await fetch(buildApiUrl('team-chat/broadcast/history'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[ChatContext] Loaded ${data.messages.length} broadcast messages`);
        setTeamBroadcastMessages(data.messages || []);
      } else {
        console.error('[ChatContext] Failed to load broadcast history:', response.status);
      }
    } catch (error) {
      console.error('[ChatContext] Error loading broadcast history:', error);
    }
  }, [user]);

  // Load team members when switching to team chat mode
  const loadTeamMembers = useCallback(async () => {
    if (!user) return;

    try {
      console.log('[ChatContext] Loading team members...');
      const response = await fetch(buildApiUrl('team-chat/members'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[ChatContext] Team members loaded:', data.members.length);
        setTeamMembers(data.members || []);
      } else {
        console.error('[ChatContext] Failed to load team members:', response.status);
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('[ChatContext] Error loading team members:', error);
      setTeamMembers([]);
    }
  }, [user]);

  useEffect(() => {
    if (chatMode === 'team' && user) {
      loadTeamMembers();
      loadBroadcastHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMode, user]);

  // Team chat actions
  const sendTeamPrivateMessage = useCallback((recipientId, content) => {
    if (!content || !content.trim()) return false;
    return wsSend('team_private_message', { recipient_id: recipientId, content: content.trim() });
  }, [wsSend]);

  const sendTeamBroadcast = useCallback((content) => {
    if (!content || !content.trim()) return false;
    return wsSend('team_broadcast_message', { content: content.trim() });
  }, [wsSend]);

  const sendAdminTeamBroadcast = useCallback((teamId, content) => {
    if (!content || !content.trim() || !teamId) return false;
    console.log('[ChatContext] Sending admin broadcast to team:', teamId);
    return wsSend('admin_team_broadcast', {
      team_id: teamId,
      content: content.trim()
    });
  }, [wsSend]);

  // Load conversation history with a specific team member
  const loadConversationHistory = useCallback(async (otherUserId) => {
    if (!user || !otherUserId) return;

    try {
      console.log(`[ChatContext] Loading conversation history with user ${otherUserId}...`);
      const response = await fetch(buildApiUrl(`team-chat/conversation/${otherUserId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[ChatContext] Loaded ${data.messages.length} messages from history`);

        // Set the conversation history
        setPrivateConversations(prev => ({
          ...prev,
          [otherUserId]: data.messages || []
        }));
      } else {
        console.error('[ChatContext] Failed to load conversation history:', response.status);
      }
    } catch (error) {
      console.error('[ChatContext] Error loading conversation history:', error);
    }
  }, [user]);

  const selectTeamMember = useCallback((member) => {
    setSelectedTeamMember(member);
    // Clear team selection when selecting a member
    setSelectedTeam(null);

    // Load conversation history when selecting a member
    if (member) {
      loadConversationHistory(member.id);

      // Clear unread count for this member
      setUnreadCounts(prev => ({
        ...prev,
        private: {
          ...prev.private,
          [member.id]: 0
        }
      }));
    }
  }, [loadConversationHistory]);

  const selectTeam = useCallback((team) => {
    setSelectedTeam(team);
    // Clear member selection when selecting a team
    setSelectedTeamMember(null);

    // TODO: Load team broadcast history if needed
    console.log('[ChatContext] Selected team for broadcast:', team);
  }, []);

  const clearBroadcastUnread = useCallback(() => {
    setUnreadCounts(prev => ({ ...prev, broadcast: 0 }));
  }, []);

  const getTotalUnreadCount = useCallback(() => {
    const privateTotal = Object.values(unreadCounts.private).reduce((sum, count) => sum + count, 0);
    return unreadCounts.broadcast + privateTotal;
  }, [unreadCounts]);

  const value = React.useMemo(() => ({
    user,
    connectionStatus,
    lastError: lastError || wsError,
    setLastError,  // Export setter for error dismissal
    reconnect: wsReconnect,
    messages,
    addMessage,
    clearMessages,
    updateMessage,
    sendMessage,
    chatMode,
    switchMode,
    aiContext,
    loadAIContext,
    loadChatHistory,  // Export for loading admin/ai chat history
    isTyping,
    rateLimitStatus,
    setRateLimitStatus,  // Export setter for countdown timer
    // Team chat
    teamMembers,
    setTeamMembers,
    selectedTeamMember,
    selectTeamMember,
    selectedTeam,
    selectTeam,
    teamBroadcastMessages,
    privateConversations,
    sendTeamPrivateMessage,
    sendTeamBroadcast,
    sendAdminTeamBroadcast,
    unreadCounts,
    clearBroadcastUnread,
    getTotalUnreadCount
  }), [
    user,
    connectionStatus,
    lastError,
    setLastError,
    wsError,
    wsReconnect,
    messages,
    addMessage,
    clearMessages,
    updateMessage,
    sendMessage,
    chatMode,
    switchMode,
    aiContext,
    loadAIContext,
    loadChatHistory,
    isTyping,
    rateLimitStatus,
    setRateLimitStatus,
    teamMembers,
    setTeamMembers,
    selectedTeamMember,
    selectTeamMember,
    selectedTeam,
    selectTeam,
    teamBroadcastMessages,
    privateConversations,
    sendTeamPrivateMessage,
    sendTeamBroadcast,
    sendAdminTeamBroadcast,
    unreadCounts,
    clearBroadcastUnread,
    getTotalUnreadCount
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export default ChatContext;
