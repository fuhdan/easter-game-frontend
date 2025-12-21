/**
 * Test: GamesAnalyticsTab Component
 * Purpose: Test games analytics tab component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-21
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GamesAnalyticsTab from '../../../src/components/AdminDashboard/GamesAnalyticsTab';
import * as admin from '../../../src/services/admin';

// Mock admin service
jest.mock('../../../src/services/admin');

describe('GamesAnalyticsTab', () => {
  const mockStatistics = {
    stats: {
      total_games: 10,
      avg_completion_rate: 75,
      most_popular: {
        game_id: 1,
        title: 'Popular Game',
        completion_rate: 95,
      },
      most_difficult: {
        game_id: 2,
        title: 'Difficult Game',
        completion_rate: 30,
      },
      games_needing_attention: [
        {
          game_id: 3,
          title: 'Struggling Game',
        },
      ],
    },
  };

  const mockAnalytics = {
    games: [
      {
        game_id: 1,
        title: 'Test Game 1',
        category_name: 'Puzzle',
        category_icon: '🧩',
        completion_rate: 80,
        completed_teams: 8,
        total_teams: 10,
        avg_time_minutes: 125,
        total_hints_used: 15,
        avg_hints_per_team: 1.5,
        avg_rating: 4.5,
        rating_count: 8,
        stuck_teams: 1,
        needs_attention: false,
      },
      {
        game_id: 2,
        title: 'Test Game 2',
        category_name: 'Trivia',
        category_icon: '❓',
        completion_rate: 50,
        completed_teams: 5,
        total_teams: 10,
        avg_time_minutes: 65,
        total_hints_used: 25,
        avg_hints_per_team: 2.5,
        avg_rating: 3.2,
        rating_count: 5,
        stuck_teams: 3,
        needs_attention: true,
      },
    ],
  };

  const mockGameDetails = {
    game: {
      id: 1,
      title: 'Test Game 1',
      description: 'Test description',
      difficulty_level: 3,
      points_value: 100,
      max_hints: 3,
    },
    team_breakdown: [
      {
        team_id: 1,
        team_name: 'Team Alpha',
        completed: 3,
        total_members: 3,
        completion_rate: 100,
        status: 'completed',
        avg_hints_used: 1.5,
        avg_time_minutes: 120,
        completions: [
          {
            username: 'user1',
            completed_at: '2025-12-20T10:00:00Z',
            time_spent_minutes: 115,
            hints_used: 1,
            score: 95,
          },
          {
            username: 'user2',
            completed_at: '2025-12-20T11:00:00Z',
            time_spent_minutes: 125,
            hints_used: 2,
            score: 90,
          },
        ],
      },
      {
        team_id: 2,
        team_name: 'Team Beta',
        completed: 0,
        total_members: 3,
        completion_rate: 0,
        status: 'not_started',
        avg_hints_used: 0,
        avg_time_minutes: 0,
        completions: [],
      },
    ],
    rating_distribution: {
      5: 5,
      4: 2,
      3: 1,
      2: 0,
      1: 0,
    },
    comments: [
      {
        rating: 5,
        comment: 'Great game!',
      },
      {
        rating: 4,
        comment: 'Good but challenging',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Component accesses .stats property, so return object with stats
    admin.getGameStatistics.mockResolvedValue(mockStatistics);
    // Component accesses .games property, so return object with games
    admin.getPerGameAnalytics.mockResolvedValue(mockAnalytics);
    // Component uses response directly
    admin.getGameAdminDetails.mockResolvedValue(mockGameDetails);
  });

  describe('Component Initialization', () => {
    it('should render component header', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('🎯 Games Analytics')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<GamesAnalyticsTab />);

      expect(screen.getByText('Loading game analytics...')).toBeInTheDocument();
    });

    it('should load analytics data on mount', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(admin.getGameStatistics).toHaveBeenCalled();
        expect(admin.getPerGameAnalytics).toHaveBeenCalled();
      });
    });
  });

  describe('Overview Statistics Rendering', () => {
    it('should display all overview stats', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument(); // total_games
        expect(screen.getByText('75%')).toBeInTheDocument(); // avg_completion_rate
        expect(screen.getByText('Popular Game')).toBeInTheDocument();
        expect(screen.getByText('Difficult Game')).toBeInTheDocument();
      });
    });

    it('should display most popular game completion rate', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/95%/)).toBeInTheDocument();
      });
    });

    it('should display games needing attention count', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('Need Attention')).toBeInTheDocument();
      });
    });

    it('should not render games needing attention card when none', async () => {
      admin.getGameStatistics.mockResolvedValue({
        stats: {
          ...mockStatistics.stats,
          games_needing_attention: [],
        },
      });

      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.queryByText('Need Attention')).not.toBeInTheDocument();
      });
    });
  });

  describe('Analytics Table Rendering', () => {
    it('should display all games in table', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
        expect(screen.getByText(/Test Game 2/)).toBeInTheDocument();
      });
    });

    it('should display game completion rates', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/80%/)).toBeInTheDocument();
        expect(screen.getByText(/50%/)).toBeInTheDocument();
      });
    });

    it('should display category icons and names', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('🧩')).toBeInTheDocument();
        expect(screen.getByText('Puzzle')).toBeInTheDocument();
        expect(screen.getByText('❓')).toBeInTheDocument();
        expect(screen.getByText('Trivia')).toBeInTheDocument();
      });
    });

    it('should format average time correctly', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        // 125 minutes = 2h 5m
        expect(screen.getByText('2h 5m')).toBeInTheDocument();
        // 65 minutes = 1h 5m
        expect(screen.getByText('1h 5m')).toBeInTheDocument();
      });
    });

    it('should display "-" for zero average time', async () => {
      admin.getPerGameAnalytics.mockResolvedValue({
        games: [
          {
            ...mockAnalytics.games[0],
            avg_time_minutes: 0,
          },
        ],
      });

      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument();
      });
    });

    it('should display hints used with average', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('15 (avg: 1.5)')).toBeInTheDocument();
        expect(screen.getByText('25 (avg: 2.5)')).toBeInTheDocument();
      });
    });

    it('should display ratings with count', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/4.5/)).toBeInTheDocument();
        expect(screen.getByText(/\(8\)/)).toBeInTheDocument();
      });
    });

    it('should display "No ratings" when rating count is 0', async () => {
      admin.getPerGameAnalytics.mockResolvedValue({
        games: [
          {
            ...mockAnalytics.games[0],
            rating_count: 0,
          },
        ],
      });

      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('No ratings')).toBeInTheDocument();
      });
    });

    it('should display stuck teams count', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('1 teams')).toBeInTheDocument();
        expect(screen.getByText('3 teams')).toBeInTheDocument();
      });
    });

    it('should highlight games needing attention', async () => {
      const { container } = render(<GamesAnalyticsTab />);

      await waitFor(() => {
        const needsAttentionRow = container.querySelector('.needs-attention');
        expect(needsAttentionRow).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no analytics', async () => {
      admin.getGameStatistics.mockResolvedValue({ stats: { total_games: 0, avg_completion_rate: 0 } });
      admin.getPerGameAnalytics.mockResolvedValue({ games: [] });

      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('No game analytics available.')).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should show error message when loading fails', async () => {
      admin.getGameStatistics.mockRejectedValue(new Error('API Error'));
      admin.getPerGameAnalytics.mockRejectedValue(new Error('API Error'));

      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/API Error/)).toBeInTheDocument();
      });
    });

    it('should show generic error message for unknown errors', async () => {
      admin.getGameStatistics.mockRejectedValue({});

      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load game analytics')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      admin.getGameStatistics.mockRejectedValue(new Error('API Error'));

      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Reset mocks to succeed
      admin.getGameStatistics.mockResolvedValue(mockStatistics);
      admin.getPerGameAnalytics.mockResolvedValue(mockAnalytics);

      await userEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.queryByText('Retry')).not.toBeInTheDocument();
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by title when clicking title header', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const titleHeader = screen.getByText(/GAME/);
      await userEvent.click(titleHeader);

      // Should show sort indicator
      expect(screen.getByText(/GAME ↓/)).toBeInTheDocument();
    });

    it('should toggle sort order on second click', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const completionHeader = screen.getByText(/COMPLETION/);

      // First click - descending
      await userEvent.click(completionHeader);
      expect(screen.getByText(/COMPLETION ↓/)).toBeInTheDocument();

      // Second click - ascending
      await userEvent.click(completionHeader);
      expect(screen.getByText(/COMPLETION ↑/)).toBeInTheDocument();
    });

    it('should sort by completion rate', async () => {
      admin.getPerGameAnalytics.mockResolvedValue({
        games: [
          { ...mockAnalytics.games[0], completion_rate: 30 },
          { ...mockAnalytics.games[1], completion_rate: 80 },
        ],
      });

      const { container } = render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const completionHeader = screen.getByText(/COMPLETION/);
      await userEvent.click(completionHeader);

      await waitFor(() => {
        const rows = container.querySelectorAll('.table-row');
        expect(rows[0]).toHaveTextContent('Test Game 2');
        expect(rows[1]).toHaveTextContent('Test Game 1');
      });
    });

    it('should handle null values in sorting', async () => {
      admin.getPerGameAnalytics.mockResolvedValue({
        games: [
          { ...mockAnalytics.games[0], avg_rating: null },
          { ...mockAnalytics.games[1], avg_rating: 4.5 },
        ],
      });

      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const ratingHeader = screen.getByText(/RATING/);
      await userEvent.click(ratingHeader);

      // Should not crash
      expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
    });
  });

  describe('Game Details Modal', () => {
    it('should open details modal when clicking "View Details"', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(admin.getGameAdminDetails).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Game 1 - Detailed Analytics')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching details', async () => {
      admin.getGameAdminDetails.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockGameDetails), 100))
      );

      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      expect(screen.getByText('Loading game details...')).toBeInTheDocument();
    });

    it('should close modal when clicking close button', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Test Game 1 - Detailed Analytics')).toBeInTheDocument();
      });

      const closeButtons = screen.getAllByText('✕');
      await userEvent.click(closeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Test Game 1 - Detailed Analytics')).not.toBeInTheDocument();
      });
    });

    it('should close modal when clicking overlay', async () => {
      const { container } = render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Test Game 1 - Detailed Analytics')).toBeInTheDocument();
      });

      const overlay = container.querySelector('.modal-overlay');
      await userEvent.click(overlay);

      await waitFor(() => {
        expect(screen.queryByText('Test Game 1 - Detailed Analytics')).not.toBeInTheDocument();
      });
    });

    it('should not close modal when clicking modal content', async () => {
      const { container } = render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Test Game 1 - Detailed Analytics')).toBeInTheDocument();
      });

      const modalContent = container.querySelector('.modal-content');
      await userEvent.click(modalContent);

      // Modal should still be visible
      expect(screen.getByText('Test Game 1 - Detailed Analytics')).toBeInTheDocument();
    });

    it('should display game information in modal', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Test description')).toBeInTheDocument();
        expect(screen.getByText(/Difficulty:/)).toBeInTheDocument();
        expect(screen.getByText(/Points:/)).toBeInTheDocument();
        expect(screen.getByText(/Max Hints:/)).toBeInTheDocument();
      });
    });

    it('should display team breakdown', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
        expect(screen.getByText('Team Beta')).toBeInTheDocument();
        expect(screen.getByText('3/3 members (100%)')).toBeInTheDocument();
        expect(screen.getByText('0/3 members (0%)')).toBeInTheDocument();
      });
    });

    it('should display rating distribution', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Rating Distribution')).toBeInTheDocument();
        expect(screen.getByText('5 ⭐')).toBeInTheDocument();
      });
    });

    it('should display comments when available', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Great game!')).toBeInTheDocument();
        expect(screen.getByText('Good but challenging')).toBeInTheDocument();
      });
    });

    it('should not display comments section when no comments', async () => {
      admin.getGameAdminDetails.mockResolvedValue({
        ...mockGameDetails,
        comments: [],
      });

      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Recent Comments')).not.toBeInTheDocument();
      });
    });
  });

  describe('Team Expansion in Modal', () => {
    it('should expand team details when clicking on team with completions', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      });

      const teamRow = screen.getByText('Team Alpha').closest('.team-breakdown-row');
      await userEvent.click(teamRow);

      await waitFor(() => {
        expect(screen.getByText('Team Members Who Completed:')).toBeInTheDocument();
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();
      });
    });

    it('should collapse team details when clicking again', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      });

      const teamRow = screen.getByText('Team Alpha').closest('.team-breakdown-row');

      // Expand
      await userEvent.click(teamRow);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Collapse
      await userEvent.click(teamRow);

      await waitFor(() => {
        expect(screen.queryByText('user1')).not.toBeInTheDocument();
      });
    });

    it('should not expand team with no completions', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Team Beta')).toBeInTheDocument();
      });

      const teamRow = screen.getByText('Team Beta').closest('.team-breakdown-row');
      await userEvent.click(teamRow);

      // Should not show expansion
      expect(screen.queryByText('Team Members Who Completed:')).not.toBeInTheDocument();
    });

    it('should reset expanded teams when closing modal', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      });

      // Expand team
      const teamRow = screen.getByText('Team Alpha').closest('.team-breakdown-row');
      await userEvent.click(teamRow);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getAllByText('Close')[0];
      await userEvent.click(closeButton);

      // Reopen modal
      const viewDetailsButtons2 = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons2[0]);

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      });

      // Team should be collapsed
      expect(screen.queryByText('user1')).not.toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh data when clicking refresh button', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      jest.clearAllMocks();

      const refreshButton = screen.getByTitle('Refresh analytics');
      await userEvent.click(refreshButton);

      await waitFor(() => {
        expect(admin.getGameStatistics).toHaveBeenCalled();
        expect(admin.getPerGameAnalytics).toHaveBeenCalled();
      });
    });
  });

  describe('Additional Sorting Tests', () => {
    it('should sort by avg_time_minutes when clicking AVG TIME header', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const avgTimeHeader = screen.getByText(/AVG TIME/);
      await userEvent.click(avgTimeHeader);

      expect(screen.getByText(/AVG TIME ↓/)).toBeInTheDocument();
    });

    it('should sort by total_hints_used when clicking HINTS header', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const hintsHeader = screen.getByText(/^HINTS/);
      await userEvent.click(hintsHeader);

      expect(screen.getByText(/HINTS ↓/)).toBeInTheDocument();
    });

    it('should sort by stuck_teams when clicking STUCK header', async () => {
      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const stuckHeader = screen.getByText(/^STUCK/);
      await userEvent.click(stuckHeader);

      expect(screen.getByText(/STUCK ↓/)).toBeInTheDocument();
    });
  });

  describe('Game Details Error Handling', () => {
    it('should handle error when fetching game details fails', async () => {
      admin.getGameAdminDetails.mockRejectedValue(new Error('Details fetch failed'));

      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Details fetch failed/)).toBeInTheDocument();
      });
    });

    it('should handle error with no message when fetching game details', async () => {
      admin.getGameAdminDetails.mockRejectedValue({});

      render(<GamesAnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText(/Test Game 1/)).toBeInTheDocument();
      });

      const viewDetailsButtons = screen.getAllByText('View Details');
      await userEvent.click(viewDetailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load game details/)).toBeInTheDocument();
      });
    });
  });
});
