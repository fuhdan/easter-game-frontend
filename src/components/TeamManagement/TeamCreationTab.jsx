/**
 * Component: TeamCreationTab
 * Purpose: Team creation interface with statistics and configuration panel
 * Part of: Easter Quest Frontend - Team Management Module
 *
 * Features:
 * - Team statistics summary
 * - Team configuration panel (side panel from TeamCreation)
 * - Create teams from player list
 * - Admin only access
 *
 * @module components/TeamManagement
 * @since 2025-11-23
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TeamConfiguration from './TeamConfiguration';
import { getAllTeams, getAllPlayers } from '../../services';
import './TeamCreationTab.css';

/**
 * TeamCreationTab component - Team creation with statistics
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - Current authenticated user (must be admin)
 * @returns {JSX.Element} Team creation interface
 *
 * @example
 * <TeamCreationTab user={currentUser} />
 */
function TeamCreationTab({ user }) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    requiredDepartment: '',
    ensureDepartmentDistribution: false,
    captainFromRequiredDept: false,
    minTeamSize: 3,
    maxTeamSize: 4,
  });

  /**
   * Load teams and players on mount
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Extract unique departments when players change
   */
  useEffect(() => {
    const uniqueDepartments = [...new Set(players.map(p => p.department))]
      .filter(d => d && d.trim())
      .sort();
    setDepartments(uniqueDepartments);
  }, [players]);

  /**
   * Load teams and players from backend
   */
  const loadData = async () => {
    try {
      setLoading(true);

      // Load teams
      const teamsResponse = await getAllTeams();
      const displayTeams = (teamsResponse.teams || []).filter(team => !team.is_system_team);
      setTeams(displayTeams);

      // Load players
      const playersResponse = await getAllPlayers();
      if (playersResponse && playersResponse.success && Array.isArray(playersResponse.users)) {
        const normalizedPlayers = playersResponse.users.map(player => ({
          id: player.id,
          name: player.name || player.display_name || '',
          username: player.username || '',
          department: player.department || 'Unassigned'
        }));
        setPlayers(normalizedPlayers);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Show notification (simple alert for now)
   */
  const showNotification = (message, type = 'info') => {
    if (type === 'error') alert(`Error: ${message}`);
  };

  /**
   * Calculate team statistics
   */
  const calculateStats = () => {
    if (teams.length === 0) {
      return {
        totalTeams: 0,
        totalPlayers: 0,
        avgTeamSize: 0,
        minTeamSize: 0,
        maxTeamSize: 0
      };
    }

    const totalPlayers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
    const teamSizes = teams.map(team => team.members?.length || 0);
    const minTeamSize = Math.min(...teamSizes);
    const maxTeamSize = Math.max(...teamSizes);
    const avgTeamSize = totalPlayers > 0 ? (totalPlayers / teams.length) : 0;

    return {
      totalTeams: teams.length,
      totalPlayers,
      avgTeamSize: Math.round(avgTeamSize * 10) / 10,
      minTeamSize,
      maxTeamSize
    };
  };

  const stats = calculateStats();

  return (
    <div className="team-creation-tab">
      {/* Team Statistics Summary */}
      <div className="team-stats-card">
        <h3>Team Statistics</h3>
        <div className="stats-grid-horizontal">
          <div className="stat-box">
            <div className="stat-value">{stats.totalTeams}</div>
            <div className="stat-label">TEAMS</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats.totalPlayers}</div>
            <div className="stat-label">PLAYERS</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats.avgTeamSize}</div>
            <div className="stat-label">AVG SIZE</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">
              {stats.totalTeams > 0 ? `${stats.minTeamSize}-${stats.maxTeamSize}` : '0-0'}
            </div>
            <div className="stat-label">SIZE RANGE</div>
          </div>
        </div>
      </div>

      {/* Team Configuration Panel */}
      <div className="team-config-card">
        <TeamConfiguration
          config={config}
          setConfig={setConfig}
          players={players}
          teams={teams}
          setTeams={setTeams}
          setPlayers={setPlayers}
          departments={departments}
          showNotification={showNotification}
          loading={loading}
          setLoading={setLoading}
        />
      </div>
    </div>
  );
}

/**
 * PropTypes validation
 */
TeamCreationTab.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    role: PropTypes.oneOf(['admin']).isRequired
  }).isRequired
};

export default TeamCreationTab;
