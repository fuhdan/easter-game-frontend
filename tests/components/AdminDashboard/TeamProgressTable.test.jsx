/**
 * Test: TeamProgressTable Component
 * Purpose: Test team progress table component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-21
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import TeamProgressTable from '../../../src/components/AdminDashboard/TeamProgressTable';

describe('TeamProgressTable', () => {
  describe('Default Data Rendering', () => {
    it('should render with default data when no data prop provided', () => {
      render(<TeamProgressTable />);

      // Check default teams are displayed
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      expect(screen.getByText('Team Gamma')).toBeInTheDocument();
    });

    it('should render card header', () => {
      render(<TeamProgressTable />);

      expect(screen.getByText('📈 Team Progress')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<TeamProgressTable />);

      expect(screen.getByText('TEAM')).toBeInTheDocument();
      expect(screen.getByText('PROGRESS')).toBeInTheDocument();
      expect(screen.getByText('GAMES COMPLETED')).toBeInTheDocument();
      expect(screen.getByText('HELP REQUESTS')).toBeInTheDocument();
      expect(screen.getByText('STATUS')).toBeInTheDocument();
    });
  });

  describe('API Data Rendering', () => {
    it('should render with API data when provided', () => {
      const apiData = [
        {
          team_id: 10,
          team_name: 'Test Team 1',
          progress: 50,
          games_completed: 5,
          total_games: 10,
          help_requests: 2,
          status: 'active',
        },
        {
          team_id: 11,
          team_name: 'Test Team 2',
          progress: 100,
          games_completed: 10,
          total_games: 10,
          help_requests: 0,
          status: 'completed',
        },
      ];

      render(<TeamProgressTable data={apiData} />);

      // Check API data is displayed
      expect(screen.getByText('Test Team 1')).toBeInTheDocument();
      expect(screen.getByText('Test Team 2')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle teams with zero progress', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Zero Progress Team',
          progress: 0,
          games_completed: 0,
          total_games: 10,
          help_requests: 5,
          status: 'needs_help',
        },
      ];

      render(<TeamProgressTable data={apiData} />);

      expect(screen.getByText('Zero Progress Team')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('System Team Filtering', () => {
    it('should filter out system teams', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Regular Team',
          is_system_team: false,
          progress: 50,
          games_completed: 5,
          total_games: 10,
          help_requests: 0,
          status: 'active',
        },
        {
          team_id: 2,
          team_name: 'System Team',
          is_system_team: true,
          progress: 100,
          games_completed: 10,
          total_games: 10,
          help_requests: 0,
          status: 'completed',
        },
      ];

      render(<TeamProgressTable data={apiData} />);

      // Regular team should be shown
      expect(screen.getByText('Regular Team')).toBeInTheDocument();

      // System team should NOT be shown
      expect(screen.queryByText('System Team')).not.toBeInTheDocument();
    });

    it('should filter out "System Admins" team', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Regular Team',
          progress: 50,
          games_completed: 5,
          total_games: 10,
          help_requests: 0,
          status: 'active',
        },
        {
          team_id: 999,
          team_name: 'System Admins',
          progress: 100,
          games_completed: 10,
          total_games: 10,
          help_requests: 0,
          status: 'completed',
        },
      ];

      render(<TeamProgressTable data={apiData} />);

      // Regular team should be shown
      expect(screen.getByText('Regular Team')).toBeInTheDocument();

      // System Admins should NOT be shown
      expect(screen.queryByText('System Admins')).not.toBeInTheDocument();
    });

    it('should filter out "system_admins" team (lowercase)', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Regular Team',
          progress: 50,
          games_completed: 5,
          total_games: 10,
          help_requests: 0,
          status: 'active',
        },
        {
          team_id: 999,
          team_name: 'system_admins',
          progress: 100,
          games_completed: 10,
          total_games: 10,
          help_requests: 0,
          status: 'completed',
        },
      ];

      render(<TeamProgressTable data={apiData} />);

      // Regular team should be shown
      expect(screen.getByText('Regular Team')).toBeInTheDocument();

      // system_admins should NOT be shown
      expect(screen.queryByText('system_admins')).not.toBeInTheDocument();
    });
  });

  describe('Status Badge Rendering', () => {
    it('should render "ACTIVE" status badge correctly', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Active Team',
          progress: 50,
          games_completed: 5,
          total_games: 10,
          help_requests: 0,
          status: 'active',
        },
      ];

      const { container } = render(<TeamProgressTable data={apiData} />);

      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(container.querySelector('.status-active')).toBeInTheDocument();
    });

    it('should render "COMPLETED" status badge correctly', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Completed Team',
          progress: 100,
          games_completed: 10,
          total_games: 10,
          help_requests: 0,
          status: 'completed',
        },
      ];

      const { container } = render(<TeamProgressTable data={apiData} />);

      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      expect(container.querySelector('.status-completed')).toBeInTheDocument();
    });

    it('should render "NEEDS HELP" status badge for "needs_help" status', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Help Team',
          progress: 30,
          games_completed: 3,
          total_games: 10,
          help_requests: 8,
          status: 'needs_help',
        },
      ];

      const { container } = render(<TeamProgressTable data={apiData} />);

      expect(screen.getByText('NEEDS HELP')).toBeInTheDocument();
      expect(container.querySelector('.status-help')).toBeInTheDocument();
    });

    it('should render "NEEDS HELP" status badge for "help" status', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Help Team',
          progress: 30,
          games_completed: 3,
          total_games: 10,
          help_requests: 8,
          status: 'help',
        },
      ];

      const { container } = render(<TeamProgressTable data={apiData} />);

      expect(screen.getByText('NEEDS HELP')).toBeInTheDocument();
      expect(container.querySelector('.status-help')).toBeInTheDocument();
    });

    it('should handle unknown status gracefully', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Unknown Status Team',
          progress: 50,
          games_completed: 5,
          total_games: 10,
          help_requests: 0,
          status: 'unknown_status',
        },
      ];

      const { container } = render(<TeamProgressTable data={apiData} />);

      // Should default to active class
      expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
      expect(container.querySelector('.status-active')).toBeInTheDocument();
    });

    it('should handle case-insensitive status values', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Team 1',
          progress: 50,
          games_completed: 5,
          total_games: 10,
          help_requests: 0,
          status: 'ACTIVE',
        },
        {
          team_id: 2,
          team_name: 'Team 2',
          progress: 100,
          games_completed: 10,
          total_games: 10,
          help_requests: 0,
          status: 'COMPLETED',
        },
      ];

      const { container } = render(<TeamProgressTable data={apiData} />);

      expect(container.querySelectorAll('.status-active')).toHaveLength(1);
      expect(container.querySelectorAll('.status-completed')).toHaveLength(1);
    });
  });

  describe('Progress Bar Rendering', () => {
    it('should render progress bar with correct width', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Test Team',
          progress: 75,
          games_completed: 7,
          total_games: 10,
          help_requests: 0,
          status: 'active',
        },
      ];

      const { container } = render(<TeamProgressTable data={apiData} />);

      const progressFill = container.querySelector('.progress-fill');
      expect(progressFill).toHaveStyle('width: 75%');
    });

    it('should handle null/undefined progress gracefully', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Test Team',
          progress: null,
          games_completed: 0,
          total_games: 10,
          help_requests: 0,
          status: 'active',
        },
      ];

      const { container } = render(<TeamProgressTable data={apiData} />);

      const progressFill = container.querySelector('.progress-fill');
      expect(progressFill).toHaveStyle('width: 0%');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Games Completed Display', () => {
    it('should display games completed with total games', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Test Team',
          progress: 70,
          games_completed: 7,
          total_games: 10,
          help_requests: 0,
          status: 'active',
        },
      ];

      render(<TeamProgressTable data={apiData} />);

      expect(screen.getByText('7/10')).toBeInTheDocument();
    });

    it('should handle missing games_completed (default to 0)', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Test Team',
          progress: 0,
          total_games: 10,
          help_requests: 0,
          status: 'active',
        },
      ];

      render(<TeamProgressTable data={apiData} />);

      expect(screen.getByText('0/10')).toBeInTheDocument();
    });

    it('should handle missing total_games (default to 10)', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Test Team',
          progress: 50,
          games_completed: 5,
          help_requests: 0,
          status: 'active',
        },
      ];

      render(<TeamProgressTable data={apiData} />);

      expect(screen.getByText('5/10')).toBeInTheDocument();
    });
  });

  describe('Help Requests Display', () => {
    it('should display help requests count', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Test Team',
          progress: 50,
          games_completed: 5,
          total_games: 10,
          help_requests: 12,
          status: 'active',
        },
      ];

      render(<TeamProgressTable data={apiData} />);

      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should handle missing help_requests (default to 0)', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Test Team',
          progress: 50,
          games_completed: 5,
          total_games: 10,
          status: 'active',
        },
      ];

      render(<TeamProgressTable data={apiData} />);

      // Should show 0 for help requests
      const cells = screen.getAllByText('0');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('CSS Classes and Structure', () => {
    it('should render table structure correctly', () => {
      const { container } = render(<TeamProgressTable />);

      expect(container.querySelector('.team-progress-card-container')).toBeInTheDocument();
      expect(container.querySelector('.data-table')).toBeInTheDocument();
      expect(container.querySelector('.table-header')).toBeInTheDocument();
      expect(container.querySelector('.table-body')).toBeInTheDocument();
    });

    it('should render correct number of table rows', () => {
      const apiData = [
        {
          team_id: 1,
          team_name: 'Team 1',
          progress: 50,
          games_completed: 5,
          total_games: 10,
          help_requests: 0,
          status: 'active',
        },
        {
          team_id: 2,
          team_name: 'Team 2',
          progress: 75,
          games_completed: 7,
          total_games: 10,
          help_requests: 2,
          status: 'active',
        },
      ];

      const { container } = render(<TeamProgressTable data={apiData} />);

      const rows = container.querySelectorAll('.table-row');
      expect(rows).toHaveLength(2);
    });
  });

  describe('Empty State', () => {
    it('should handle empty data array', () => {
      const { container } = render(<TeamProgressTable data={[]} />);

      // Should render table structure but no rows
      expect(container.querySelector('.data-table')).toBeInTheDocument();
      const rows = container.querySelectorAll('.table-row');
      expect(rows).toHaveLength(0);
    });

    it('should handle null data prop', () => {
      render(<TeamProgressTable data={null} />);

      // Should fall back to default data
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });
  });
});
