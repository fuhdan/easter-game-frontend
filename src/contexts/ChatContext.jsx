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
import { logger } from '../utils/logger';

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
  const [unreadCounts, setUnreadCounts] = useState({ broadcast: 0, private: {}, adminNotifications: 0 }); // Track unread messages

  // Admin notifications state (one-way admin broadcasts to users)
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [showingAdminNotifications, setShowingAdminNotifications] = useState(false);

  // Admin contacts state (admins who have sent private messages to this user)
  // Format: { [adminUserId]: { id, username, display_name, role } }
  const [adminContacts, setAdminContacts] = useState({});
  const [selectedAdminContact, setSelectedAdminContact] = useState(null);

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
    logger.debug('chat_private_message_received', {
      senderId: message.sender_id,
      recipientId: message.recipient_id,
      isFromSelf: message.sender_id === user?.id,
      module: 'ChatContext'
    });
    // Add to private conversation
    const otherUserId = message.sender_id === user?.id ? message.recipient_id : message.sender_id;
    setPrivateConversations(prev => ({
      ...prev,
      [otherUserId]: [...(prev[otherUserId] || []), message]
    }));

    // Check if sender is an admin (and not the current user)
    // This allows players to see conversations with admins who message them
    if (message.sender_id !== user?.id) {
      const isAdminSender = message.sender_role === 'admin' || message.sender_role === 'game_admin';
      if (isAdminSender) {
        logger.debug('chat_admin_contact_added', {
          adminId: message.sender_id,
          adminUsername: message.sender_username,
          module: 'ChatContext'
        });
        setAdminContacts(prev => ({
          ...prev,
          [message.sender_id]: {
            id: message.sender_id,
            username: message.sender_username,
            display_name: message.sender_display_name || message.sender_username,
            role: message.sender_role
          }
        }));
      }

      // Increment unread count
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
    const isCurrentUserAdmin = user && (user.role === 'admin' || user.role === 'game_admin');
    const isAdminBroadcast = message.sender_role === 'admin' || message.sender_role === 'game_admin';

    logger.debug('chat_broadcast_received', {
      senderId: message.sender_id,
      senderRole: message.sender_role,
      currentUserId: user?.id,
      isCurrentUserAdmin,
      isAdminBroadcast,
      module: 'ChatContext'
    });

    if (isCurrentUserAdmin) {
      // Admins see all broadcasts in teamBroadcastMessages
      logger.debug('chat_admin_viewing_broadcast', {
        addingToTeamBroadcasts: true,
        module: 'ChatContext'
      });
      setTeamBroadcastMessages(prev => [...prev, message]);

      // Don't increment unread for admins viewing their own broadcasts
      if (message.sender_id !== user?.id) {
        setUnreadCounts(prev => ({
          ...prev,
          broadcast: prev.broadcast + 1
        }));
      }
    } else if (isAdminBroadcast) {
      // Regular user receiving admin broadcast - route to admin notifications
      logger.debug('chat_routing_to_admin_notifications', {
        senderId: message.sender_id,
        module: 'ChatContext'
      });
      setAdminNotifications(prev => [...prev, message]);

      logger.debug('chat_increment_admin_notification_unread', {
        module: 'ChatContext'
      });
      setUnreadCounts(prev => ({
        ...prev,
        adminNotifications: prev.adminNotifications + 1
      }));
    } else {
      // Regular team broadcast for regular user
      setTeamBroadcastMessages(prev => [...prev, message]);

      // Increment broadcast unread count if message is from someone else
      if (message.sender_id !== user?.id) {
        logger.debug('chat_increment_broadcast_unread', {
          module: 'ChatContext'
        });
        setUnreadCounts(prev => ({
          ...prev,
          broadcast: prev.broadcast + 1
        }));
      } else {
        logger.debug('chat_skip_unread_own_message', {
          module: 'ChatContext'
        });
      }
    }
  }, [user]);

  // Add admin-sent broadcast to local state (for admin to see their own broadcasts)
  // Defined here so it's available in the useEffect below
  const addAdminSentBroadcast = useCallback((message) => {
    logger.debug('chat_admin_sent_broadcast_added', {
      messageId: message.id,
      teamId: message.team_id,
      module: 'ChatContext'
    });
    setTeamBroadcastMessages(prev => [...prev, message]);
  }, []);

  // BUGFIX: Use ref to store latest handler functions to avoid re-registering listener
  // This prevents race conditions where messages arrive between unsubscribe/resubscribe
  const handlersRef = useRef({
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
    handleTypingIndicator: (userId, typing) => logger.debug('chat_typing_indicator', { userId, typing, module: 'ChatContext' }),
    addAdminSentBroadcast
  });

  // Update ref whenever handlers change (but don't re-register listener)
  useEffect(() => {
    handlersRef.current = {
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
      handleTypingIndicator: (userId, typing) => logger.debug('chat_typing_indicator', { userId, typing, module: 'ChatContext' }),
      addAdminSentBroadcast
    };
  }, [addMessage, updateMessage, addOrUpdateMessage, updateLastUserMessage, updateMessagesByNotificationId, setIsTyping, setLastError, setRateLimitStatus, handleIncomingPrivateMessage, handleIncomingBroadcast, addAdminSentBroadcast]);

  // Register message listener ONCE with stable callback that reads from ref
  useEffect(() => {
    logger.debug('chat_message_handler_setup', {
      hasOnMessage: !!onMessage,
      module: 'ChatContext'
    });
    if (!onMessage) {
      logger.warn('chat_onmessage_unavailable', {
        skipSetup: true,
        module: 'ChatContext'
      });
      return;
    }

    // Stable callback that always uses latest handlers from ref
    const handleMessage = (data) => {
      logger.debug('chat_message_received_listener', {
        messageType: data.type,
        module: 'ChatContext'
      });
      handleWebSocketMessage(data, handlersRef.current);
    };

    const unsubscribe = onMessage(handleMessage);

    logger.debug('chat_message_handler_registered', {
      module: 'ChatContext'
    });
    return () => {
      logger.debug('chat_message_handler_cleanup', {
        module: 'ChatContext'
      });
      unsubscribe();
    };
  }, [onMessage]); // Only re-register if onMessage itself changes (which should be never)

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
      logger.debug('chat_history_loading', {
        sessionType,
        userId: user.id,
        module: 'ChatContext'
      });
      const response = await fetch(`${buildApiUrl('chat/messages')}?session_type=${sessionType}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('chat_history_loaded', {
          sessionType,
          messageCount: data.count,
          module: 'ChatContext'
        });

        // Convert to UI message format
        // Note: The messages endpoint now includes notification_id, status, and escalation_type
        // directly in the response for user messages that triggered escalations
        const uiMessages = data.messages.map(msg => ({
          id: msg.id.toString(),
          type: msg.sender_type,
          sender_type: msg.sender_type,
          // TEAM-BASED AI CHAT: Use actual sender_name from backend (e.g., "Clark Kent")
          sender_name: msg.sender_name,
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
        logger.error('chat_history_load_failed', {
          sessionType,
          status: response.status,
          module: 'ChatContext'
        });
      }
    } catch (error) {
      logger.error('chat_history_load_error', {
        sessionType,
        errorMessage: error.message,
        module: 'ChatContext'
      }, error);
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
    logger.debug('🎯 [ChatContext] loadAIContext called', {
      hasUser: !!user,
      userId: user?.id,
      module: 'ChatContext'
    });

    if (!user) {
      logger.warn('🎯 [ChatContext] loadAIContext aborted - no user', {
        module: 'ChatContext'
      });
      return;
    }

    // SECURITY: Admin users don't belong to teams, skip AI context loading
    if (user.role === 'admin' || user.role === 'game_admin' || user.role === 'system_admin' || user.role === 'content_admin') {
      logger.debug('🎯 [ChatContext] loadAIContext skipped - admin user without team', {
        role: user.role,
        module: 'ChatContext'
      });
      setAIContext({
        game: null,
        team: 'Admin',
        progress: 0,
        hints_used: 0,
        hasActiveGame: false
      });
      return;
    }

    try {
      logger.debug('🎯 [ChatContext] Fetching team progress for AI context', {
        module: 'ChatContext'
      });

      // BUGFIX: Use the team progress endpoint which already includes game progress
      const progressResponse = await fetch(buildApiUrl('teams/me/progress'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!progressResponse.ok) {
        logger.error('chat_ai_context_progress_fetch_failed', {
          status: progressResponse.status,
          module: 'ChatContext'
        });
        setAIContext({ game: null, team: user.team_name || 'Unknown', progress: 0, hints_used: 0, hasActiveGame: false });
        return;
      }

      const progressData = await progressResponse.json();

      logger.debug('🎯 [ChatContext] Team progress data received for AI context', {
        teamName: progressData.team?.name,
        totalGames: progressData.summary?.total_games,
        completedGames: progressData.summary?.completed_games,
        progressPercentage: progressData.summary?.progress_percentage,
        gamesCount: progressData.games?.length,
        module: 'ChatContext'
      });

      // DEBUG: Log full games array to debug progress issue
      if (progressData.games && progressData.games.length > 0) {
        logger.debug('🎯 [ChatContext] Full games data from API', {
          games: progressData.games.map(g => ({
            game_title: g.game_title,
            order_index: g.order_index,
            user_status: g.user_status,
            team_progress_percentage: g.team_progress_percentage,
            user_progress_percentage: g.user_progress_percentage,
            total_hints_used: g.total_hints_used
          })),
          module: 'ChatContext'
        });
      }

      // Extract data from team progress response
      const games = progressData.games || [];
      const progressPercentage = Math.round(progressData.summary?.progress_percentage || 0);
      const teamName = progressData.team?.name || user.team_name || 'Unknown';

      // Find current game with priority:
      // 1. Game with user_status === 'in_progress'
      // 2. Most recently active game (not completed)
      let currentGame = games.find(g => g.user_status === 'in_progress');

      if (!currentGame) {
        // Find first game that's not completed
        currentGame = games.find(g => g.user_status && g.user_status !== 'completed');
      }

      // Get hints used, game name, and game-specific progress
      let hintsUsed = 0;
      let gameName = null;  // null means no active game
      let hasActiveGame = false;
      let displayProgress = progressPercentage;  // Default to overall progress

      if (currentGame && currentGame.user_status && currentGame.user_status !== 'not_started') {
        // Only set game info if user has started the game
        hintsUsed = currentGame.total_hints_used || 0;
        // Use "Game X" format
        gameName = currentGame.order_index ? `Game ${currentGame.order_index}` : currentGame.game_title;
        hasActiveGame = true;
        // TEAM-BASED: Use team progress (highest progress achieved by any team member)
        // This ensures all team members see the same progress percentage
        displayProgress = Math.round(currentGame.team_progress_percentage || 0);
      }

      const newContext = {
        game: gameName,
        team: teamName,
        progress: displayProgress,  // Game-specific progress if active, overall progress otherwise
        hints_used: hintsUsed,
        hasActiveGame: hasActiveGame  // Add flag to indicate if game is active
      };

      logger.debug('🎯 [ChatContext] Setting AI context', {
        aiContext: newContext,
        module: 'ChatContext'
      });

      setAIContext(newContext);

      logger.info('🎯 [ChatContext] AI context updated successfully', {
        gameName,
        progressPercentage,
        hasActiveGame,
        module: 'ChatContext'
      });

    } catch (error) {
      logger.error('chat_ai_context_load_error', {
        errorMessage: error.message,
        module: 'ChatContext'
      }, error);
      setAIContext({ game: null, team: user.team_name || 'Unknown', progress: 0, hints_used: 0, hasActiveGame: false });
    }
  }, [user]);

  useEffect(() => { if (chatMode === 'ai' && user) loadAIContext(); }, [chatMode, user, loadAIContext]);

  // AI-BASED PROGRESS TRACKING: Function to trigger game progress refresh in GamePanel
  const refreshGameProgress = useCallback((gameId) => {
    logger.info('chat_refreshing_game_progress', {
      gameId,
      module: 'ChatContext'
    });

    // Dispatch custom event that GamePanel can listen to
    const event = new CustomEvent('gameProgressUpdated', {
      detail: { gameId, source: 'ai_estimation' }
    });
    window.dispatchEvent(event);
  }, []);

  // BUGFIX: Add loadAIContext to handlers after it's defined
  useEffect(() => {
    handlersRef.current.loadAIContext = loadAIContext;
    handlersRef.current.refreshGameProgress = refreshGameProgress;
  }, [loadAIContext, refreshGameProgress]);

  // Load initial history when component mounts (AI mode is default)
  const hasLoadedInitialHistory = useRef(false);
  useEffect(() => {
    if (user && chatMode === 'ai' && !hasLoadedInitialHistory.current) {
      logger.debug('chat_initial_history_loading', {
        chatMode,
        userId: user.id,
        module: 'ChatContext'
      });
      loadChatHistory('ai');
      hasLoadedInitialHistory.current = true;
    }
  }, [user, chatMode, loadChatHistory]);

  // Disconnect WebSocket when user logs out
  const prevUserRef = useRef(user);
  useEffect(() => {
    // If user was previously logged in and is now null (logged out)
    if (prevUserRef.current && !user && disconnect) {
      logger.info('chat_websocket_disconnect_logout', {
        previousUserId: prevUserRef.current.id,
        module: 'ChatContext'
      });
      disconnect();
      // The WebSocket will not auto-reconnect because autoConnect is based on !!user
    }

    prevUserRef.current = user;
  }, [user, disconnect]);

  // Load team broadcast history
  const loadBroadcastHistory = useCallback(async () => {
    if (!user) return;

    try {
      logger.debug('chat_broadcast_history_loading', {
        userId: user.id,
        module: 'ChatContext'
      });
      const response = await fetch(buildApiUrl('team-chat/broadcast/history'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('chat_broadcast_history_loaded', {
          messageCount: data.messages.length,
          module: 'ChatContext'
        });

        const allMessages = data.messages || [];

        // Check if current user is admin
        const isAdmin = user && (user.role === 'admin' || user.role === 'game_admin');

        if (isAdmin) {
          // Admins see all broadcasts in teamBroadcastMessages (including their own admin broadcasts)
          logger.debug('chat_broadcast_admin_view', {
            totalMessages: allMessages.length,
            module: 'ChatContext'
          });
          setTeamBroadcastMessages(allMessages);
          setAdminNotifications([]);
        } else {
          // Regular users: Separate admin broadcasts from team broadcasts
          const adminBroadcasts = allMessages.filter(msg =>
            msg.sender_role === 'admin' || msg.sender_role === 'game_admin'
          );
          const teamBroadcasts = allMessages.filter(msg =>
            msg.sender_role !== 'admin' && msg.sender_role !== 'game_admin'
          );

          logger.debug('chat_broadcast_user_view_separated', {
            adminBroadcastCount: adminBroadcasts.length,
            teamBroadcastCount: teamBroadcasts.length,
            module: 'ChatContext'
          });
          setTeamBroadcastMessages(teamBroadcasts);
          setAdminNotifications(adminBroadcasts);
        }
      } else {
        logger.error('chat_broadcast_history_load_failed', {
          status: response.status,
          module: 'ChatContext'
        });
      }
    } catch (error) {
      logger.error('chat_broadcast_history_load_error', {
        errorMessage: error.message,
        module: 'ChatContext'
      }, error);
    }
  }, [user]);

  // Load team members when switching to team chat mode
  const loadTeamMembers = useCallback(async () => {
    if (!user) return;

    try {
      logger.debug('chat_team_members_loading', {
        userId: user.id,
        teamId: user.team_id,
        module: 'ChatContext'
      });
      const response = await fetch(buildApiUrl('team-chat/members'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('chat_team_members_loaded', {
          memberCount: data.members.length,
          module: 'ChatContext'
        });
        setTeamMembers(data.members || []);
      } else {
        logger.error('chat_team_members_load_failed', {
          status: response.status,
          module: 'ChatContext'
        });
        setTeamMembers([]);
      }
    } catch (error) {
      logger.error('chat_team_members_load_error', {
        errorMessage: error.message,
        module: 'ChatContext'
      }, error);
      setTeamMembers([]);
    }
  }, [user]);

  // Load admin contacts (admins who have sent private messages to this user)
  const loadAdminContacts = useCallback(async () => {
    if (!user) return;

    // Skip for admins - they don't need to see admin contacts
    if (user.role === 'admin' || user.role === 'game_admin') {
      logger.debug('chat_admin_contacts_skip', {
        userRole: user.role,
        reason: 'Admin user does not need admin contacts',
        module: 'ChatContext'
      });
      return;
    }

    try {
      logger.debug('chat_admin_contacts_loading', {
        userId: user.id,
        module: 'ChatContext'
      });
      const response = await fetch(buildApiUrl('team-chat/admin-contacts'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('chat_admin_contacts_loaded', {
          contactCount: data.members.length,
          module: 'ChatContext'
        });

        // Convert array to object keyed by admin ID
        const contactsObj = {};
        for (const admin of data.members || []) {
          contactsObj[admin.id] = admin;
        }
        setAdminContacts(contactsObj);
      } else {
        logger.error('chat_admin_contacts_load_failed', {
          status: response.status,
          module: 'ChatContext'
        });
      }
    } catch (error) {
      logger.error('chat_admin_contacts_load_error', {
        errorMessage: error.message,
        module: 'ChatContext'
      }, error);
    }
  }, [user]);

  useEffect(() => {
    if (chatMode === 'team' && user) {
      loadTeamMembers();
      loadBroadcastHistory();
      loadAdminContacts();
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
    logger.info('chat_admin_broadcast_sending', {
      teamId,
      contentLength: content.trim().length,
      module: 'ChatContext'
    });
    return wsSend('admin_team_broadcast', {
      team_id: teamId,
      content: content.trim()
    });
  }, [wsSend]);

  // Load conversation history with a specific team member
  const loadConversationHistory = useCallback(async (otherUserId) => {
    if (!user || !otherUserId) return;

    try {
      logger.debug('chat_conversation_history_loading', {
        userId: user.id,
        otherUserId,
        module: 'ChatContext'
      });
      const response = await fetch(buildApiUrl(`team-chat/conversation/${otherUserId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('chat_conversation_history_loaded', {
          otherUserId,
          messageCount: data.messages.length,
          module: 'ChatContext'
        });

        // Set the conversation history
        setPrivateConversations(prev => ({
          ...prev,
          [otherUserId]: data.messages || []
        }));
      } else {
        logger.error('chat_conversation_history_load_failed', {
          otherUserId,
          status: response.status,
          module: 'ChatContext'
        });
      }
    } catch (error) {
      logger.error('chat_conversation_history_load_error', {
        otherUserId,
        errorMessage: error.message,
        module: 'ChatContext'
      }, error);
    }
  }, [user]);

  const selectTeamMember = useCallback((member) => {
    setSelectedTeamMember(member);
    // Clear all other selections when selecting a team member
    setSelectedTeam(null);
    setShowingAdminNotifications(false);
    setSelectedAdminContact(null);

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
    // Clear all other selections when selecting a team
    setSelectedTeamMember(null);
    setShowingAdminNotifications(false);
    setSelectedAdminContact(null);

    // TODO: Load team broadcast history if needed
    logger.debug('chat_team_selected_for_broadcast', {
      teamId: team?.id,
      teamName: team?.name,
      module: 'ChatContext'
    });
  }, []);

  const clearBroadcastUnread = useCallback(() => {
    setUnreadCounts(prev => ({ ...prev, broadcast: 0 }));
  }, []);

  // Select admin notifications view (clears all other selections)
  const selectAdminNotifications = useCallback(() => {
    setShowingAdminNotifications(true);
    setSelectedTeamMember(null);
    setSelectedTeam(null);
    setSelectedAdminContact(null);
    // Clear admin notifications unread count
    setUnreadCounts(prev => ({ ...prev, adminNotifications: 0 }));
  }, []);

  // Clear admin notifications selection (go back to team broadcast)
  const clearAdminNotifications = useCallback(() => {
    setShowingAdminNotifications(false);
  }, []);

  // Select an admin contact for private messaging
  const selectAdminContact = useCallback((admin) => {
    logger.debug('chat_admin_contact_selected', {
      adminId: admin?.id,
      adminUsername: admin?.username,
      module: 'ChatContext'
    });
    setSelectedAdminContact(admin);
    // Clear other selections
    setSelectedTeamMember(null);
    setSelectedTeam(null);
    setShowingAdminNotifications(false);

    if (admin) {
      // Load conversation history with this admin
      loadConversationHistory(admin.id);

      // Clear unread count for this admin
      setUnreadCounts(prev => ({
        ...prev,
        private: {
          ...prev.private,
          [admin.id]: 0
        }
      }));
    }
  }, [loadConversationHistory]);

  const getTotalUnreadCount = useCallback(() => {
    const privateTotal = Object.values(unreadCounts.private).reduce((sum, count) => sum + count, 0);
    return unreadCounts.broadcast + privateTotal + unreadCounts.adminNotifications;
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
    getTotalUnreadCount,
    // Admin notifications (one-way broadcasts from admins)
    adminNotifications,
    showingAdminNotifications,
    selectAdminNotifications,
    clearAdminNotifications,
    addAdminSentBroadcast,
    // Admin contacts (admins who have messaged this user)
    adminContacts,
    selectedAdminContact,
    selectAdminContact
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
    getTotalUnreadCount,
    adminNotifications,
    showingAdminNotifications,
    selectAdminNotifications,
    clearAdminNotifications,
    addAdminSentBroadcast,
    adminContacts,
    selectedAdminContact,
    selectAdminContact
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export default ChatContext;
