/**
 * Component: GamesAnalyticsTab
 * Purpose: Display comprehensive game analytics for admin dashboard
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - Overview statistics (total games, avg completion, most popular/difficult)
 * - Per-game analytics table (completion rates, times, hints, ratings)
 * - Game details modal/panel (team breakdown, rating distribution)
 * - Needs attention highlighting for struggling teams
 * - Team-based metrics (not individual players)
 * - Real-time data fetching with loading/error states
 *
 * @since 2025-11-21
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  getGameStatistics,
  getPerGameAnalytics,
  getGameAdminDetails
} from '../../services/admin';
import { logger } from '../../utils/logger';
import './GamesAnalyticsTab.css';

/**
 * Games Analytics tab component for admin dashboard
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
const GamesAnalyticsTab = () => {
  const [statistics, setStatistics] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameDetails, setGameDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('game_id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [expandedTeams, setExpandedTeams] = useState(new Set());

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  /**
   * Fetch statistics and analytics data from API
   * @async
   */
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsResponse, analyticsResponse] = await Promise.all([
        getGameStatistics(),
        getPerGameAnalytics()
      ]);

      setStatistics(statsResponse.stats);
      setAnalytics(analyticsResponse.games);
    } catch (err) {
      logger.error('games_analytics_fetch_failed', {
        errorMessage: err.message,
        module: 'GamesAnalyticsTab'
      }, err);
      setError(err.message || 'Failed to load game analytics');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch detailed data for a specific game
   * @async
   * @param {number} gameId - Game ID
   */
  const fetchGameDetails = async (gameId) => {
    setDetailsLoading(true);
    setSelectedGame(gameId);

    try {
      const response = await getGameAdminDetails(gameId);
      setGameDetails(response);
    } catch (err) {
      logger.error('game_details_fetch_failed', {
        gameId,
        errorMessage: err.message,
        module: 'GamesAnalyticsTab'
      }, err);
      setError(err.message || 'Failed to load game details');
    } finally {
      setDetailsLoading(false);
    }
  };

  /**
   * Close game details modal
   */
  const closeDetails = () => {
    setSelectedGame(null);
    setGameDetails(null);
    setExpandedTeams(new Set()); // Reset expanded teams when closing
  };

  /**
   * Toggle team details expansion
   * @param {number} teamId - Team ID to toggle
   */
  const toggleTeamExpansion = (teamId) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  /**
   * Sort analytics data
   * @param {string} field - Field to sort by
   */
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  /**
   * Get sorted analytics data
   * @returns {Array} Sorted analytics array
   */
  const getSortedAnalytics = () => {
    if (!analytics || analytics.length === 0) return [];

    const sorted = [...analytics].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle null/undefined values
      if (aValue == null) aValue = 0;
      if (bValue == null) bValue = 0;

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  };

  /**
   * Render overview statistics section
   * @returns {JSX.Element}
   */
  const renderOverview = () => {
    if (!statistics) return null;

    const {
      total_games,
      avg_completion_rate,
      most_popular,
      most_difficult,
      games_needing_attention
    } = statistics;

    return (
      <div className="analytics-overview">
        <div className="overview-card">
          <div className="overview-icon">🎮</div>
          <div className="overview-value">{total_games}</div>
          <div className="overview-label">Total Games</div>
        </div>

        <div className="overview-card">
          <div className="overview-icon">📊</div>
          <div className="overview-value">{avg_completion_rate}%</div>
          <div className="overview-label">Avg Completion</div>
        </div>

        <div className="overview-card highlight-success">
          <div className="overview-icon">⭐</div>
          <div className="overview-value">{most_popular?.title || 'N/A'}</div>
          <div className="overview-label">
            Most Popular ({most_popular?.completion_rate}%)
          </div>
        </div>

        <div className="overview-card highlight-warning">
          <div className="overview-icon">🔧</div>
          <div className="overview-value">{most_difficult?.title || 'N/A'}</div>
          <div className="overview-label">
            Most Difficult ({most_difficult?.completion_rate}%)
          </div>
        </div>

        {games_needing_attention && games_needing_attention.length > 0 && (
          <div className="overview-card highlight-danger">
            <div className="overview-icon">⚠️</div>
            <div className="overview-value">{games_needing_attention.length}</div>
            <div className="overview-label">Need Attention</div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render per-game analytics table
   * @returns {JSX.Element}
   */
  const renderAnalyticsTable = () => {
    const sortedData = getSortedAnalytics();

    if (sortedData.length === 0) {
      return (
        <div className="empty-state">
          <p>No game analytics available.</p>
        </div>
      );
    }

    return (
      <div className="data-table">
        <div className="table-header">
          <div onClick={() => handleSort('title')}>
            GAME {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div onClick={() => handleSort('completion_rate')}>
            COMPLETION {sortBy === 'completion_rate' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div onClick={() => handleSort('avg_time_minutes')}>
            AVG TIME {sortBy === 'avg_time_minutes' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div onClick={() => handleSort('total_hints_used')}>
            HINTS {sortBy === 'total_hints_used' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div onClick={() => handleSort('avg_rating')}>
            RATING {sortBy === 'avg_rating' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div onClick={() => handleSort('stuck_teams')}>
            STUCK {sortBy === 'stuck_teams' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div>ACTIONS</div>
        </div>

        <div className="table-body">
          {sortedData.map((game) => (
            <div
              key={game.game_id}
              className={`table-row ${game.needs_attention ? 'needs-attention' : ''}`}
            >
              <div data-label="Game">
                <div className="game-title-cell">
                  {game.category_icon && (
                    <span className="category-icon">{game.category_icon}</span>
                  )}
                  <div>
                    <strong>#{game.game_id} {game.title}</strong>
                    {game.category_name && (
                      <div className="category-name">{game.category_name}</div>
                    )}
                  </div>
                </div>
              </div>

              <div data-label="Completion">
                <div className="completion-cell">
                  <div className="progress-bar-mini">
                    <div
                      className="progress-fill-mini"
                      style={{ width: `${game.completion_rate}%` }}
                    ></div>
                  </div>
                  <span className="completion-text">
                    {game.completion_rate}% ({game.completed_teams}/{game.total_teams})
                  </span>
                </div>
              </div>

              <div data-label="Avg Time">
                {game.avg_time_minutes > 0
                  ? `${Math.floor(game.avg_time_minutes / 60)}h ${game.avg_time_minutes % 60}m`
                  : '-'}
              </div>

              <div data-label="Hints">
                <span className="hints-badge">
                  {game.total_hints_used} (avg: {game.avg_hints_per_team})
                </span>
              </div>

              <div data-label="Rating">
                {game.rating_count > 0 ? (
                  <span className="rating-value">
                    ⭐ {game.avg_rating} ({game.rating_count})
                  </span>
                ) : (
                  <span className="text-muted">No ratings</span>
                )}
              </div>

              <div data-label="Stuck">
                {game.stuck_teams > 0 ? (
                  <span className="stuck-badge">{game.stuck_teams} teams</span>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </div>

              <div data-label="Actions">
                <button
                  className="btn-details"
                  onClick={() => fetchGameDetails(game.game_id)}
                  aria-label={`View details for ${game.title}`}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render game details modal
   * @returns {JSX.Element|null}
   */
  const renderDetailsModal = () => {
    if (!selectedGame || !gameDetails) return null;

    const { game, team_breakdown, rating_distribution, comments } = gameDetails;

    return (
      <div className="modal-overlay" onClick={closeDetails}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{game.title} - Detailed Analytics</h3>
            <button className="modal-close" onClick={closeDetails}>
              ✕
            </button>
          </div>

          <div className="modal-body">
            {/* Game Info */}
            <div className="details-section">
              <h4>Game Information</h4>
              <p><strong>Description:</strong> {game.description}</p>
              <p><strong>Difficulty:</strong> {game.difficulty_level || 'Not set'}</p>
              <p><strong>Points:</strong> {game.points_value}</p>
              <p><strong>Max Hints:</strong> {game.max_hints}</p>
            </div>

            {/* Team Breakdown */}
            <div className="details-section">
              <h4>Team Completion Breakdown</h4>
              <div className="team-breakdown-table">
                {team_breakdown.map((team) => {
                  const isExpanded = expandedTeams.has(team.team_id);
                  const hasCompletions = team.completions && team.completions.length > 0;
                  // Get the first completion (the person who actually submitted the answer)
                  const submitter = hasCompletions ? team.completions[0] : null;

                  return (
                    <div key={team.team_id} className="team-breakdown-wrapper">
                      <div
                        className={`team-breakdown-row ${hasCompletions ? 'clickable' : ''}`}
                        onClick={() => hasCompletions && toggleTeamExpansion(team.team_id)}
                        style={{ cursor: hasCompletions ? 'pointer' : 'default' }}
                      >
                        <span className="team-name">
                          {hasCompletions && (
                            <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                          )}
                          {team.team_name}
                        </span>
                        <span className={`team-status status-${team.status}`}>
                          {team.status === 'completed' ? '✓ Complete' : '○ Not Started'}
                        </span>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && hasCompletions && submitter && (
                        <div className="team-details-expanded">
                          <div className="completions-list">
                            <h5>Submitted by:</h5>
                            <div className="completion-item">
                              <div className="completion-header">
                                <strong>{submitter.username}</strong>
                                <span className="completion-date">
                                  {new Date(submitter.completed_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="completion-details">
                                <span>⏱️ {submitter.time_spent_minutes} min</span>
                                <span>💡 {submitter.hints_used} hints</span>
                                <span>⭐ {submitter.score} pts</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="details-section">
              <h4>Rating Distribution</h4>
              <div className="rating-bars">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="rating-bar-row">
                    <span className="star-label">{star} ⭐</span>
                    <div className="rating-bar-bg">
                      <div
                        className="rating-bar-fill"
                        style={{
                          width: `${(rating_distribution[star] / Math.max(...Object.values(rating_distribution), 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="rating-count">{rating_distribution[star]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Comments */}
            {comments && comments.length > 0 && (
              <div className="details-section">
                <h4>Recent Comments</h4>
                <div className="comments-list">
                  {comments.map((comment, idx) => (
                    <div key={idx} className="comment-item">
                      <div className="comment-rating">⭐ {comment.rating}/5</div>
                      <div className="comment-text">{comment.comment}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn-primary" onClick={closeDetails}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="games-analytics-tab">
        <div className="card-header">🎯 Games Analytics</div>
        <div className="card-body">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading game analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="games-analytics-tab">
        <div className="card-header">🎯 Games Analytics</div>
        <div className="card-body">
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button className="btn-primary" onClick={fetchAnalyticsData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="games-analytics-tab">
      <div className="card-header">
        🎯 Games Analytics
        <button
          className="refresh-btn"
          onClick={fetchAnalyticsData}
          title="Refresh analytics"
          aria-label="Refresh game analytics"
        >
          🔄
        </button>
      </div>

      <div className="card-body">
        {renderOverview()}
        {renderAnalyticsTable()}
      </div>

      {detailsLoading && (
        <div className="modal-overlay">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading game details...</p>
          </div>
        </div>
      )}

      {renderDetailsModal()}
    </div>
  );
};

GamesAnalyticsTab.propTypes = {};

export default GamesAnalyticsTab;
