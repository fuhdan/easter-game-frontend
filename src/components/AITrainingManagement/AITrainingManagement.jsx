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
 * - Only accessible to super_admin role
 *
 * @module components/AITrainingManagement
 * @since 2025-11-16
 * @updated 2025-11-20 - Refactored into smaller components
 */

import React, { useState, useEffect } from 'react';
import './AITrainingManagement.css';
import {
  getHintsByGame, getEvents,
  getCategories, getAllGames
} from '../../services';
import EventManagement from './EventManagement/EventManagement';
import GameManagement from './GameManagement/GameManagement';
import HintManagement from './HintManagement/HintManagement';

function AITrainingManagement({ initialTab = 'events', showTabs = true }) {
  // State management
  const [activeTab, setActiveTab] = useState(initialTab);
  const [games, setGames] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load all data on component mount
   */
  useEffect(() => {
    loadAllData();
  }, []);

  /**
   * Fetch all data from backend
   */
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load games, events, categories, prompts, and hints in parallel
      const [gamesData, hintsData, eventsData, categoriesData] = await Promise.all([
        getAllGames(false),
        getHintsByGame(),
        getEvents(),
        getCategories()
      ]);

      // Merge game data with hint counts
      const gamesWithHints = (gamesData.games || []).map(game => {
        const hintData = hintsData.games?.find(g => g.game_id === game.id);
        return {
          ...game,
          hints: hintData?.hints || []
        };
      });

      setGames(gamesWithHints);
      setEvents(eventsData || []);
      setCategories(categoriesData.categories || []);

      console.log(`Loaded ${gamesWithHints.length} games, ${eventsData?.length || 0} events, ${categoriesData.categories?.length || 0} categories`);
    } catch (error) {
      console.error('Failed to load AI training data:', error);
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

export default AITrainingManagement;
