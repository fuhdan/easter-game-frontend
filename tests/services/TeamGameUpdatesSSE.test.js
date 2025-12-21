/**
 * Module: TeamGameUpdatesSSE.test.js
 * Purpose: Tests for TeamGameUpdatesSSE wrapper
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import TeamGameUpdatesSSE from '../../src/services/TeamGameUpdatesSSE';
import GenericSSEClient from '../../src/services/GenericSSEClient';

jest.mock('../../src/services/GenericSSEClient');
jest.mock('../../src/config/apiConfig', () => ({
  API_CONFIG: {
    BASE_URL: '/api/v1',
    VERSION: 'v1'
  },
  buildApiUrl: jest.fn((path) => `/api/${path}`)
}));

describe('TeamGameUpdatesSSE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('extends GenericSSEClient', () => {
    const client = new TeamGameUpdatesSSE();
    expect(client).toBeInstanceOf(GenericSSEClient);
  });

  test('configures endpoint correctly', () => {
    new TeamGameUpdatesSSE();
    expect(GenericSSEClient).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/api/sse/team/game-updates/stream'
    }));
  });

  test('configures event types', () => {
    new TeamGameUpdatesSSE();
    expect(GenericSSEClient).toHaveBeenCalledWith(expect.objectContaining({
      eventTypes: ['game_started', 'game_completed', 'hint_used', 'heartbeat', 'error']
    }));
  });

  test('configures reconnection settings', () => {
    new TeamGameUpdatesSSE();
    expect(GenericSSEClient).toHaveBeenCalledWith(expect.objectContaining({
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000
    }));
  });

  test('sets client name', () => {
    new TeamGameUpdatesSSE();
    expect(GenericSSEClient).toHaveBeenCalledWith(expect.objectContaining({
      name: 'TeamGameUpdatesSSE'
    }));
  });

  test('logs initialization', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    new TeamGameUpdatesSSE();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('TeamGameUpdatesSSE'));
    consoleSpy.mockRestore();
  });
});
