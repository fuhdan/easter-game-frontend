/**
 * Test: TeamConfiguration Component
 * Purpose: Test team configuration and creation functionality
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-21
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TeamConfiguration from '../../../src/components/TeamManagement/TeamConfiguration';
import * as services from '../../../src/services';

// Mock services
jest.mock('../../../src/services', () => ({
  createTeams: jest.fn(),
  resetTeams: jest.fn(),
  utils: {
    handleError: jest.fn((error, showNotification) => {
      // Call showNotification with error message to simulate real behavior
      if (showNotification) {
        showNotification(error.message, 'error');
      }
      return error.message;
    }),
  },
}));

describe('TeamConfiguration Component', () => {
  const mockConfig = {
    requiredDepartment: '',
    ensureDepartmentDistribution: false,
    captainFromRequiredDept: false,
    minTeamSize: 3,
    maxTeamSize: 4,
  };

  const mockPlayers = [
    { id: 1, name: 'Player 1', username: 'p1', department: 'Engineering' },
    { id: 2, name: 'Player 2', username: 'p2', department: 'Marketing' },
    { id: 3, name: 'Player 3', username: 'p3', department: 'Engineering' },
    { id: 4, name: 'Player 4', username: 'p4', department: 'Sales' },
  ];

  const mockTeams = [
    { id: 1, name: 'Team Alpha', members: [{ id: 1 }, { id: 2 }] },
    { id: 2, name: 'Team Beta', members: [{ id: 3 }, { id: 4 }] },
  ];

  const mockDepartments = ['Engineering', 'Marketing', 'Sales'];

  const mockSetConfig = jest.fn();
  const mockSetTeams = jest.fn();
  const mockSetPlayers = jest.fn();
  const mockShowNotification = jest.fn();
  const mockSetLoading = jest.fn();

  const defaultProps = {
    config: mockConfig,
    setConfig: mockSetConfig,
    players: mockPlayers,
    teams: mockTeams,
    setTeams: mockSetTeams,
    setPlayers: mockSetPlayers,
    departments: mockDepartments,
    showNotification: mockShowNotification,
    loading: false,
    setLoading: mockSetLoading,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the component', () => {
      render(<TeamConfiguration {...defaultProps} />);

      expect(screen.getByText(/Team Configuration/i)).toBeInTheDocument();
    });

    it('should render team size settings section', () => {
      render(<TeamConfiguration {...defaultProps} />);

      expect(screen.getByText('Team Size Settings')).toBeInTheDocument();
    });

    it('should render department constraints section', () => {
      render(<TeamConfiguration {...defaultProps} />);

      expect(screen.getByText('Department Constraints')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<TeamConfiguration {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Create Teams/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset Teams/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset All/i })).toBeInTheDocument();
    });

    it('should have correct CSS classes', () => {
      const { container } = render(<TeamConfiguration {...defaultProps} />);

      expect(container.querySelector('.options-panel')).toBeInTheDocument();
      expect(container.querySelector('.options-panel-header')).toBeInTheDocument();
      expect(container.querySelector('.options-panel-body')).toBeInTheDocument();
      expect(container.querySelector('.config-section')).toBeInTheDocument();
    });
  });

  describe('Form Inputs - Team Size', () => {
    it('should display minimum team size input', () => {
      render(<TeamConfiguration {...defaultProps} />);

      const inputs = screen.getAllByRole('spinbutton');
      const minSizeInput = inputs[0];
      expect(minSizeInput).toBeInTheDocument();
      expect(minSizeInput).toHaveValue(3);
    });

    it('should display maximum team size input', () => {
      render(<TeamConfiguration {...defaultProps} />);

      const inputs = screen.getAllByRole('spinbutton');
      const maxSizeInput = inputs[1];
      expect(maxSizeInput).toBeInTheDocument();
      expect(maxSizeInput).toHaveValue(4);
    });

    it('should have correct min/max attributes on inputs', () => {
      render(<TeamConfiguration {...defaultProps} />);

      const inputs = screen.getAllByRole('spinbutton');
      const minSizeInput = inputs[0];
      expect(minSizeInput).toHaveAttribute('min', '2');
      expect(minSizeInput).toHaveAttribute('max', '10');

      const maxSizeInput = inputs[1];
      expect(maxSizeInput).toHaveAttribute('min', '3');
      expect(maxSizeInput).toHaveAttribute('max', '15');
    });

    it('should update config when minimum team size changes', async () => {
      render(<TeamConfiguration {...defaultProps} />);

      const inputs = screen.getAllByRole('spinbutton');
      const minSizeInput = inputs[0];
      await userEvent.clear(minSizeInput);
      await userEvent.type(minSizeInput, '5');

      expect(mockSetConfig).toHaveBeenCalled();
    });

    it('should update config when maximum team size changes', async () => {
      render(<TeamConfiguration {...defaultProps} />);

      const inputs = screen.getAllByRole('spinbutton');
      const maxSizeInput = inputs[1];
      await userEvent.clear(maxSizeInput);
      await userEvent.type(maxSizeInput, '8');

      expect(mockSetConfig).toHaveBeenCalled();
    });

    it('should disable inputs when loading', () => {
      render(<TeamConfiguration {...defaultProps} loading={true} />);

      const inputs = screen.getAllByRole('spinbutton');
      const minSizeInput = inputs[0];
      const maxSizeInput = inputs[1];

      expect(minSizeInput).toBeDisabled();
      expect(maxSizeInput).toBeDisabled();
    });

    it('should display help text for inputs', () => {
      render(<TeamConfiguration {...defaultProps} />);

      expect(screen.getByText(/Minimum players per team \(2-10\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Maximum players per team/i)).toBeInTheDocument();
    });
  });

  describe('Form Inputs - Department Constraints', () => {
    it('should display required department dropdown', () => {
      render(<TeamConfiguration {...defaultProps} />);

      const deptSelect = screen.getByRole('combobox');
      expect(deptSelect).toBeInTheDocument();
    });

    it('should have "None" option in department dropdown', () => {
      render(<TeamConfiguration {...defaultProps} />);

      expect(screen.getByRole('option', { name: /None - No requirement/i })).toBeInTheDocument();
    });

    it('should display all departments in dropdown', () => {
      render(<TeamConfiguration {...defaultProps} />);

      expect(screen.getByRole('option', { name: 'Engineering' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Marketing' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Sales' })).toBeInTheDocument();
    });

    it('should update config when department is selected', async () => {
      render(<TeamConfiguration {...defaultProps} />);

      const deptSelect = screen.getByRole('combobox');
      await userEvent.selectOptions(deptSelect, screen.getByRole('option', { name: 'Engineering' }));

      expect(mockSetConfig).toHaveBeenCalled();
    });

    it('should display captain from required dept checkbox', () => {
      render(<TeamConfiguration {...defaultProps} />);

      expect(
        screen.getByLabelText(/Team captain must be from required department/i)
      ).toBeInTheDocument();
    });

    it('should disable captain checkbox when no department selected', () => {
      render(<TeamConfiguration {...defaultProps} />);

      const checkbox = screen.getByLabelText(/Team captain must be from required department/i);
      expect(checkbox).toBeDisabled();
    });

    it('should enable captain checkbox when department is selected', () => {
      const propsWithDept = {
        ...defaultProps,
        config: { ...mockConfig, requiredDepartment: 'Engineering' },
      };

      render(<TeamConfiguration {...propsWithDept} />);

      const checkbox = screen.getByLabelText(/Team captain must be from required department/i);
      expect(checkbox).not.toBeDisabled();
    });

    it('should update config when captain checkbox is toggled', async () => {
      const propsWithDept = {
        ...defaultProps,
        config: { ...mockConfig, requiredDepartment: 'Engineering' },
      };

      render(<TeamConfiguration {...propsWithDept} />);

      const checkbox = screen.getByLabelText(/Team captain must be from required department/i);
      await userEvent.click(checkbox);

      expect(mockSetConfig).toHaveBeenCalled();
    });

    it('should disable department inputs when loading', () => {
      render(<TeamConfiguration {...defaultProps} loading={true} />);

      const deptSelect = screen.getByRole('combobox');
      expect(deptSelect).toBeDisabled();
    });
  });

  describe('Create Teams Button', () => {
    it('should call createTeams API on button click', async () => {
      services.createTeams.mockResolvedValue({
        success: true,
        teams: [{ id: 1, name: 'Team A' }],
      });

      render(<TeamConfiguration {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(services.createTeams).toHaveBeenCalledWith(mockPlayers, mockConfig);
      });
    });

    it('should set loading state during creation', async () => {
      services.createTeams.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<TeamConfiguration {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      expect(mockSetLoading).toHaveBeenCalledWith(true);
    });

    it('should update teams on successful creation', async () => {
      const createdTeams = [
        { id: 1, name: 'Team A' },
        { id: 2, name: 'Team B' },
      ];

      services.createTeams.mockResolvedValue({
        success: true,
        teams: createdTeams,
      });

      render(<TeamConfiguration {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockSetTeams).toHaveBeenCalledWith(createdTeams);
      });
    });

    it('should show success notification on creation', async () => {
      services.createTeams.mockResolvedValue({
        success: true,
        teams: [{ id: 1, name: 'Team A' }, { id: 2, name: 'Team B' }],
      });

      render(<TeamConfiguration {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          'Successfully created 2 teams with backend algorithm!',
          'success'
        );
      });
    });

    it('should be disabled when no players', () => {
      render(<TeamConfiguration {...defaultProps} players={[]} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      expect(createButton).toBeDisabled();
    });

    it('should be disabled when loading', () => {
      render(<TeamConfiguration {...defaultProps} loading={true} />);

      const createButton = screen.getByRole('button', { name: /Creating Teams.../i });
      expect(createButton).toBeDisabled();
    });

    it('should show loading text when creating', () => {
      render(<TeamConfiguration {...defaultProps} loading={true} />);

      expect(screen.getByRole('button', { name: /Creating Teams.../i })).toBeInTheDocument();
    });
  });

  describe('Create Teams Validation', () => {
    it('should validate no players', async () => {
      render(<TeamConfiguration {...defaultProps} players={[]} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      expect(services.createTeams).not.toHaveBeenCalled();
    });

    it('should validate minimum team size too small', async () => {
      const invalidConfig = { ...mockConfig, minTeamSize: 1 };

      render(<TeamConfiguration {...defaultProps} config={invalidConfig} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          expect.stringContaining('Minimum team size must be between 2 and 10'),
          'error'
        );
      });

      expect(services.createTeams).not.toHaveBeenCalled();
    });

    it('should validate minimum team size too large', async () => {
      const invalidConfig = { ...mockConfig, minTeamSize: 11 };

      render(<TeamConfiguration {...defaultProps} config={invalidConfig} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          expect.stringContaining('Minimum team size must be between 2 and 10'),
          'error'
        );
      });
    });

    it('should validate max size less than min size', async () => {
      const invalidConfig = { ...mockConfig, minTeamSize: 5, maxTeamSize: 3 };

      render(<TeamConfiguration {...defaultProps} config={invalidConfig} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          expect.stringContaining('Maximum team size must be greater than or equal to minimum'),
          'error'
        );
      });
    });

    it('should validate not enough players', async () => {
      const tooFewPlayers = [{ id: 1, name: 'P1', username: 'p1' }];
      const largeMinSize = { ...mockConfig, minTeamSize: 5, maxTeamSize: 6 };

      render(<TeamConfiguration {...defaultProps} players={tooFewPlayers} config={largeMinSize} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          expect.stringContaining('Need at least 5 players to create teams'),
          'error'
        );
      });
    });
  });

  describe('Create Teams Error Handling', () => {
    it('should handle API error gracefully', async () => {
      services.createTeams.mockRejectedValue(new Error('Network error'));

      render(<TeamConfiguration {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith('Network error', 'error');
      });
    });

    it('should handle unsuccessful response', async () => {
      services.createTeams.mockResolvedValue({
        success: false,
        teams: null,
      });

      render(<TeamConfiguration {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          expect.stringContaining('Backend did not return teams successfully'),
          'error'
        );
      });
    });

    it('should clear loading state after error', async () => {
      services.createTeams.mockRejectedValue(new Error('Error'));

      render(<TeamConfiguration {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockSetLoading).toHaveBeenLastCalledWith(false);
      });
    });

    it('should use error handler utility', async () => {
      const error = new Error('Test error');
      services.createTeams.mockRejectedValue(error);

      render(<TeamConfiguration {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(services.utils.handleError).toHaveBeenCalledWith(error, mockShowNotification);
      });
    });
  });

  describe('Reset Teams Button', () => {
    it('should show confirmation dialog', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(<TeamConfiguration {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /Reset Teams/i });
      await userEvent.click(resetButton);

      expect(confirmMock).toHaveBeenCalledWith(
        expect.stringContaining('Reset all teams?')
      );

      confirmMock.mockRestore();
    });

    it('should not reset if user cancels', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(<TeamConfiguration {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /Reset Teams/i });
      await userEvent.click(resetButton);

      expect(services.resetTeams).not.toHaveBeenCalled();

      confirmMock.mockRestore();
    });

    it('should call resetTeams API when confirmed', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);
      services.resetTeams.mockResolvedValue({ success: true });

      render(<TeamConfiguration {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /Reset Teams/i });
      await userEvent.click(resetButton);

      await waitFor(() => {
        expect(services.resetTeams).toHaveBeenCalledTimes(1);
      });

      confirmMock.mockRestore();
    });

    it('should clear teams on successful reset', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);
      services.resetTeams.mockResolvedValue({ success: true });

      render(<TeamConfiguration {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /Reset Teams/i });
      await userEvent.click(resetButton);

      await waitFor(() => {
        expect(mockSetTeams).toHaveBeenCalledWith([]);
      });

      confirmMock.mockRestore();
    });

    it('should be disabled when no teams', () => {
      render(<TeamConfiguration {...defaultProps} teams={[]} />);

      const resetButton = screen.getByRole('button', { name: /Reset Teams/i });
      expect(resetButton).toBeDisabled();
    });

    it('should be disabled when loading', () => {
      render(<TeamConfiguration {...defaultProps} loading={true} />);

      const buttons = screen.getAllByRole('button', { name: /Resetting.../i });
      // Reset Teams button is the second "Resetting..." button
      const resetButton = buttons[0];
      expect(resetButton).toBeDisabled();
    });

    it('should handle reset error gracefully', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);
      services.resetTeams.mockRejectedValue(new Error('Reset failed'));

      render(<TeamConfiguration {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /Reset Teams/i });
      await userEvent.click(resetButton);

      await waitFor(() => {
        expect(services.utils.handleError).toHaveBeenCalled();
      });

      confirmMock.mockRestore();
    });
  });

  describe('Reset All Button', () => {
    it('should show confirmation dialog', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(<TeamConfiguration {...defaultProps} />);

      const resetAllButton = screen.getByRole('button', { name: /Reset All/i });
      await userEvent.click(resetAllButton);

      expect(confirmMock).toHaveBeenCalledWith(
        expect.stringContaining('Reset everything?')
      );

      confirmMock.mockRestore();
    });

    it('should not reset if user cancels', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(<TeamConfiguration {...defaultProps} />);

      const resetAllButton = screen.getByRole('button', { name: /Reset All/i });
      await userEvent.click(resetAllButton);

      expect(services.resetTeams).not.toHaveBeenCalled();

      confirmMock.mockRestore();
    });

    it('should reset teams and players when confirmed', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);
      services.resetTeams.mockResolvedValue({ success: true });

      render(<TeamConfiguration {...defaultProps} />);

      const resetAllButton = screen.getByRole('button', { name: /Reset All/i });
      await userEvent.click(resetAllButton);

      await waitFor(() => {
        expect(services.resetTeams).toHaveBeenCalledTimes(1);
        expect(mockSetTeams).toHaveBeenCalledWith([]);
        expect(mockSetPlayers).toHaveBeenCalledWith([]);
      });

      confirmMock.mockRestore();
    });

    it('should be disabled when loading', () => {
      render(<TeamConfiguration {...defaultProps} loading={true} />);

      const buttons = screen.getAllByRole('button', { name: /Resetting.../i });
      // Reset All button is the second "Resetting..." button
      const resetAllButton = buttons[1];
      expect(resetAllButton).toBeDisabled();
    });

    it('should be enabled even with no teams or players', () => {
      render(<TeamConfiguration {...defaultProps} teams={[]} players={[]} />);

      const resetAllButton = screen.getByRole('button', { name: /Reset All/i });
      expect(resetAllButton).not.toBeDisabled();
    });

    it('should handle reset error gracefully', async () => {
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);
      services.resetTeams.mockRejectedValue(new Error('Reset failed'));

      render(<TeamConfiguration {...defaultProps} />);

      const resetAllButton = screen.getByRole('button', { name: /Reset All/i });
      await userEvent.click(resetAllButton);

      await waitFor(() => {
        expect(services.utils.handleError).toHaveBeenCalled();
      });

      confirmMock.mockRestore();
    });
  });

  describe('Button States', () => {
    it('should show loading text on all buttons when loading', () => {
      render(<TeamConfiguration {...defaultProps} loading={true} />);

      expect(screen.getByRole('button', { name: /Creating Teams.../i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Resetting.../i }).length).toBe(2);
    });

    it('should disable all buttons when loading', () => {
      render(<TeamConfiguration {...defaultProps} loading={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should have correct CSS classes on buttons', () => {
      const { container } = render(<TeamConfiguration {...defaultProps} />);

      expect(container.querySelector('.btn.btn-success')).toBeInTheDocument();
      expect(container.querySelector('.btn.btn-warning')).toBeInTheDocument();
      expect(container.querySelector('.btn.btn-danger')).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Structure', () => {
    it('should have config buttons container', () => {
      const { container } = render(<TeamConfiguration {...defaultProps} />);

      expect(container.querySelector('.config-buttons')).toBeInTheDocument();
    });

    it('should have form groups', () => {
      const { container } = render(<TeamConfiguration {...defaultProps} />);

      expect(container.querySelectorAll('.form-group').length).toBeGreaterThan(0);
    });

    it('should have checkbox group', () => {
      const { container } = render(<TeamConfiguration {...defaultProps} />);

      expect(container.querySelector('.checkbox-group')).toBeInTheDocument();
    });

    it('should have form controls', () => {
      const { container } = render(<TeamConfiguration {...defaultProps} />);

      expect(container.querySelectorAll('.form-control').length).toBeGreaterThan(0);
    });

    it('should have form labels', () => {
      const { container } = render(<TeamConfiguration {...defaultProps} />);

      expect(container.querySelectorAll('.form-label').length).toBeGreaterThan(0);
    });

    it('should have form help text', () => {
      const { container } = render(<TeamConfiguration {...defaultProps} />);

      expect(container.querySelectorAll('.form-text').length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty departments array', () => {
      render(<TeamConfiguration {...defaultProps} departments={[]} />);

      const deptSelect = screen.getByRole('combobox');
      const options = deptSelect.querySelectorAll('option');
      expect(options.length).toBe(1); // Only "None" option
    });

    it('should handle very large player list', () => {
      const largePlayers = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `Player ${i}`,
        username: `p${i}`,
      }));

      render(<TeamConfiguration {...defaultProps} players={largePlayers} />);

      expect(screen.getByRole('button', { name: /Create Teams/i })).not.toBeDisabled();
    });

    it('should handle config with all options enabled', () => {
      const fullConfig = {
        requiredDepartment: 'Engineering',
        ensureDepartmentDistribution: true,
        captainFromRequiredDept: true,
        minTeamSize: 5,
        maxTeamSize: 8,
      };

      render(<TeamConfiguration {...defaultProps} config={fullConfig} />);

      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toHaveValue(5);
      expect(inputs[1]).toHaveValue(8);
    });

    it('should validate and reject team creation with insufficient players', async () => {
      // Test line 101-102: validation error when players < minTeamSize
      // Note: Line 90 (players.length === 0) is defensive code - button is disabled when no players
      // This test uses minTeamSize=3 with only 2 players
      const twoPlayers = [
        { id: 1, name: 'Player 1', username: 'p1', department: 'Engineering' },
        { id: 2, name: 'Player 2', username: 'p2', department: 'Marketing' },
      ];

      render(<TeamConfiguration {...defaultProps} players={twoPlayers} />);

      const createButton = screen.getByRole('button', { name: /Create Teams/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          'Need at least 3 players to create teams',
          'error'
        );
      });

      // createTeams API should NOT be called
      expect(services.createTeams).not.toHaveBeenCalled();
    });

    it('should handle reset failure from backend', async () => {
      // Test line 155: error thrown when reset fails on backend
      render(<TeamConfiguration {...defaultProps} teams={mockTeams} />);

      // Mock resetTeams to return failure
      services.resetTeams.mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      // Mock window.confirm to return true
      window.confirm = jest.fn().mockReturnValue(true);

      const resetButton = screen.getByRole('button', { name: /Reset Teams/i });
      await userEvent.click(resetButton);

      await waitFor(() => {
        // Should show error notification (line 155 throws error, caught in catch block)
        expect(mockShowNotification).toHaveBeenCalledWith(
          expect.stringContaining('Reset failed'),
          'error'
        );
      });

      // Teams should NOT be cleared since reset failed
      expect(mockSetTeams).not.toHaveBeenCalledWith([]);
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<TeamConfiguration {...defaultProps} />);

      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[0]).toBeInTheDocument();
      expect(inputs[1]).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Team captain must be from required department/i)
      ).toBeInTheDocument();
    });

    it('should have proper button labels', () => {
      render(<TeamConfiguration {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Create Teams/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset Teams/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset All/i })).toBeInTheDocument();
    });

    it('should have help text for inputs', () => {
      render(<TeamConfiguration {...defaultProps} />);

      expect(screen.getByText(/Minimum players per team/i)).toBeInTheDocument();
      expect(screen.getByText(/Maximum players per team/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Department that should be represented in each team/i)
      ).toBeInTheDocument();
    });
  });
});
