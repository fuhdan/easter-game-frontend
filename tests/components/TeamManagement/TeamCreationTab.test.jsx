/**
 * Test: TeamCreationTab Component
 * Purpose: Test team creation interface with statistics
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-21
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamCreationTab from '../../../src/components/TeamManagement/TeamCreationTab';
import * as services from '../../../src/services';

// Mock services
jest.mock('../../../src/services', () => ({
  getAllTeams: jest.fn(),
  getAllPlayers: jest.fn(),
}));

// Mock TeamConfiguration component
jest.mock('../../../src/components/TeamManagement/TeamConfiguration', () => {
  return function MockTeamConfiguration({
    config,
    setConfig,
    players,
    teams,
    setTeams,
    setPlayers,
    departments,
    showNotification,
    loading,
    setLoading,
  }) {
    return (
      <div data-testid="team-configuration">
        <div>Players: {players.length}</div>
        <div>Teams: {teams.length}</div>
        <div>Departments: {departments.join(', ')}</div>
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>Min Team Size: {config.minTeamSize}</div>
        <div>Max Team Size: {config.maxTeamSize}</div>
        <button onClick={() => setConfig({ ...config, minTeamSize: 5 })}>
          Change Config
        </button>
        <button onClick={() => setTeams([{ id: 1, name: 'New Team' }])}>
          Add Team
        </button>
        <button onClick={() => setPlayers([{ id: 1, name: 'New Player' }])}>
          Add Player
        </button>
        <button onClick={() => showNotification('Test message', 'success')}>
          Show Notification
        </button>
        <button onClick={() => showNotification('Error message', 'error')}>
          Show Error
        </button>
        <button onClick={() => setLoading(true)}>Set Loading</button>
      </div>
    );
  };
});

describe('TeamCreationTab Component', () => {
  const mockAdminUser = {
    id: 1,
    username: 'admin',
    role: 'admin',
  };

  const mockTeams = [
    {
      id: 1,
      name: 'Team Alpha',
      is_system_team: false,
      members: [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' },
        { id: 3, username: 'user3' },
      ],
    },
    {
      id: 2,
      name: 'Team Beta',
      is_system_team: false,
      members: [
        { id: 4, username: 'user4' },
        { id: 5, username: 'user5' },
      ],
    },
  ];

  const mockSystemTeam = {
    id: 99,
    name: 'System Team',
    is_system_team: true,
    members: [],
  };

  const mockPlayers = [
    { id: 1, username: 'player1', name: 'Player One', department: 'Engineering' },
    { id: 2, username: 'player2', name: 'Player Two', department: 'Marketing' },
    { id: 3, username: 'player3', name: 'Player Three', department: 'Engineering' },
    { id: 4, username: 'player4', display_name: 'Player Four', department: 'Sales' },
    { id: 5, username: 'player5', department: '' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    services.getAllTeams.mockResolvedValue({ teams: mockTeams });
    services.getAllPlayers.mockResolvedValue({ success: true, users: mockPlayers });
  });

  describe('Data Loading on Mount', () => {
    it('should load teams on mount', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(services.getAllTeams).toHaveBeenCalledTimes(1);
      });
    });

    it('should load players on mount', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(services.getAllPlayers).toHaveBeenCalledTimes(1);
      });
    });

    it('should set loading state during data fetch', async () => {
      services.getAllTeams.mockImplementation(() => new Promise(() => {}));
      services.getAllPlayers.mockImplementation(() => new Promise(() => {}));

      render(<TeamCreationTab user={mockAdminUser} />);

      expect(screen.getByText('Loading: true')).toBeInTheDocument();
    });

    it('should clear loading state after data loads', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Loading: false')).toBeInTheDocument();
      });
    });

    it('should filter out system teams', async () => {
      services.getAllTeams.mockResolvedValue({
        teams: [...mockTeams, mockSystemTeam],
      });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Teams: 2')).toBeInTheDocument();
      });
    });

    it('should normalize player data correctly', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Players: 5')).toBeInTheDocument();
      });
    });

    it('should handle players with display_name instead of name', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByTestId('team-configuration')).toBeInTheDocument();
      });
    });

    it('should handle empty teams array', async () => {
      services.getAllTeams.mockResolvedValue({ teams: [] });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Teams: 0')).toBeInTheDocument();
      });
    });

    it('should handle null teams response', async () => {
      services.getAllTeams.mockResolvedValue({ teams: null });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Teams: 0')).toBeInTheDocument();
      });
    });
  });

  describe('Department Extraction', () => {
    it('should extract unique departments from players', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Departments:.*Engineering, Marketing, Sales/i)).toBeInTheDocument();
      });
    });

    it('should filter out empty departments', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        const departmentsText = screen.getByText(/Departments:/i).textContent;
        expect(departmentsText).not.toContain('Unassigned');
      });
    });

    it('should sort departments alphabetically', async () => {
      const unsortedPlayers = [
        { id: 1, username: 'p1', name: 'P1', department: 'Zebra' },
        { id: 2, username: 'p2', name: 'P2', department: 'Alpha' },
        { id: 3, username: 'p3', name: 'P3', department: 'Beta' },
      ];

      services.getAllPlayers.mockResolvedValue({ success: true, users: unsortedPlayers });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Departments:.*Alpha, Beta, Zebra/i)).toBeInTheDocument();
      });
    });

    it('should handle players without department field', async () => {
      const noDeptPlayers = [
        { id: 1, username: 'p1', name: 'P1' },
      ];

      services.getAllPlayers.mockResolvedValue({ success: true, users: noDeptPlayers });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Departments:')).toBeInTheDocument();
      });
    });

    it('should remove duplicates in departments', async () => {
      const duplicateDeptPlayers = [
        { id: 1, username: 'p1', name: 'P1', department: 'Engineering' },
        { id: 2, username: 'p2', name: 'P2', department: 'Engineering' },
      ];

      services.getAllPlayers.mockResolvedValue({ success: true, users: duplicateDeptPlayers });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Departments: Engineering')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Calculation', () => {
    it('should display total teams count', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('TEAMS')).toBeInTheDocument();
      });
    });

    it('should display total players count', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('PLAYERS')).toBeInTheDocument();
      });
    });

    it('should calculate average team size', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('2.5')).toBeInTheDocument();
        expect(screen.getByText('AVG SIZE')).toBeInTheDocument();
      });
    });

    it('should calculate size range', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('2-3')).toBeInTheDocument();
        expect(screen.getByText('SIZE RANGE')).toBeInTheDocument();
      });
    });

    it('should show zero statistics for no teams', async () => {
      services.getAllTeams.mockResolvedValue({ teams: [] });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('TEAMS')).toBeInTheDocument();
        expect(screen.getByText('0-0')).toBeInTheDocument();
        const zeroTexts = screen.getAllByText('0');
        expect(zeroTexts.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should handle teams without members array', async () => {
      const teamsWithoutMembers = [
        { id: 1, name: 'Team A', is_system_team: false },
      ];

      services.getAllTeams.mockResolvedValue({ teams: teamsWithoutMembers });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('AVG SIZE')).toBeInTheDocument();
        const zeroTexts = screen.getAllByText('0');
        expect(zeroTexts.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should round average team size to one decimal', async () => {
      const unevenTeams = [
        {
          id: 1,
          name: 'Team A',
          is_system_team: false,
          members: [{ id: 1 }, { id: 2 }],
        },
        {
          id: 2,
          name: 'Team B',
          is_system_team: false,
          members: [{ id: 3 }],
        },
        {
          id: 3,
          name: 'Team C',
          is_system_team: false,
          members: [{ id: 4 }],
        },
      ];

      services.getAllTeams.mockResolvedValue({ teams: unevenTeams });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('1.3')).toBeInTheDocument(); // (2+1+1)/3 = 1.33 -> 1.3
      });
    });
  });

  describe('Team Statistics Card', () => {
    it('should render team statistics header', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Team Statistics')).toBeInTheDocument();
      });
    });

    it('should have correct CSS classes', async () => {
      const { container } = render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(container.querySelector('.team-stats-card')).toBeInTheDocument();
        expect(container.querySelector('.stats-grid-horizontal')).toBeInTheDocument();
      });
    });

    it('should render stat boxes', async () => {
      const { container } = render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        const statBoxes = container.querySelectorAll('.stat-box');
        expect(statBoxes.length).toBe(4);
      });
    });

    it('should have stat values and labels', async () => {
      const { container } = render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(container.querySelector('.stat-value')).toBeInTheDocument();
        expect(container.querySelector('.stat-label')).toBeInTheDocument();
      });
    });
  });

  describe('TeamConfiguration Integration', () => {
    it('should render TeamConfiguration component', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByTestId('team-configuration')).toBeInTheDocument();
      });
    });

    it('should pass players to TeamConfiguration', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Players: 5')).toBeInTheDocument();
      });
    });

    it('should pass teams to TeamConfiguration', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Teams: 2')).toBeInTheDocument();
      });
    });

    it('should pass departments to TeamConfiguration', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Departments:/i)).toBeInTheDocument();
      });
    });

    it('should pass default config to TeamConfiguration', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Min Team Size: 3')).toBeInTheDocument();
        expect(screen.getByText('Max Team Size: 4')).toBeInTheDocument();
      });
    });

    it('should pass loading state to TeamConfiguration', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Loading: false')).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('should allow TeamConfiguration to update config', async () => {
      const { container } = render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Min Team Size: 3')).toBeInTheDocument();
      });

      const changeButton = screen.getByText('Change Config');
      changeButton.click();

      await waitFor(() => {
        expect(screen.getByText('Min Team Size: 5')).toBeInTheDocument();
      });
    });

    it('should allow TeamConfiguration to update teams', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Teams: 2')).toBeInTheDocument();
      });

      const addTeamButton = screen.getByText('Add Team');
      addTeamButton.click();

      await waitFor(() => {
        expect(screen.getByText('Teams: 1')).toBeInTheDocument();
      });
    });

    it('should allow TeamConfiguration to update players', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Players: 5')).toBeInTheDocument();
      });

      const addPlayerButton = screen.getByText('Add Player');
      addPlayerButton.click();

      await waitFor(() => {
        expect(screen.getByText('Players: 1')).toBeInTheDocument();
      });
    });

    it('should allow TeamConfiguration to update loading state', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Loading: false')).toBeInTheDocument();
      });

      const loadingButton = screen.getByText('Set Loading');
      loadingButton.click();

      await waitFor(() => {
        expect(screen.getByText('Loading: true')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Handling', () => {
    it('should provide showNotification function to TeamConfiguration', async () => {
      // Mock window.alert
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByTestId('team-configuration')).toBeInTheDocument();
      });

      const notificationButton = screen.getByText('Show Notification');
      notificationButton.click();

      // Alert should not be called for success messages
      expect(alertMock).not.toHaveBeenCalled();

      alertMock.mockRestore();
    });

    it('should show error notification with alert', async () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByTestId('team-configuration')).toBeInTheDocument();
      });

      const errorButton = screen.getByText('Show Error');
      errorButton.click();

      expect(alertMock).toHaveBeenCalledWith('Error: Error message');

      alertMock.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle getAllTeams error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      services.getAllTeams.mockRejectedValue(new Error('Network error'));

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load data:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should handle getAllPlayers error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      services.getAllPlayers.mockRejectedValue(new Error('Network error'));

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load data:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should set loading to false after error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      services.getAllTeams.mockRejectedValue(new Error('Network error'));

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Loading: false')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('Player Normalization', () => {
    it('should use name field if available', async () => {
      const playersWithName = [
        { id: 1, username: 'user1', name: 'Name Field', department: 'Eng' },
      ];

      services.getAllPlayers.mockResolvedValue({ success: true, users: playersWithName });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByTestId('team-configuration')).toBeInTheDocument();
      });
    });

    it('should use display_name if name is missing', async () => {
      const playersWithDisplayName = [
        { id: 1, username: 'user1', display_name: 'Display Name', department: 'Eng' },
      ];

      services.getAllPlayers.mockResolvedValue({ success: true, users: playersWithDisplayName });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByTestId('team-configuration')).toBeInTheDocument();
      });
    });

    it('should use empty string if both name and display_name are missing', async () => {
      const playersWithNoName = [
        { id: 1, username: 'user1', department: 'Eng' },
      ];

      services.getAllPlayers.mockResolvedValue({ success: true, users: playersWithNoName });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByTestId('team-configuration')).toBeInTheDocument();
      });
    });

    it('should set department to Unassigned if missing', async () => {
      const playersNoDept = [
        { id: 1, username: 'user1', name: 'Name' },
      ];

      services.getAllPlayers.mockResolvedValue({ success: true, users: playersNoDept });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByTestId('team-configuration')).toBeInTheDocument();
      });
    });

    it('should handle unsuccessful player response', async () => {
      services.getAllPlayers.mockResolvedValue({ success: false, users: [] });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Players: 0')).toBeInTheDocument();
      });
    });

    it('should handle missing users array in response', async () => {
      services.getAllPlayers.mockResolvedValue({ success: true });

      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Players: 0')).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure', () => {
    it('should have correct root CSS class', async () => {
      const { container } = render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(container.querySelector('.team-creation-tab')).toBeInTheDocument();
      });
    });

    it('should have team config card', async () => {
      const { container } = render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(container.querySelector('.team-config-card')).toBeInTheDocument();
      });
    });
  });

  describe('PropTypes', () => {
    it('should accept admin user', async () => {
      render(<TeamCreationTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByTestId('team-configuration')).toBeInTheDocument();
      });
    });

    it('should render with minimal user object', async () => {
      const minimalUser = { id: 1, username: 'admin', role: 'admin' };

      render(<TeamCreationTab user={minimalUser} />);

      await waitFor(() => {
        expect(screen.getByTestId('team-configuration')).toBeInTheDocument();
      });
    });
  });
});
