/**
 * Component: TeamCreation.jsx
 * Purpose: Main container for team management system with data persistence
 * Part of: Easter Quest 2025 Frontend
 * Location: frontend/src/components/TeamCreation/TeamCreation.jsx
 * 
 * Layout:
 * - PlayerManagement (dedicated file)
 * - TeamDisplay (dedicated file)
 * - TeamConfiguration (dedicated file)
 * 
 * FIXED ISSUES:
 * - Load existing teams and players on component mount
 * - Persist data after logout/login
 * - Handle loading states properly
 * 
 * @since 2025-08-31
 * @updated 2025-09-03 - Added data loading on mount
 */

import React, { useState, useEffect } from 'react';
import './TeamCreation.css';
import PlayerManagement from './PlayerManagement';
import TeamConfiguration from './TeamConfiguration';
import TeamDisplay from './TeamDisplay';
import TeamLoader from '../Loader/TeamLoader';
import { getAllTeams } from '../../services';

const TeamCreation = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const [config, setConfig] = useState({
    requiredDepartment: '',
    ensureDepartmentDistribution: false,
    captainFromRequiredDept: false,
    minTeamSize: 3,
    maxTeamSize: 4,
  });

  // Extract unique departments whenever players change
  useEffect(() => {
    const uniqueDepartments = [...new Set(players.map(p => p.department))]
      .filter(d => d && d.trim())
      .sort();
    setDepartments(uniqueDepartments);
  }, [players]);

  /**
   * Load existing teams and players on component mount
   * FIXES: Data persistence after logout/login
   */
  useEffect(() => {
    const loadExistingData = async () => {
      setInitialLoading(true);

      try {
        // Load existing teams
        const teamsResponse = await getAllTeams();
        if (teamsResponse.success && teamsResponse.teams) {
          setTeams(teamsResponse.teams);
          
          // Extract players from team members (since /api/users doesn't exist)
          const playerMap = new Map(); // Avoid duplicates
          
          teamsResponse.teams.forEach(team => {
            if (team.members && Array.isArray(team.members)) {
              team.members.forEach(member => {
                if (!playerMap.has(member.username)) {
                  playerMap.set(member.username, {
                    id: member.id,
                    name: member.display_name || member.username,
                    username: member.username,
                    department: member.department || 'Unassigned'
                  });
                }
              });
            }
          });

          const playersData = Array.from(playerMap.values());
          setPlayers(playersData);
        } else {
          setTeams([]);
          setPlayers([]);
        }
        
      } catch (error) {
        console.error('Failed to load existing data:', error);
        showNotification('Failed to load existing data', 'warning');
        // Set empty arrays on error
        setTeams([]);
        setPlayers([]);
      } finally {
        setInitialLoading(false);
      }
    };

    loadExistingData();
  }, []); // Run once on mount

  const showNotification = (message, type = 'info') => {
    if (type === 'error') alert(`Error: ${message}`);
  };

  // Show loading state while initial data loads
  if (initialLoading) {
    return (
      <div className="team-creation">
        <h2 className="team-creation-title">Team Creation & Management</h2>
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Loading existing teams and players...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="team-creation">

      {loading && (
        <TeamLoader message={`Processing... ${progress > 0 ? `${progress}%` : ''}`} />
      )}

      <div className="main-content">
        <div className="content-area">
          <div className="player-section">
            <PlayerManagement
              players={players}
              setPlayers={setPlayers}
              showNotification={showNotification}
              loading={loading}
              setLoading={setLoading}
              setProgress={setProgress}
            />
          </div>

          <div className="teams-section">
            <TeamDisplay
              teams={teams}
              players={players}
              showNotification={showNotification}
              useMock={false}
            />
          </div>
        </div>
      </div>

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
  );
};

export default TeamCreation;