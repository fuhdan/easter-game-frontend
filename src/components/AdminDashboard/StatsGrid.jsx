/**
 * Component: StatsGrid
 * Purpose: Display KPI statistics in a grid layout
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - Four key statistics cards
 * - Shows default data immediately, updates when API responds
 * - Responsive grid layout
 * - Hover animations
 */
import React from 'react';
import './StatsGrid.css';

/**
 * Statistics grid component showing key performance indicators.
 * @param {Object} props
 * @param {Object} props.data - Statistics data from API
 * @returns {JSX.Element}
 */
const StatsGrid = ({ data }) => {
    // Default data shown immediately
    const defaultStats = {
        active_teams: 24,
        games_completed: 156,
        participation_rate: 89,
        avg_rating: 4.2
    };

    // Use API data when available, fallback to defaults
    const stats = data || defaultStats;

    return (
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-number">{stats.active_teams}</div>
                <div className="stat-label">Active Teams</div>
            </div>
            <div className="stat-card">
                <div className="stat-number">{stats.games_completed}</div>
                <div className="stat-label">Games Completed</div>
            </div>
            <div className="stat-card">
                <div className="stat-number">{stats.participation_rate}%</div>
                <div className="stat-label">Participation Rate</div>
            </div>
            <div className="stat-card">
                <div className="stat-number">{stats.avg_rating}</div>
                <div className="stat-label">Avg Rating</div>
            </div>
        </div>
    );
};

export default StatsGrid;