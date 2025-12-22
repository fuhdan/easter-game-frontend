/**
 * Module: services/websocket/index.js
 * Purpose: WebSocket exports (migrated to hooks)
 * Part of: Easter Quest Frontend - Chat System
 *
 * MIGRATION NOTE (2025-12-22):
 * WebSocket functionality has been migrated from classes to React hooks.
 * - ChatWebSocket → useWebSocket hook (src/hooks/useWebSocket.js)
 * - ReconnectionManager → integrated into useWebSocket
 * - MessageQueue → integrated into useWebSocket
 * - HeartbeatManager → integrated into useWebSocket
 *
 * Use the useWebSocket hook instead of the old class-based approach.
 *
 * @since 2025-11-20
 * @updated 2025-12-22 - Migrated to hooks
 */

// No exports - use useWebSocket hook from src/hooks/useWebSocket.js
export default null;
