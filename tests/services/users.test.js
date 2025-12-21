/**
 * Module: users.test.js
 * Purpose: Tests for users service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import * as usersService from '../../src/services/users';
import { request } from '../../src/services/api';

// Mock the api module
jest.mock('../../src/services/api', () => ({
  request: jest.fn()
}));

describe('Users Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('fetches all users', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@example.com', role: 'player' },
        { id: 2, username: 'user2', email: 'user2@example.com', role: 'admin' }
      ];

      request.mockResolvedValueOnce(mockUsers);

      const result = await usersService.getAll();

      expect(request).toHaveBeenCalledWith('GET', '/users');
      expect(result).toEqual(mockUsers);
    });

    test('returns empty array when no users', async () => {
      request.mockResolvedValueOnce([]);

      const result = await usersService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    test('fetches user by ID', async () => {
      const userId = 5;
      const mockUser = {
        id: 5,
        username: 'testuser',
        email: 'test@example.com',
        role: 'player',
        team_id: 1
      };

      request.mockResolvedValueOnce(mockUser);

      const result = await usersService.getById(userId);

      expect(request).toHaveBeenCalledWith('GET', '/users/5');
      expect(result).toEqual(mockUser);
    });

    test('throws error when user not found', async () => {
      request.mockRejectedValueOnce(new Error('User not found'));

      await expect(usersService.getById(999)).rejects.toThrow('User not found');
    });
  });

  describe('create', () => {
    test('creates a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        role: 'player'
      };
      const mockCreated = { id: 10, ...userData, password: undefined };

      request.mockResolvedValueOnce(mockCreated);

      const result = await usersService.create(userData);

      expect(request).toHaveBeenCalledWith('POST', '/users', userData);
      expect(result).toEqual(mockCreated);
    });

    test('creates user with team assignment', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        role: 'player',
        team_id: 5
      };
      const mockCreated = { id: 10, ...userData, password: undefined };

      request.mockResolvedValueOnce(mockCreated);

      const result = await usersService.create(userData);

      expect(request).toHaveBeenCalledWith('POST', '/users', userData);
      expect(result.team_id).toBe(5);
    });

    test('handles duplicate username error', async () => {
      request.mockRejectedValueOnce(new Error('Username already exists'));

      await expect(
        usersService.create({ username: 'existing', email: 'test@example.com', password: 'pass123' })
      ).rejects.toThrow('Username already exists');
    });

    test('handles duplicate email error', async () => {
      request.mockRejectedValueOnce(new Error('Email already exists'));

      await expect(
        usersService.create({ username: 'newuser', email: 'existing@example.com', password: 'pass123' })
      ).rejects.toThrow('Email already exists');
    });

    test('handles validation error for short password', async () => {
      request.mockRejectedValueOnce(new Error('Password too short'));

      await expect(
        usersService.create({ username: 'test', email: 'test@example.com', password: 'short' })
      ).rejects.toThrow('Password too short');
    });
  });

  describe('update', () => {
    test('updates a user', async () => {
      const userId = 5;
      const updateData = { username: 'updateduser', email: 'updated@example.com' };
      const mockUpdated = { id: 5, ...updateData, role: 'player' };

      request.mockResolvedValueOnce(mockUpdated);

      const result = await usersService.update(userId, updateData);

      expect(request).toHaveBeenCalledWith('PUT', '/users/5', updateData);
      expect(result).toEqual(mockUpdated);
    });

    test('updates user role', async () => {
      const userId = 5;
      const updateData = { role: 'admin' };
      const mockUpdated = { id: 5, username: 'user', email: 'user@example.com', role: 'admin' };

      request.mockResolvedValueOnce(mockUpdated);

      const result = await usersService.update(userId, updateData);

      expect(request).toHaveBeenCalledWith('PUT', '/users/5', updateData);
      expect(result.role).toBe('admin');
    });

    test('updates user team assignment', async () => {
      const userId = 5;
      const updateData = { team_id: 3 };
      const mockUpdated = { id: 5, username: 'user', team_id: 3 };

      request.mockResolvedValueOnce(mockUpdated);

      const result = await usersService.update(userId, updateData);

      expect(result.team_id).toBe(3);
    });

    test('handles user not found', async () => {
      request.mockRejectedValueOnce(new Error('User not found'));

      await expect(
        usersService.update(999, { username: 'test' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    test('deletes a user', async () => {
      const userId = 5;
      const mockResponse = { success: true, message: 'User deleted' };

      request.mockResolvedValueOnce(mockResponse);

      const result = await usersService.deleteUser(userId);

      expect(request).toHaveBeenCalledWith('DELETE', '/users/5');
      expect(result).toEqual(mockResponse);
    });

    test('handles user not found', async () => {
      request.mockRejectedValueOnce(new Error('User not found'));

      await expect(usersService.deleteUser(999)).rejects.toThrow('User not found');
    });

    test('handles conflict when user is team leader', async () => {
      request.mockRejectedValueOnce(new Error('Cannot delete team leader'));

      await expect(usersService.deleteUser(5)).rejects.toThrow('Cannot delete team leader');
    });
  });

  describe('bulkCreate', () => {
    test('creates multiple users', async () => {
      const users = [
        { username: 'user1', email: 'user1@example.com', password: 'pass123' },
        { username: 'user2', email: 'user2@example.com', password: 'pass456' }
      ];
      const mockResponse = { success: 2, failed: 0, errors: [] };

      request.mockResolvedValueOnce(mockResponse);

      const result = await usersService.bulkCreate(users);

      expect(request).toHaveBeenCalledWith('POST', '/users/bulk-create', { users });
      expect(result).toEqual(mockResponse);
    });

    test('handles partial failure', async () => {
      const users = [
        { username: 'user1', email: 'valid@example.com', password: 'pass123' },
        { username: 'user2', email: 'invalid', password: 'pass456' }
      ];
      const mockResponse = {
        success: 1,
        failed: 1,
        errors: [{ row: 2, error: 'Invalid email' }]
      };

      request.mockResolvedValueOnce(mockResponse);

      const result = await usersService.bulkCreate(users);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
    });

    test('auto-generates passwords when not provided', async () => {
      const users = [
        { username: 'user1', email: 'user1@example.com' },
        { username: 'user2', email: 'user2@example.com' }
      ];
      const mockResponse = { success: 2, failed: 0, errors: [] };

      request.mockResolvedValueOnce(mockResponse);

      const result = await usersService.bulkCreate(users);

      expect(result.success).toBe(2);
    });

    test('handles empty array', async () => {
      const mockResponse = { success: 0, failed: 0, errors: [] };

      request.mockResolvedValueOnce(mockResponse);

      const result = await usersService.bulkCreate([]);

      expect(request).toHaveBeenCalledWith('POST', '/users/bulk-create', { users: [] });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCurrentUser', () => {
    test('fetches current user profile', async () => {
      const mockUser = {
        id: 5,
        username: 'currentuser',
        email: 'current@example.com',
        role: 'player',
        team_id: 1
      };

      request.mockResolvedValueOnce(mockUser);

      const result = await usersService.getCurrentUser();

      expect(request).toHaveBeenCalledWith('GET', '/users/me');
      expect(result).toEqual(mockUser);
    });

    test('throws error when not authenticated', async () => {
      request.mockRejectedValueOnce(new Error('Not authenticated'));

      await expect(usersService.getCurrentUser()).rejects.toThrow('Not authenticated');
    });
  });

  describe('updateProfile', () => {
    test('updates current user profile', async () => {
      const profileData = { email: 'newemail@example.com' };
      const mockUpdated = {
        id: 5,
        username: 'user',
        email: 'newemail@example.com',
        role: 'player'
      };

      request.mockResolvedValueOnce(mockUpdated);

      const result = await usersService.updateProfile(profileData);

      expect(request).toHaveBeenCalledWith('PUT', '/users/me', profileData);
      expect(result).toEqual(mockUpdated);
    });

    test('handles validation error', async () => {
      request.mockRejectedValueOnce(new Error('Invalid email'));

      await expect(
        usersService.updateProfile({ email: 'invalid' })
      ).rejects.toThrow('Invalid email');
    });
  });

  describe('changePassword', () => {
    test('changes password successfully', async () => {
      const passwordData = {
        old_password: 'oldpass123',
        new_password: 'newpass456'
      };
      const mockResponse = { success: true, message: 'Password changed' };

      request.mockResolvedValueOnce(mockResponse);

      const result = await usersService.changePassword(passwordData);

      expect(request).toHaveBeenCalledWith('PUT', '/users/me/password', passwordData);
      expect(result).toEqual(mockResponse);
    });

    test('handles incorrect old password', async () => {
      request.mockRejectedValueOnce(new Error('Incorrect password'));

      await expect(
        usersService.changePassword({ old_password: 'wrong', new_password: 'newpass123' })
      ).rejects.toThrow('Incorrect password');
    });

    test('handles validation error for new password', async () => {
      request.mockRejectedValueOnce(new Error('Password too short'));

      await expect(
        usersService.changePassword({ old_password: 'oldpass123', new_password: 'short' })
      ).rejects.toThrow('Password too short');
    });
  });
});
