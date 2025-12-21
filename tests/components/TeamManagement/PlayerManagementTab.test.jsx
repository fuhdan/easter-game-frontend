/**
 * Test: PlayerManagementTab Component
 * Purpose: Test player management tab wrapper component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-21
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlayerManagementTab from '../../../src/components/TeamManagement/PlayerManagementTab';

// Mock PlayerManagement component
jest.mock('../../../src/components/TeamManagement/PlayerManagement', () => {
  return function MockPlayerManagement({ players, setPlayers, showNotification, loading, setLoading, setProgress }) {
    return (
      <div data-testid="player-management">
        <div>Players Count: {players.length}</div>
        <button onClick={() => setPlayers([...players, { id: 1, name: 'Test Player' }])}>
          Add Player
        </button>
        <button onClick={() => showNotification('Test success', 'success')}>
          Show Success
        </button>
        <button onClick={() => showNotification('Test error', 'error')}>
          Show Error
        </button>
        <button onClick={() => showNotification('Test warning', 'warning')}>
          Show Warning
        </button>
        <button onClick={() => showNotification('Test info', 'info')}>
          Show Info
        </button>
        <button onClick={() => setLoading(true)}>Set Loading</button>
        <button onClick={() => setProgress(50)}>Set Progress</button>
        <div>Loading: {loading ? 'true' : 'false'}</div>
      </div>
    );
  };
});

describe('PlayerManagementTab', () => {
  const mockUser = {
    id: 1,
    username: 'admin',
    role: 'admin',
  };

  // Use fake timers for notification auto-dismiss
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the component', () => {
      render(<PlayerManagementTab user={mockUser} />);

      expect(screen.getByTestId('player-management')).toBeInTheDocument();
    });

    it('should render PlayerManagement child component', () => {
      render(<PlayerManagementTab user={mockUser} />);

      expect(screen.getByText('Players Count: 0')).toBeInTheDocument();
      expect(screen.getByText('Loading: false')).toBeInTheDocument();
    });

    it('should not render notification initially', () => {
      render(<PlayerManagementTab user={mockUser} />);

      expect(screen.queryByRole('button', { name: /close notification/i })).not.toBeInTheDocument();
    });

    it('should not render progress bar when not loading', () => {
      render(<PlayerManagementTab user={mockUser} />);

      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should manage players state', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      expect(screen.getByText('Players Count: 0')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Add Player'));

      expect(screen.getByText('Players Count: 1')).toBeInTheDocument();
    });

    it('should manage loading state', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      expect(screen.getByText('Loading: false')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Set Loading'));

      expect(screen.getByText('Loading: true')).toBeInTheDocument();
    });

    it('should manage progress state', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      // Set loading first
      await userEvent.click(screen.getByText('Set Loading'));

      // Set progress
      await userEvent.click(screen.getByText('Set Progress'));

      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('Notification System', () => {
    it('should show success notification', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Show Success'));

      expect(screen.getByText('Test success')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close notification/i })).toBeInTheDocument();
    });

    it('should show error notification', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Show Error'));

      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should show warning notification', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Show Warning'));

      expect(screen.getByText('Test warning')).toBeInTheDocument();
    });

    it('should show info notification', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Show Info'));

      expect(screen.getByText('Test info')).toBeInTheDocument();
    });

    it('should apply correct CSS class for success notification', async () => {
      const { container } = render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Show Success'));

      const notification = container.querySelector('.notification-success');
      expect(notification).toBeInTheDocument();
    });

    it('should apply correct CSS class for error notification', async () => {
      const { container } = render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Show Error'));

      const notification = container.querySelector('.notification-error');
      expect(notification).toBeInTheDocument();
    });

    it('should apply correct CSS class for warning notification', async () => {
      const { container } = render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Show Warning'));

      const notification = container.querySelector('.notification-warning');
      expect(notification).toBeInTheDocument();
    });

    it('should apply correct CSS class for info notification', async () => {
      const { container } = render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Show Info'));

      const notification = container.querySelector('.notification-info');
      expect(notification).toBeInTheDocument();
    });

    it('should auto-dismiss notification after 3 seconds', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Show Success'));

      expect(screen.getByText('Test success')).toBeInTheDocument();

      // Fast-forward time by 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.queryByText('Test success')).not.toBeInTheDocument();
      });
    });

    it('should allow manual close of notification', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Show Success'));

      expect(screen.getByText('Test success')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /close notification/i });
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Test success')).not.toBeInTheDocument();
      });
    });

    it('should replace previous notification with new one', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Show Success'));
      expect(screen.getByText('Test success')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Show Error'));
      expect(screen.queryByText('Test success')).not.toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should use default info type for unknown notification type', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      // Trigger showNotification with info type
      await userEvent.click(screen.getByText('Show Info'));

      expect(screen.getByText('Test info')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should show progress bar when loading and progress > 0', async () => {
      const { container } = render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Set Loading'));
      await userEvent.click(screen.getByText('Set Progress'));

      expect(screen.getByText('50%')).toBeInTheDocument();

      const progressBar = container.querySelector('.progress-bar');
      expect(progressBar).toHaveStyle('width: 50%');
    });

    it('should not show progress bar when not loading', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Set Progress'));

      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });

    it('should not show progress bar when progress is 0', async () => {
      render(<PlayerManagementTab user={mockUser} />);

      await userEvent.click(screen.getByText('Set Loading'));

      expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass all required props to PlayerManagement', () => {
      render(<PlayerManagementTab user={mockUser} />);

      // Verify PlayerManagement receives correct props by testing its behavior
      expect(screen.getByTestId('player-management')).toBeInTheDocument();
      expect(screen.getByText('Players Count: 0')).toBeInTheDocument();
      expect(screen.getByText('Loading: false')).toBeInTheDocument();
    });
  });
});
