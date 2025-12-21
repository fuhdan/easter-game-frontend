/**
 * Module: index.test.js
 * Purpose: Tests for services index (central export)
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import api, * as services from '../../src/services';

describe('Services Index', () => {
  describe('namespace exports', () => {
    test('exports auth namespace', () => {
      expect(services.auth).toBeDefined();
      expect(services.auth.login).toBeDefined();
      expect(services.auth.logout).toBeDefined();
    });

    test('exports users namespace', () => {
      expect(services.users).toBeDefined();
      expect(services.users.getAll).toBeDefined();
    });

    test('exports teams namespace', () => {
      expect(services.teams).toBeDefined();
    });

    test('exports players namespace', () => {
      expect(services.players).toBeDefined();
    });

    test('exports games namespace', () => {
      expect(services.games).toBeDefined();
    });

    test('exports events namespace', () => {
      expect(services.events).toBeDefined();
    });

    test('exports admin namespace', () => {
      expect(services.admin).toBeDefined();
    });

    test('exports chat namespace', () => {
      expect(services.chat).toBeDefined();
    });

    test('exports system namespace', () => {
      expect(services.system).toBeDefined();
    });

    test('exports aiTraining namespace', () => {
      expect(services.aiTraining).toBeDefined();
    });

    test('exports files namespace', () => {
      expect(services.files).toBeDefined();
    });
  });

  describe('direct function exports', () => {
    test('exports auth functions', () => {
      expect(services.login).toBeDefined();
      expect(services.logout).toBeDefined();
      expect(services.refresh).toBeDefined();
      expect(services.verify).toBeDefined();
      expect(services.activateAccount).toBeDefined();
    });

    test('exports user functions', () => {
      expect(services.getAllUsers).toBeDefined();
      expect(services.getUserById).toBeDefined();
      expect(services.createUser).toBeDefined();
      expect(services.updateUser).toBeDefined();
      expect(services.deleteUser).toBeDefined();
      expect(services.getCurrentUser).toBeDefined();
      expect(services.updateProfile).toBeDefined();
      expect(services.changePassword).toBeDefined();
    });

    test('exports system functions', () => {
      expect(services.ping).toBeDefined();
      expect(services.health).toBeDefined();
      expect(services.version).toBeDefined();
    });
  });

  describe('API utilities', () => {
    test('exports request function', () => {
      expect(services.request).toBeDefined();
    });

    test('exports buildHeaders function', () => {
      expect(services.buildHeaders).toBeDefined();
    });

    test('exports onTokenRefresh function', () => {
      expect(services.onTokenRefresh).toBeDefined();
    });

    test('exports utils object', () => {
      expect(services.utils).toBeDefined();
    });

    test('exports log object', () => {
      expect(services.log).toBeDefined();
    });

    test('exports CONFIG object', () => {
      expect(services.CONFIG).toBeDefined();
    });

    test('exports APIError class', () => {
      expect(services.APIError).toBeDefined();
    });
  });

  describe('default export', () => {
    test('default export is object with all services', () => {
      expect(api).toBeDefined();
      expect(typeof api).toBe('object');
    });

    test('default export includes all namespace', () => {
      expect(api.auth).toBeDefined();
      expect(api.users).toBeDefined();
      expect(api.teams).toBeDefined();
      expect(api.players).toBeDefined();
      expect(api.games).toBeDefined();
      expect(api.events).toBeDefined();
      expect(api.admin).toBeDefined();
      expect(api.chat).toBeDefined();
      expect(api.system).toBeDefined();
      expect(api.aiTraining).toBeDefined();
      expect(api.files).toBeDefined();
    });

    test('default export includes utils', () => {
      expect(api.utils).toBeDefined();
      expect(api.utils.processLoginResponse).toBeDefined();
    });
  });

  describe('processLoginResponse utility', () => {
    test('processes successful login (scenario 1)', () => {
      const response = {success: true, user: {id: 1}, message: 'Success'};
      const result = api.utils.processLoginResponse(response);
      expect(result.scenario).toBe(1);
      expect(result.success).toBe(true);
      expect(result.user).toEqual({id: 1});
    });

    test('processes password change required (scenario 2)', () => {
      const response = {
        success: false,
        user: {username: 'test', requiresPasswordChange: true, requiresOTP: false},
        message: 'Change password'
      };
      const result = api.utils.processLoginResponse(response);
      expect(result.scenario).toBe(2);
      expect(result.requiresPasswordChange).toBe(true);
      expect(result.requiresOTP).toBe(false);
    });

    test('processes password change + OTP (scenario 3)', () => {
      const response = {
        success: false,
        user: {username: 'test', requiresPasswordChange: true, requiresOTP: true},
        message: 'Change password and OTP'
      };
      const result = api.utils.processLoginResponse(response);
      expect(result.scenario).toBe(3);
      expect(result.requiresPasswordChange).toBe(true);
      expect(result.requiresOTP).toBe(true);
    });

    test('handles unknown scenario', () => {
      const response = {success: false, message: 'Unknown error'};
      const result = api.utils.processLoginResponse(response);
      expect(result.scenario).toBe(0);
      expect(result.success).toBe(false);
    });

    test('handles missing user object', () => {
      const response = {success: false};
      const result = api.utils.processLoginResponse(response);
      expect(result.scenario).toBe(0);
      expect(result.message).toBe('Login failed');
    });
  });

  describe('alias exports', () => {
    test('getEvents is alias for events.getAll', () => {
      expect(services.getEvents).toBe(services.events.getAll);
    });

    test('getGames is alias for events.getGames', () => {
      expect(services.getGames).toBe(services.events.getGames);
    });
  });
});
