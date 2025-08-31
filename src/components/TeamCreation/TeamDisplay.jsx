/**
 * Component: TeamDisplay.jsx
 * Purpose: Display generated teams and provide export functionality
 * Part of: Easter Quest 2025 Team Creation
 * Location: frontend/src/components/TeamCreation/TeamDisplay.jsx
 * 
 * Features:
 * - Display teams in card layout
 * - Show team members with departments
 * - Highlight team captain with badge/icon
 * - Team statistics summary
 * - Export teams to CSV via API service
 * - Empty state handling
 * - Responsive team cards
 * 
 * Data Structure Expected:
 * teams: [{
 *   id: number,
 *   name: string,
 *   members: [{id, name, department}],
 *   captain: {id, name, department}
 * }]
 * 
 * @since 2025-08-31
 */

import React, { useState } from 'react';
// import api from '../../services/api';

// TEMPORARY: Mock API for testing until service is created
const api = {
  teams: {
    export: async () => {
      console.log('Mock: Exporting teams');
      await new Promise(resolve => setTimeout(resolve, 500));
      return 'Team Name,Member Name,Department,Captain\nTeam Alpha,John Doe,Engineering,Yes';
    }
  },
  utils: {
    handleError: (error, showNotification) => {
      console.error('API Error:', error);
      if (showNotification) {
        showNotification(error.message || 'An error occurred', 'error');
      }
    }
  }
};

// Enhanced mock data - 5 teams with 4-5 members each
const mockTeams = [
  {
    id: 1,
    name: 'Team Alpha',
    members: [
      { id: 101, name: 'Alice Johnson', login: 'ajohnson', department: 'Engineering' },
      { id: 102, name: 'Bob Smith', login: 'bsmith', department: 'Design' },
      { id: 103, name: 'Charlie Brown', login: 'cbrown', department: 'Engineering' },
      { id: 104, name: 'Diana Prince', login: 'dprince', department: 'Marketing' },
      { id: 105, name: 'Edward Wilson', login: 'ewilson', department: 'Sales' },
    ],
    captain: { id: 101, name: 'Alice Johnson', login: 'ajohnson', department: 'Engineering' },
  },
  {
    id: 2,
    name: 'Team Beta',
    members: [
      { id: 201, name: 'Frank Miller', login: 'fmiller', department: 'Marketing' },
      { id: 202, name: 'Grace Lee', login: 'glee', department: 'Sales' },
      { id: 203, name: 'Henry Davis', login: 'hdavis', department: 'Engineering' },
      { id: 204, name: 'Ivy Chen', login: 'ichen', department: 'Design' },
    ],
    captain: { id: 202, name: 'Grace Lee', login: 'glee', department: 'Sales' },
  },
  {
    id: 3,
    name: 'Team Gamma',
    members: [
      { id: 301, name: 'Jack Thompson', login: 'jthompson', department: 'Development' },
      { id: 302, name: 'Kate Anderson', login: 'kanderson', department: 'Marketing' },
      { id: 303, name: 'Luke Rodriguez', login: 'lrodriguez', department: 'Sales' },
      { id: 304, name: 'Maya Patel', login: 'mpatel', department: 'Engineering' },
      { id: 305, name: 'Noah Kim', login: 'nkim', department: 'Design' },
    ],
    captain: { id: 303, name: 'Luke Rodriguez', login: 'lrodriguez', department: 'Sales' },
  },
  {
    id: 4,
    name: 'Team Delta',
    members: [
      { id: 401, name: 'Olivia Garcia', login: 'ogarcia', department: 'Development' },
      { id: 402, name: 'Paul Martinez', login: 'pmartinez', department: 'Marketing' },
      { id: 403, name: 'Quinn Taylor', login: 'qtaylor', department: 'Engineering' },
      { id: 404, name: 'Rachel White', login: 'rwhite', department: 'Sales' },
    ],
    captain: { id: 401, name: 'Olivia Garcia', login: 'ogarcia', department: 'Development' },
  },
  {
    id: 5,
    name: 'Team Epsilon',
    members: [
      { id: 501, name: 'Sam Wilson', login: 'swilson', department: 'Design' },
      { id: 502, name: 'Tina Brown', login: 'tbrown', department: 'Marketing' },
      { id: 503, name: 'Uma Singh', login: 'usingh', department: 'Development' },
      { id: 504, name: 'Victor Lopez', login: 'vlopez', department: 'Engineering' },
      { id: 505, name: 'Wendy Clark', login: 'wclark', department: 'Sales' },
    ],
    captain: { id: 504, name: 'Victor Lopez', login: 'vlopez', department: 'Engineering' },
  },
];

