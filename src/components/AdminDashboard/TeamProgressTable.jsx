/**
 * Component: TeamProgressTable
 * Purpose: Display team progress data in table format
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - Progress bars with animations
 * - Status badges
 * - Responsive mobile layout
 * - Shows default data immediately, updates when API responds
 */

import React from 'react';
import './TeamProgressTable.css';

/**
 * Team progress table component showing team statistics and progress.
 * @param {Object} props
 * @param {Array} props.data - Team data from API
 * @returns {JSX.Element}
 */
const TeamProgressTable = ({ data }) => {
    
    // Default teams shown immediately
    const defaultTeams = [
        {
            id: 1,
            name: 'Team Alpha',
            progress: 95,
            games_completed: 9,
            total_games: 10,
            help_requests: 3,
            status: 'active'
        },
        {
            id: 2,
            name: 'Team Beta',
            progress: 100,
            games_completed: 10,
            total_games: 10,
            help_requests: 1,
            status: 'completed'
        },
        {
            id: 3,
            name: 'Team Gamma',
            progress: 70,
            games_completed: 7,
            total_games: 10,
            help_requests: 8,
            status: 'needs_help'
        }
    ];

    // Use API data when available, fallback to defaults
    // SECURITY: Filter out system teams (is_system_team=true) and admin teams from display
    const allTeams = data || defaultTeams;
    const teams = allTeams.filter(team =>
        !team.is_system_team &&
        team.name !== 'System Admins' &&
        team.name !== 'system_admins'
    );

    /**
     * Get appropriate CSS class for status badge.
     * @param {string} status - Team status
     * @returns {string} CSS class name
     */
    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case 'active': return 'status-active';
            case 'completed': return 'status-completed';
            case 'help':
            case 'needs_help': return 'status-help';
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
            case 'help':
            case 'needs_help': return 'NEEDS HELP';
            default: return status.toUpperCase();
        }
    };

    return (
        <div className="team-progress-card-container">
            <div className="card-header">
                📈 Team Progress
            </div>
            <div className="card-body">
                <div className="team-progress-section">
                    <div className="data-table">
                <div className="table-header">
                    <div>TEAM</div>
                    <div>PROGRESS</div>
                    <div>GAMES COMPLETED</div>
                    <div>HELP REQUESTS</div>
                    <div>STATUS</div>
                </div>
                
                <div className="table-body">
                    {teams.map((team) => (
                        <div key={team.id} className="table-row">
                            <div data-label="Team">{team.name}</div>
                            <div data-label="Progress">
                                <div className="progress-container">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${team.progress || 0}%` }}
                                        ></div>
                                    </div>
                                    <div className="progress-text">{team.progress || 0}%</div>
                                </div>
                            </div>
                            <div data-label="Games">
                                {team.games_completed || team.gamesCompleted || 0}/
                                {team.total_games || team.totalGames || 10}
                            </div>
                            <div data-label="Help">{team.help_requests || team.helpRequests || 0}</div>
                            <div data-label="Status">
                                <span className={`status-badge ${getStatusClass(team.status)}`}>
                                    {getStatusText(team.status)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
                </div>
            </div>
        </div>
    );
};

export default TeamProgressTable;