/**
 * Component: AdminDashboard
 * Purpose: Admin dashboard with stats, team progress, and view controls
 * Part of: Easter Quest 2025 Frontend Dashboard
 * 
 * Features:
 * - KPI statistics grid
 * - Team progress table with multiple views
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
    const [loading, setLoading] = useState(true);

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
            setLoading(true);
            const response = await fetch(`/api/admin/dashboard?view=${viewMode}`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                setDashboardData(data);
            }
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="dashboard-loading">Loading dashboard...</div>;
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