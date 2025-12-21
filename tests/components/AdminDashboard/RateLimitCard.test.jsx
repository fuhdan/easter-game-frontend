/**
 * Test: RateLimitCard Component
 * Purpose: Test rate limit management component with SSE
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-21
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RateLimitCard from '../../../src/components/AdminDashboard/RateLimitCard';
import * as services from '../../../src/services';
import GenericSSEClient from '../../../src/services/GenericSSEClient';
import { buildApiUrl } from '../../../src/config/apiConfig';

// Mock dependencies
jest.mock('../../../src/services');
jest.mock('../../../src/services/GenericSSEClient');
jest.mock('../../../src/config/apiConfig');

describe('RateLimitCard', () => {
  let mockSSEClient;
  let mockUser;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock user
    mockUser = {
      id: 1,
      username: 'admin',
      role: 'admin',
    };

    // Mock buildApiUrl
    buildApiUrl.mockImplementation((path) => `http://localhost:8000/api/${path}`);

    // Mock SSE client
    mockSSEClient = {
      on: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    };

    GenericSSEClient.mockImplementation(() => mockSSEClient);

    // Mock services
    services.getConfig.mockResolvedValue({
      configs: [
        { key: 'auth.login_max_attempts', value: 5 },
        { key: 'auth.login_window_seconds', value: 60 },
        { key: 'auth.login_ban_duration_seconds', value: 300 },
        { key: 'rate_limits.api.max_requests', value: 100 },
      ],
    });

    services.resetRateLimitBulk.mockResolvedValue({
      success: true,
      reset_count: 1,
      failed_count: 0,
      results: [{ ip: '192.168.1.1', success: true }],
    });

    services.utils = {
      handleError: jest.fn(),
    };

    // Mock window.confirm
    global.confirm = jest.fn(() => true);

    // Mock setInterval and clearInterval
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Component Initialization', () => {
    it('should render component header', () => {
      render(<RateLimitCard user={mockUser} />);

      expect(screen.getByText('🛡️ Rate Limit Management')).toBeInTheDocument();
    });

    it('should load rate limit configuration on mount', async () => {
      render(<RateLimitCard user={mockUser} />);

      await waitFor(() => {
        expect(services.getConfig).toHaveBeenCalledTimes(1);
      });
    });

    it('should create SSE client on mount', () => {
      render(<RateLimitCard user={mockUser} />);

      expect(GenericSSEClient).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: expect.stringContaining('blocked-ips/stream'),
          eventTypes: ['blocked_ips_update', 'heartbeat', 'error'],
          name: 'RateLimitSSE',
        })
      );
    });

    it('should connect SSE client on mount', () => {
      render(<RateLimitCard user={mockUser} />);

      expect(mockSSEClient.connect).toHaveBeenCalled();
    });

    it('should disconnect SSE client on unmount', () => {
      const { unmount } = render(<RateLimitCard user={mockUser} />);

      unmount();

      expect(mockSSEClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('Rate Limit Configuration Display', () => {
    it('should display rate limit configuration after loading', async () => {
      render(<RateLimitCard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Maximum 5 failed attempts/)).toBeInTheDocument();
        expect(screen.getByText(/100 requests per minute/)).toBeInTheDocument();
      });
    });

    it('should use default values if config fetch fails', async () => {
      services.getConfig.mockRejectedValue(new Error('Config fetch failed'));

      render(<RateLimitCard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Maximum 5 failed attempts/)).toBeInTheDocument();
      });
    });

    it('should display ban duration information', async () => {
      render(<RateLimitCard user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/banned for 5 minutes/)).toBeInTheDocument();
        expect(screen.getByText(/300 seconds/)).toBeInTheDocument();
      });
    });
  });

  describe('SSE Event Handling', () => {
    it('should handle connected event', async () => {
      render(<RateLimitCard user={mockUser} />);

      // Trigger connected event
      const connectedHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'connected'
      )[1];

      act(() => {
        connectedHandler();
      });

      await waitFor(() => {
        expect(screen.getByText('🟢 Live')).toBeInTheDocument();
      });
    });

    it('should handle disconnected event', async () => {
      render(<RateLimitCard user={mockUser} />);

      // Trigger disconnected event
      const disconnectedHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'disconnected'
      )[1];

      act(() => {
        disconnectedHandler();
      });

      await waitFor(() => {
        expect(screen.getByText('🔴 Disconnected')).toBeInTheDocument();
      });
    });

    it('should handle blocked_ips_update event', async () => {
      render(<RateLimitCard user={mockUser} />);

      // Trigger blocked IPs update
      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      const mockBlockedIPs = {
        blocked_ips: [
          {
            ip: '192.168.1.100',
            status: 'banned',
            attempt_count: 5,
            ban_ttl_seconds: 300,
          },
          {
            ip: '10.0.0.50',
            status: 'warning',
            attempt_count: 3,
            ban_ttl_seconds: null,
          },
        ],
        timestamp: new Date().toISOString(),
      };

      act(() => {
        updateHandler(mockBlockedIPs);
      });

      await waitFor(() => {
        expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
        expect(screen.getByText('10.0.0.50')).toBeInTheDocument();
      });
    });

    it('should handle error event', async () => {
      render(<RateLimitCard user={mockUser} />);

      // Trigger error event
      const errorHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'error'
      )[1];

      act(() => {
        errorHandler({ message: 'Test error' });
      });

      await waitFor(() => {
        expect(screen.getByText('🔴 Disconnected')).toBeInTheDocument();
      });
    });

    it('should not show notification for "Connection lost" error', async () => {
      render(<RateLimitCard user={mockUser} />);

      const errorHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'error'
      )[1];

      act(() => {
        errorHandler({ message: 'Connection lost' });
      });

      await waitFor(() => {
        expect(screen.queryByText(/Failed to retrieve blocked IPs/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Blocked IPs Display', () => {
    it('should show empty state when no blocked IPs', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({ blocked_ips: [], timestamp: new Date().toISOString() });
      });

      await waitFor(() => {
        expect(screen.getByText('✅ No blocked IPs found')).toBeInTheDocument();
      });
    });

    it('should display blocked IP information correctly', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            {
              ip: '192.168.1.100',
              status: 'banned',
              attempt_count: 5,
              ban_ttl_seconds: 300,
            },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('192.168.1.100')).toBeInTheDocument();
        expect(screen.getByText('🔴 Banned')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('5m 0s')).toBeInTheDocument();
      });
    });

    it('should display status badges correctly', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 100 },
            { ip: '2.2.2.2', status: 'warning', attempt_count: 3, ban_ttl_seconds: null },
            { ip: '3.3.3.3', status: 'active', attempt_count: 1, ban_ttl_seconds: null },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('🔴 Banned')).toBeInTheDocument();
        expect(screen.getByText('🟡 Warning')).toBeInTheDocument();
        expect(screen.getByText('🟢 Active')).toBeInTheDocument();
      });
    });
  });

  describe('TTL Formatting', () => {
    it('should format TTL seconds correctly', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 65 },
            { ip: '2.2.2.2', status: 'banned', attempt_count: 5, ban_ttl_seconds: 30 },
            { ip: '3.3.3.3', status: 'banned', attempt_count: 5, ban_ttl_seconds: 0 },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('1m 5s')).toBeInTheDocument();
        expect(screen.getByText('30s')).toBeInTheDocument();
        expect(screen.getByText('Expired')).toBeInTheDocument();
      });
    });

    it('should show "-" for null TTL', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'warning', attempt_count: 3, ban_ttl_seconds: null },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        const cells = screen.getAllByText('-');
        expect(cells.length).toBeGreaterThan(0);
      });
    });
  });

  describe('TTL Countdown', () => {
    it('should decrement TTL every second', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 65 },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('1m 5s')).toBeInTheDocument();
      });

      // Fast-forward 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText('1m 4s')).toBeInTheDocument();
      });
    });

    it('should remove expired banned IPs', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 2 },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
      });

      // Fast-forward 3 seconds to expire the ban
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.queryByText('1.1.1.1')).not.toBeInTheDocument();
        expect(screen.getByText('✅ No blocked IPs found')).toBeInTheDocument();
      });
    });
  });

  describe('IP Selection', () => {
    it('should allow selecting individual IPs', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 100 },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
      });

      const checkbox = screen.getAllByRole('checkbox')[1]; // First checkbox is select-all
      await userEvent.click(checkbox);

      expect(screen.getByText('Reset Selected (1)')).toBeInTheDocument();
    });

    it('should allow selecting all IPs', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 100 },
            { ip: '2.2.2.2', status: 'banned', attempt_count: 5, ban_ttl_seconds: 100 },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByText('Select All');
      await userEvent.click(selectAllButton);

      expect(screen.getByText('Reset Selected (2)')).toBeInTheDocument();
      expect(screen.getByText('Deselect All')).toBeInTheDocument();
    });

    it('should deselect all IPs when clicking Deselect All', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 100 },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });

      // Select all
      const selectAllButton = screen.getByText('Select All');
      await userEvent.click(selectAllButton);

      expect(screen.getByText('Deselect All')).toBeInTheDocument();

      // Deselect all
      const deselectAllButton = screen.getByText('Deselect All');
      await userEvent.click(deselectAllButton);

      expect(screen.getByText('Reset Selected (0)')).toBeInTheDocument();
    });

    it('should toggle individual IP selection (select and deselect)', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 100 },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('1.1.1.1')).toBeInTheDocument();
      });

      const checkbox = screen.getAllByRole('checkbox')[1];

      // Select
      await userEvent.click(checkbox);
      expect(screen.getByText('Reset Selected (1)')).toBeInTheDocument();

      // Deselect
      await userEvent.click(checkbox);
      expect(screen.getByText('Reset Selected (0)')).toBeInTheDocument();
    });
  });

  describe('Bulk Reset Functionality', () => {
    // NOTE: "No IPs selected" error cannot be tested via UI because button is disabled when selectedIPs.size === 0
    // Lines 111-112 in component are defensive code for programmatic calls only

    it('should show confirmation dialog before resetting', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 100 },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByText('Select All');
      await userEvent.click(selectAllButton);

      const resetButton = screen.getByText('Reset Selected (1)');
      await userEvent.click(resetButton);

      expect(global.confirm).toHaveBeenCalledWith('Reset rate limits for 1 IP(s)?');
    });

    it('should not reset if confirmation is cancelled', async () => {
      global.confirm = jest.fn(() => false);

      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 100 },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByText('Select All');
      await userEvent.click(selectAllButton);

      const resetButton = screen.getByText('Reset Selected (1)');
      await userEvent.click(resetButton);

      expect(services.resetRateLimitBulk).not.toHaveBeenCalled();
    });

    it('should successfully reset selected IPs', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 100 },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByText('Select All');
      await userEvent.click(selectAllButton);

      const resetButton = screen.getByText('Reset Selected (1)');
      await userEvent.click(resetButton);

      await waitFor(() => {
        expect(services.resetRateLimitBulk).toHaveBeenCalledWith(['1.1.1.1']);
      });

      await waitFor(() => {
        expect(screen.getByText('✓ Successfully reset 1 IP(s)')).toBeInTheDocument();
      });
    });

    it('should handle partial reset failure', async () => {
      services.resetRateLimitBulk.mockResolvedValue({
        success: false,
        reset_count: 1,
        failed_count: 1,
        results: [
          { ip: '1.1.1.1', success: true },
          { ip: '2.2.2.2', success: false },
        ],
      });

      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 100 },
            { ip: '2.2.2.2', status: 'banned', attempt_count: 5, ban_ttl_seconds: 100 },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByText('Select All');
      await userEvent.click(selectAllButton);

      const resetButton = screen.getByText('Reset Selected (2)');
      await userEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('✗ Reset 1 IP(s), 1 failed')).toBeInTheDocument();
      });
    });

    it('should handle reset API error', async () => {
      services.resetRateLimitBulk.mockRejectedValue(new Error('API Error'));

      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [
            { ip: '1.1.1.1', status: 'banned', attempt_count: 5, ban_ttl_seconds: 100 },
          ],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Select All')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByText('Select All');
      await userEvent.click(selectAllButton);

      const resetButton = screen.getByText('Reset Selected (1)');
      await userEvent.click(resetButton);

      await waitFor(() => {
        expect(services.utils.handleError).toHaveBeenCalled();
      });
    });
  });

  describe('Manual Reconnection', () => {
    it('should show reconnect button when disconnected', async () => {
      render(<RateLimitCard user={mockUser} />);

      const disconnectedHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'disconnected'
      )[1];

      act(() => {
        disconnectedHandler();
      });

      await waitFor(() => {
        expect(screen.getByText('🔄 Reconnect')).toBeInTheDocument();
      });
    });

    it('should not show reconnect button when connected', async () => {
      render(<RateLimitCard user={mockUser} />);

      const connectedHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'connected'
      )[1];

      act(() => {
        connectedHandler();
      });

      await waitFor(() => {
        expect(screen.queryByText('🔄 Reconnect')).not.toBeInTheDocument();
      });
    });

    it('should reconnect when reconnect button is clicked', async () => {
      render(<RateLimitCard user={mockUser} />);

      const disconnectedHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'disconnected'
      )[1];

      act(() => {
        disconnectedHandler();
      });

      await waitFor(() => {
        expect(screen.getByText('🔄 Reconnect')).toBeInTheDocument();
      });

      const reconnectButton = screen.getByText('🔄 Reconnect');
      await userEvent.click(reconnectButton);

      // Should call disconnect and connect
      await waitFor(() => {
        expect(mockSSEClient.disconnect).toHaveBeenCalled();
      });

      // Fast-forward timer for reconnect delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(mockSSEClient.connect).toHaveBeenCalled();
      });
    });
  });

  describe('Connection Status Display', () => {
    it('should display connection status text correctly', async () => {
      render(<RateLimitCard user={mockUser} />);

      // Initially should be disconnected
      expect(screen.getByText('🔴 Disconnected')).toBeInTheDocument();

      // Trigger connected event
      const connectedHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'connected'
      )[1];

      act(() => {
        connectedHandler();
      });

      await waitFor(() => {
        expect(screen.getByText('🟢 Live')).toBeInTheDocument();
      });
    });

    it('should update last updated timestamp', async () => {
      render(<RateLimitCard user={mockUser} />);

      const updateHandler = mockSSEClient.on.mock.calls.find(
        (call) => call[0] === 'blocked_ips_update'
      )[1];

      act(() => {
        updateHandler({
          blocked_ips: [],
          timestamp: new Date().toISOString(),
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });
  });

  // NOTE: Notification auto-hide cannot be tested via "No IPs selected" error
  // because button is disabled when selectedIPs.size === 0
  // This functionality is tested via success notifications in other tests
});
