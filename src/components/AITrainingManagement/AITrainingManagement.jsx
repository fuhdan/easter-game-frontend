/**
 * Component: AITrainingManagement
 * Purpose: Main container for AI training content management
 * Part of: Easter Quest 2025 Frontend - System Administration
 *
 * Features:
 * - Tab navigation for Events, Games, and Hints
 * - Data loading and state management
 * - Coordination between child components
 *
 * Security:
 * - Only accessible to admin role
 *
 * @module components/AITrainingManagement
 * @since 2025-11-16
 * @updated 2025-11-20 - Refactored into smaller components
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './AITrainingManagement.css';
import {
  getHintsByGame, getEvents,
  getCategories, getAllGames
} from '../../services';
import { getGamesByYear, getHintsByYear } from '../../services/aiTraining';
import EventManagement from './EventManagement/EventManagement';
import GameManagement from './GameManagement/GameManagement';
import HintManagement from './HintManagement/HintManagement';
import { logger } from '../../utils/logger';

function AITrainingManagement({ initialTab = 'events', showTabs = true, eventYear = null }) {
  // State management
  const [activeTab, setActiveTab] = useState(initialTab);
  const [games, setGames] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load all data on component mount and when eventYear changes
   */
  useEffect(() => {
    loadAllData();
  }, [eventYear]);

  /**
   * Fetch all data from backend
   * If eventYear is provided, loads games and hints from that specific event's database
   */
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load games (from specific event year or all games)
      let gamesData;
      let hintsData;

      if (eventYear) {
        // MULTI-DATABASE: Load games and hints from specific event year's database
        logger.debug('Loading games and hints from event year database', { eventYear });
        const [gamesArray, hintsResponse] = await Promise.all([
          getGamesByYear(eventYear),
          getHintsByYear(eventYear)
        ]);
        gamesData = { games: gamesArray };
        hintsData = hintsResponse;
      } else {
        // Load all games and hints from active database
        [gamesData, hintsData] = await Promise.all([
          getAllGames(false),
          getHintsByGame()
        ]);
      }

      // Load events and categories in parallel
      const [eventsData, categoriesData] = await Promise.all([
        getEvents(),
        getCategories()
      ]);

      // Merge game data with hint counts
      // MULTI-DATABASE: Handle different data structures
      // - When eventYear is null: hintsData is an array directly
      // - When eventYear is set: hintsData is { games: [...] }
      const hintsArray = eventYear ? (hintsData.games || []) : (hintsData || []);

      const gamesWithHints = (gamesData.games || []).map(game => {
        const hintData = hintsArray.find(g => g.game_id === game.id);
        return {
          ...game,
          hints: hintData?.hints || []
        };
      });

      setGames(gamesWithHints);
      setEvents(eventsData || []);
      setCategories(categoriesData.categories || []);

      logger.debug('ai_training_data_loaded', {
        gamesCount: gamesWithHints.length,
        eventsCount: eventsData?.length || 0,
        categoriesCount: categoriesData.categories?.length || 0,
        eventYear: eventYear || 'all',
        module: 'AITrainingManagement'
      });
    } catch (error) {
      logger.error('ai_training_data_load_failed', {
        errorMessage: error.message,
        eventYear: eventYear || 'all',
        module: 'AITrainingManagement'
      }, error);
      setError('Failed to load AI training data. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle tab change
   */
  const handleTabChange = async (tab) => {
    setActiveTab(tab);
  };

  // Loading state
  if (loading) {
    return <div className="loading">Loading AI training management...</div>;
  }

  // Error state
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="ai-training-management">
      {/* Main Card */}
      <div className="ai-training-card">
        <div className="card-header">
          🤖 AI Training Content Management
          <div className="header-actions">
            <button className="btn-header-action" onClick={loadAllData}>
              🔄 Reload
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Tab Navigation */}
          {showTabs && (
            <div className="tab-navigation">
              <button
                className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => handleTabChange('events')}
              >
                📖 Event Story
              </button>
              <button
                className={`tab-btn ${activeTab === 'games' ? 'active' : ''}`}
                onClick={() => handleTabChange('games')}
              >
                🎮 Games
              </button>
              <button
                className={`tab-btn ${activeTab === 'hints' ? 'active' : ''}`}
                onClick={() => handleTabChange('hints')}
              >
                💡 Training Hints
              </button>
            </div>
          )}

          {/* Event Story Tab */}
          {activeTab === 'events' && (
            <EventManagement
              events={events}
              onEventsChanged={loadAllData}
            />
          )}

          {/* Games Tab */}
          {activeTab === 'games' && (
            <GameManagement
              games={games}
              events={events}
              categories={categories}
              onGamesChanged={loadAllData}
            />
          )}

          {/* Training Hints Tab */}
          {activeTab === 'hints' && (
            <HintManagement
              games={games}
              onHintsChanged={loadAllData}
            />
          )}
        </div>
      </div>
    </div>
  );
}

AITrainingManagement.propTypes = {
  initialTab: PropTypes.string,
  showTabs: PropTypes.bool,
  eventYear: PropTypes.number
};

export default AITrainingManagement;
