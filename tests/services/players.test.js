/**
 * Module: players.test.js
 * Purpose: Tests for players service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import * as playersService from '../../src/services/players';
import { request } from '../../src/services/api';

// Mock the api module
jest.mock('../../src/services/api', () => ({
  request: jest.fn(),
  log: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('Players Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('fetches all players', async () => {
      const mockPlayers = [
        { id: 1, name: 'Player 1', email: 'player1@example.com' },
        { id: 2, name: 'Player 2', email: 'player2@example.com' }
      ];

      request.mockResolvedValueOnce(mockPlayers);

      const result = await playersService.getAll();

      expect(request).toHaveBeenCalledWith('GET', '/players');
      expect(result).toEqual(mockPlayers);
    });

    test('returns empty array when no players exist', async () => {
      request.mockResolvedValueOnce([]);

      const result = await playersService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    test('fetches player by ID', async () => {
      const playerId = 5;
      const mockPlayer = { id: 5, name: 'Player 5', email: 'player5@example.com', skill_level: 3 };

      request.mockResolvedValueOnce(mockPlayer);

      const result = await playersService.getById(playerId);

      expect(request).toHaveBeenCalledWith('GET', '/players/5');
      expect(result).toEqual(mockPlayer);
    });

    test('throws error when player not found', async () => {
      request.mockRejectedValueOnce(new Error('Player not found'));

      await expect(playersService.getById(999)).rejects.toThrow('Player not found');
    });
  });

  describe('create', () => {
    test('creates a new player', async () => {
      const playerData = {
        name: 'New Player',
        email: 'newplayer@example.com',
        skill_level: 2
      };
      const mockCreated = { id: 10, ...playerData };

      request.mockResolvedValueOnce(mockCreated);

      const result = await playersService.create(playerData);

      expect(request).toHaveBeenCalledWith('POST', '/players', playerData);
      expect(result).toEqual(mockCreated);
    });

    test('creates player without skill level', async () => {
      const playerData = {
        name: 'New Player',
        email: 'newplayer@example.com'
      };
      const mockCreated = { id: 10, ...playerData, skill_level: null };

      request.mockResolvedValueOnce(mockCreated);

      const result = await playersService.create(playerData);

      expect(request).toHaveBeenCalledWith('POST', '/players', playerData);
      expect(result).toEqual(mockCreated);
    });

    test('handles validation error', async () => {
      request.mockRejectedValueOnce(new Error('Invalid email'));

      await expect(
        playersService.create({ name: 'Test', email: 'invalid' })
      ).rejects.toThrow('Invalid email');
    });
  });

  describe('update', () => {
    test('updates a player', async () => {
      const playerId = 5;
      const updateData = { name: 'Updated Name', skill_level: 4 };
      const mockUpdated = { id: 5, ...updateData, email: 'old@example.com' };

      request.mockResolvedValueOnce(mockUpdated);

      const result = await playersService.update(playerId, updateData);

      expect(request).toHaveBeenCalledWith('PUT', '/players/5', updateData);
      expect(result).toEqual(mockUpdated);
    });

    test('handles player not found', async () => {
      request.mockRejectedValueOnce(new Error('Player not found'));

      await expect(
        playersService.update(999, { name: 'Test' })
      ).rejects.toThrow('Player not found');
    });
  });

  describe('deletePlayer', () => {
    test('deletes a player', async () => {
      const playerId = 5;
      const mockResponse = { success: true, message: 'Player deleted' };

      request.mockResolvedValueOnce(mockResponse);

      const result = await playersService.deletePlayer(playerId);

      expect(request).toHaveBeenCalledWith('DELETE', '/players/5');
      expect(result).toEqual(mockResponse);
    });

    test('handles player not found', async () => {
      request.mockRejectedValueOnce(new Error('Player not found'));

      await expect(playersService.deletePlayer(999)).rejects.toThrow('Player not found');
    });
  });

  describe('bulkCreate', () => {
    test('creates multiple players', async () => {
      const players = [
        { name: 'Player 1', email: 'player1@example.com', skill_level: 2 },
        { name: 'Player 2', email: 'player2@example.com', skill_level: 3 }
      ];
      const mockResponse = { success: 2, failed: 0, errors: [] };

      request.mockResolvedValueOnce(mockResponse);

      const result = await playersService.bulkCreate(players);

      expect(request).toHaveBeenCalledWith('POST', '/players/bulk-create', { players });
      expect(result).toEqual(mockResponse);
    });

    test('handles partial failure', async () => {
      const players = [
        { name: 'Player 1', email: 'valid@example.com' },
        { name: 'Player 2', email: 'invalid' }
      ];
      const mockResponse = {
        success: 1,
        failed: 1,
        errors: [{ row: 2, error: 'Invalid email' }]
      };

      request.mockResolvedValueOnce(mockResponse);

      const result = await playersService.bulkCreate(players);

      expect(result).toEqual(mockResponse);
    });

    test('handles empty array', async () => {
      const mockResponse = { success: 0, failed: 0, errors: [] };

      request.mockResolvedValueOnce(mockResponse);

      const result = await playersService.bulkCreate([]);

      expect(request).toHaveBeenCalledWith('POST', '/players/bulk-create', { players: [] });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('importPlayers', () => {
    test('imports players from CSV', async () => {
      const csvData = 'name,email,skill_level\nPlayer 1,player1@example.com,2\nPlayer 2,player2@example.com,3';
      const mockResponse = { success: 2, failed: 0, errors: [] };

      request.mockResolvedValueOnce(mockResponse);

      const result = await playersService.importPlayers(csvData);

      expect(request).toHaveBeenCalledWith('POST', '/players/import', { csvData });
      expect(result).toEqual(mockResponse);
    });

    test('handles invalid CSV format', async () => {
      request.mockRejectedValueOnce(new Error('Invalid CSV format'));

      await expect(
        playersService.importPlayers('invalid csv data')
      ).rejects.toThrow('Invalid CSV format');
    });
  });

  describe('exportPlayers', () => {
    test('exports players as CSV', async () => {
      const mockCsv = 'name,email,skill_level\nPlayer 1,player1@example.com,2\nPlayer 2,player2@example.com,3';

      request.mockResolvedValueOnce(mockCsv);

      const result = await playersService.exportPlayers();

      expect(request).toHaveBeenCalledWith('GET', '/players/export');
      expect(result).toEqual(mockCsv);
    });

    test('returns empty CSV when no players', async () => {
      request.mockResolvedValueOnce('name,email,skill_level\n');

      const result = await playersService.exportPlayers();

      expect(result).toEqual('name,email,skill_level\n');
    });
  });

  describe('generateOtp', () => {
    test('generates OTP for player', async () => {
      const playerId = 5;
      const mockOtp = {
        password: 'ABC123XYZ',
        expires_at: '2025-12-21T12:00:00Z'
      };

      request.mockResolvedValueOnce(mockOtp);

      const result = await playersService.generateOtp(playerId);

      expect(request).toHaveBeenCalledWith('POST', '/players/5/generate-otp');
      expect(result).toEqual(mockOtp);
    });

    test('handles player not found', async () => {
      request.mockRejectedValueOnce(new Error('Player not found'));

      await expect(playersService.generateOtp(999)).rejects.toThrow('Player not found');
    });

    test('generates different OTPs for different players', async () => {
      const otp1 = { password: 'ABC123', expires_at: '2025-12-21T12:00:00Z' };
      const otp2 = { password: 'XYZ789', expires_at: '2025-12-21T12:00:00Z' };

      request.mockResolvedValueOnce(otp1);
      const result1 = await playersService.generateOtp(1);

      request.mockResolvedValueOnce(otp2);
      const result2 = await playersService.generateOtp(2);

      expect(result1.password).not.toEqual(result2.password);
    });
  });
});
