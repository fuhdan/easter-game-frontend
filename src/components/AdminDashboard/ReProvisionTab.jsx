/**
 * Component: ReProvisionTab
 * Purpose: Re-provision access triggers for teams playing games
 * Part of: Easter Quest 2025 Frontend - Game Admin Dashboard
 *
 * This component allows admins to re-run provision triggers when game
 * containers are recreated. It lists games with triggers and shows which
 * teams are currently playing (in_progress status).
 *
 * Use case:
 * - Game container is recreated (SSH server, web app, etc.)
 * - Teams lose access (SSH keys gone, users deleted, etc.)
 * - Admin uses this to re-provision access for all affected teams
 *
 * @module components/AdminDashboard/ReProvisionTab
 * @since 2026-03-29
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { buildApiUrl } from '../../config/apiConfig';
import { logger } from '../../utils/logger';
import './ReProvisionTab.css';

function ReProvisionTab({ user }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [provisioning, setProvisioning] = useState({});
  const [results, setResults] = useState({});

  useEffect(() => {
    loadGamesWithTriggers();
  }, []);

  /**
   * Load all games with provision triggers and their in_progress team counts.
   * @async
   */
  const loadGamesWithTriggers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all games
      const gamesResponse = await fetch(buildApiUrl('admin/content/games'), {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!gamesResponse.ok) {
        throw new Error('Failed to fetch games');
      }

      const gamesData = await gamesResponse.json();

      // Fetch all rewards with triggers
      const triggersResponse = await fetch(buildApiUrl('admin/rewards/provision-triggers'), {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!triggersResponse.ok) {
        throw new Error('Failed to fetch triggers');
      }

      const triggersData = await triggersResponse.json();

      // Map games to their triggers
      const gameTriggersMap = {};
      triggersData.provision_triggers.forEach(trigger => {
        const gameId = trigger.trigger_on_game_id;
        if (!gameTriggersMap[gameId]) {
          gameTriggersMap[gameId] = [];
        }
        gameTriggersMap[gameId].push(trigger);
      });

      // Filter games that have triggers and fetch in_progress counts
      const gamesWithTriggers = await Promise.all(
        gamesData.games
          .filter(game => gameTriggersMap[game.id])
          .map(async (game) => {
            // Fetch teams with in_progress status for this game using existing analytics endpoint
            const progressResponse = await fetch(
              buildApiUrl(`admin/dashboard/games/${game.id}/details`),
              {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
              }
            );

            let inProgressTeams = [];
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              // Filter for in_progress status from team_breakdown
              inProgressTeams = progressData.team_breakdown
                .filter(team => team.status === 'in_progress')
                .map(team => ({
                  team_id: team.team_id,
                  team_name: team.team_name
                }));
            }

            return {
              ...game,
              triggers: gameTriggersMap[game.id],
              inProgressTeams: inProgressTeams,
              inProgressCount: inProgressTeams.length
            };
          })
      );

      setGames(gamesWithTriggers);
      logger.info('reprovision_games_loaded', {
        gamesCount: gamesWithTriggers.length,
        module: 'ReProvisionTab'
      });
    } catch (err) {
      logger.error('reprovision_games_load_failed', {
        errorMessage: err.message,
        module: 'ReProvisionTab'
      }, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Re-provision access for all in_progress teams for a specific game.
   * @async
   * @param {number} gameId - Game ID to re-provision
   * @param {Array} teams - Teams to provision (with team_id)
   */
  const handleReProvisionGame = async (gameId, teams) => {
    if (teams.length === 0) {
      return;
    }

    setProvisioning(prev => ({ ...prev, [gameId]: true }));
    setResults(prev => ({ ...prev, [gameId]: null }));

    try {
      const provisionResults = [];

      // Call provision endpoint for each team
      for (const team of teams) {
        try {
          const response = await fetch(
            buildApiUrl(`admin/content/games/${gameId}/provision-team/${team.team_id}`),
            {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            }
          );

          if (response.ok) {
            const data = await response.json();
            provisionResults.push({
              team_id: team.team_id,
              team_name: team.team_name,
              success: true,
              provisioned_count: data.provisioned_rewards.length
            });
          } else {
            const errorData = await response.json();
            provisionResults.push({
              team_id: team.team_id,
              team_name: team.team_name,
              success: false,
              error: errorData.detail || 'Unknown error'
            });
          }
        } catch (err) {
          provisionResults.push({
            team_id: team.team_id,
            team_name: team.team_name,
            success: false,
            error: err.message
          });
        }
      }

      setResults(prev => ({ ...prev, [gameId]: provisionResults }));

      const successCount = provisionResults.filter(r => r.success).length;
      const failCount = provisionResults.length - successCount;

      logger.info('reprovision_completed', {
        gameId,
        totalTeams: provisionResults.length,
        successCount,
        failCount,
        module: 'ReProvisionTab'
      });

    } catch (err) {
      logger.error('reprovision_failed', {
        gameId,
        errorMessage: err.message,
        module: 'ReProvisionTab'
      }, err);
      setResults(prev => ({ ...prev, [gameId]: [] }));
    } finally {
      setProvisioning(prev => ({ ...prev, [gameId]: false }));
    }
  };

  /**
   * Render results for a specific game
   */
  const renderResults = (gameId) => {
    const gameResults = results[gameId];
    if (!gameResults) return null;

    const successCount = gameResults.filter(r => r.success).length;
    const failCount = gameResults.length - successCount;

    return (
      <div className="provision-results">
        <h4>📊 Provisioning Results</h4>
        <div className="results-summary">
          <span className="success-count">✓ {successCount} succeeded</span>
          {failCount > 0 && <span className="fail-count">✗ {failCount} failed</span>}
        </div>
        <table className="results-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {gameResults.map(result => (
              <tr key={result.team_id} className={result.success ? 'success' : 'failure'}>
                <td>{result.team_name}</td>
                <td>{result.success ? '✅ Success' : '❌ Failed'}</td>
                <td>
                  {result.success
                    ? `${result.provisioned_count} triggers executed`
                    : result.error
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading games with triggers...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">❌ {error}</div>
        <button onClick={loadGamesWithTriggers} className="retry-btn">
          🔄 Retry
        </button>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="empty-state">
        <p>ℹ️ No games with provision triggers configured.</p>
        <p className="help-text">
          Provision triggers are configured in System Admin → Events when editing rewards.
        </p>
      </div>
    );
  }

  return (
    <div className="reprovision-tab">
      <div className="tab-header">
        <h2>🔄 Re-provision Game Access</h2>
        <p className="tab-description">
          Re-run provision triggers when game containers are recreated.
          This restores access (SSH keys, credentials, etc.) for teams currently playing.
        </p>
        <button onClick={loadGamesWithTriggers} className="refresh-btn" disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      <div className="games-list">
        {games.map(game => {
          const gameResults = results[game.id];
          let statusClass = '';
          if (gameResults) {
            const successCount = gameResults.filter(r => r.success).length;
            const failCount = gameResults.length - successCount;
            if (failCount > 0) {
              statusClass = 'status-failed';
            } else if (successCount > 0) {
              statusClass = 'status-success';
            }
          }

          return (
          <div key={game.id} className={`game-card ${statusClass}`}>
            <div className="game-header">
              <h3>{game.title}</h3>
              <span className="game-id">ID: {game.id}</span>
            </div>

            <div className="game-info">
              <div className="info-item">
                <span className="label">Triggers:</span>
                <span className="value">{game.triggers.length}</span>
              </div>
              <div className="info-item">
                <span className="label">Teams in progress:</span>
                <span className="value">{game.inProgressCount}</span>
              </div>
            </div>

            {game.inProgressTeams.length > 0 && (
              <div className="teams-list">
                <p className="teams-label">Teams to provision:</p>
                <ul>
                  {game.inProgressTeams.map(team => (
                    <li key={team.team_id}>{team.team_name}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              className="reprovision-btn"
              onClick={() => handleReProvisionGame(game.id, game.inProgressTeams)}
              disabled={provisioning[game.id] || game.inProgressCount === 0}
            >
              {provisioning[game.id]
                ? '⏳ Provisioning...'
                : `🔄 Re-provision (${game.inProgressCount} teams)`
              }
            </button>

            {renderResults(game.id)}
          </div>
          );
        })}
      </div>
    </div>
  );
}

ReProvisionTab.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired
  }).isRequired
};

export default ReProvisionTab;
