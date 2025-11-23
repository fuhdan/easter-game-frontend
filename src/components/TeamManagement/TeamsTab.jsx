/**
 * Component: TeamsTab
 * Purpose: Display teams based on user role
 * Part of: Easter Quest Frontend - Team Management Module
 *
 * Features:
 * - Admin/game_admin: Show all teams with all members
 * - Team captain: Show only their team with members
 * - Team statistics and member details
 * - Department distribution (admin view)
 * - Captain highlighting
 *
 * @module components/TeamManagement
 * @since 2025-11-23
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getAllTeams, getMyTeamPlayers } from '../../services';
import './TeamsTab.css';

/**
 * TeamsTab component - Display teams based on user role
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - Current authenticated user
 * @param {string} props.user.role - User role (admin, game_admin, team_captain)
 * @param {number} [props.user.team_id] - Team ID (for captains)
 * @param {string} [props.user.team_name] - Team name (for captains)
 * @returns {JSX.Element} Teams display interface
 *
 * @example
 * <TeamsTab user={currentUser} />
 */
function TeamsTab({ user }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user.role === 'admin' || user.role === 'game_admin';
  const isCaptain = user.role === 'team_captain';

  /**
   * Load teams based on user role
   */
  useEffect(() => {
    loadTeams();
  }, [user.role]);

  /**
   * Fetch teams from backend
   */
  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isAdmin) {
        // Admin/game_admin: Load all teams
        const response = await getAllTeams();

        // Filter out system teams
        const displayTeams = (response.teams || []).filter(team => !team.is_system_team);
        setTeams(displayTeams);
      } else if (isCaptain) {
        // Team captain: Load only their team
        const response = await getMyTeamPlayers();

        if (response.team) {
          // Convert to same format as getAllTeams
          setTeams([{
            id: response.team.id,
            name: response.team.name,
            leader_id: response.team.leader_id,
            members: response.players || []
          }]);
        } else {
          setTeams([]);
        }
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
      setError('Failed to load teams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate team statistics (admin view only)
   */
  const calculateStats = () => {
    if (teams.length === 0) {
      return {
        totalTeams: 0,
        totalPlayers: 0,
        avgTeamSize: 0,
        minTeamSize: 0,
        maxTeamSize: 0,
        departmentDistribution: {}
      };
    }

    const totalPlayers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
    const teamSizes = teams.map(team => team.members?.length || 0);
    const minTeamSize = Math.min(...teamSizes);
    const maxTeamSize = Math.max(...teamSizes);
    const avgTeamSize = totalPlayers > 0 ? (totalPlayers / teams.length) : 0;

    // Calculate department distribution
    const departmentDistribution = {};
    teams.forEach(team => {
      (team.members || []).forEach(member => {
        const dept = member.department || 'Unassigned';
        departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
      });
    });

    return {
      totalTeams: teams.length,
      totalPlayers,
      avgTeamSize: Math.round(avgTeamSize * 10) / 10,
      minTeamSize,
      maxTeamSize,
      departmentDistribution
    };
  };

  /**
   * Check if member is team captain
   */
  const isMemberCaptain = (member, team) => {
    return team.leader_id && member.id === team.leader_id;
  };

  // Loading state
  if (loading) {
    return (
      <div className="teams-tab-loading">
        <div className="loading-spinner"></div>
        <p>Loading teams...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="teams-tab-error">
        <p>{error}</p>
        <button className="btn-retry" onClick={loadTeams}>
          🔄 Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (teams.length === 0) {
    return (
      <div className="teams-tab-empty">
        <div className="empty-icon">👥</div>
        <h3>No Teams Found</h3>
        <p>
          {isCaptain
            ? 'You are not assigned to a team yet.'
            : 'No teams have been created yet.'}
        </p>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="teams-tab">
      {/* Team Statistics - Admin only */}
      {isAdmin && (
        <div className="teams-stats-section">
          <h3>Team Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{stats.totalTeams}</span>
              <span className="stat-label">Teams</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.totalPlayers}</span>
              <span className="stat-label">Players</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.avgTeamSize}</span>
              <span className="stat-label">Avg Size</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.minTeamSize}-{stats.maxTeamSize}</span>
              <span className="stat-label">Size Range</span>
            </div>
          </div>

          {/* Department Distribution */}
          {Object.keys(stats.departmentDistribution).length > 1 && (
            <div className="department-distribution">
              <h4>Department Distribution:</h4>
              <div className="dept-stats">
                {Object.entries(stats.departmentDistribution).map(([dept, count]) => (
                  <span key={dept} className="dept-stat">
                    <strong>{dept}:</strong> {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teams Grid */}
      <div className="teams-grid">
        {teams.map(team => (
          <div key={team.id} className="team-card">
            {/* Team Header */}
            <div className="team-card-header">
              <h4 className="team-name">{team.name}</h4>
              <span className="member-count">{team.members?.length || 0} members</span>
            </div>

            {/* Team Members */}
            <div className="team-card-body">
              {(team.members || []).length === 0 ? (
                <div className="no-members">No members assigned</div>
              ) : (
                <div className="members-list">
                  {team.members.map(member => {
                    const memberIsCaptain = isMemberCaptain(member, team);

                    return (
                      <div
                        key={member.id}
                        className={`member-item ${memberIsCaptain ? 'is-captain' : ''}`}
                      >
                        <div className="member-details">
                          <div className="member-name">
                            {member.display_name || member.username}
                            {memberIsCaptain && (
                              <span className="captain-badge">👑 Captain</span>
                            )}
                          </div>
                          <div className="member-meta">
                            <span className="member-username">{member.username}</span>
                            {member.department && (
                              <span className="member-department">{member.department}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * PropTypes validation
 */
TeamsTab.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    role: PropTypes.oneOf(['admin', 'game_admin', 'team_captain']).isRequired,
    team_id: PropTypes.number,
    team_name: PropTypes.string
  }).isRequired
};

export default TeamsTab;
