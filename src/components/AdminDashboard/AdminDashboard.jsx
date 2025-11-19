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
import RateLimitCard from './RateLimitCard.jsx';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    /**
     * Load dashboard data from API.
     * Uses the admin dashboard endpoint that already aggregates all stats.
     * @async
     * @returns {Promise<void>}
     */
    async function loadDashboardData() {
        try {
            // Fetch dashboard data from admin endpoint
            const response = await fetch('/api/admin/dashboard', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const data = await response.json();

            // Backend returns: stats (active_teams, games_completed, participation_rate, average_rating, total_games) and teams array
            const totalGames = data.stats.total_games || 0;

            const realData = {
                stats: {
                    active_teams: data.stats.active_teams,
                    games_completed: data.stats.games_completed,
                    participation_rate: data.stats.participation_rate,
                    avg_rating: data.stats.average_rating
                },
                teams: (data.teams || []).map(team => ({
                    ...team,
                    total_games: totalGames,  // Add total_games to each team
                    games_completed: team.completed_games || 0,  // Backend uses completed_games
                    progress: team.progress_percentage || 0  // Backend uses progress_percentage
                }))
            };

            console.log(`Dashboard data loaded: ${realData.stats.active_teams} teams, ${realData.stats.games_completed} games completed, ${totalGames} total games`);
            setDashboardData(realData);

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

            <RateLimitCard user={user} />

        </div>
    );
};

export default AdminDashboard;