/**
 * Module: hooks/useTeamGameUpdates.js
 * Purpose: SSE hook for real-time team game updates
 * Part of: Easter Quest 2025 - Team Game Progress
 *
 * This is a specialized hook wrapping useSSE configured for team game updates.
 * Receives real-time notifications when:
 * - Team members start games
 * - Team members complete games
 * - Team members use hints
 *
 * Features:
 * - Real-time game progress streaming from backend
 * - Automatic reconnection on disconnect
 * - Token refresh handling with reconnection
 * - Event-based architecture for game updates
 * - Connection state management
 *
 * Usage:
 * ```javascript
 * const { gameUpdate, isConnected, error } = useTeamGameUpdates({
 *   onGameStarted: (data) => console.log('Game started:', data),
 *   onGameCompleted: (data) => console.log('Game completed:', data),
 *   onHintUsed: (data) => console.log('Hint used:', data)
 * });
 * ```
 *
 * @since 2025-12-22
 */

import { useCallback } from 'react';
import { useSSE } from './useSSE';
import { buildApiUrl } from '../config/apiConfig';
import { logger } from '../utils/logger';

/**
 * Team Game Updates SSE Hook
 *
 * Provides real-time updates about team game progress.
 *
 * Events:
 * - game_started: When a teammate starts a game
 * - game_completed: When a teammate completes a game
 * - hint_used: When a teammate uses a hint
 * - heartbeat: Keep-alive ping
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onGameStarted - Callback when game is started (data)
 * @param {Function} options.onGameCompleted - Callback when game is completed (data)
 * @param {Function} options.onHintUsed - Callback when hint is used (data)
 * @param {Function} options.onHeartbeat - Callback for heartbeat (data)
 * @param {Function} options.onConnect - Callback when connected
 * @param {Function} options.onDisconnect - Callback when disconnected
 * @param {Function} options.onError - Callback for errors
 * @returns {Object} { gameUpdate, isConnected, error, reconnect, disconnect }
 */
export const useTeamGameUpdates = (options = {}) => {
  const {
    onGameStarted,
    onGameCompleted,
    onHintUsed,
    onHeartbeat,
    onConnect,
    onDisconnect,
    onError
  } = options;

  /**
   * Handle incoming SSE messages
   */
  const handleMessage = useCallback((eventType, data) => {
    switch (eventType) {
      case 'game_started':
        logger.info('team_game_started', {
          gameName: data.game_name,
          playerName: data.player_name,
          module: 'useTeamGameUpdates'
        });
        onGameStarted?.(data);
        break;

      case 'game_completed':
        logger.info('team_game_completed', {
          gameName: data.game_name,
          playerName: data.player_name,
          score: data.score,
          module: 'useTeamGameUpdates'
        });
        onGameCompleted?.(data);
        break;

      case 'hint_used':
        logger.info('team_hint_used', {
          gameName: data.game_name,
          playerName: data.player_name,
          hintNumber: data.hint_number,
          module: 'useTeamGameUpdates'
        });
        onHintUsed?.(data);
        break;

      case 'heartbeat':
        // PERF: Don't log heartbeats - they happen every 30 seconds
        onHeartbeat?.(data);
        break;

      default:
        logger.warn('team_updates_unknown_event', {
          eventType,
          module: 'useTeamGameUpdates'
        });
    }
  }, [onGameStarted, onGameCompleted, onHintUsed, onHeartbeat]);

  /**
   * Handle connection established
   */
  const handleConnect = useCallback(() => {
    logger.info('team_updates_connected', {
      module: 'useTeamGameUpdates'
    });
    onConnect?.();
  }, [onConnect]);

  /**
   * Handle disconnection
   */
  const handleDisconnect = useCallback(() => {
    logger.info('team_updates_disconnected', {
      module: 'useTeamGameUpdates'
    });
    onDisconnect?.();
  }, [onDisconnect]);

  /**
   * Handle errors
   */
  const handleError = useCallback((errorData) => {
    logger.error('team_updates_error', {
      errorMessage: errorData.message,
      module: 'useTeamGameUpdates'
    });
    onError?.(errorData);
  }, [onError]);

  // Use generic SSE hook with team game updates configuration
  const { data, isConnected, error, reconnect, disconnect } = useSSE({
    endpoint: buildApiUrl('sse/team/game-updates/stream'),
    eventTypes: ['game_started', 'game_completed', 'hint_used', 'heartbeat', 'error'],
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    name: 'TeamGameUpdates'
  });

  return {
    gameUpdate: data,
    isConnected,
    error,
    reconnect,
    disconnect
  };
};

export default useTeamGameUpdates;
