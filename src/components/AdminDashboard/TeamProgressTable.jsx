/**
 * Component: TeamProgressTable
 * Purpose: Display team progress data in table format
 * Part of: Easter Quest 2025 Frontend Dashboard
 * 
 * Features:
 * - Multiple view modes (summary, per-game, per-team)
 * - Progress bars with animations
 * - Status badges
 * - Responsive mobile layout
 */

import React from 'react';
import './TeamProgressTable.css';

/**
 * Team progress table component showing team statistics and progress.
 * @param {Object} props
 * @param {Object} props.data - Team data from API
 * @param {string} props.viewMode - Current view mode (summary, per-game, per-team)
 * @returns {JSX.Element}
 */
const TeamProgressTable = ({ data, viewMode = 'summary', onViewModeChange }) => {
    // Default data for when API data is not available
    const defaultTeams = [
        {
            id: 1,
            name: 'Team Alpha',
            progress: 95,
            gamesCompleted: 9,
            totalGames: 10,
            helpRequests: 3,
            status: 'active'
        },
        {
            id: 2,
            name: 'Team Beta',
            progress: 100,
            gamesCompleted: 10,
            totalGames: 10,
            helpRequests: 1,
            status: 'completed'
        },
        {
            id: 3,
            name: 'Team Gamma',
            progress: 70,
            gamesCompleted: 7,
            totalGames: 10,
            helpRequests: 8,
            status: 'help'
        }
    ];

    const teams = data || defaultTeams;

    /**
     * Get appropriate CSS class for status badge.
     * @param {string} status - Team status
     * @returns {string} CSS class name
     */
    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'active': return 'status-active';
            case 'completed': return 'status-completed';
            case 'help': return 'status-help';
            default: return 'status-active';
        }
    };

    /**
     * Get display text for status.
     * @param {string} status - Team status
     * @returns {string} Display text
     */
    const getStatusText = (status) => {
        switch (status.toLowerCase()) {
            case 'active': return 'ACTIVE';
            case 'completed': return 'COMPLETED';
            case 'help': return 'NEEDS HELP';
            default: return status.toUpperCase();
        }
    };

    return (
        <div className="team-progress-section">
            <div className="data-table">
            
                {/* Integrated toolbar */}
                <div className="table-toolbar">
                    <span className="toolbar-title">View Options</span>
                    <div className="toolbar-buttons">
                        <button 
                            className={`toolbar-btn ${viewMode === 'summary' ? 'active' : ''}`}
                            onClick={() => onViewModeChange('summary')}
                        >
                            Summary
                        </button>
                        <button 
                            className={`toolbar-btn ${viewMode === 'per-game' ? 'active' : ''}`}
                            onClick={() => onViewModeChange('per-game')}
                        >
                            Per Game
                        </button>
                        <button 
                            className={`toolbar-btn ${viewMode === 'per-team' ? 'active' : ''}`}
                            onClick={() => onViewModeChange('per-team')}
                        >
                            Per Team
                        </button>
                    </div>
                </div>

                <div className="table-header">
                    <div>TEAM</div>
                    <div>PROGRESS</div>
                    <div>GAMES COMPLETED</div>
                    <div>HELP REQUESTS</div>
                    <div>STATUS</div>
                </div>
                
                {teams.map((team) => (
                    <div key={team.id} className="table-row">
                        <div data-label="Team">{team.name}</div>
                        <div data-label="Progress">
                            <div className="progress-container">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${team.progress}%` }}
                                    ></div>
                                </div>
                                <div className="progress-text">{team.progress}%</div>
                            </div>
                        </div>
                        <div data-label="Games">
                            {team.gamesCompleted}/{team.totalGames}
                        </div>
                        <div data-label="Help">{team.helpRequests}</div>
                        <div data-label="Status">
                            <span className={`status-badge ${getStatusClass(team.status)}`}>
                                {getStatusText(team.status)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamProgressTable;