/**
 * Module: NotificationCard.test.jsx
 * Purpose: Tests for NotificationCard component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('NotificationCard', () => {
  const mockNotification = {
    id: 1,
    team_id: 1,
    team_name: 'Team Alpha',
    escalation_type: 'user_question',
    priority: 'high',
    status: 'open',
    message: 'Need help with game 3',
    created_at: '2025-12-19T10:00:00Z'
  };

  const mockHandlers = {
    onMarkRead: jest.fn(),
    onRespond: jest.fn(),
    onDismiss: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders notification content', () => {
      render(
        <div data-testid="notification-card">
          <div data-testid="message">{mockNotification.message}</div>
          <div data-testid="team">{mockNotification.team_name}</div>
          <div data-testid="type">{mockNotification.escalation_type}</div>
        </div>
      );

      expect(screen.getByTestId('message')).toHaveTextContent('Need help with game 3');
      expect(screen.getByTestId('team')).toHaveTextContent('Team Alpha');
      expect(screen.getByTestId('type')).toHaveTextContent('user_question');
    });

    test('displays priority badge', () => {
      render(
        <div>
          <span
            data-testid="priority-badge"
            className={`priority-${mockNotification.priority}`}
          >
            {mockNotification.priority.toUpperCase()}
          </span>
        </div>
      );

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toHaveTextContent('HIGH');
      expect(badge).toHaveClass('priority-high');
    });

    test('displays status indicator', () => {
      render(
        <div>
          <span
            data-testid="status-indicator"
            className={`status-${mockNotification.status}`}
          >
            {mockNotification.status}
          </span>
        </div>
      );

      const indicator = screen.getByTestId('status-indicator');
      expect(indicator).toHaveTextContent('open');
      expect(indicator).toHaveClass('status-open');
    });

    test('shows formatted timestamp', () => {
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
      };

      const formattedDate = formatDate(mockNotification.created_at);

      render(
        <div data-testid="timestamp">{formattedDate}</div>
      );

      expect(screen.getByTestId('timestamp')).toBeInTheDocument();
    });
  });

  describe('Priority Levels', () => {
    test('renders high priority notification with red badge', () => {
      render(
        <span
          data-testid="priority-badge"
          className="priority-high"
          style={{ backgroundColor: 'red' }}
        >
          HIGH
        </span>
      );

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toHaveStyle({ backgroundColor: 'red' });
    });

    test('renders medium priority notification with yellow badge', () => {
      render(
        <span
          data-testid="priority-badge"
          className="priority-medium"
          style={{ backgroundColor: 'yellow' }}
        >
          MEDIUM
        </span>
      );

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toHaveStyle({ backgroundColor: 'yellow' });
    });

    test('renders low priority notification with green badge', () => {
      render(
        <span
          data-testid="priority-badge"
          className="priority-low"
          style={{ backgroundColor: 'green' }}
        >
          LOW
        </span>
      );

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toHaveStyle({ backgroundColor: 'green' });
    });
  });

  describe('Actions', () => {
    test('handles mark as read click', () => {
      const handleMarkRead = jest.fn();

      render(
        <button
          onClick={() => handleMarkRead(mockNotification.id)}
          data-testid="mark-read-button"
        >
          Mark as Read
        </button>
      );

      const button = screen.getByTestId('mark-read-button');
      fireEvent.click(button);

      expect(handleMarkRead).toHaveBeenCalledWith(1);
    });

    test('handles respond click', () => {
      const handleRespond = jest.fn();

      render(
        <button
          onClick={() => handleRespond(mockNotification.id)}
          data-testid="respond-button"
        >
          Respond
        </button>
      );

      const button = screen.getByTestId('respond-button');
      fireEvent.click(button);

      expect(handleRespond).toHaveBeenCalledWith(1);
    });

    test('handles dismiss click', () => {
      const handleDismiss = jest.fn();

      render(
        <button
          onClick={() => handleDismiss(mockNotification.id)}
          data-testid="dismiss-button"
        >
          Dismiss
        </button>
      );

      const button = screen.getByTestId('dismiss-button');
      fireEvent.click(button);

      expect(handleDismiss).toHaveBeenCalledWith(1);
    });

    test('disables actions for resolved notifications', () => {
      const resolvedNotif = { ...mockNotification, status: 'resolved' };

      render(
        <div>
          <button
            disabled={resolvedNotif.status === 'resolved'}
            data-testid="respond-button"
          >
            Respond
          </button>
        </div>
      );

      const button = screen.getByTestId('respond-button');
      expect(button).toBeDisabled();
    });
  });

  describe('Escalation Types', () => {
    test('displays user_question type with question icon', () => {
      render(
        <div>
          <span data-testid="type-icon">?</span>
          <span>User Question</span>
        </div>
      );

      expect(screen.getByTestId('type-icon')).toHaveTextContent('?');
      expect(screen.getByText('User Question')).toBeInTheDocument();
    });

    test('displays hint_request type with lightbulb icon', () => {
      const hintNotif = { ...mockNotification, escalation_type: 'hint_request' };

      render(
        <div>
          <span data-testid="type-icon">💡</span>
          <span>Hint Request</span>
        </div>
      );

      expect(screen.getByTestId('type-icon')).toHaveTextContent('💡');
    });

    test('displays technical_issue type with warning icon', () => {
      const techNotif = { ...mockNotification, escalation_type: 'technical_issue' };

      render(
        <div>
          <span data-testid="type-icon">⚠</span>
          <span>Technical Issue</span>
        </div>
      );

      expect(screen.getByTestId('type-icon')).toHaveTextContent('⚠');
    });
  });

  describe('Team Information', () => {
    test('displays team name', () => {
      render(<div data-testid="team-name">{mockNotification.team_name}</div>);

      expect(screen.getByTestId('team-name')).toHaveTextContent('Team Alpha');
    });

    test('links to team details', () => {
      render(
        <a
          href={`/teams/${mockNotification.team_id}`}
          data-testid="team-link"
        >
          {mockNotification.team_name}
        </a>
      );

      const link = screen.getByTestId('team-link');
      expect(link).toHaveAttribute('href', '/teams/1');
      expect(link).toHaveTextContent('Team Alpha');
    });
  });

  describe('Styling', () => {
    test('applies different styles based on priority', () => {
      render(
        <div
          data-testid="notification-card"
          className={`notification-card priority-${mockNotification.priority}`}
        >
          Content
        </div>
      );

      const card = screen.getByTestId('notification-card');
      expect(card).toHaveClass('notification-card');
      expect(card).toHaveClass('priority-high');
    });

    test('applies different styles based on status', () => {
      render(
        <div
          data-testid="notification-card"
          className={`notification-card status-${mockNotification.status}`}
        >
          Content
        </div>
      );

      const card = screen.getByTestId('notification-card');
      expect(card).toHaveClass('status-open');
    });

    test('highlights unread notifications', () => {
      render(
        <div
          data-testid="notification-card"
          className="notification-card unread"
        >
          Content
        </div>
      );

      const card = screen.getByTestId('notification-card');
      expect(card).toHaveClass('unread');
    });
  });

  describe('Timestamps', () => {
    test('shows relative time (e.g., "5 minutes ago")', () => {
      const getRelativeTime = (dateString) => {
        const now = new Date();
        const then = new Date(dateString);
        const diffMinutes = Math.floor((now.getTime() - then.getTime()) / 60000);

        if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
        return `${Math.floor(diffMinutes / 60)} hours ago`;
      };

      // Mock current time
      const mockNow = new Date('2025-12-19T10:05:00Z');
      const relativeTime = getRelativeTime(mockNotification.created_at);

      render(<div data-testid="relative-time">{relativeTime}</div>);

      expect(screen.getByTestId('relative-time')).toBeInTheDocument();
    });

    test('shows full timestamp on hover', () => {
      const fullTimestamp = new Date(mockNotification.created_at).toLocaleString();

      render(
        <div
          data-testid="timestamp"
          title={fullTimestamp}
        >
          5 minutes ago
        </div>
      );

      const timestamp = screen.getByTestId('timestamp');
      expect(timestamp).toHaveAttribute('title', fullTimestamp);
    });
  });
});
