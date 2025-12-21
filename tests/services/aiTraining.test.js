/**
 * Module: aiTraining.test.js
 * Purpose: Tests for AI training service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import * as aiTrainingService from '../../src/services/aiTraining';
import { request } from '../../src/services/api';

jest.mock('../../src/services/api', () => ({
  request: jest.fn(),
  log: { info: jest.fn(), error: jest.fn() }
}));

describe('AI Training Service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getHints', () => {
    test('fetches all hints without filters', async () => {
      request.mockResolvedValueOnce([{id: 1, content: 'hint'}]);
      await aiTrainingService.getHints();
      expect(request).toHaveBeenCalledWith('GET', '/admin/ai/training-hints');
    });

    test('applies game_id filter', async () => {
      request.mockResolvedValueOnce([]);
      await aiTrainingService.getHints({game_id: 5});
      expect(request).toHaveBeenCalledWith('GET', '/admin/ai/training-hints?game_id=5');
    });

    test('applies hint_type filter', async () => {
      request.mockResolvedValueOnce([]);
      await aiTrainingService.getHints({hint_type: 'contextual'});
      expect(request).toHaveBeenCalledWith('GET', expect.stringContaining('hint_type=contextual'));
    });

    test('applies multiple filters', async () => {
      request.mockResolvedValueOnce([]);
      await aiTrainingService.getHints({game_id: 5, hint_type: 'contextual', hint_level: 2});
      const url = request.mock.calls[0][1];
      expect(url).toContain('game_id=5');
      expect(url).toContain('hint_type=contextual');
      expect(url).toContain('hint_level=2');
    });
  });

  describe('hint CRUD operations', () => {
    test('getHintsByGame', async () => {
      request.mockResolvedValueOnce({game1: []});
      await aiTrainingService.getHintsByGame();
      expect(request).toHaveBeenCalledWith('GET', '/admin/ai/training-hints/by-game');
    });

    test('createHint', async () => {
      const data = {game_id: 1, hint_type: 'contextual', hint_level: 1, content: 'hint'};
      request.mockResolvedValueOnce({id: 10, ...data});
      await aiTrainingService.createHint(data);
      expect(request).toHaveBeenCalledWith('POST', '/admin/ai/training-hints', data);
    });

    test('updateHint', async () => {
      request.mockResolvedValueOnce({id: 5, content: 'updated'});
      await aiTrainingService.updateHint(5, {content: 'updated'});
      expect(request).toHaveBeenCalledWith('PUT', '/admin/ai/training-hints/5', {content: 'updated'});
    });

    test('deleteHint', async () => {
      request.mockResolvedValueOnce({success: true});
      await aiTrainingService.deleteHint(5);
      expect(request).toHaveBeenCalledWith('DELETE', '/admin/ai/training-hints/5');
    });

    test('bulkDeleteHints', async () => {
      request.mockResolvedValueOnce({deleted: 10});
      await aiTrainingService.bulkDeleteHints(3);
      expect(request).toHaveBeenCalledWith('POST', '/admin/ai/training-hints/bulk-delete', {game_id: 3});
    });
  });

  describe('system prompts', () => {
    test('getSystemPrompts', async () => {
      request.mockResolvedValueOnce([{id: 1, name: 'default'}]);
      await aiTrainingService.getSystemPrompts();
      expect(request).toHaveBeenCalledWith('GET', '/admin/ai/system-prompts');
    });

    test('createSystemPrompt', async () => {
      const data = {name: 'prompt1', content: 'You are...', priority: 1};
      request.mockResolvedValueOnce({id: 1, ...data});
      await aiTrainingService.createSystemPrompt(data);
      expect(request).toHaveBeenCalledWith('POST', '/admin/ai/system-prompts', data);
    });

    test('updateSystemPrompt', async () => {
      request.mockResolvedValueOnce({id: 1, priority: 10});
      await aiTrainingService.updateSystemPrompt(1, {priority: 10});
      expect(request).toHaveBeenCalledWith('PUT', '/admin/ai/system-prompts/1', {priority: 10});
    });

    test('deleteSystemPrompt', async () => {
      request.mockResolvedValueOnce({success: true});
      await aiTrainingService.deleteSystemPrompt(1);
      expect(request).toHaveBeenCalledWith('DELETE', '/admin/ai/system-prompts/1');
    });
  });

  describe('admin guide', () => {
    test('getAdminGuide', async () => {
      request.mockResolvedValueOnce({content: '# Guide'});
      await aiTrainingService.getAdminGuide();
      expect(request).toHaveBeenCalledWith('GET', '/admin/ai/admin-guide');
    });
  });

  describe('events management', () => {
    test('getEvents', async () => {
      request.mockResolvedValueOnce([{id: 1, year: 2025}]);
      await aiTrainingService.getEvents();
      expect(request).toHaveBeenCalledWith('GET', '/admin/content/events');
    });

    test('getEvent', async () => {
      request.mockResolvedValueOnce({id: 1});
      await aiTrainingService.getEvent(1);
      expect(request).toHaveBeenCalledWith('GET', '/admin/content/events/1');
    });

    test('createEvent', async () => {
      const data = {year: 2026, name: 'Easter 2026', story_html: '<p>Story</p>'};
      request.mockResolvedValueOnce({id: 2, ...data});
      await aiTrainingService.createEvent(data);
      expect(request).toHaveBeenCalledWith('POST', '/admin/content/events', data);
    });

    test('updateEvent', async () => {
      request.mockResolvedValueOnce({id: 1, name: 'Updated'});
      await aiTrainingService.updateEvent(1, {name: 'Updated'});
      expect(request).toHaveBeenCalledWith('PUT', '/admin/content/events/1', {name: 'Updated'});
    });

    test('deleteEvent', async () => {
      request.mockResolvedValueOnce({success: true});
      await aiTrainingService.deleteEvent(1);
      expect(request).toHaveBeenCalledWith('DELETE', '/admin/content/events/1');
    });
  });

  describe('categories', () => {
    test('getCategories without filter', async () => {
      request.mockResolvedValueOnce([{id: 1, name: 'Puzzles'}]);
      await aiTrainingService.getCategories();
      expect(request).toHaveBeenCalledWith('GET', '/admin/content/categories');
    });

    test('getCategories with activeOnly', async () => {
      request.mockResolvedValueOnce([]);
      await aiTrainingService.getCategories(true);
      expect(request).toHaveBeenCalledWith('GET', '/admin/content/categories?active_only=true');
    });

    test('createCategory', async () => {
      const data = {name: 'Quiz', description: 'Quiz games'};
      request.mockResolvedValueOnce({id: 1, ...data});
      await aiTrainingService.createCategory(data);
      expect(request).toHaveBeenCalledWith('POST', '/admin/content/categories', data);
    });

    test('updateCategory', async () => {
      request.mockResolvedValueOnce({id: 1});
      await aiTrainingService.updateCategory(1, {name: 'Updated'});
      expect(request).toHaveBeenCalledWith('PUT', '/admin/content/categories/1', {name: 'Updated'});
    });

    test('deleteCategory', async () => {
      request.mockResolvedValueOnce({success: true});
      await aiTrainingService.deleteCategory(1);
      expect(request).toHaveBeenCalledWith('DELETE', '/admin/content/categories/1');
    });
  });

  describe('games management', () => {
    test('getAllGames without inactive', async () => {
      request.mockResolvedValueOnce([{id: 1}]);
      await aiTrainingService.getAllGames();
      expect(request).toHaveBeenCalledWith('GET', '/admin/content/games');
    });

    test('getAllGames with inactive', async () => {
      request.mockResolvedValueOnce([]);
      await aiTrainingService.getAllGames(true);
      expect(request).toHaveBeenCalledWith('GET', '/admin/content/games?include_inactive=true');
    });

    test('getGame', async () => {
      request.mockResolvedValueOnce({id: 1});
      await aiTrainingService.getGame(1);
      expect(request).toHaveBeenCalledWith('GET', '/admin/content/games/1');
    });

    test('createGame', async () => {
      const data = {title: 'New Game'};
      request.mockResolvedValueOnce({id: 1, ...data});
      await aiTrainingService.createGame(data);
      expect(request).toHaveBeenCalledWith('POST', '/admin/content/games', data);
    });

    test('updateGame', async () => {
      request.mockResolvedValueOnce({id: 1});
      await aiTrainingService.updateGame(1, {title: 'Updated'});
      expect(request).toHaveBeenCalledWith('PUT', '/admin/content/games/1', {title: 'Updated'});
    });

    test('deleteGame', async () => {
      request.mockResolvedValueOnce({success: true});
      await aiTrainingService.deleteGame(1);
      expect(request).toHaveBeenCalledWith('DELETE', '/admin/content/games/1');
    });
  });
});
