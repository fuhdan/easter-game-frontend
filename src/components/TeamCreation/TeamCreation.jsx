/**
 * Component: TeamCreation.jsx
 * Purpose: Main container for team management system
 * Part of: Easter Quest 2025 Frontend
 * Location: frontend/src/components/TeamCreation/TeamCreation.jsx
 * 
 * Layout:
 * - PlayerManagement (dedicated file)
 * - TeamDisplay (dedicated file)
 * - TeamConfiguration (dedicated file)
 * 
 * @since 2025-08-31
 */

import React, { useState, useEffect } from 'react';
import './TeamCreation.css';
import PlayerManagement from './PlayerManagement';
import TeamConfiguration from './TeamConfiguration';
import TeamDisplay from './TeamDisplay';

const TeamCreation = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const showNotification = (message, type = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    if (type === 'error') alert(`Error: ${message}`);
  };

  return (
    <div className="team-creation">
      <h2 className="team-creation-title">🏆 Team Creation & Management</h2>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Processing... {progress > 0 && `${progress}%`}</p>
          </div>
        </div>
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
        departments={departments}
        showNotification={showNotification}
        loading={loading}
        setLoading={setLoading}
      />
    </div>
  );
};

export default TeamCreation;
