/**
 * Component: StatsGrid
 * Purpose: Display KPI statistics in a grid layout
 * Part of: Easter Quest 2025 Frontend Dashboard
 * 
 * Features:
 * - Four key statistics cards
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
    // Default data for when API data is not available
    const defaultStats = {
        activeTeams: 24,
        gamesCompleted: 156,
        participationRate: 89,
        avgRating: 4.2
    };

    const stats = data || defaultStats;

    return (
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-number">{stats.activeTeams}</div>
                <div className="stat-label">Active Teams</div>
            </div>
            <div className="stat-card">
                <div className="stat-number">{stats.gamesCompleted}</div>
                <div className="stat-label">Games Completed</div>
            </div>
            <div className="stat-card">
                <div className="stat-number">{stats.participationRate}%</div>
                <div className="stat-label">Participation Rate</div>
            </div>
            <div className="stat-card">
                <div className="stat-number">{stats.avgRating}</div>
                <div className="stat-label">Avg Rating</div>
            </div>
        </div>
    );
};

export default StatsGrid;