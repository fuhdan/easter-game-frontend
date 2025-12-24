/**
 * Component: TeamProgress
 * Purpose: Display team's aggregate progress on all games in active event
 * Part of: Easter Quest 2025 Frontend
 *
 * Features:
 * - Team-based progress display (not individual members)
 * - Per-game completion status
 * - Total score and progress percentage
 * - Current game highlighting
 * - Real-time updates via SSE
 *
 * Team-based gameplay:
 * - When ANY member completes a game, entire team completes it
 * - Displays best scores and total hints used by team
 * - Individual contributors hidden for privacy
 *
 * @component
 * @param {Object} props - Component props
 * @param {number} props.teamId - Current user's team ID
 * @param {number} props.eventId - Active event ID (optional)
 * @param {number} props.currentGameId - User's current game ID (optional, for highlighting)
 *
 * @since 2025-11-21
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { getMyTeamProgress } from '../../services/teams';

const TeamProgress = ({ user, teamId, eventId, currentGameId, showPoints = true, refreshKey }) => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Skip API call for admin users
    if (user && user.role === 'admin') {
      setLoading(false);
      return;
    }
    fetchTeamProgress();
  }, [teamId, eventId, user, refreshKey]);

  /**
   * Fetch team progress from API
   */
  const fetchTeamProgress = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getMyTeamProgress();
      setProgressData(data);
    } catch (err) {
      logger.error('Error fetching team progress:', err);
      setError(
        err.response?.status === 403
          ? 'You must be assigned to a team to view progress'
          : 'Failed to load team progress. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get status badge component based on game status
   *
   * @param {string} status - Game status (completed|in_progress|not_started|locked)
   * @returns {JSX.Element} Status badge
   */
  const getStatusBadge = (status) => {
    const badges = {
      completed: { icon: '✓', text: 'Complete', className: 'status-solved' },
      in_progress: { icon: '⏳', text: 'In Progress', className: 'status-current' },
      not_started: { icon: '▶️', text: 'Available', className: 'status-available' },
      locked: { icon: '🔒', text: 'Locked', className: 'status-locked' }
    };

    const badge = badges[status] || badges.locked;

    return (
      <span className={`status-badge ${badge.className}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  /**
   * Render progress table with all games
   *
   * @returns {JSX.Element} Progress table
   */
  const renderProgressTable = () => {
    if (!progressData?.games || progressData.games.length === 0) {
      return (
        <div className="empty-state">
          <p>No games available in this event.</p>
        </div>
      );
    }

    return (
      <table className="table team-progress-table">
        <thead>
          <tr>
            <th>Game</th>
            <th>Status</th>
            {showPoints && <th>Score</th>}
            <th>Hints</th>
          </tr>
        </thead>
        <tbody>
          {progressData.games.map((game) => {
            // Highlight current game if user is working on it
            const isCurrentGame =
              currentGameId === game.game_id ||
              game.user_status === 'in_progress';

            return (
              <tr
                key={game.game_id}
                className={isCurrentGame ? 'current-game' : ''}
              >
                <td>
                  <div className="game-info">
                    {game.category_icon && (
                      <span className="category-icon">{game.category_icon}</span>
                    )}
                    <strong>Game {game.order_index}</strong>
                    {game.category_name && (
                      <div className="category-name">{game.category_name}</div>
                    )}
                  </div>
                </td>
                <td>{getStatusBadge(game.status)}</td>
                {showPoints && (
                  <td>
                    {game.status === 'completed' ? (
                      <strong>{game.best_score} pts</strong>
                    ) : game.status === 'in_progress' ? (
                      <span className="text-muted">{game.best_score} pts</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                )}
                <td>
                  {game.total_hints_used > 0 ? (
                    <span className="hints-used">{game.total_hints_used}</span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  /**
   * Render summary section with total score and progress bar
   *
   * @returns {JSX.Element} Summary section
   */
  const renderSummary = () => {
    if (!progressData?.summary) return null;

    const { total_score, completed_games, total_games, progress_percentage } =
      progressData.summary;

    return (
      <div className="team-progress-summary">
        {showPoints && (
          <div className="total-score">
            <div className="score-value">{total_score} pts</div>
            <div className="score-label">Total Score</div>
          </div>
        )}

        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress_percentage}%` }}
              aria-valuenow={progress_percentage}
              aria-valuemin="0"
              aria-valuemax="100"
              role="progressbar"
            ></div>
          </div>
          <div className="progress-text">
            {progress_percentage}% Complete - {completed_games} of {total_games} games
            finished
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="card team-progress-card">
        <div className="card-header">
          <h3 className="card-title">👥 Team Progress</h3>
        </div>
        <div className="card-body">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading team progress...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="card team-progress-card">
        <div className="card-header">
          <h3 className="card-title">👥 Team Progress</h3>
        </div>
        <div className="card-body">
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button className="btn btn-primary" onClick={fetchTeamProgress}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin view - show info message instead of team progress
  if (user && user.role === 'admin') {
    return (
      <div className="card team-progress-card">
        <div className="card-header">
          <h3 className="card-title">👥 Team Progress</h3>
        </div>
        <div className="card-body">
          <div className="info-state" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #c3e6cb',
              marginBottom: '10px'
            }}>
              <strong>ℹ️ Admin View</strong>
              <p style={{ margin: '10px 0 0 0' }}>
                Admins do not have team-specific progress tracking.
                Use the Game Admin Dashboard to monitor all teams.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="card team-progress-card">
      <div className="card-header">
        <h3 className="card-title">
          👥 {progressData?.team?.name || 'Team'} Progress
        </h3>
      </div>
      <div className="card-body">
        {renderProgressTable()}
        {renderSummary()}
      </div>
    </div>
  );
};

export default TeamProgress;
