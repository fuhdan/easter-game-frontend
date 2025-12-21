/**
 * Test: ActivationCodesTab Component
 * Purpose: Test activation code management functionality
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-21
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ActivationCodesTab from '../../../src/components/TeamManagement/ActivationCodesTab';
import * as services from '../../../src/services';

// Mock services
jest.mock('../../../src/services', () => ({
  getMyTeamPlayers: jest.fn(),
  getAllTeams: jest.fn(),
  generateOtp: jest.fn(),
}));

describe('ActivationCodesTab Component', () => {
  const mockCaptainUser = {
    id: 1,
    username: 'captain',
    role: 'team_captain',
    team_id: 1,
  };

  const mockAdminUser = {
    id: 2,
    username: 'admin',
    role: 'admin',
  };

  const mockGameAdminUser = {
    id: 3,
    username: 'game_admin',
    role: 'game_admin',
  };

  const mockTeamMembers = [
    {
      id: 10,
      username: 'player1',
      display_name: 'Player One',
      role: 'player',
      is_active: false,
      has_otp: false,
      otp_expires: null,
      activation_code: null,
    },
    {
      id: 11,
      username: 'player2',
      display_name: 'Player Two',
      role: 'player',
      is_active: true,
      has_otp: false,
      otp_expires: null,
      activation_code: null,
    },
    {
      id: 12,
      username: 'player3',
      display_name: 'Player Three',
      role: 'player',
      is_active: false,
      has_otp: true,
      otp_expires: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      activation_code: 'ABC123',
    },
  ];

  const mockTeams = [
    {
      id: 1,
      name: 'Team Alpha',
      members: [
        ...mockTeamMembers,
        {
          id: 20,
          username: 'admin_user',
          display_name: 'Admin User',
          role: 'admin',
          is_active: true,
        },
      ],
    },
    {
      id: 2,
      name: 'Team Beta',
      members: [
        {
          id: 13,
          username: 'player4',
          display_name: 'Player Four',
          role: 'player',
          is_active: false,
          has_otp: true,
          otp_expires: new Date(Date.now() - 1000).toISOString(), // Expired
          activation_code: 'XYZ789',
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      services.getMyTeamPlayers.mockReturnValue(new Promise(() => {})); // Never resolves

      render(<ActivationCodesTab user={mockCaptainUser} />);

      expect(screen.getByText('Loading activation codes...')).toBeInTheDocument();
    });

    it('should render activation codes for team captain', async () => {
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: mockTeamMembers,
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('🔑 Activation Codes')).toBeInTheDocument();
      });

      expect(screen.getByText('Activation codes for your team members')).toBeInTheDocument();
    });

    it('should render activation codes for admin', async () => {
      services.getAllTeams.mockResolvedValue({
        success: true,
        teams: mockTeams,
      });

      render(<ActivationCodesTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('🔑 Activation Codes')).toBeInTheDocument();
      });

      expect(screen.getByText('All activation codes across all teams')).toBeInTheDocument();
    });

    it('should render activation codes for game_admin', async () => {
      services.getAllTeams.mockResolvedValue({
        success: true,
        teams: mockTeams,
      });

      render(<ActivationCodesTab user={mockGameAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('🔑 Activation Codes')).toBeInTheDocument();
      });

      expect(screen.getByText('All activation codes across all teams')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should load team members for team captain', async () => {
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: mockTeamMembers,
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(services.getMyTeamPlayers).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      expect(screen.getByText('Player Two')).toBeInTheDocument();
    });

    it('should load all teams for admin', async () => {
      services.getAllTeams.mockResolvedValue({
        success: true,
        teams: mockTeams,
      });

      render(<ActivationCodesTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(services.getAllTeams).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      expect(screen.getAllByText('Team Alpha').length).toBeGreaterThan(0);
    });

    it('should handle error when loading team members fails', async () => {
      services.getMyTeamPlayers.mockResolvedValue({
        success: false,
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load team members/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('should handle error when loading teams fails', async () => {
      services.getAllTeams.mockResolvedValue({
        success: false,
      });

      render(<ActivationCodesTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load team members/i)).toBeInTheDocument();
      });
    });

    it('should retry loading on retry button click', async () => {
      services.getMyTeamPlayers
        .mockResolvedValueOnce({ success: false })
        .mockResolvedValueOnce({ success: true, players: mockTeamMembers });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load team members/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });
    });

    it('should handle teams with no members array', async () => {
      services.getAllTeams.mockResolvedValue({
        success: true,
        teams: [
          { id: 1, name: 'Empty Team', members: null },
          { id: 2, name: 'Another Team' }, // No members property
        ],
      });

      render(<ActivationCodesTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('🔑 Activation Codes')).toBeInTheDocument();
      });
    });

    it('should handle API exception', async () => {
      services.getMyTeamPlayers.mockRejectedValue(new Error('Network error'));

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load team members/i)).toBeInTheDocument();
      });
    });
  });

  describe('Member Status', () => {
    it('should display NEW status for members without activation codes', async () => {
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[0]], // player1 - no code
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('NEW')).toBeInTheDocument();
      });

      expect(screen.getByText('No code generated')).toBeInTheDocument();
    });

    it('should display ACTIVE status for active members', async () => {
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[1]], // player2 - active
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      });

      expect(screen.getByText('Account Active')).toBeInTheDocument();
    });

    it('should display PENDING status for members with valid codes', async () => {
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[2]], // player3 - pending with code
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });

      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });

    it('should display EXPIRED status for members with expired codes', async () => {
      const expiredMember = {
        id: 14,
        username: 'expired_player',
        display_name: 'Expired Player',
        role: 'player',
        is_active: false,
        has_otp: true,
        otp_expires: new Date(Date.now() - 1000).toISOString(),
        activation_code: null,
      };

      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [expiredMember],
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('EXPIRED')).toBeInTheDocument();
      });

      expect(screen.getByText('Code expired')).toBeInTheDocument();
    });
  });

  describe('Status Filtering', () => {
    beforeEach(() => {
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: mockTeamMembers,
      });
    });

    it('should show all members by default', async () => {
      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      expect(screen.getByText('Player Two')).toBeInTheDocument();
      expect(screen.getByText('Player Three')).toBeInTheDocument();
    });

    it('should filter members by NEW status', async () => {
      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText('Filter by status:');
      await userEvent.selectOptions(filterSelect, 'new');

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
        expect(screen.queryByText('Player Two')).not.toBeInTheDocument();
        expect(screen.queryByText('Player Three')).not.toBeInTheDocument();
      });
    });

    it('should filter members by ACTIVE status', async () => {
      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('Player Two')).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText('Filter by status:');
      await userEvent.selectOptions(filterSelect, 'active');

      await waitFor(() => {
        expect(screen.queryByText('Player One')).not.toBeInTheDocument();
        expect(screen.getByText('Player Two')).toBeInTheDocument();
        expect(screen.queryByText('Player Three')).not.toBeInTheDocument();
      });
    });

    it('should filter members by PENDING status', async () => {
      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('Player Three')).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText('Filter by status:');
      await userEvent.selectOptions(filterSelect, 'pending');

      await waitFor(() => {
        expect(screen.queryByText('Player One')).not.toBeInTheDocument();
        expect(screen.queryByText('Player Two')).not.toBeInTheDocument();
        expect(screen.getByText('Player Three')).toBeInTheDocument();
      });
    });

    it('should show no codes message when filter has no matches', async () => {
      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText('Filter by status:');
      await userEvent.selectOptions(filterSelect, 'expired');

      await waitFor(() => {
        expect(screen.getByText('No activation codes found for the selected filter.')).toBeInTheDocument();
      });
    });
  });

  describe('Activation Code Generation', () => {
    it('should generate activation code for member', async () => {
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[0]], // player1 - no code
      });

      services.generateOtp.mockResolvedValue({
        success: true,
        otp: 'NEW123',
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /Generate Code/i });
      await userEvent.click(generateButton);

      await waitFor(() => {
        expect(services.generateOtp).toHaveBeenCalledWith(10);
      });

      await waitFor(() => {
        expect(screen.getByText('NEW123')).toBeInTheDocument();
      });
    });

    it('should handle generate code API error', async () => {
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[0]],
      });

      services.generateOtp.mockRejectedValue(new Error('API error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /Generate Code/i });
      await userEvent.click(generateButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to generate activation code:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should show Generate New Code button for members with existing codes', async () => {
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[2]], // player3 - has code
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Generate New Code/i })).toBeInTheDocument();
      });
    });

    it('should not show generate button for active members', async () => {
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[1]], // player2 - active
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('Account Active')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /Generate/i })).not.toBeInTheDocument();
    });

    it('should update member state with OTP data on successful generation', async () => {
      // Test lines 112-117: successful OTP generation state update
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[0]], // player1 - NEW status, no code
      });

      const futureExpiry = new Date(Date.now() + 3600000).toISOString();

      services.generateOtp.mockResolvedValue({
        success: true,
        otp: 'TEST_OTP_123',
        expires: futureExpiry,
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('NEW')).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /Generate Code/i });
      await userEvent.click(generateButton);

      // Verify state updated: status changes from NEW to PENDING
      await waitFor(() => {
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });

      // Verify activation code is displayed
      expect(screen.getByText('TEST_OTP_123')).toBeInTheDocument();

      // Verify expiration timer is shown
      expect(screen.getByText(/Expires in:/)).toBeInTheDocument();
    });

    it('should handle non-successful OTP generation response', async () => {
      // Test line 112: when response.success is false
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[0]],
      });

      services.generateOtp.mockResolvedValue({
        success: false,
        error: 'Some error',
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      const generateButton = screen.getByRole('button', { name: /Generate Code/i });
      await userEvent.click(generateButton);

      // Should remain in NEW status since generation failed
      await waitFor(() => {
        expect(screen.getByText('NEW')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Expires in:/)).not.toBeInTheDocument();
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy activation code using modern clipboard API', async () => {
      // Use modern fake timers that work with promises
      jest.useFakeTimers({ legacyFakeTimers: false });

      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[2]], // player3 - has code ABC123
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /Copy/i });
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');
      });

      await waitFor(() => {
        expect(screen.getByText('✓ Copied')).toBeInTheDocument();
      });

      // Fast-forward 2 seconds to reset copy success
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should use fallback copy method when clipboard API unavailable', async () => {
      // Use modern fake timers that work with promises
      jest.useFakeTimers({ legacyFakeTimers: false });

      // Remove clipboard API
      delete navigator.clipboard;

      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[2]],
      });

      document.execCommand = jest.fn().mockReturnValue(true);

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /Copy/i });
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(document.execCommand).toHaveBeenCalledWith('copy');
      });

      expect(screen.getByText('✓ Copied')).toBeInTheDocument();

      jest.useRealTimers();
    });

    it('should handle fallback copy failure', async () => {
      delete navigator.clipboard;
      document.execCommand = jest.fn().mockReturnValue(false);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[2]],
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /Copy/i });
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy code using fallback');
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle fallback copy exception', async () => {
      delete navigator.clipboard;
      document.execCommand = jest.fn().mockImplementation(() => {
        throw new Error('execCommand failed');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[2]],
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /Copy/i });
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Fallback copy failed:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle clipboard API error', async () => {
      navigator.clipboard.writeText = jest.fn().mockRejectedValue(new Error('Clipboard error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[2]],
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /Copy/i });
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy code:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Expiration Timer', () => {
    it('should update expiration timer every second', async () => {
      // Use modern fake timers that work with promises
      jest.useFakeTimers({ legacyFakeTimers: false });

      const futureTime = new Date(Date.now() + 125000); // 2 minutes 5 seconds from now

      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [
          {
            ...mockTeamMembers[2],
            otp_expires: futureTime.toISOString(),
          },
        ],
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });

      // Wait for timer to initialize
      await waitFor(() => {
        expect(screen.getByText(/Expires in:/)).toBeInTheDocument();
      });

      // Advance timer by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/02:0[34]/)).toBeInTheDocument(); // Should show ~02:04 or 02:03
      });

      jest.useRealTimers();
    });

    it('should mark code as expired when timer reaches zero', async () => {
      // Use modern fake timers that work with promises
      jest.useFakeTimers({ legacyFakeTimers: false });

      const almostExpired = new Date(Date.now() + 500); // 0.5 seconds from now

      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [
          {
            ...mockTeamMembers[2],
            otp_expires: almostExpired.toISOString(),
          },
        ],
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });

      // Run the initial timer once
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Verify the code has expired (tests line 134-138: clears OTP data)
      await waitFor(() => {
        // Activation code should be cleared (line 135)
        expect(screen.queryByText('ABC123')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      jest.useRealTimers();
    });

    it('should display hours in timer for long durations', async () => {
      // Use modern fake timers that work with promises
      jest.useFakeTimers({ legacyFakeTimers: false });

      const futureTime = new Date(Date.now() + 7325000); // 2 hours, 2 minutes, 5 seconds

      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [
          {
            ...mockTeamMembers[2],
            otp_expires: futureTime.toISOString(),
          },
        ],
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });

      // Run timers to update the display
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/2:0[12]:0[0-9]/)).toBeInTheDocument(); // 2:02:0X or 2:01:0X
      });

      jest.useRealTimers();
    });

    it('should cleanup timers on unmount', async () => {
      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [mockTeamMembers[2]],
      });

      const { unmount } = render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Admin Features', () => {
    it('should display team badges for admin users', async () => {
      services.getAllTeams.mockResolvedValue({
        success: true,
        teams: mockTeams,
      });

      render(<ActivationCodesTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      // Team Alpha appears multiple times (once per member from that team)
      expect(screen.getAllByText('Team Alpha').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Team Beta').length).toBeGreaterThan(0);
    });

    it('should exclude admin and game_admin roles from display', async () => {
      services.getAllTeams.mockResolvedValue({
        success: true,
        teams: mockTeams,
      });

      render(<ActivationCodesTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
    });

    it('should show correct counts in filter options excluding admins', async () => {
      services.getAllTeams.mockResolvedValue({
        success: true,
        teams: mockTeams,
      });

      render(<ActivationCodesTab user={mockAdminUser} />);

      await waitFor(() => {
        expect(screen.getByText('Player One')).toBeInTheDocument();
      });

      // Should count only non-admin members (4 players across both teams)
      expect(screen.getByText(/All \(4\)/)).toBeInTheDocument();
    });
  });

  describe('Member Display', () => {
    it('should display member username when display_name is missing', async () => {
      const memberNoDisplayName = {
        id: 15,
        username: 'player_no_name',
        role: 'player',
        is_active: false,
        has_otp: false,
      };

      services.getMyTeamPlayers.mockResolvedValue({
        success: true,
        players: [memberNoDisplayName],
      });

      render(<ActivationCodesTab user={mockCaptainUser} />);

      await waitFor(() => {
        expect(screen.getAllByText('player_no_name').length).toBeGreaterThan(0);
      });
    });
  });
});
