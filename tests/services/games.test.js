/**
 * Module: games.test.js
 * Purpose: Tests for games service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

import * as gamesService from '../../src/services/games';
import { request } from '../../src/services/api';

// Mock the API request function
jest.mock('../../src/services/api');

describe('Games Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('fetches all games', async () => {
      const mockGames = [
        { id: 1, name: 'Game 1', description: 'Test game 1' },
        { id: 2, name: 'Game 2', description: 'Test game 2' }
      ];

      request.mockResolvedValue(mockGames);

      const result = await gamesService.getAll();

      expect(request).toHaveBeenCalledWith('GET', '/games');
      expect(result).toEqual(mockGames);
      expect(result).toHaveLength(2);
    });

    test('handles error fetching games', async () => {
      const error = new Error('Network error');
      request.mockRejectedValue(error);

      await expect(gamesService.getAll()).rejects.toThrow('Network error');
      expect(request).toHaveBeenCalledWith('GET', '/games');
    });
  });

  describe('getById', () => {
    test('fetches game by ID', async () => {
      const mockGame = {
        id: 1,
        name: 'Test Game',
        description: 'A test game',
        game_type: 'puzzle'
      };

      request.mockResolvedValue(mockGame);

      const result = await gamesService.getById(1);

      expect(request).toHaveBeenCalledWith('GET', '/games/1');
      expect(result).toEqual(mockGame);
      expect(result.id).toBe(1);
    });

    test('handles game not found', async () => {
      const error = new Error('HTTP 404');
      request.mockRejectedValue(error);

      await expect(gamesService.getById(999)).rejects.toThrow('HTTP 404');
      expect(request).toHaveBeenCalledWith('GET', '/games/999');
    });
  });

  describe('create', () => {
    test('creates new game (admin)', async () => {
      const gameData = {
        name: 'New Game',
        description: 'A new game',
        game_type: 'puzzle',
        solution_data: { answer: 'test' }
      };

      const mockResponse = {
        id: 3,
        ...gameData
      };

      request.mockResolvedValue(mockResponse);

      const result = await gamesService.create(gameData);

      expect(request).toHaveBeenCalledWith('POST', '/admin/content/games', gameData);
      expect(result).toEqual(mockResponse);
      expect(result.id).toBe(3);
    });

    test('handles validation error', async () => {
      const error = new Error('HTTP 400');
      request.mockRejectedValue(error);

      await expect(gamesService.create({})).rejects.toThrow('HTTP 400');
    });

    test('handles permission error', async () => {
      const error = new Error('HTTP 403');
      request.mockRejectedValue(error);

      const gameData = { name: 'Test' };

      await expect(gamesService.create(gameData)).rejects.toThrow('HTTP 403');
    });
  });

  describe('update', () => {
    test('updates existing game (admin)', async () => {
      const gameData = {
        name: 'Updated Game',
        description: 'Updated description'
      };

      const mockResponse = {
        id: 1,
        ...gameData
      };

      request.mockResolvedValue(mockResponse);

      const result = await gamesService.update(1, gameData);

      expect(request).toHaveBeenCalledWith('PUT', '/admin/content/games/1', gameData);
      expect(result).toEqual(mockResponse);
    });

    test('handles game not found', async () => {
      const error = new Error('HTTP 404');
      request.mockRejectedValue(error);

      await expect(gamesService.update(999, {})).rejects.toThrow('HTTP 404');
      expect(request).toHaveBeenCalledWith('PUT', '/admin/content/games/999', {});
    });
  });

  describe('deleteGame', () => {
    test('deletes game (admin)', async () => {
      const mockResponse = {
        success: true,
        message: 'Game deleted successfully'
      };

      request.mockResolvedValue(mockResponse);

      const result = await gamesService.deleteGame(1);

      expect(request).toHaveBeenCalledWith('DELETE', '/admin/content/games/1');
      expect(result).toEqual(mockResponse);
    });

    test('handles game not found', async () => {
      const error = new Error('HTTP 404');
      request.mockRejectedValue(error);

      await expect(gamesService.deleteGame(999)).rejects.toThrow('HTTP 404');
    });

    test('handles permission error', async () => {
      const error = new Error('HTTP 403');
      request.mockRejectedValue(error);

      await expect(gamesService.deleteGame(1)).rejects.toThrow('HTTP 403');
    });
  });

  describe('getProgress', () => {
    test('fetches game progress for a team', async () => {
      const mockProgress = {
        status: 'in_progress',
        time_spent: 300,
        hints_used: 1,
        score: 50
      };

      request.mockResolvedValue(mockProgress);

      const result = await gamesService.getProgress(1, 2);

      expect(request).toHaveBeenCalledWith('GET', '/games/1/progress/2');
      expect(result).toEqual(mockProgress);
      expect(result.status).toBe('in_progress');
    });

    test('handles not found error', async () => {
      const error = new Error('HTTP 404');
      request.mockRejectedValue(error);

      await expect(gamesService.getProgress(999, 1)).rejects.toThrow('HTTP 404');
    });

    test('handles authorization error', async () => {
      const error = new Error('HTTP 403');
      request.mockRejectedValue(error);

      await expect(gamesService.getProgress(1, 999)).rejects.toThrow('HTTP 403');
    });
  });

  describe('startGame', () => {
    test('starts game successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Game started successfully',
        status: 'in_progress',
        already_started: false,
        started_at: '2025-12-20T10:00:00Z'
      };

      request.mockResolvedValue(mockResponse);

      const result = await gamesService.startGame(1);

      expect(request).toHaveBeenCalledWith('POST', '/games/1/start');
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.already_started).toBe(false);
    });

    test('handles already started game', async () => {
      const mockResponse = {
        success: true,
        message: 'Game already started',
        status: 'in_progress',
        already_started: true
      };

      request.mockResolvedValue(mockResponse);

      const result = await gamesService.startGame(1);

      expect(result.already_started).toBe(true);
    });

    test('handles game not found', async () => {
      const error = new Error('HTTP 404');
      request.mockRejectedValue(error);

      await expect(gamesService.startGame(999)).rejects.toThrow('HTTP 404');
    });

    test('handles authentication error', async () => {
      const error = new Error('HTTP 401');
      request.mockRejectedValue(error);

      await expect(gamesService.startGame(1)).rejects.toThrow('HTTP 401');
    });
  });

  describe('submitSolution', () => {
    test('submits correct solution', async () => {
      const solution = { answer: 'correct answer' };
      const mockResponse = {
        correct: true,
        score: 100,
        feedback: 'Excellent work!'
      };

      request.mockResolvedValue(mockResponse);

      const result = await gamesService.submitSolution(1, solution);

      expect(request).toHaveBeenCalledWith('POST', '/games/1/submit', { solution });
      expect(result).toEqual(mockResponse);
      expect(result.correct).toBe(true);
      expect(result.score).toBe(100);
    });

    test('submits incorrect solution', async () => {
      const solution = { answer: 'wrong answer' };
      const mockResponse = {
        correct: false,
        score: 0,
        feedback: 'Try again'
      };

      request.mockResolvedValue(mockResponse);

      const result = await gamesService.submitSolution(1, solution);

      expect(result.correct).toBe(false);
      expect(result.score).toBe(0);
    });

    test('handles invalid solution format', async () => {
      const error = new Error('HTTP 400');
      request.mockRejectedValue(error);

      await expect(gamesService.submitSolution(1, null)).rejects.toThrow('HTTP 400');
    });

    test('handles game not found', async () => {
      const error = new Error('HTTP 404');
      request.mockRejectedValue(error);

      await expect(gamesService.submitSolution(999, { answer: 'test' })).rejects.toThrow('HTTP 404');
    });
  });

  describe('useHint', () => {
    test('requests hint successfully', async () => {
      const mockResponse = {
        text: 'This is a helpful hint',
        level: 1,
        hints_remaining: 2
      };

      request.mockResolvedValue(mockResponse);

      const result = await gamesService.useHint(1);

      expect(request).toHaveBeenCalledWith('POST', '/games/1/hint');
      expect(result).toEqual(mockResponse);
      expect(result.hints_remaining).toBe(2);
    });

    test('handles no hints remaining', async () => {
      const error = new Error('HTTP 403');
      request.mockRejectedValue(error);

      await expect(gamesService.useHint(1)).rejects.toThrow('HTTP 403');
    });

    test('handles game not found', async () => {
      const error = new Error('HTTP 404');
      request.mockRejectedValue(error);

      await expect(gamesService.useHint(999)).rejects.toThrow('HTTP 404');
    });
  });

  describe('rate', () => {
    test('rates game with comment', async () => {
      const mockResponse = {
        success: true,
        message: 'Rating submitted successfully'
      };

      request.mockResolvedValue(mockResponse);

      const result = await gamesService.rate(1, 5, 'Great game!');

      expect(request).toHaveBeenCalledWith('POST', '/games/1/rate', {
        rating: 5,
        comment: 'Great game!'
      });
      expect(result).toEqual(mockResponse);
    });

    test('rates game without comment', async () => {
      const mockResponse = {
        success: true,
        message: 'Rating submitted successfully'
      };

      request.mockResolvedValue(mockResponse);

      const result = await gamesService.rate(1, 4, undefined);

      expect(request).toHaveBeenCalledWith('POST', '/games/1/rate', {
        rating: 4,
        comment: undefined
      });
      expect(result).toEqual(mockResponse);
    });

    test('handles invalid rating', async () => {
      const error = new Error('HTTP 400');
      request.mockRejectedValue(error);

      await expect(gamesService.rate(1, 6, 'Invalid')).rejects.toThrow('HTTP 400');
    });

    test('handles game not completed', async () => {
      const error = new Error('HTTP 403');
      request.mockRejectedValue(error);

      await expect(gamesService.rate(1, 5, 'Test')).rejects.toThrow('HTTP 403');
    });

    test('handles game not found', async () => {
      const error = new Error('HTTP 404');
      request.mockRejectedValue(error);

      await expect(gamesService.rate(999, 5, 'Test')).rejects.toThrow('HTTP 404');
    });
  });

  describe('getRatings', () => {
    test('fetches all ratings for game (admin)', async () => {
      const mockRatings = [
        { id: 1, rating: 5, comment: 'Excellent!', user: 'User 1' },
        { id: 2, rating: 4, comment: 'Good', user: 'User 2' }
      ];

      request.mockResolvedValue(mockRatings);

      const result = await gamesService.getRatings(1);

      expect(request).toHaveBeenCalledWith('GET', '/games/1/ratings');
      expect(result).toEqual(mockRatings);
      expect(result).toHaveLength(2);
    });

    test('handles permission error', async () => {
      const error = new Error('HTTP 403');
      request.mockRejectedValue(error);

      await expect(gamesService.getRatings(1)).rejects.toThrow('HTTP 403');
    });

    test('handles game not found', async () => {
      const error = new Error('HTTP 404');
      request.mockRejectedValue(error);

      await expect(gamesService.getRatings(999)).rejects.toThrow('HTTP 404');
    });
  });
});
