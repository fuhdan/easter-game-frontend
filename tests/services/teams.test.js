/**
 * Module: teams.test.js
 * Purpose: Tests for teams service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

import { mockFetchResponse, createMockTeam } from '../test-utils';

const teamsService = {
  getTeams: async () => {
    const response = await fetch('http://localhost:8000/api/teams', {
      headers: { 'Authorization': 'Bearer token' }
    });
    return response.json();
  },
  getTeamById: async (id) => {
    const response = await fetch(`http://localhost:8000/api/teams/${id}`, {
      headers: { 'Authorization': 'Bearer token' }
    });
    return response.json();
  },
  createTeam: async (teamData) => {
    const response = await fetch('http://localhost:8000/api/teams', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(teamData)
    });
    return response.json();
  },
  updateTeam: async (id, teamData) => {
    const response = await fetch(`http://localhost:8000/api/teams/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(teamData)
    });
    return response.json();
  },
  deleteTeam: async (id) => {
    const response = await fetch(`http://localhost:8000/api/teams/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer token' }
    });
    return response.json();
  }
};

describe('Teams Service', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete global.fetch;
  });

  describe('getTeams', () => {
    test('fetches all teams', async () => {
      const mockTeams = [createMockTeam(), createMockTeam({ id: 2, name: 'Team Beta' })];
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockTeams));

      const teams = await teamsService.getTeams();

      expect(mockFetch).toHaveBeenCalled();
      expect(teams).toHaveLength(2);
    });
  });

  describe('getTeamById', () => {
    test('fetches team by ID', async () => {
      const mockTeam = createMockTeam();
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockTeam));

      const team = await teamsService.getTeamById(1);

      expect(team.id).toBe(1);
      expect(team.name).toBe('Team Alpha');
    });
  });

  describe('createTeam', () => {
    test('creates new team', async () => {
      const newTeam = { name: 'Team Gamma', leader_id: 1 };
      const mockResponse = { ...createMockTeam({ id: 3, name: 'Team Gamma' }) };
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const team = await teamsService.createTeam(newTeam);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/teams',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newTeam)
        })
      );

      expect(team.name).toBe('Team Gamma');
    });
  });

  describe('updateTeam', () => {
    test('updates existing team', async () => {
      const updates = { name: 'Team Alpha Updated' };
      const mockResponse = { ...createMockTeam(), name: 'Team Alpha Updated' };
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const team = await teamsService.updateTeam(1, updates);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/teams/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates)
        })
      );

      expect(team.name).toBe('Team Alpha Updated');
    });
  });

  describe('deleteTeam', () => {
    test('deletes team', async () => {
      const mockResponse = { success: true, message: 'Team deleted' };
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const result = await teamsService.deleteTeam(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/teams/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );

      expect(result.success).toBe(true);
    });
  });
});
