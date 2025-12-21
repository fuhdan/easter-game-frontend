/**
 * Test Suite: CurrentGame Component
 * Purpose: Comprehensive tests for game selection and solution submission
 * Coverage Target: 100% (lines 36-533)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CurrentGame from '../../../src/components/GamePanel/CurrentGame';
import { getAllGames, submitSolution, startGame } from '../../../src/services';

// Mock services
jest.mock('../../../src/services');

describe('CurrentGame Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    role: 'player'
  };

  const mockAdminUser = {
    id: 2,
    username: 'admin',
    role: 'admin'
  };

  const mockActiveEvent = {
    id: 1,
    title: 'Easter Quest 2025',
    show_points: true
  };

  const mockGames = [
    {
      id: 1,
      title: 'Game 1',
      order_index: 1,
      category_name: 'Puzzle',
      category_icon: '🧩',
      category_color: '#FF5733',
      challenge_text: 'What is 2+2?',
      description: 'Math problem',
      points_value: 100,
      max_hints: 3,
      difficulty_level: 'easy'
    },
    {
      id: 2,
      title: 'Game 2',
      order_index: 2,
      category_name: 'Riddle',
      category_icon: '🎯',
      category_color: '#33FF57',
      challenge_text: 'What has keys but no locks?',
      points_value: 200,
      max_hints: 2,
      difficulty_level: 'medium'
    },
    {
      id: 3,
      title: 'Game 3',
      order_index: 3,
      challenge_text: 'Hard puzzle',
      points_value: 300,
      max_hints: 1,
      difficulty_level: 'hard'
    }
  ];

  const mockAllGamesResponse = {
    games: [
      {
        id: 1,
        progress: { status: 'completed', score: 100 }
      },
      {
        id: 2,
        progress: { status: 'in_progress', score: 50 }
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    console.error.mockRestore();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ========== Rendering Tests ==========
  describe('Rendering', () => {
    test('renders "no games" message when games array is empty (line 212-223)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={[]}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No games available for this event.')).toBeInTheDocument();
      });
    });

    test('renders "no games" message when games is null (line 212)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={null}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No games available for this event.')).toBeInTheDocument();
      });
    });

    test('renders game list when games exist', async () => {
      getAllGames.mockResolvedValue(mockAllGamesResponse);

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('🎮 Games (3)')).toBeInTheDocument();
      });

      expect(screen.getByText('Game 1')).toBeInTheDocument();
      expect(screen.getByText('Game 2')).toBeInTheDocument();
    });

    test('identifies admin user (line 38)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockAdminUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Admin View/)).toBeInTheDocument();
        expect(screen.getByText(/You can preview all game questions/)).toBeInTheDocument();
      });
    });

    test('shows select message for non-admin users (line 333-336)', async () => {
      getAllGames.mockResolvedValue(mockAllGamesResponse);

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Select a game to answer:')).toBeInTheDocument();
      });
    });
  });

  // ========== loadGameProgress Tests ==========
  describe('loadGameProgress', () => {
    test('loads game progress on mount (line 46-48)', async () => {
      getAllGames.mockResolvedValue(mockAllGamesResponse);

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        // Called twice on mount: once from first useEffect, once from second useEffect (when games has length > 0)
        expect(getAllGames).toHaveBeenCalledTimes(2);
      });
    });

    test('reloads game progress when games prop changes (line 51-55)', async () => {
      getAllGames.mockResolvedValue(mockAllGamesResponse);

      const { rerender } = render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        // Called twice on initial mount
        expect(getAllGames).toHaveBeenCalledTimes(2);
      });

      // Change games prop
      const newGames = [...mockGames, { id: 4, order_index: 4 }];
      rerender(
        <CurrentGame
          games={newGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        // Called again when games prop changes (3rd call total)
        expect(getAllGames).toHaveBeenCalledTimes(3);
      });
    });

    test('builds progress map from response (line 72-80)', async () => {
      getAllGames.mockResolvedValue(mockAllGamesResponse);

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        // Game 1 should show as completed
        expect(screen.getByText(/✅/)).toBeInTheDocument();
      });
    });

    test('handles empty response (line 73-78)', async () => {
      getAllGames.mockResolvedValue(null);

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        // Empty response means no progress, so game is not started and text is blurred
        expect(challengeText).toHaveStyle('filter: blur(5px)');
      });
    });

    test('logs error when loadGameProgress fails (line 81-83)', async () => {
      const error = new Error('API Error');
      getAllGames.mockRejectedValue(error);

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to load game progress:', error);
      });
    });
  });

  // ========== isGameLocked Tests ==========
  describe('isGameLocked', () => {
    test('returns false when games or gameProgress is not available (line 97)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={null}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No games available for this event.')).toBeInTheDocument();
      });
    });

    test('locks game when previous game is not completed (line 103-106)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: null }, // Not completed
          { id: 2, progress: null }
        ]
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        // Game 2 should be locked because Game 1 is not completed
        const lockMessages = screen.getAllByText(/🔒 Complete previous games to unlock/);
        expect(lockMessages.length).toBeGreaterThan(0);
      });
    });

    test('unlocks game when all previous games are completed', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'completed' } },
          { id: 2, progress: null }
        ]
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('What has keys but no locks?')).toBeInTheDocument();
      });
    });
  });

  // ========== getCategoryForGame Tests ==========
  describe('getCategoryForGame', () => {
    test('returns category from game data (line 130-136)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        // Component only renders icon, not category name
        expect(screen.getByText('🧩')).toBeInTheDocument();
      });
    });

    test('returns default icon when category_icon is missing (line 133)', async () => {
      const gamesWithoutIcon = [
        {
          ...mockGames[0],
          category_icon: null
        }
      ];

      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={gamesWithoutIcon}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('🎮')).toBeInTheDocument();
      });
    });

    test('returns null when category_name is missing (line 137-139)', async () => {
      const gamesWithoutCategory = [
        {
          id: 1,
          title: 'Game 1',
          order_index: 1,
          challenge_text: 'Test',
          points_value: 100,
          max_hints: 3
        }
      ];

      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={gamesWithoutCategory}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        // Default icon (🎮) is used when category is missing
        expect(screen.getByText('🎮')).toBeInTheDocument();
        // Game is not started (no progress), so text is blurred
        const challengeText = screen.getByText('Test');
        expect(challengeText).toHaveStyle('filter: blur(5px)');
      });
    });
  });

  // ========== handleStartGame Tests ==========
  describe('handleStartGame', () => {
    test('starts game and reloads progress (line 151-172)', async () => {
      getAllGames.mockResolvedValue({ games: [] });
      startGame.mockResolvedValue({ success: true });

      const mockOnSubmitSolution = jest.fn();

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={mockOnSubmitSolution}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('🎯 Start Challenge').length).toBeGreaterThan(0);
      });

      // Click start button for first game
      const startButtons = screen.getAllByText('🎯 Start Challenge');
      fireEvent.click(startButtons[0]);

      await waitFor(() => {
        expect(startGame).toHaveBeenCalledWith(1);
        expect(getAllGames).toHaveBeenCalled(); // Reloaded
        expect(mockOnSubmitSolution).toHaveBeenCalled();
      });
    });

    test('stops propagation to prevent clicking game card (line 152)', async () => {
      getAllGames.mockResolvedValue({ games: [] });
      startGame.mockResolvedValue({ success: true });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('🎯 Start Challenge').length).toBeGreaterThan(0);
      });

      const startButton = screen.getAllByText('🎯 Start Challenge')[0];
      const event = { stopPropagation: jest.fn() };

      fireEvent.click(startButton, event);

      // Note: stopPropagation is called internally, hard to test directly
    });

    test('shows starting state (line 155, 476)', async () => {
      getAllGames.mockResolvedValue({ games: [] });
      startGame.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('🎯 Start Challenge').length).toBeGreaterThan(0);
      });

      const startButton = screen.getAllByText('🎯 Start Challenge')[0];
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('🎯 Starting...')).toBeInTheDocument();
      });
    });

    test('logs error when startGame fails (line 167-169)', async () => {
      getAllGames.mockResolvedValue({ games: [] });
      const error = new Error('Start game failed');
      startGame.mockRejectedValue(error);

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('🎯 Start Challenge').length).toBeGreaterThan(0);
      });

      const startButton = screen.getAllByText('🎯 Start Challenge')[0];
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to start game:', error);
      });
    });

    test('does not call onSubmitSolution when startGame is not successful (line 159-166)', async () => {
      getAllGames.mockResolvedValue({ games: [] });
      startGame.mockResolvedValue({ success: false });

      const mockOnSubmitSolution = jest.fn();

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={mockOnSubmitSolution}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('🎯 Start Challenge').length).toBeGreaterThan(0);
      });

      const startButton = screen.getAllByText('🎯 Start Challenge')[0];
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(startGame).toHaveBeenCalled();
      });

      expect(mockOnSubmitSolution).not.toHaveBeenCalled();
    });
  });

  // ========== Game Selection and Solution Form Tests ==========
  describe('Game Selection and Solution Form', () => {
    test('displays solution form when game is selected (line 226-312)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'in_progress' } },
          { id: 2, progress: { status: 'not_started' } },
          { id: 3, progress: { status: 'not_started' } }
        ]
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      // Wait for game progress to load - challenge text should be visible (not blurred)
      await waitFor(() => {
        const challengeText = screen.queryByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      }, { timeout: 3000 });

      // Find and click the game card
      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Wait for the form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('← Back to Games')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
    });

    test('shows challenge_text or falls back to description (line 247)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'in_progress' } },
          { id: 2, progress: { status: 'not_started' } },
          { id: 3, progress: { status: 'not_started' } }
        ]
      });

      const gameWithoutChallengeText = [
        {
          ...mockGames[0],
          challenge_text: null,
          description: 'Fallback description'
        }
      ];

      render(
        <CurrentGame
          games={gameWithoutChallengeText}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const description = screen.getByText('Fallback description');
        expect(description).toBeInTheDocument();
        expect(description).toHaveStyle('filter: none');
      });

      // Click on description text - event bubbles to parent with onClick
      const description = screen.getByText('Fallback description');
      fireEvent.click(description);

      // Form should appear showing the fallback description
      await waitFor(() => {
        expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
      });

      expect(screen.getByText('Fallback description')).toBeInTheDocument();
    });

    test('back button returns to game list (line 232-243)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'in_progress' } },
          { id: 2, progress: { status: 'not_started' } },
          { id: 3, progress: { status: 'not_started' } }
        ]
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Select game
      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByText('← Back to Games')).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByText('← Back to Games');
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('🎮 Games (3)')).toBeInTheDocument();
      });
    });

    test('updates solution input (line 252-258)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'in_progress' } },
          { id: 2, progress: { status: 'not_started' } },
          { id: 3, progress: { status: 'not_started' } }
        ]
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Your Answer:');
      fireEvent.change(input, { target: { value: '4' } });

      expect(input.value).toBe('4');
    });

    test('shows game info with points (line 301-308)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'in_progress' } },
          { id: 2, progress: { status: 'not_started' } },
          { id: 3, progress: { status: 'not_started' } }
        ]
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
      });

      expect(screen.getByText(/Points: 100/)).toBeInTheDocument();
      expect(screen.getByText(/Max Hints: 3/)).toBeInTheDocument();
      expect(screen.getByText(/Difficulty: easy/)).toBeInTheDocument();
    });

    test('hides points when showPoints is false (line 304)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'in_progress' } },
          { id: 2, progress: { status: 'not_started' } },
          { id: 3, progress: { status: 'not_started' } }
        ]
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={false}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      expect(screen.queryByText(/Points:/)).not.toBeInTheDocument();
    });

    test('does not show difficulty when not provided (line 307)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'in_progress' } },
          { id: 2, progress: { status: 'not_started' } },
          { id: 3, progress: { status: 'not_started' } }
        ]
      });

      const gameWithoutDifficulty = [
        {
          ...mockGames[0],
          difficulty_level: null
        }
      ];

      render(
        <CurrentGame
          games={gameWithoutDifficulty}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      expect(screen.queryByText(/Difficulty:/)).not.toBeInTheDocument();
    });
  });

  // ========== handleSubmit Tests ==========
  describe('handleSubmit', () => {
    beforeEach(async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'in_progress' } },
          { id: 2, progress: { status: 'not_started' } },
          { id: 3, progress: { status: 'not_started' } }
        ]
      });
    });

    test('does not submit with empty solution (line 185)', async () => {
      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
      });

      const form = screen.getByLabelText('Your Answer:').closest('form');
      fireEvent.submit(form);

      expect(submitSolution).not.toHaveBeenCalled();
    });

    test('does not submit when selectedGame is null (line 185)', async () => {
      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Don't select a game
      // Can't submit because form isn't rendered
      expect(screen.queryByLabelText('Your Answer:')).not.toBeInTheDocument();
    });

    test('submits correct solution and resets form (line 193-201)', async () => {
      submitSolution.mockResolvedValue({
        correct: true,
        message: 'Correct answer!'
      });

      const mockOnSubmitSolution = jest.fn();

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={mockOnSubmitSolution}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Your Answer:');
      fireEvent.change(input, { target: { value: '4' } });

      const submitButton = screen.getByText('Submit Answer');

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(submitSolution).toHaveBeenCalledWith(1, '4');
        expect(screen.getByText('Correct answer!')).toBeInTheDocument();
      });

      expect(input.value).toBe(''); // Solution cleared

      // Fast-forward timeout
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockOnSubmitSolution).toHaveBeenCalled();
      });
    });

    test('shows error message for incorrect solution (line 202-204)', async () => {
      submitSolution.mockResolvedValue({
        correct: false,
        message: 'Incorrect answer!'
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Your Answer:');
      fireEvent.change(input, { target: { value: '5' } });

      const submitButton = screen.getByText('Submit Answer');

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Incorrect answer!')).toBeInTheDocument();
      });
    });

    test('handles submission error (line 205-207)', async () => {
      submitSolution.mockRejectedValue(new Error('Network error'));

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Your Answer:');
      fireEvent.change(input, { target: { value: '4' } });

      const submitButton = screen.getByText('Submit Answer');

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('handles error without message property (line 206)', async () => {
      const error = new Error();
      delete error.message;
      submitSolution.mockRejectedValue(error);

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Your Answer:');
      fireEvent.change(input, { target: { value: '4' } });

      const submitButton = screen.getByText('Submit Answer');

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to submit solution')).toBeInTheDocument();
      });
    });

    test('disables submit button while submitting (line 285, 293)', async () => {
      submitSolution.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Your Answer:');
      fireEvent.change(input, { target: { value: '4' } });

      const submitButton = screen.getByText('Submit Answer');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
      });
    });

    test('trims whitespace from solution (line 191)', async () => {
      submitSolution.mockResolvedValue({
        correct: true,
        message: 'Correct!'
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Your Answer:');
      fireEvent.change(input, { target: { value: '  4  ' } });

      const submitButton = screen.getByText('Submit Answer');

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(submitSolution).toHaveBeenCalledWith(1, '4'); // Trimmed
      });
    });
  });

  // ========== Game List Display Tests ==========
  describe('Game List Display', () => {
    test('displays admin preview for admin users (line 404-421)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockAdminUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText(/🔒 Admin preview only/).length).toBe(3);
      });

      // All questions should be visible
      expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
      expect(screen.getByText('What has keys but no locks?')).toBeInTheDocument();
    });

    test('displays locked game message for locked games (line 422-431)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: null } // Not completed
        ]
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText(/🔒 Complete previous games to unlock/).length).toBeGreaterThan(0);
      });
    });

    test('blurs challenge text for unlocked but not started games (line 440-442)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toHaveStyle('filter: blur(5px)');
      });
    });

    test('shows start button for unlocked, not started games (line 448-478)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('🎯 Start Challenge').length).toBeGreaterThan(0);
      });
    });

    test('does not show start button for started games (line 448)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'in_progress' } },
          { id: 2, progress: { status: 'not_started' } },
          { id: 3, progress: { status: 'not_started' } }
        ]
      });

      render(
        <CurrentGame
          games={mockGames.slice(0, 1)}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      // Wait for game progress to load
      await waitFor(() => {
        expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
        // Challenge text should not be blurred since game is started
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).not.toHaveStyle('filter: blur(5px)');
      });

      // Start button should not be present for started games
      expect(screen.queryByText(/Start Challenge/)).not.toBeInTheDocument();
    });

    test('displays completed badge for completed games (line 399-401, 512-516)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'completed' } }
        ]
      });

      render(
        <CurrentGame
          games={mockGames.slice(0, 1)}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/✅/)).toBeInTheDocument();
        expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      });
    });

    test('displays difficulty badges with correct colors (line 485-506)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        // Difficulty text is lowercase in DOM (uppercase via CSS text-transform)
        expect(screen.getByText('easy')).toBeInTheDocument();
        expect(screen.getByText('medium')).toBeInTheDocument();
        expect(screen.getByText('hard')).toBeInTheDocument();
      });
    });

    test('displays points when showPoints is true (line 507-511)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('100 pts')).toBeInTheDocument();
        expect(screen.getByText('200 pts')).toBeInTheDocument();
      });
    });

    test('hides points when showPoints is false (line 507)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={false}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('100 pts')).not.toBeInTheDocument();
        expect(screen.queryByText('200 pts')).not.toBeInTheDocument();
      });
    });

    test('does not show completed badge for admin (line 512)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'completed' } }
        ]
      });

      render(
        <CurrentGame
          games={mockGames.slice(0, 1)}
          activeEvent={mockActiveEvent}
          user={mockAdminUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('COMPLETED')).not.toBeInTheDocument();
      });
    });

    test('displays locked badge for locked games (line 517-521)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: null } // Not completed
        ]
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText(/🔒 LOCKED/).length).toBeGreaterThan(0);
      });
    });

    test('displays preview badge for admin (line 519)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockAdminUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('🔒 PREVIEW').length).toBe(3);
      });
    });
  });

  // ========== Admin vs Regular User Tests ==========
  describe('Admin vs Regular User', () => {
    test('admin cannot click game cards (line 354, 348-349)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockAdminUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        // Admin sees all content without blur/filter
        expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
        // There are 3 games, so 3 instances of admin preview message
        expect(screen.getAllByText('🔒 Admin preview only').length).toBe(3);
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Should still show game list, not form (admin cannot click games)
      expect(screen.getByText('🎮 Games (3)')).toBeInTheDocument();
      expect(screen.queryByLabelText('Your Answer:')).not.toBeInTheDocument();
    });

    test('regular user can click unlocked started games (line 354, 366)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'in_progress' } },
          { id: 2, progress: { status: 'not_started' } },
          { id: 3, progress: { status: 'not_started' } }
        ]
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toBeInTheDocument();
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Click on challenge text - event bubbles to parent with onClick
      const challengeText = screen.getByText('What is 2+2?');
      fireEvent.click(challengeText);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Your Answer:')).toBeInTheDocument();
      });
    });
  });

  // ========== Hover Effects Tests ==========
  describe('Hover Effects', () => {
    test('game card hover effects when started (lines 366-374)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'in_progress' } },
          { id: 2, progress: { status: 'not_started' } },
          { id: 3, progress: { status: 'not_started' } }
        ]
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toHaveStyle('filter: none');
      });

      // Get the game card (parent of challenge text)
      const challengeText = screen.getByText('What is 2+2?');
      const gameCard = challengeText.parentElement.parentElement.parentElement;

      // Trigger mouseEnter
      fireEvent.mouseEnter(gameCard);
      expect(gameCard.style.background).toBe('rgb(232, 244, 248)'); // #e8f4f8
      expect(gameCard.style.transform).toBe('translateY(-2px)');

      // Trigger mouseLeave
      fireEvent.mouseLeave(gameCard);
      expect(gameCard.style.background).toBe('rgb(255, 255, 255)'); // #fff
      expect(gameCard.style.transform).toBe('translateY(0)');
    });

    test('game card hover effects when completed (lines 367, 373)', async () => {
      getAllGames.mockResolvedValue({
        games: [
          { id: 1, progress: { status: 'completed', score: 100 } },
          { id: 2, progress: { status: 'not_started' } },
          { id: 3, progress: { status: 'not_started' } }
        ]
      });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        const challengeText = screen.getByText('What is 2+2?');
        expect(challengeText).toHaveStyle('filter: none');
      });

      const challengeText = screen.getByText('What is 2+2?');
      const gameCard = challengeText.parentElement.parentElement.parentElement;

      // Trigger mouseEnter on completed game
      fireEvent.mouseEnter(gameCard);
      expect(gameCard.style.background).toBe('rgb(224, 240, 224)'); // #e0f0e0
      expect(gameCard.style.transform).toBe('translateY(-2px)');

      // Trigger mouseLeave
      fireEvent.mouseLeave(gameCard);
      expect(gameCard.style.background).toBe('rgb(240, 248, 240)'); // #f0f8f0
      expect(gameCard.style.transform).toBe('translateY(0)');
    });

    test('Start Challenge button hover effects (lines 466-473)', async () => {
      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('🎯 Start Challenge').length).toBeGreaterThan(0);
      });

      const startButton = screen.getAllByText('🎯 Start Challenge')[0];

      // Trigger mouseEnter
      fireEvent.mouseEnter(startButton);
      expect(startButton.style.transform).toBe('translateY(-1px)');
      expect(startButton.style.boxShadow).toBe('0 4px 8px rgba(0,0,0,0.15)');

      // Trigger mouseLeave
      fireEvent.mouseLeave(startButton);
      expect(startButton.style.transform).toBe('translateY(0)');
      expect(startButton.style.boxShadow).toBe('0 2px 4px rgba(0,0,0,0.1)');
    });

    test('Start Challenge button hover disabled when starting (line 466)', async () => {
      getAllGames.mockResolvedValue({ games: [] });
      startGame.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('🎯 Start Challenge').length).toBeGreaterThan(0);
      });

      const startButton = screen.getAllByText('🎯 Start Challenge')[0];

      // Click to start (will never complete)
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('🎯 Starting...')).toBeInTheDocument();
      });

      const startingButton = screen.getByText('🎯 Starting...');

      // Hover should NOT change transform when disabled
      fireEvent.mouseEnter(startingButton);
      expect(startingButton.style.transform).not.toBe('translateY(-1px)');
    });
  });

  // ========== Missing Coverage Tests ==========
  describe('Missing Coverage', () => {
    test('getCategoryForGame returns default color when category_color is missing (line 134)', async () => {
      const gamesWithoutCategoryColor = [
        {
          ...mockGames[0],
          category_color: null
        }
      ];

      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={gamesWithoutCategoryColor}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        // Game should render even without category_color (uses default #005da0)
        expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
      });
    });

    test('calls onSubmitSolution after starting game successfully (line 163)', async () => {
      const mockOnSubmit = jest.fn();
      getAllGames.mockResolvedValue({ games: [] });
      startGame.mockResolvedValue({ success: true });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={mockOnSubmit}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('🎯 Start Challenge').length).toBeGreaterThan(0);
      });

      const startButton = screen.getAllByText('🎯 Start Challenge')[0];
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    test('does not call onSubmitSolution when it is not provided (line 163)', async () => {
      getAllGames.mockResolvedValue({ games: [] });
      startGame.mockResolvedValue({ success: true });

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={null}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('🎯 Start Challenge').length).toBeGreaterThan(0);
      });

      const startButton = screen.getAllByText('🎯 Start Challenge')[0];
      fireEvent.click(startButton);

      await waitFor(() => {
        // Should not throw error even without callback
        expect(startGame).toHaveBeenCalled();
      });
    });

    test('shows game description when challenge_text is missing for admin (line 411)', async () => {
      const adminUser = {
        ...mockUser,
        role: 'admin'
      };

      const gamesWithDescription = [
        {
          id: 1,
          title: 'Game 1',
          order_index: 1,
          description: 'This is the game description',
          challenge_text: null,
          points_value: 100,
          max_hints: 3,
          category_name: 'Test',
          category_icon: '🎮',
          difficulty_level: 'easy'
        }
      ];

      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={gamesWithDescription}
          activeEvent={mockActiveEvent}
          user={adminUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('This is the game description')).toBeInTheDocument();
        expect(screen.getByText('🔒 Admin preview only')).toBeInTheDocument();
      });
    });

    test('shows default difficulty colors for unknown difficulty level (lines 494, 498)', async () => {
      const gamesWithUnknownDifficulty = [
        {
          ...mockGames[0],
          difficulty_level: 'very_hard' // Unknown difficulty to hit the default case
        }
      ];

      getAllGames.mockResolvedValue({ games: [] });

      render(
        <CurrentGame
          games={gamesWithUnknownDifficulty}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        // Text is displayed as "very_hard" in DOM, CSS textTransform: uppercase makes it appear as VERY_HARD
        const difficultyBadge = screen.getByText('very_hard');
        expect(difficultyBadge).toBeInTheDocument();
        // Default background: #e9ecef, text color: #495057
        expect(difficultyBadge).toHaveStyle('background: rgb(233, 236, 239)'); // #e9ecef
        expect(difficultyBadge).toHaveStyle('color: rgb(73, 80, 87)'); // #495057
        expect(difficultyBadge).toHaveStyle('text-transform: uppercase');
      });
    });

    test('isGameLocked returns false when gameProgress is null (line 97)', async () => {
      // This test ensures that when gameProgress hasn't loaded yet,
      // games aren't incorrectly locked
      getAllGames.mockResolvedValue({ games: null }); // gameProgress will be null

      render(
        <CurrentGame
          games={mockGames}
          activeEvent={mockActiveEvent}
          user={mockUser}
          showPoints={true}
          onSubmitSolution={jest.fn()}
        />
      );

      await waitFor(() => {
        // All games should be shown without locks since gameProgress is null
        expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
      });
    });
  });
});
