/**
 * Component: TeamConfiguration.jsx
 * Purpose: Configure team creation parameters and communicate with backend API
 * Part of: Easter Quest 2025 Team Creation
 * Location: frontend/src/components/TeamCreation/TeamConfiguration.jsx
 * 
 * Features:
 * - Team size configuration UI (min/max players per team)
 * - Department distribution constraint settings
 * - Captain selection rule configuration
 * - Uses REAL API service for backend communication
 * - Frontend validation before sending to backend
 * - Loading states and error handling
 * 
 * Backend Integration:
 * - api.teams.create() - Send players + config, get generated teams
 * - api.teams.reset() - Clear all teams from database
 * - All API logic handled by centralized service
 * 
 * @since 2025-08-31
 * @updated 2025-09-04 - Removed department distribution checkbox
 */

import React from 'react';
import api from '../../services/api';

const TeamConfiguration = ({ 
  config, 
  setConfig, 
  players, 
  teams, 
  setTeams,
  setPlayers,
  departments, 
  showNotification, 
  loading, 
  setLoading 
}) => {

  /**
   * Handle configuration form changes
   * Updates local config state for UI reactivity
   */
  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Validate configuration before sending to backend
   * Frontend validation for better UX before API call
   */
  const validateConfiguration = () => {
    if (players.length === 0) {
      throw new Error('No players available. Please upload players first.');
    }

    if (config.minTeamSize < 2 || config.minTeamSize > 10) {
      throw new Error('Minimum team size must be between 2 and 10');
    }

    if (config.maxTeamSize < config.minTeamSize) {
      throw new Error('Maximum team size must be greater than or equal to minimum team size');
    }

    if (players.length < config.minTeamSize) {
      throw new Error(`Need at least ${config.minTeamSize} players to create teams`);
    }
  };

  /**
   * Handle Create Teams button click
   * Uses REAL API service for backend communication
   */
  const handleCreateTeams = async () => {
    setLoading(true);
    
    try {
      // Frontend validation
      validateConfiguration();
      
      console.log('Sending to backend:', { players, config });
      
      // Call REAL API service
      const result = await api.teams.create(players, config);
      
      console.log('Backend response:', result);
      
      if (result.success && result.teams) {
        // Update frontend state with backend results
        setTeams(result.teams);
        showNotification(`Successfully created ${result.teams.length} teams with backend algorithm!`, 'success');
      } else {
        throw new Error('Backend did not return teams successfully');
      }
      
    } catch (error) {
      console.error('Team creation failed:', error);
      // Use centralized error handling
      const errorMessage = api.utils.handleError(error, showNotification);
      showNotification(errorMessage || 'Failed to create teams', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Reset Teams button click
   * Clears teams from backend database via REAL API service
   */
  const handleResetTeams = async () => {
    if (!window.confirm('Reset all teams? This will delete all generated teams from the database.')) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('Calling api.teams.reset()');
      const result = await api.teams.reset();
      
      if (result.success) {
        setTeams([]);
      } else {
        throw new Error('Reset failed on backend');
      }
      
    } catch (error) {
      console.error('Reset failed:', error);
      api.utils.handleError(error, showNotification);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Reset All button click
   * Clears both players and teams (teams via API, players locally)
   */
  const handleResetAll = async () => {
    if (!window.confirm('Reset everything? This will delete all players and teams.')) {
      return;
    }

    setLoading(true);
    
    try {
      // Reset teams on backend using REAL API
      await api.teams.reset();
      
      // Clear frontend state
      setTeams([]);
      setPlayers([]);
      
    } catch (error) {
      api.utils.handleError(error, showNotification);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate estimated number of teams based on current settings
   * Provides user feedback on configuration impact
   */
  // Commented out - not currently used in UI
  // const getEstimatedTeams = () => {
  //   if (players.length === 0) return 0;
  //
  //   const totalPlayers = players.length;
  //   const optimalTeams = Math.floor(totalPlayers / config.maxTeamSize);
  //   const remainingPlayers = totalPlayers % config.maxTeamSize;
  //
  //   return remainingPlayers >= config.minTeamSize ? optimalTeams + 1 : optimalTeams;
  // };

  return (
    <div className="options-panel">
      <div className="options-panel-header">
        <h3 className="options-panel-title">⚙️ Team Configuration</h3>
      </div>
      <div className="options-panel-body">
        
        {/* Team Size Settings */}
        <div className="config-section">
          <h4>Team Size Settings</h4>
          
          <div className="form-group">
            <label className="form-label">Minimum Team Size</label>
            <input
              type="number"
              className="form-control"
              min="2"
              max="10"
              value={config.minTeamSize}
              onChange={(e) => handleConfigChange('minTeamSize', parseInt(e.target.value))}
              disabled={loading}
            />
            <small className="form-text">Minimum players per team (2-10)</small>
          </div>

          <div className="form-group">
            <label className="form-label">Maximum Team Size</label>
            <input
              type="number"
              className="form-control"
              min={config.minTeamSize}
              max="15"
              value={config.maxTeamSize}
              onChange={(e) => handleConfigChange('maxTeamSize', parseInt(e.target.value))}
              disabled={loading}
            />
            <small className="form-text">Maximum players per team</small>
          </div>
        </div>

        {/* Department Constraints */}
        <div className="config-section">
          <h4>Department Constraints</h4>
          
          <div className="form-group">
            <label className="form-label">Required Department</label>
            <select
              className="form-control"
              value={config.requiredDepartment}
              onChange={(e) => handleConfigChange('requiredDepartment', e.target.value)}
              disabled={loading}
            >
              <option value="">None - No requirement</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <small className="form-text">Department that should be represented in each team</small>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="captainFromRequiredDept"
              checked={config.captainFromRequiredDept}
              onChange={(e) => handleConfigChange('captainFromRequiredDept', e.target.checked)}
              disabled={!config.requiredDepartment || loading}
            />
            <label htmlFor="captainFromRequiredDept">
              Team captain must be from required department
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="config-buttons">
          <button
            className="btn btn-success"
            onClick={handleCreateTeams}
            disabled={loading || players.length === 0}
          >
            {loading ? 'Creating Teams...' : 'Create Teams'}
          </button>

          <button
            className="btn btn-warning"
            onClick={handleResetTeams}
            disabled={loading || teams.length === 0}
          >
            {loading ? 'Resetting...' : 'Reset Teams'}
          </button>

          <button
            className="btn btn-danger"
            onClick={handleResetAll}
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset All'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamConfiguration;