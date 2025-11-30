/**
 * Module: services/TeamGameUpdatesSSE.js
 * Purpose: SSE client for real-time team game updates
 * Part of: Easter Quest 2025 - Team Game Progress
 *
 * This is a wrapper around GenericSSEClient configured for team game updates.
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
 * const client = new TeamGameUpdatesSSE();
 *
 * client.on('game_started', (data) => {
 *   console.log(`${data.started_by} started ${data.game_name}`);
 *   // Refresh game list or update UI
 * });
 *
 * client.on('game_completed', (data) => {
 *   console.log(`${data.completed_by} completed ${data.game_name}`);
 *   // Refresh game list or update UI
 * });
 *
 * client.connect();
 * ```
 *
 * @since 2025-11-30
 */

import GenericSSEClient from './GenericSSEClient';

/**
 * SSE Client for Team Game Updates
 *
 * Backward-compatible wrapper around GenericSSEClient configured for
 * team game progress updates.
 *
 * Events:
 * - game_started: When a teammate starts a game
 * - game_completed: When a teammate completes a game
 * - hint_used: When a teammate uses a hint
 * - heartbeat: Keep-alive ping
 * - connected: Connection established
 * - disconnected: Connection closed
 * - error: Error occurred
 */
class TeamGameUpdatesSSE extends GenericSSEClient {
  /**
   * Create team game updates SSE client instance
   *
   * Automatically configures GenericSSEClient with:
   * - Endpoint: /sse/team/game-updates/stream
   * - Event types: game_started, game_completed, hint_used, heartbeat, error
   * - Reconnection: 5 attempts with exponential backoff (1s to 30s)
   */
  constructor() {
    super({
      endpoint: '/sse/team/game-updates/stream',
      eventTypes: ['game_started', 'game_completed', 'hint_used', 'heartbeat', 'error'],
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      name: 'TeamGameUpdatesSSE'
    });

    console.log('[TeamGameUpdatesSSE] Initialized using GenericSSEClient');
  }
}

export default TeamGameUpdatesSSE;
