/**
 * Module: notificationsSSE.test.js
 * Purpose: Tests for NotificationsSSE wrapper
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import NotificationsSSE from '../../src/services/notificationsSSE';
import GenericSSEClient from '../../src/services/GenericSSEClient';

jest.mock('../../src/services/GenericSSEClient');
jest.mock('../../src/config/apiConfig', () => ({
  API_CONFIG: {
    BASE_URL: '/api/v1',
    VERSION: 'v1'
  },
  buildApiUrl: jest.fn((path) => `/api/${path}`)
}));

describe('NotificationsSSE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('extends GenericSSEClient', () => {
    const client = new NotificationsSSE();
    expect(client).toBeInstanceOf(GenericSSEClient);
  });

  test('configures endpoint correctly', () => {
    new NotificationsSSE();
    expect(GenericSSEClient).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: '/api/chat/admin/notifications/stream'
    }));
  });

  test('configures event types', () => {
    new NotificationsSSE();
    expect(GenericSSEClient).toHaveBeenCalledWith(expect.objectContaining({
      eventTypes: ['notification', 'heartbeat', 'error']
    }));
  });

  test('configures reconnection settings', () => {
    new NotificationsSSE();
    expect(GenericSSEClient).toHaveBeenCalledWith(expect.objectContaining({
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000
    }));
  });

  test('sets client name', () => {
    new NotificationsSSE();
    expect(GenericSSEClient).toHaveBeenCalledWith(expect.objectContaining({
      name: 'NotificationsSSE'
    }));
  });

  test('logs initialization', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    new NotificationsSSE();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('NotificationsSSE'));
    consoleSpy.mockRestore();
  });
});
