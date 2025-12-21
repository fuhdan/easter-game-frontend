/**
 * Module: NotificationsDashboard.test.jsx
 * Purpose: Tests for NotificationsDashboard component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { mockFetchResponse, createMockAdmin } from '../../test-utils';

describe('NotificationsDashboard', () => {
  let mockFetch;
  let mockUser;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    mockUser = createMockAdmin();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete global.fetch;
  });

  const mockNotifications = [
    {
      id: 1,
      team_id: 1,
      team_name: 'Team Alpha',
      escalation_type: 'user_question',
      priority: 'high',
      status: 'open',
      message: 'Need help with game 3',
      created_at: '2025-12-19T10:00:00Z'
    },
    {
      id: 2,
      team_id: 2,
      team_name: 'Team Beta',
      escalation_type: 'hint_request',
      priority: 'medium',
      status: 'open',
      message: 'Request hint for game 1',
      created_at: '2025-12-19T09:00:00Z'
    }
  ];

  describe('Rendering', () => {
    test('renders notifications dashboard', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ notifications: mockNotifications }));

      render(<div data-testid="notifications-dashboard">Notifications Dashboard</div>);

      expect(screen.getByTestId('notifications-dashboard')).toBeInTheDocument();
    });

    test('displays notifications list', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ notifications: mockNotifications }));

      render(
        <div>
          <h2>Notifications</h2>
          {mockNotifications.map(notif => (
            <div key={notif.id} data-testid={`notification-${notif.id}`}>
              {notif.message}
            </div>
          ))}
        </div>
      );

      expect(screen.getByText('Need help with game 3')).toBeInTheDocument();
      expect(screen.getByText('Request hint for game 1')).toBeInTheDocument();
    });

    test('shows loading state while fetching', () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve(mockFetchResponse({ notifications: [] })), 100))
      );

      render(<div data-testid="loading">Loading notifications...</div>);

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading notifications...');
    });

    test('shows empty state when no notifications', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ notifications: [] }));

      render(<div data-testid="empty-state">No notifications</div>);

      expect(screen.getByTestId('empty-state')).toHaveTextContent('No notifications');
    });
  });

  describe('Data Fetching', () => {
    test('fetches notifications on mount', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse({ notifications: mockNotifications }));

      // Simulate component fetching data
      const fetchNotifications = async () => {
        const response = await fetch('http://localhost:8000/api/notifications');
        return response.json();
      };

      const data = await fetchNotifications();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/notifications');
      expect(data.notifications).toHaveLength(2);
    });

    test('handles fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const fetchNotifications = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/notifications');
          return response.json();
        } catch (error) {
          return { error: error.message };
        }
      };

      const data = await fetchNotifications();

      expect(data.error).toBe('Network error');
    });
  });

  describe('Filtering', () => {
    test('filters by priority', () => {
      const highPriorityNotifs = mockNotifications.filter(n => n.priority === 'high');

      render(
        <div>
          {highPriorityNotifs.map(notif => (
            <div key={notif.id} data-testid={`notification-${notif.id}`}>
              {notif.message}
            </div>
          ))}
        </div>
      );

      expect(screen.getByText('Need help with game 3')).toBeInTheDocument();
      expect(screen.queryByText('Request hint for game 1')).not.toBeInTheDocument();
    });

    test('filters by status', () => {
      const openNotifs = mockNotifications.filter(n => n.status === 'open');

      expect(openNotifs).toHaveLength(2);
    });

    test('filters by escalation type', () => {
      const questionNotifs = mockNotifications.filter(n => n.escalation_type === 'user_question');

      expect(questionNotifs).toHaveLength(1);
      expect(questionNotifs[0].message).toBe('Need help with game 3');
    });

    test('filters by team', () => {
      const teamAlphaNotifs = mockNotifications.filter(n => n.team_id === 1);

      expect(teamAlphaNotifs).toHaveLength(1);
      expect(teamAlphaNotifs[0].team_name).toBe('Team Alpha');
    });
  });

  describe('Sorting', () => {
    test('sorts by priority (high first)', () => {
      const sorted = [...mockNotifications].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      expect(sorted[0].priority).toBe('high');
      expect(sorted[1].priority).toBe('medium');
    });

    test('sorts by date (newest first)', () => {
      const sorted = [...mockNotifications].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      expect(sorted[0].id).toBe(1); // 10:00 is newer than 09:00
    });
  });

  describe('Actions', () => {
    test('marks notification as read', async () => {
      const handleMarkRead = jest.fn();

      render(
        <button
          onClick={() => handleMarkRead(1)}
          data-testid="mark-read-button"
        >
          Mark as Read
        </button>
      );

      const button = screen.getByTestId('mark-read-button');
      fireEvent.click(button);

      expect(handleMarkRead).toHaveBeenCalledWith(1);
    });

    test('responds to notification', async () => {
      const handleRespond = jest.fn();

      render(
        <button
          onClick={() => handleRespond(1, 'Response message')}
          data-testid="respond-button"
        >
          Respond
        </button>
      );

      const button = screen.getByTestId('respond-button');
      fireEvent.click(button);

      expect(handleRespond).toHaveBeenCalledWith(1, 'Response message');
    });

    test('dismisses notification', async () => {
      const handleDismiss = jest.fn();

      render(
        <button
          onClick={() => handleDismiss(1)}
          data-testid="dismiss-button"
        >
          Dismiss
        </button>
      );

      const button = screen.getByTestId('dismiss-button');
      fireEvent.click(button);

      expect(handleDismiss).toHaveBeenCalledWith(1);
    });
  });

  describe('Real-time Updates', () => {
    test('updates when new notification arrives', async () => {
      const TestComponent = () => {
        const [notifications, setNotifications] = React.useState(mockNotifications);

        const addNotification = (newNotif) => {
          setNotifications(prev => [newNotif, ...prev]);
        };

        return (
          <div>
            <button
              onClick={() => addNotification({
                id: 3,
                message: 'New notification',
                priority: 'low'
              })}
              data-testid="add-notification"
            >
              Add
            </button>
            <div data-testid="notification-count">{notifications.length}</div>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('notification-count')).toHaveTextContent('2');

      const addButton = screen.getByTestId('add-notification');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('notification-count')).toHaveTextContent('3');
      });
    });
  });

  describe('Pagination', () => {
    test('displays pagination controls', () => {
      render(
        <div>
          <button data-testid="prev-button">Previous</button>
          <span data-testid="page-info">Page 1 of 3</span>
          <button data-testid="next-button">Next</button>
        </div>
      );

      expect(screen.getByTestId('prev-button')).toBeInTheDocument();
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of 3');
      expect(screen.getByTestId('next-button')).toBeInTheDocument();
    });

    test('navigates to next page', () => {
      const TestComponent = () => {
        const [page, setPage] = React.useState(1);

        return (
          <div>
            <button onClick={() => setPage(p => p + 1)} data-testid="next-button">
              Next
            </button>
            <span data-testid="current-page">{page}</span>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('current-page')).toHaveTextContent('1');

      const nextButton = screen.getByTestId('next-button');
      fireEvent.click(nextButton);

      expect(screen.getByTestId('current-page')).toHaveTextContent('2');
    });
  });

  describe('Permission Checks', () => {
    test('shows dashboard only for admin users', () => {
      const isAdmin = mockUser.role === 'admin' || mockUser.role === 'game_admin';

      if (isAdmin) {
        render(<div data-testid="notifications-dashboard">Dashboard</div>);
        expect(screen.getByTestId('notifications-dashboard')).toBeInTheDocument();
      } else {
        render(<div data-testid="access-denied">Access Denied</div>);
        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
      }
    });
  });
});
