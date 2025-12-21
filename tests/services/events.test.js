/**
 * Module: events.test.js
 * Purpose: Tests for events service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import * as eventsService from '../../src/services/events';
import { request } from '../../src/services/api';

// Mock the api module
jest.mock('../../src/services/api', () => ({
  request: jest.fn(),
  log: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('Events Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('fetches all events', async () => {
      const mockEvents = [
        { id: 1, year: 2024, name: 'Easter Quest 2024', start_date: '2024-03-20', end_date: '2024-04-05' },
        { id: 2, year: 2025, name: 'Easter Quest 2025', start_date: '2025-04-10', end_date: '2025-04-25' }
      ];

      request.mockResolvedValueOnce(mockEvents);

      const result = await eventsService.getAll();

      expect(request).toHaveBeenCalledWith('GET', '/events');
      expect(result).toEqual(mockEvents);
    });

    test('returns empty array when no events', async () => {
      request.mockResolvedValueOnce([]);

      const result = await eventsService.getAll();

      expect(result).toEqual([]);
    });

    test('includes event metadata', async () => {
      const mockEvents = [
        {
          id: 1,
          year: 2025,
          name: 'Easter Quest 2025',
          start_date: '2025-04-10',
          end_date: '2025-04-25',
          is_active: true,
          game_count: 15
        }
      ];

      request.mockResolvedValueOnce(mockEvents);

      const result = await eventsService.getAll();

      expect(result[0].game_count).toBe(15);
      expect(result[0].is_active).toBe(true);
    });
  });

  describe('getActive', () => {
    test('fetches active event with story', async () => {
      const mockEvent = {
        id: 2,
        year: 2025,
        name: 'Easter Quest 2025',
        story_html: '<h1>Welcome to Easter Quest 2025!</h1><p>The adventure begins...</p>',
        image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        start_date: '2025-04-10',
        end_date: '2025-04-25'
      };

      request.mockResolvedValueOnce(mockEvent);

      const result = await eventsService.getActive();

      expect(request).toHaveBeenCalledWith('GET', '/events/active');
      expect(result).toEqual(mockEvent);
    });

    test('returns full story HTML', async () => {
      const mockEvent = {
        id: 2,
        year: 2025,
        name: 'Easter Quest 2025',
        story_html: '<div><h1>Title</h1><p>Story content</p></div>',
        image_urls: []
      };

      request.mockResolvedValueOnce(mockEvent);

      const result = await eventsService.getActive();

      expect(result.story_html).toContain('<h1>Title</h1>');
      expect(result.story_html).toContain('<p>Story content</p>');
    });

    test('includes image URLs', async () => {
      const mockEvent = {
        id: 2,
        year: 2025,
        name: 'Easter Quest 2025',
        story_html: '<p>Story</p>',
        image_urls: [
          'https://example.com/bg.jpg',
          'https://example.com/logo.png',
          'https://example.com/icon.svg'
        ]
      };

      request.mockResolvedValueOnce(mockEvent);

      const result = await eventsService.getActive();

      expect(result.image_urls).toHaveLength(3);
      expect(result.image_urls[0]).toBe('https://example.com/bg.jpg');
    });

    test('throws error when no active event', async () => {
      request.mockRejectedValueOnce(new Error('No active event found'));

      await expect(eventsService.getActive()).rejects.toThrow('No active event found');
    });

    test('handles empty image_urls array', async () => {
      const mockEvent = {
        id: 2,
        year: 2025,
        name: 'Easter Quest 2025',
        story_html: '<p>Story</p>',
        image_urls: []
      };

      request.mockResolvedValueOnce(mockEvent);

      const result = await eventsService.getActive();

      expect(result.image_urls).toEqual([]);
    });
  });

  describe('getByYear', () => {
    test('fetches event by year', async () => {
      const year = 2025;
      const mockEvent = {
        id: 2,
        year: 2025,
        name: 'Easter Quest 2025',
        start_date: '2025-04-10',
        end_date: '2025-04-25'
      };

      request.mockResolvedValueOnce(mockEvent);

      const result = await eventsService.getByYear(year);

      expect(request).toHaveBeenCalledWith('GET', '/events/2025');
      expect(result).toEqual(mockEvent);
    });

    test('fetches past event', async () => {
      const year = 2024;
      const mockEvent = {
        id: 1,
        year: 2024,
        name: 'Easter Quest 2024',
        start_date: '2024-03-20',
        end_date: '2024-04-05',
        is_active: false
      };

      request.mockResolvedValueOnce(mockEvent);

      const result = await eventsService.getByYear(year);

      expect(request).toHaveBeenCalledWith('GET', '/events/2024');
      expect(result.year).toBe(2024);
      expect(result.is_active).toBe(false);
    });

    test('throws error when event not found', async () => {
      request.mockRejectedValueOnce(new Error('Event not found'));

      await expect(eventsService.getByYear(2099)).rejects.toThrow('Event not found');
    });

    test('handles invalid year', async () => {
      request.mockRejectedValueOnce(new Error('Invalid year'));

      await expect(eventsService.getByYear(-1)).rejects.toThrow('Invalid year');
    });
  });

  describe('getGames', () => {
    test('fetches all games for an event', async () => {
      const eventId = 2;
      const mockGames = [
        { id: 1, title: 'Game 1', description: 'First game', difficulty_level: 2 },
        { id: 2, title: 'Game 2', description: 'Second game', difficulty_level: 3 },
        { id: 3, title: 'Game 3', description: 'Third game', difficulty_level: 4 }
      ];

      request.mockResolvedValueOnce(mockGames);

      const result = await eventsService.getGames(eventId);

      expect(request).toHaveBeenCalledWith('GET', '/events/2/games');
      expect(result).toEqual(mockGames);
    });

    test('returns empty array when event has no games', async () => {
      request.mockResolvedValueOnce([]);

      const result = await eventsService.getGames(1);

      expect(result).toEqual([]);
    });

    test('includes game metadata', async () => {
      const mockGames = [
        {
          id: 1,
          title: 'Easter Puzzle',
          description: 'Solve the puzzle',
          difficulty_level: 3,
          points_value: 100,
          max_hints: 3,
          category_name: 'Puzzles',
          category_icon: '🧩'
        }
      ];

      request.mockResolvedValueOnce(mockGames);

      const result = await eventsService.getGames(2);

      expect(result[0].points_value).toBe(100);
      expect(result[0].max_hints).toBe(3);
      expect(result[0].category_name).toBe('Puzzles');
    });

    test('throws error when event not found', async () => {
      request.mockRejectedValueOnce(new Error('Event not found'));

      await expect(eventsService.getGames(999)).rejects.toThrow('Event not found');
    });

    test('handles different event IDs', async () => {
      const event1Games = [{ id: 1, title: 'Game 1' }];
      const event2Games = [{ id: 2, title: 'Game 2' }];

      request.mockResolvedValueOnce(event1Games);
      const result1 = await eventsService.getGames(1);

      request.mockResolvedValueOnce(event2Games);
      const result2 = await eventsService.getGames(2);

      expect(result1).toEqual(event1Games);
      expect(result2).toEqual(event2Games);
    });
  });

  describe('error handling', () => {
    test('handles network errors in getAll', async () => {
      request.mockRejectedValueOnce(new Error('Network error'));

      await expect(eventsService.getAll()).rejects.toThrow('Network error');
    });

    test('handles network errors in getActive', async () => {
      request.mockRejectedValueOnce(new Error('Network error'));

      await expect(eventsService.getActive()).rejects.toThrow('Network error');
    });

    test('handles server errors in getByYear', async () => {
      request.mockRejectedValueOnce(new Error('Server error'));

      await expect(eventsService.getByYear(2025)).rejects.toThrow('Server error');
    });

    test('handles unauthorized access', async () => {
      request.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(eventsService.getGames(1)).rejects.toThrow('Unauthorized');
    });
  });
});
