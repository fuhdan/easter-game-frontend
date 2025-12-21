/**
 * Module: admin.test.js
 * Purpose: Tests for admin service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import * as adminService from '../../src/services/admin';
import { request } from '../../src/services/api';
import { mockFetchResponse } from '../test-utils';

// Mock the api module
jest.mock('../../src/services/api', () => ({
  request: jest.fn(),
  log: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('Admin Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    test('fetches dashboard statistics', async () => {
      const mockStats = {
        total_users: 100,
        total_teams: 20,
        total_games: 15,
        active_players: 80,
        completed_games: 45
      };

      request.mockResolvedValueOnce(mockStats);

      const result = await adminService.getStats();

      expect(request).toHaveBeenCalledWith('GET', '/admin/stats');
      expect(result).toEqual(mockStats);
    });

    test('throws error when request fails', async () => {
      request.mockRejectedValueOnce(new Error('Network error'));

      await expect(adminService.getStats()).rejects.toThrow('Network error');
    });
  });

  describe('getTeamProgress', () => {
    test('fetches team progress', async () => {
      const mockProgress = [
        { team_id: 1, team_name: 'Team A', games_completed: 5, total_score: 500 },
        { team_id: 2, team_name: 'Team B', games_completed: 3, total_score: 300 }
      ];

      request.mockResolvedValueOnce(mockProgress);

      const result = await adminService.getTeamProgress();

      expect(request).toHaveBeenCalledWith('GET', '/admin/teams/progress');
      expect(result).toEqual(mockProgress);
    });
  });

  describe('getGameProgress', () => {
    test('fetches game progress', async () => {
      const mockProgress = [
        { game_id: 1, game_name: 'Game 1', teams_completed: 15, avg_time: 120 },
        { game_id: 2, game_name: 'Game 2', teams_completed: 10, avg_time: 180 }
      ];

      request.mockResolvedValueOnce(mockProgress);

      const result = await adminService.getGameProgress();

      expect(request).toHaveBeenCalledWith('GET', '/admin/games/progress');
      expect(result).toEqual(mockProgress);
    });
  });

  describe('resetGame', () => {
    test('resets a specific game', async () => {
      const gameId = 5;
      const mockResponse = { success: true, message: 'Game reset' };

      request.mockResolvedValueOnce(mockResponse);

      const result = await adminService.resetGame(gameId);

      expect(request).toHaveBeenCalledWith('POST', '/admin/games/5/reset');
      expect(result).toEqual(mockResponse);
    });

    test('handles game not found error', async () => {
      request.mockRejectedValueOnce(new Error('Game not found'));

      await expect(adminService.resetGame(999)).rejects.toThrow('Game not found');
    });
  });

  describe('resetAllProgress', () => {
    test('resets all progress', async () => {
      const mockResponse = { success: true, message: 'All progress reset' };

      request.mockResolvedValueOnce(mockResponse);

      const result = await adminService.resetAllProgress();

      expect(request).toHaveBeenCalledWith('POST', '/admin/reset-all');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSystemInfo', () => {
    test('fetches system information', async () => {
      const mockInfo = {
        version: '1.0.0',
        environment: 'development',
        database: { status: 'connected' },
        redis: { status: 'connected' }
      };

      request.mockResolvedValueOnce(mockInfo);

      const result = await adminService.getSystemInfo();

      expect(request).toHaveBeenCalledWith('GET', '/admin/system');
      expect(result).toEqual(mockInfo);
    });
  });

  describe('exportAllData', () => {
    test('exports all data', async () => {
      const mockData = { users: [], teams: [], games: [] };

      request.mockResolvedValueOnce(mockData);

      const result = await adminService.exportAllData();

      expect(request).toHaveBeenCalledWith('GET', '/admin/export');
      expect(result).toEqual(mockData);
    });
  });

  describe('promoteUser', () => {
    test('promotes user to admin', async () => {
      const userId = 5;
      const mockUser = { id: 5, username: 'user', role: 'admin' };

      request.mockResolvedValueOnce(mockUser);

      const result = await adminService.promoteUser(userId);

      expect(request).toHaveBeenCalledWith('PUT', '/admin/users/5/promote');
      expect(result).toEqual(mockUser);
    });

    test('handles user not found error', async () => {
      request.mockRejectedValueOnce(new Error('User not found'));

      await expect(adminService.promoteUser(999)).rejects.toThrow('User not found');
    });
  });

  describe('demoteUser', () => {
    test('demotes admin to player', async () => {
      const userId = 5;
      const mockUser = { id: 5, username: 'user', role: 'player' };

      request.mockResolvedValueOnce(mockUser);

      const result = await adminService.demoteUser(userId);

      expect(request).toHaveBeenCalledWith('PUT', '/admin/users/5/demote');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateGameContent', () => {
    test('updates game content', async () => {
      const gameId = 3;
      const content = { description: 'Updated description', points: 150 };
      const mockGame = { id: 3, ...content };

      request.mockResolvedValueOnce(mockGame);

      const result = await adminService.updateGameContent(gameId, content);

      expect(request).toHaveBeenCalledWith('PUT', '/admin/games/3/content', content);
      expect(result).toEqual(mockGame);
    });

    test('handles validation error', async () => {
      request.mockRejectedValueOnce(new Error('Validation failed'));

      await expect(
        adminService.updateGameContent(1, { invalid: 'data' })
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('resetRateLimit', () => {
    test('resets rate limit for specific target', async () => {
      const target = 'ai';
      const identifier = '192.168.1.1';
      const mockResponse = { success: true, message: 'Rate limit reset' };

      request.mockResolvedValueOnce(mockResponse);

      const result = await adminService.resetRateLimit(target, identifier);

      expect(request).toHaveBeenCalledWith('POST', '/admin/reset-rate-limit', { target, identifier });
      expect(result).toEqual(mockResponse);
    });

    test('resets chat rate limit', async () => {
      const mockResponse = { success: true };

      request.mockResolvedValueOnce(mockResponse);

      await adminService.resetRateLimit('chat', 'user_123');

      expect(request).toHaveBeenCalledWith('POST', '/admin/reset-rate-limit', {
        target: 'chat',
        identifier: 'user_123'
      });
    });
  });

  describe('resetRateLimitBulk', () => {
    test('resets rate limits for multiple IPs', async () => {
      const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];
      const mockResponse = { success: true, reset_count: 3 };

      request.mockResolvedValueOnce(mockResponse);

      const result = await adminService.resetRateLimitBulk(ips);

      expect(request).toHaveBeenCalledWith('POST', '/admin/reset-rate-limit-bulk', { ips });
      expect(result).toEqual(mockResponse);
    });

    test('handles empty IP array', async () => {
      const mockResponse = { success: true, reset_count: 0 };

      request.mockResolvedValueOnce(mockResponse);

      const result = await adminService.resetRateLimitBulk([]);

      expect(request).toHaveBeenCalledWith('POST', '/admin/reset-rate-limit-bulk', { ips: [] });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getGameStatistics', () => {
    test('fetches game statistics overview', async () => {
      const mockStats = {
        success: true,
        stats: {
          total_games: 15,
          avg_completion_rate: 75.5,
          most_popular: { id: 1, name: 'Game 1', completion_rate: 95 },
          most_difficult: { id: 5, name: 'Game 5', completion_rate: 45 },
          games_needing_attention: []
        }
      };

      request.mockResolvedValueOnce(mockStats);

      const result = await adminService.getGameStatistics();

      expect(request).toHaveBeenCalledWith('GET', '/admin/dashboard/games/stats');
      expect(result).toEqual(mockStats);
    });

    test('handles no active event error', async () => {
      request.mockRejectedValueOnce(new Error('No active event'));

      await expect(adminService.getGameStatistics()).rejects.toThrow('No active event');
    });
  });

  describe('getPerGameAnalytics', () => {
    test('fetches per-game analytics', async () => {
      const mockAnalytics = {
        success: true,
        games: [
          {
            game_id: 1,
            title: 'Game 1',
            category_name: 'Quiz',
            category_icon: '🎯',
            difficulty_level: 3,
            completion_rate: 85.5,
            completed_teams: 17,
            total_teams: 20,
            avg_time_minutes: 15.5,
            total_hints_used: 25,
            avg_hints_per_team: 1.47,
            stuck_teams: 2,
            avg_rating: 4.2,
            rating_count: 15,
            needs_attention: false
          }
        ]
      };

      request.mockResolvedValueOnce(mockAnalytics);

      const result = await adminService.getPerGameAnalytics();

      expect(request).toHaveBeenCalledWith('GET', '/admin/dashboard/games/analytics');
      expect(result).toEqual(mockAnalytics);
    });
  });

  describe('getGameAdminDetails', () => {
    test('fetches detailed admin view for a game', async () => {
      const gameId = 5;
      const mockDetails = {
        success: true,
        game: {
          id: 5,
          title: 'Easter Puzzle',
          description: 'Solve the puzzle',
          difficulty_level: 4,
          points_value: 200,
          max_hints: 3
        },
        team_breakdown: [
          {
            team_id: 1,
            team_name: 'Team A',
            completed: 4,
            total_members: 5,
            completion_rate: 80,
            status: 'completed'
          }
        ],
        rating_distribution: { 1: 0, 2: 1, 3: 2, 4: 5, 5: 7 },
        comments: []
      };

      request.mockResolvedValueOnce(mockDetails);

      const result = await adminService.getGameAdminDetails(gameId);

      expect(request).toHaveBeenCalledWith('GET', '/admin/dashboard/games/5/details');
      expect(result).toEqual(mockDetails);
    });

    test('handles game not found error', async () => {
      request.mockRejectedValueOnce(new Error('Game not found'));

      await expect(adminService.getGameAdminDetails(999)).rejects.toThrow('Game not found');
    });
  });
});