const TeamDisplay = ({ teams, players, showNotification }) => {
  const [exportLoading, setExportLoading] = useState(false);

  // Use mock teams for demonstration
  const displayTeams = teams.length > 0 ? teams : mockTeams;

  /**
   * Calculate team statistics
   * Provides overview of team distribution and department representation
   */
  const calculateStats = () => {
    if (displayTeams.length === 0) {
      return {
        totalTeams: 0,
        totalPlayers: 0,
        avgTeamSize: 0,
        minTeamSize: 0,
        maxTeamSize: 0,
        departmentDistribution: {}
      };
    }

    const totalPlayers = displayTeams.reduce((sum, team) => sum + team.members.length, 0);
    const teamSizes = displayTeams.map(team => team.members.length);
    const minTeamSize = Math.min(...teamSizes);
    const maxTeamSize = Math.max(...teamSizes);
    const avgTeamSize = (totalPlayers / displayTeams.length).toFixed(1);

    // Calculate department distribution across all teams
    const departmentDistribution = {};
    displayTeams.forEach(team => {
      team.members.forEach(member => {
        const dept = member.department || 'Unassigned';
        departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
      });
    });

    return {
      totalTeams: displayTeams.length,
      totalPlayers,
      avgTeamSize: parseFloat(avgTeamSize),
      minTeamSize,
      maxTeamSize,
      departmentDistribution
    };
  };

  /**
   * Handle CSV export via API service
   * Downloads teams as CSV file using backend endpoint
   */
  const handleExportCSV = async () => {
    if (displayTeams.length === 0) {
      showNotification('No teams to export', 'warning');
      return;
    }

    setExportLoading(true);
    
    try {
      const csvData = await api.teams.export();
      
      // Create and download CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = `team-assignments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('Teams exported successfully', 'success');
      
    } catch (error) {
      api.utils.handleError(error, showNotification);
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * Handle regenerate captains
   * Re-randomize captain selection with same team members
   */
  const handleRegenerateCaptains = async () => {
    if (displayTeams.length === 0) return;
    
    if (!window.confirm('Regenerate team captains? This will randomly reassign captains for all teams.')) {
      return;
    }

    try {
      // Note: This would need a specific API endpoint
      // For now, we'll show a message that this feature needs backend support
      showNotification('Captain regeneration requires backend API endpoint', 'info');
      
      // TODO: Implement when backend endpoint is available
      // await api.teams.regenerateCaptains();
      
    } catch (error) {
      api.utils.handleError(error, showNotification);
    }
  };

  const stats = calculateStats();

  // Empty state
  if (displayTeams.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">👥 Generated Teams</h3>
        </div>
        <div className="card-body">
          <div className="empty-state">
            <div className="empty-icon">🎲</div>
            <h4>No Teams Created Yet</h4>
            <p>Configure your team settings and click "Create Teams" to generate random teams.</p>
            <div className="empty-hints">
              <small>💡 Tips:</small>
              <ul>
                <li>Upload players first using the CSV upload</li>
                <li>Configure team sizes and constraints</li>
                <li>Backend algorithm will create balanced teams</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">👥 Generated Teams ({displayTeams.length})</h3>
      </div>

      <div className="card-body">
        
        {/* Team Statistics */}
        <div className="team-stats">
          <h4>📊 Team Statistics</h4>
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
              <h5>Department Distribution:</h5>
              <div className="dept-stats">
                {Object.entries(stats.departmentDistribution).map(([dept, count]) => (
                  <span key={dept} className="dept-stat">
                    <strong>{dept}:</strong> {count} players
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Teams Grid */}
        <div className="teams-grid">
          {displayTeams.map(team => (
            <div key={team.id} className="team-card">
              
              {/* Team Header */}
              <div className="team-header">
                <div className="team-info">
                  <h4 className="team-name">{team.name}</h4>
                  <span className="member-count">{team.members.length} members</span>
                </div>
                <div className="team-id">#{team.id}</div>
              </div>

              {/* Team Members List */}
              <div className="team-members">
                <ul className="members-list">
                  {team.members.map(member => (
                    <li key={member.id} className="team-member">
                      <div className="member-info">
                        <div className="member-name">
                          {member.name}
                          {team.captain && team.captain.id === member.id && (
                            <span className="captain-badge">👑 Captain</span>
                          )}
                        </div>
                        <div className="member-department">{member.department}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
            </div>
          ))}
        </div>

        {/* Action Footer */}
        <div className="display-footer">
          <div className="footer-info">
            <small>
              Teams generated by backend algorithm • 
              Saved to database • 
              Export available as CSV
            </small>
          </div>
          
          <div className="footer-actions">
            <button
              className="btn btn-primary"
              onClick={handleRegenerateCaptains}
              title="Randomly reassign team captains"
            >
              🎯 New Captains
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExportCSV}
              disabled={exportLoading}
            >
              {exportLoading ? '⏳ Exporting...' : '📄 Export CSV'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => window.location.reload()}
              title="Refresh teams from database"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeamDisplay;