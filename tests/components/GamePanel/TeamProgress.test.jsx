/**
 * Test Suite: TeamProgress Component
 * Purpose: Comprehensive tests for team progress display
 * Coverage Target: 100% (lines 30-269)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamProgress from '../../../src/components/GamePanel/TeamProgress';
import { getMyTeamProgress } from '../../../src/services/teams';

// Mock the teams service
jest.mock('../../../src/services/teams');

describe('TeamProgress Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    team_id: 1,
    role: 'player'
  };

  const mockAdminUser = {
    id: 2,
    username: 'admin',
    team_id: null,
    role: 'admin'
  };

  const mockProgressData = {
    team: {
      name: 'Team Alpha'
    },
    games: [
      {
        game_id: 1,
        order_index: 1,
        category_icon: '🧩',
        category_name: 'Puzzle',
        status: 'completed',
        user_status: 'completed',
        best_score: 100,
        total_hints_used: 2
      },
      {
        game_id: 2,
        order_index: 2,
        category_icon: '🎯',
        category_name: 'Challenge',
        status: 'in_progress',
        user_status: 'in_progress',
        best_score: 50,
        total_hints_used: 1
      },
      {
        game_id: 3,
        order_index: 3,
        category_icon: '🔍',
        category_name: 'Mystery',
        status: 'not_started',
        user_status: 'not_started',
        best_score: 0,
        total_hints_used: 0
      },
      {
        game_id: 4,
        order_index: 4,
        status: 'locked',
        user_status: 'locked',
        best_score: 0,
        total_hints_used: 0
      }
    ],
    summary: {
      total_score: 150,
      completed_games: 1,
      total_games: 4,
      progress_percentage: 25
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console mocks
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // ========== Rendering Tests ==========
  describe('Rendering', () => {
    test('renders loading state initially', () => {
      getMyTeamProgress.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      expect(screen.getByText('👥 Team Progress')).toBeInTheDocument();
      expect(screen.getByText('Loading team progress...')).toBeInTheDocument();
      expect(document.querySelector('.spinner')).toBeInTheDocument();
    });

    test('renders admin view without calling API (line 36-40)', async () => {
      render(<TeamProgress user={mockAdminUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading team progress...')).not.toBeInTheDocument();
      });

      expect(getMyTeamProgress).not.toHaveBeenCalled();
      expect(screen.getByText('ℹ️ Admin View')).toBeInTheDocument();
      expect(screen.getByText(/Admins do not have team-specific progress tracking/)).toBeInTheDocument();
    });

    test('renders error state with message', async () => {
      getMyTeamProgress.mockRejectedValue(new Error('Network error'));

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load team progress. Please try again.')).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    test('renders 403 error with specific message (line 56-60)', async () => {
      getMyTeamProgress.mockRejectedValue({
        response: { status: 403 }
      });

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('You must be assigned to a team to view progress')).toBeInTheDocument();
      });
    });

    test('renders successfully with progress data', async () => {
      getMyTeamProgress.mockResolvedValue(mockProgressData);

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('👥 Team Alpha Progress')).toBeInTheDocument();
      });

      expect(screen.getByText('Game 1')).toBeInTheDocument();
      expect(screen.getByText('Game 2')).toBeInTheDocument();
    });

    test('renders without team name when not provided (line 273)', async () => {
      const dataWithoutTeamName = {
        ...mockProgressData,
        team: null
      };
      getMyTeamProgress.mockResolvedValue(dataWithoutTeamName);

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('👥 Team Progress')).toBeInTheDocument();
      });
    });

    test('renders empty state when no games available (line 95-100)', async () => {
      const emptyData = {
        team: { name: 'Team Alpha' },
        games: [],
        summary: null
      };
      getMyTeamProgress.mockResolvedValue(emptyData);

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('No games available in this event.')).toBeInTheDocument();
      });
    });
  });

  // ========== Status Badges Tests ==========
  describe('Status Badges', () => {
    beforeEach(async () => {
      getMyTeamProgress.mockResolvedValue(mockProgressData);
      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('Game 1')).toBeInTheDocument();
      });
    });

    test('displays completed status badge (line 74)', () => {
      const completeBadges = screen.getAllByText(/Complete/);
      // Should have at least one (status badge), might have two (status badge + progress text)
      expect(completeBadges.length).toBeGreaterThan(0);
      // Check that at least one has the status badge class
      const statusBadge = completeBadges.find(el => el.className.includes('status-badge'));
      expect(statusBadge).toBeTruthy();
    });

    test('displays in_progress status badge (line 75)', () => {
      const inProgressBadges = screen.getAllByText(/In Progress/);
      expect(inProgressBadges.length).toBeGreaterThan(0);
      const statusBadge = inProgressBadges.find(el => el.className.includes('status-badge'));
      expect(statusBadge).toBeTruthy();
    });

    test('displays not_started status badge (line 76)', () => {
      const availableBadges = screen.getAllByText(/Available/);
      expect(availableBadges.length).toBeGreaterThan(0);
      const statusBadge = availableBadges.find(el => el.className.includes('status-badge'));
      expect(statusBadge).toBeTruthy();
    });

    test('displays locked status badge (line 77)', () => {
      const lockedBadges = screen.getAllByText(/Locked/);
      expect(lockedBadges.length).toBeGreaterThan(0);
      const statusBadge = lockedBadges.find(el => el.className.includes('status-badge'));
      expect(statusBadge).toBeTruthy();
    });

    test('handles unknown status with locked badge (line 80)', async () => {
      const dataWithUnknownStatus = {
        ...mockProgressData,
        games: [
          {
            game_id: 5,
            order_index: 5,
            status: 'unknown_status',
            user_status: 'unknown_status',
            best_score: 0,
            total_hints_used: 0
          }
        ]
      };
      getMyTeamProgress.mockResolvedValue(dataWithUnknownStatus);

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getAllByText(/Locked/).length).toBeGreaterThan(0);
      });
    });
  });

  // ========== Progress Table Tests ==========
  describe('Progress Table', () => {
    beforeEach(async () => {
      getMyTeamProgress.mockResolvedValue(mockProgressData);
    });

    test('displays category icon and name (line 127-133)', async () => {
      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('🧩')).toBeInTheDocument();
        expect(screen.getByText('Puzzle')).toBeInTheDocument();
        expect(screen.getByText('🎯')).toBeInTheDocument();
        expect(screen.getByText('Challenge')).toBeInTheDocument();
      });
    });

    test('displays game without category icon/name', async () => {
      const dataWithoutCategory = {
        ...mockProgressData,
        games: [
          {
            game_id: 1,
            order_index: 1,
            status: 'completed',
            user_status: 'completed',
            best_score: 100,
            total_hints_used: 0
          }
        ]
      };
      getMyTeamProgress.mockResolvedValue(dataWithoutCategory);

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('Game 1')).toBeInTheDocument();
      });
    });

    test('highlights current game when currentGameId matches (line 116-123)', async () => {
      render(<TeamProgress user={mockUser} teamId={1} eventId={1} currentGameId={2} showPoints={true} />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        const currentGameRow = rows.find(row => row.textContent.includes('Game 2'));
        expect(currentGameRow).toHaveClass('current-game');
      });
    });

    test('highlights current game when user_status is in_progress (line 118)', async () => {
      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        const currentGameRow = rows.find(row => row.textContent.includes('Game 2'));
        expect(currentGameRow).toHaveClass('current-game');
      });
    });

    test('displays score for completed games (line 139-141)', async () => {
      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('100 pts')).toBeInTheDocument();
      });
    });

    test('displays muted score for in_progress games (line 141-143)', async () => {
      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('50 pts')).toBeInTheDocument();
      });
    });

    test('displays dash for not_started games (line 143-145)', async () => {
      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        const notStartedRow = rows.find(row => row.textContent.includes('Game 3'));
        expect(notStartedRow.textContent).toContain('-');
      });
    });

    test('hides score column when showPoints is false (line 109, 137-146)', async () => {
      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Score')).not.toBeInTheDocument();
        expect(screen.queryByText('100 pts')).not.toBeInTheDocument();
      });
    });

    test('displays hints used when greater than 0 (line 149-151)', async () => {
      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    test('displays dash when hints used is 0 (line 151-153)', async () => {
      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        const noHintsRow = rows.find(row => row.textContent.includes('Game 3'));
        // Should have dash for hints
        expect(noHintsRow.querySelector('.text-muted')).toBeInTheDocument();
      });
    });
  });

  // ========== Summary Tests ==========
  describe('Summary', () => {
    test('displays summary with total score and progress bar (line 168-201)', async () => {
      getMyTeamProgress.mockResolvedValue(mockProgressData);

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('150 pts')).toBeInTheDocument();
        expect(screen.getByText('Total Score')).toBeInTheDocument();
        expect(screen.getByText('25% Complete - 1 of 4 games finished')).toBeInTheDocument();
      });

      const progressBar = document.querySelector('.progress-fill');
      expect(progressBar).toHaveStyle('width: 25%');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');
    });

    test('hides total score when showPoints is false (line 176-181)', async () => {
      getMyTeamProgress.mockResolvedValue(mockProgressData);

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={false} />);

      await waitFor(() => {
        expect(screen.queryByText('150 pts')).not.toBeInTheDocument();
        expect(screen.queryByText('Total Score')).not.toBeInTheDocument();
        // Progress bar should still be visible
        expect(screen.getByText('25% Complete - 1 of 4 games finished')).toBeInTheDocument();
      });
    });

    test('does not render summary when progressData.summary is null (line 169)', async () => {
      const dataWithoutSummary = {
        ...mockProgressData,
        summary: null
      };
      getMyTeamProgress.mockResolvedValue(dataWithoutSummary);

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.queryByText('Total Score')).not.toBeInTheDocument();
      });
    });
  });

  // ========== User Interactions ==========
  describe('User Interactions', () => {
    test('retry button calls fetchTeamProgress again', async () => {
      getMyTeamProgress.mockRejectedValueOnce(new Error('Network error'));

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load team progress. Please try again.')).toBeInTheDocument();
      });

      // Mock success for retry
      getMyTeamProgress.mockResolvedValueOnce(mockProgressData);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('👥 Team Alpha Progress')).toBeInTheDocument();
      });

      expect(getMyTeamProgress).toHaveBeenCalledTimes(2);
    });
  });

  // ========== Props Changes ==========
  describe('Props Changes', () => {
    test('refetches data when teamId changes (line 35-42)', async () => {
      getMyTeamProgress.mockResolvedValue(mockProgressData);

      const { rerender } = render(
        <TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />
      );

      await waitFor(() => {
        expect(getMyTeamProgress).toHaveBeenCalledTimes(1);
      });

      // Change teamId
      rerender(<TeamProgress user={mockUser} teamId={2} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(getMyTeamProgress).toHaveBeenCalledTimes(2);
      });
    });

    test('refetches data when eventId changes', async () => {
      getMyTeamProgress.mockResolvedValue(mockProgressData);

      const { rerender } = render(
        <TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />
      );

      await waitFor(() => {
        expect(getMyTeamProgress).toHaveBeenCalledTimes(1);
      });

      // Change eventId
      rerender(<TeamProgress user={mockUser} teamId={1} eventId={2} showPoints={true} />);

      await waitFor(() => {
        expect(getMyTeamProgress).toHaveBeenCalledTimes(2);
      });
    });

    test('refetches data when user changes', async () => {
      getMyTeamProgress.mockResolvedValue(mockProgressData);

      const { rerender } = render(
        <TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />
      );

      await waitFor(() => {
        expect(getMyTeamProgress).toHaveBeenCalledTimes(1);
      });

      // Change to admin user
      rerender(<TeamProgress user={mockAdminUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        // Admin doesn't trigger API call, so still 1
        expect(getMyTeamProgress).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ========== Error Handling ==========
  describe('Error Handling', () => {
    test('logs error to console when fetch fails (line 55)', async () => {
      const error = new Error('Network error');
      getMyTeamProgress.mockRejectedValue(error);

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error fetching team progress:', error);
      });
    });
  });

  // ========== Edge Cases Tests ==========
  describe('Edge Cases', () => {
    test('handles invalid game status with fallback to locked (line 80)', async () => {
      const dataWithInvalidStatus = {
        ...mockProgressData,
        games: [
          {
            ...mockProgressData.games[0],
            status: 'invalid_status' // Invalid status
          }
        ]
      };

      getMyTeamProgress.mockResolvedValue(dataWithInvalidStatus);

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        // Should show locked badge as fallback
        const lockedBadges = screen.getAllByText(/Locked/);
        expect(lockedBadges.length).toBeGreaterThan(0);
      });
    });

    test('shows default team name when team name is missing (line 273)', async () => {
      const dataWithoutTeamName = {
        ...mockProgressData,
        team: {
          id: 1
          // name is missing
        }
      };

      getMyTeamProgress.mockResolvedValue(dataWithoutTeamName);

      render(<TeamProgress user={mockUser} teamId={1} eventId={1} showPoints={true} />);

      await waitFor(() => {
        // Should show "Team" as default
        expect(screen.getByText(/👥 Team Progress/)).toBeInTheDocument();
      });
    });

    test('showPoints defaults to true when not provided (line 30)', async () => {
      getMyTeamProgress.mockResolvedValue(mockProgressData);

      // Render without showPoints prop (should default to true)
      render(<TeamProgress user={mockUser} teamId={1} eventId={1} />);

      await waitFor(() => {
        // Points should be shown by default
        expect(screen.getByText(/Total Score/)).toBeInTheDocument();
      });
    });
  });
});
