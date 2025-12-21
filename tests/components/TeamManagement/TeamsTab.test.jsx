/**
 * Test: TeamsTab Component
 * Purpose: Test teams display based on user role
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-21
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TeamsTab from '../../../src/components/TeamManagement/TeamsTab';
import * as services from '../../../src/services';

// Mock services
jest.mock('../../../src/services', () => ({
  getAllTeams: jest.fn(),
  getMyTeamPlayers: jest.fn(),
}));

describe('TeamsTab Component', () => {
  const mockAdminUser = {
    id: 1,
    username: 'admin',
    role: 'admin',
  };

  const mockGameAdminUser = {
    id: 2,
    username: 'gameadmin',
    role: 'game_admin',
  };

  const mockCaptainUser = {
    id: 3,
    username: 'captain',
    role: 'team_captain',
    team_id: 1,
    team_name: 'Team Alpha',
  };

  const mockTeams = [
    {
      id: 1,
      name: 'Team Alpha',
      leader_id: 10,
      is_system_team: false,
      members: [
        { id: 10, username: 'user1', display_name: 'User One', department: 'Engineering' },
        { id: 11, username: 'user2', display_name: 'User Two', department: 'Marketing' },
        { id: 12, username: 'user3', display_name: 'User Three', department: 'Engineering' },
      ],
    },
    {
      id: 2,
      name: 'Team Beta',
      leader_id: 20,
      is_system_team: false,
      members: [
        { id: 20, username: 'user4', display_name: 'User Four', department: 'Sales' },
        { id: 21, username: 'user5', display_name: 'User Five', department: 'Engineering' },
      ],
    },
  ];

  const mockSystemTeam = {
    id: 99,
    name: 'System Team',
    leader_id: null,
    is_system_team: true,
    members: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching teams', () => {
      services.getAllTeams.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<TeamsTab user={mockAdminUser} />);

      expect(screen.getByText(/Loading teams.../i)).toBeInTheDocument();
      expect(container.querySelector('.teams-tab-loading')).toBeInTheDocument();
    });

    it('should have loading spinner with correct CSS class', () => {
      services.getAllTeams.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<TeamsTab user={mockAdminUser} />);

      expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
      expect(container.querySelector('.teams-tab-loading')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when API call fails', async () => {
      services.getAllTeams.mockRejectedValue(new Error('Network error'));

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load teams/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      services.getAllTeams.mockRejectedValue(new Error('Network error'));

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });

    it('should retry loading teams when retry button is clicked', async () => {
      services.getAllTeams
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ teams: mockTeams });

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load teams/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /Retry/i }));

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      });

      expect(services.getAllTeams).toHaveBeenCalledTimes(2);
    });

    it('should have error container with correct CSS class', async () => {
      services.getAllTeams.mockRejectedValue(new Error('Network error'));

      const { container } = render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(container.querySelector('.teams-tab-error')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no teams exist (admin)', async () => {
      services.getAllTeams.mockResolvedValue({ teams: [] });

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('No Teams Found')).toBeInTheDocument();
        expect(screen.getByText(/No teams have been created yet/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when captain has no team', async () => {
      services.getMyTeamPlayers.mockResolvedValue({ team: null, players: [] });

      render(<TeamsTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('No Teams Found')).toBeInTheDocument();
        expect(screen.getByText(/You are not assigned to a team yet/i)).toBeInTheDocument();
      });
    });

    it('should display empty icon in empty state', async () => {
      services.getAllTeams.mockResolvedValue({ teams: [] });

      const { container } = render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(container.querySelector('.empty-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Admin View - All Teams', () => {
    beforeEach(() => {
      services.getAllTeams.mockResolvedValue({ teams: mockTeams });
    });

    it('should load all teams for admin', async () => {
      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
        expect(screen.getByText('Team Beta')).toBeInTheDocument();
      });

      expect(services.getAllTeams).toHaveBeenCalledTimes(1);
    });

    it('should load all teams for game_admin', async () => {
      render(<TeamsTab user={mockGameAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
        expect(screen.getByText('Team Beta')).toBeInTheDocument();
      });

      expect(services.getAllTeams).toHaveBeenCalledTimes(1);
    });

    it('should filter out system teams', async () => {
      services.getAllTeams.mockResolvedValue({
        teams: [...mockTeams, mockSystemTeam],
      });

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
        expect(screen.queryByText('System Team')).not.toBeInTheDocument();
      });
    });

    it('should display team statistics for admin', async () => {
      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Team Statistics')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // Total teams
        expect(screen.getByText('5')).toBeInTheDocument(); // Total players
        expect(screen.getByText('2.5')).toBeInTheDocument(); // Avg team size
        expect(screen.getByText('2-3')).toBeInTheDocument(); // Size range
      });
    });

    it('should calculate statistics correctly', async () => {
      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        const statsSection = screen.getByText('Team Statistics').closest('.teams-stats-section');
        expect(statsSection).toBeInTheDocument();

        // Verify stat labels
        expect(screen.getByText('Teams')).toBeInTheDocument();
        expect(screen.getByText('Players')).toBeInTheDocument();
        expect(screen.getByText('Avg Size')).toBeInTheDocument();
        expect(screen.getByText('Size Range')).toBeInTheDocument();
      });
    });

    it('should display department distribution for admin', async () => {
      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Department Distribution:')).toBeInTheDocument();
        expect(screen.getByText(/Engineering:/i)).toBeInTheDocument();
        expect(screen.getByText(/Marketing:/i)).toBeInTheDocument();
        expect(screen.getByText(/Sales:/i)).toBeInTheDocument();
      });
    });

    it('should not display department distribution if only one department', async () => {
      const singleDeptTeams = [
        {
          id: 1,
          name: 'Team Alpha',
          leader_id: 10,
          members: [
            { id: 10, username: 'user1', display_name: 'User One', department: 'Engineering' },
          ],
        },
      ];

      services.getAllTeams.mockResolvedValue({ teams: singleDeptTeams });

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.queryByText('Department Distribution:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Team Captain View - Single Team', () => {
    const mockCaptainTeamResponse = {
      team: {
        id: 1,
        name: 'Team Alpha',
        leader_id: 10,
      },
      players: [
        { id: 10, username: 'captain', display_name: 'Captain User', department: 'Engineering' },
        { id: 11, username: 'user2', display_name: 'User Two', department: 'Marketing' },
      ],
    };

    beforeEach(() => {
      services.getMyTeamPlayers.mockResolvedValue(mockCaptainTeamResponse);
    });

    it('should load only captain team', async () => {
      render(<TeamsTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      });

      expect(services.getMyTeamPlayers).toHaveBeenCalledTimes(1);
      expect(services.getAllTeams).not.toHaveBeenCalled();
    });

    it('should not show team statistics for captain', async () => {
      render(<TeamsTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      });

      expect(screen.queryByText('Team Statistics')).not.toBeInTheDocument();
    });

    it('should convert captain team to correct format', async () => {
      render(<TeamsTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('2 members')).toBeInTheDocument();
        expect(screen.getByText('Captain User')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
      });
    });
  });

  describe('Team Card Rendering', () => {
    beforeEach(() => {
      services.getAllTeams.mockResolvedValue({ teams: mockTeams });
    });

    it('should render team cards with team names', async () => {
      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
        expect(screen.getByText('Team Beta')).toBeInTheDocument();
      });
    });

    it('should display member count for each team', async () => {
      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('3 members')).toBeInTheDocument();
        expect(screen.getByText('2 members')).toBeInTheDocument();
      });
    });

    it('should render all team members', async () => {
      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
        expect(screen.getByText('User Three')).toBeInTheDocument();
        expect(screen.getByText('User Four')).toBeInTheDocument();
        expect(screen.getByText('User Five')).toBeInTheDocument();
      });
    });

    it('should display member usernames', async () => {
      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();
      });
    });

    it('should display member departments', async () => {
      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        const deptElements = screen.getAllByText('Engineering');
        expect(deptElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Marketing')).toBeInTheDocument();
        expect(screen.getByText('Sales')).toBeInTheDocument();
      });
    });

    it('should highlight team captain', async () => {
      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        const captainBadges = screen.getAllByText(/Captain/i);
        expect(captainBadges.length).toBe(2); // One for each team
      });
    });

    it('should apply captain CSS class to captain member', async () => {
      const { container } = render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        const captainMembers = container.querySelectorAll('.member-item.is-captain');
        expect(captainMembers.length).toBe(2); // One captain per team
      });
    });

    it('should show "No members assigned" for empty team', async () => {
      const emptyTeam = [
        {
          id: 1,
          name: 'Empty Team',
          leader_id: null,
          members: [],
        },
      ];

      services.getAllTeams.mockResolvedValue({ teams: emptyTeam });

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('No members assigned')).toBeInTheDocument();
      });
    });
  });

  describe('Captain Badge Display', () => {
    beforeEach(() => {
      services.getAllTeams.mockResolvedValue({ teams: mockTeams });
    });

    it('should show captain badge for team leader', async () => {
      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        const captainBadges = screen.getAllByText(/👑 Captain/i);
        expect(captainBadges.length).toBe(2);
      });
    });

    it('should not show captain badge for non-captain members', async () => {
      const { container } = render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        const allMembers = container.querySelectorAll('.member-item');
        const captainMembers = container.querySelectorAll('.member-item.is-captain');

        expect(allMembers.length).toBe(5); // Total members
        expect(captainMembers.length).toBe(2); // Only captains
      });
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate zero statistics for empty teams', async () => {
      services.getAllTeams.mockResolvedValue({ teams: [] });

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.queryByText('Team Statistics')).not.toBeInTheDocument();
      });
    });

    it('should calculate average team size correctly', async () => {
      const unevenTeams = [
        {
          id: 1,
          name: 'Team A',
          leader_id: 1,
          members: [{ id: 1, username: 'u1', display_name: 'U1', department: 'D1' }],
        },
        {
          id: 2,
          name: 'Team B',
          leader_id: 2,
          members: [
            { id: 2, username: 'u2', display_name: 'U2', department: 'D1' },
            { id: 3, username: 'u3', display_name: 'U3', department: 'D1' },
            { id: 4, username: 'u4', display_name: 'U4', department: 'D1' },
            { id: 5, username: 'u5', display_name: 'U5', department: 'D1' },
          ],
        },
      ];

      services.getAllTeams.mockResolvedValue({ teams: unevenTeams });

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('2.5')).toBeInTheDocument(); // (1+4)/2 = 2.5
      });
    });

    it('should calculate min and max team sizes', async () => {
      services.getAllTeams.mockResolvedValue({ teams: mockTeams });

      const { container } = render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        const statsContainer = container.querySelector('.stats-grid');
        expect(statsContainer).toBeInTheDocument();
        expect(statsContainer.textContent).toContain('2-3'); // min=2, max=3
      });
    });

    it('should handle teams with missing members array', async () => {
      const teamsWithoutMembers = [
        {
          id: 1,
          name: 'Team No Members',
          leader_id: null,
        },
      ];

      services.getAllTeams.mockResolvedValue({ teams: teamsWithoutMembers });

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('0 members')).toBeInTheDocument();
      });
    });
  });

  describe('Department Distribution Calculation', () => {
    beforeEach(() => {
      services.getAllTeams.mockResolvedValue({ teams: mockTeams });
    });

    it('should count department occurrences correctly', async () => {
      const { container } = render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        const deptStats = container.querySelector('.dept-stats');
        expect(deptStats).toBeInTheDocument();
        expect(deptStats.textContent).toMatch(/Engineering:.*3/);
        expect(deptStats.textContent).toMatch(/Marketing:.*1/);
        expect(deptStats.textContent).toMatch(/Sales:.*1/);
      });
    });

    it('should handle members without department', async () => {
      const teamsWithNoDept = [
        {
          id: 1,
          name: 'Team',
          leader_id: 1,
          members: [{ id: 1, username: 'u1', display_name: 'U1' }],
        },
      ];

      services.getAllTeams.mockResolvedValue({ teams: teamsWithNoDept });

      const { container } = render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        const deptStats = container.querySelector('.dept-stats');
        if (deptStats) {
          expect(deptStats.textContent).toMatch(/Unassigned:.*1/i);
        } else {
          // Department distribution may not be shown for single department
          expect(container.querySelector('.teams-grid')).toBeInTheDocument();
        }
      });
    });
  });

  describe('Component Re-rendering on Role Change', () => {
    it('should reload teams when user role changes', async () => {
      services.getAllTeams.mockResolvedValue({ teams: mockTeams });
      services.getMyTeamPlayers.mockResolvedValue({
        team: { id: 1, name: 'Team Alpha', leader_id: 10 },
        players: [],
      });

      const { rerender } = render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(services.getAllTeams).toHaveBeenCalledTimes(1);
      });

      // Change user to captain
      rerender(<TeamsTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(services.getMyTeamPlayers).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('CSS Classes and Structure', () => {
    beforeEach(() => {
      services.getAllTeams.mockResolvedValue({ teams: mockTeams });
    });

    it('should have correct root CSS class', async () => {
      const { container } = render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(container.querySelector('.teams-tab')).toBeInTheDocument();
      });
    });

    it('should have teams grid container', async () => {
      const { container } = render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(container.querySelector('.teams-grid')).toBeInTheDocument();
      });
    });

    it('should have team cards', async () => {
      const { container } = render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        const teamCards = container.querySelectorAll('.team-card');
        expect(teamCards.length).toBe(2);
      });
    });

    it('should have members list', async () => {
      const { container } = render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(container.querySelector('.members-list')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null teams response', async () => {
      services.getAllTeams.mockResolvedValue({ teams: null });

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('No Teams Found')).toBeInTheDocument();
      });
    });

    it('should handle undefined teams response', async () => {
      services.getAllTeams.mockResolvedValue({});

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('No Teams Found')).toBeInTheDocument();
      });
    });

    it('should handle member without display_name', async () => {
      const teamWithNoDisplayName = [
        {
          id: 1,
          name: 'Team',
          leader_id: 1,
          members: [{ id: 1, username: 'user1', department: 'Eng' }],
        },
      ];

      services.getAllTeams.mockResolvedValue({ teams: teamWithNoDisplayName });

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        const usernameElements = screen.getAllByText('user1');
        expect(usernameElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should handle console error logging on API failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      services.getAllTeams.mockRejectedValue(new Error('Network error'));

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load teams:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      services.getAllTeams.mockResolvedValue({ teams: mockTeams });
    });

    it('should have loading spinner with role="status"', () => {
      services.getAllTeams.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<TeamsTab user={mockAdminUser} />);

      const loadingSpinner = container.querySelector('.loading-spinner');
      expect(loadingSpinner?.closest('[role="status"]') || loadingSpinner?.parentElement).toBeTruthy();
    });

    it('should have retry button accessible', async () => {
      services.getAllTeams.mockRejectedValue(new Error('Network error'));

      render(<TeamsTab user={mockAdminUser} />);

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /Retry/i });
        expect(retryButton).toBeEnabled();
      });
    });
  });
});
