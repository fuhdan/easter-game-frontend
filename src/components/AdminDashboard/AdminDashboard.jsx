/**
 * Component: AdminDashboard
 * Purpose: Admin dashboard with stats, team progress, and view controls
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - KPI statistics grid
 * - Team progress table with multiple views
 * - Shows default data immediately, updates when API responds
 * - Real-time data updates (TODO: WebSocket integration)
 */
import React, { useState, useEffect } from 'react';
import StatsGrid from './StatsGrid';
import TeamProgressTable from './TeamProgressTable.jsx';
import './AdminDashboard.css';

/**
 * Admin dashboard component with team management and statistics.
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user
 * @returns {JSX.Element}
 */
const AdminDashboard = ({ user }) => {
    const [viewMode, setViewMode] = useState('summary');
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, [viewMode]);

    /**
     * Load dashboard data from API based on current view mode.
     * @async
     * @returns {Promise<void>}
     */
    async function loadDashboardData() {
        try {
            // No loading state - components show defaults immediately
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const mockData = {
                stats: {
                    active_teams: 26,  // Slightly different to show update
                    games_completed: 158,
                    participation_rate: 91,
                    avg_rating: 4.3
                },
                teams: [
                    {
                        id: 1,
                        name: 'Team Alpha',
                        progress: 96,
                        games_completed: 9,
                        total_games: 10,
                        help_requests: 2,
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
                        progress: 72,
                        games_completed: 7,
                        total_games: 10,
                        help_requests: 6,
                        status: 'needs_help'
                    },
                    {
                        id: 4,
                        name: 'Team Delta',
                        progress: 45,
                        games_completed: 4,
                        total_games: 10,
                        help_requests: 2,
                        status: 'active'
                    }
                ]
            };
            
            console.log(`Mock: Dashboard data updated for view: ${viewMode}`);
            setDashboardData(mockData);
            
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            // Keep showing default data on error - no error state needed
        }
    }

    return (
        <div className="admin-dashboard">
            <StatsGrid data={dashboardData?.stats} />
            
            <TeamProgressTable
                data={dashboardData?.teams}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />
        </div>
    );
};

export default AdminDashboard;