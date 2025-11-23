/**
 * Component: GameAdminDashboard
 * Purpose: Game admin dashboard with stats, team progress, and game analytics
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * This dashboard monitors the running Easter game event, displaying:
 * - Real-time team progress and game completion stats
 * - Game analytics (completion rates, stuck teams, difficulty metrics)
 * - Rate limit management for login/API protection
 *
 * Note: This is the GAME admin dashboard (monitors game progress).
 * The SYSTEM admin dashboard (game events, settings) is separate.
 *
 * Features:
 * - KPI statistics grid with real-time updates via SSE
 * - Team progress table showing live game progress
 * - Games analytics tab with detailed metrics
 * - Rate limit management
 * - Tabbed interface for organized navigation
 * - Real-time data updates via Server-Sent Events
 *
 * @since 2025-11-21
 * @updated 2025-11-23 - Renamed to GameAdminDashboard, prepared for SSE integration
 */
import React, { useState, useEffect } from 'react';
import StatsGrid from './StatsGrid';
import TeamProgressTable from './TeamProgressTable.jsx';
import RateLimitCard from './RateLimitCard.jsx';
import GamesAnalyticsTab from './GamesAnalyticsTab.jsx';
import GenericSSEClient from '../../services/GenericSSEClient';
import './GameAdminDashboard.css';

/**
 * Game admin dashboard component for monitoring running game events.
 *
 * Displays real-time statistics and progress for the current Easter game,
 * including team progress, game completion rates, and difficulty metrics.
 *
 * @param {Object} props
 * @param {Object} props.user - Current authenticated admin user
 * @returns {JSX.Element}
 */
const GameAdminDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboardData, setDashboardData] = useState(null);
    const [sseClient, setSseClient] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // connected, connecting, disconnected

    useEffect(() => {
        loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // Set up SSE connection for real-time updates
    useEffect(() => {
        // Only connect SSE for Overview and Games Analytics tabs
        // Rate Limits tab has its own SSE connection
        if (activeTab === 'rate-limits') {
            return;
        }

        console.log('[GameAdminDashboard] Setting up SSE connection');

        // Create SSE client for game dashboard updates
        const client = new GenericSSEClient({
            endpoint: '/api/admin/game-dashboard/stream',
            eventTypes: ['stats_update', 'team_progress_update', 'heartbeat', 'error'],
            maxReconnectAttempts: 5,
            reconnectDelay: 1000,
            maxReconnectDelay: 30000,
            name: 'GameDashboardSSE'
        });

        // Setup event listeners
        client.on('connected', () => {
            console.log('[GameAdminDashboard] SSE connected');
            setConnectionStatus('connected');
        });

        client.on('disconnected', () => {
            console.log('[GameAdminDashboard] SSE disconnected');
            setConnectionStatus('disconnected');
        });

        client.on('stats_update', (data) => {
            console.log('[GameAdminDashboard] Stats update received:', data);
            setDashboardData(prev => ({
                ...prev,
                stats: data
            }));
        });

        client.on('team_progress_update', (teamData) => {
            console.log('[GameAdminDashboard] Team progress update:', teamData.team_name, teamData.progress_percentage + '%');
            setDashboardData(prev => {
                if (!prev || !prev.teams) {
                    return prev;
                }

                // Update the specific team in the teams array
                const updatedTeams = prev.teams.map(team => {
                    if (team.id === teamData.team_id) {
                        return {
                            ...team,
                            progress_percentage: teamData.progress_percentage,
                            completed_games: teamData.completed_games,
                            help_requests: teamData.help_requests,
                            status: teamData.status
                        };
                    }
                    return team;
                });

                return {
                    ...prev,
                    teams: updatedTeams
                };
            });
        });

        client.on('heartbeat', (data) => {
            console.log('[GameAdminDashboard] Heartbeat:', data.timestamp);
        });

        client.on('error', (error) => {
            console.error('[GameAdminDashboard] SSE error:', error);
            setConnectionStatus('disconnected');
        });

        // Connect
        client.connect();
        setSseClient(client);

        // Cleanup on unmount or tab change
        return () => {
            console.log('[GameAdminDashboard] Cleaning up SSE connection');
            client.disconnect();
        };
    }, [activeTab]); // Reconnect when tab changes

    /**
     * Render connection status indicator
     * @returns {JSX.Element}
     */
    const renderConnectionStatus = () => {
        // Don't show status on Rate Limits tab (has its own indicator)
        if (activeTab === 'rate-limits') {
            return null;
        }

        return (
            <div className={`stat-badge connection-status ${connectionStatus}`}>
                <div className="status-indicator"></div>
                <span>{connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}</span>
            </div>
        );
    };

    /**
     * Render tab navigation
     * @returns {JSX.Element}
     */
    const renderTabNavigation = () => {
        const tabs = [
            { id: 'overview', label: '📊 Overview' },
            { id: 'games-analytics', label: '🎯 Games Analytics' },
            { id: 'rate-limits', label: '⚡ Rate Limits' }
        ];

        return (
            <div className="game-dashboard-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        aria-label={`Switch to ${tab.label}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        );
    };

    /**
     * Render active tab content
     * @returns {JSX.Element}
     */
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <>
                        <StatsGrid data={dashboardData?.stats} />
                        <TeamProgressTable
                            data={dashboardData?.teams}
                        />
                    </>
                );

            case 'games-analytics':
                return <GamesAnalyticsTab />;

            case 'rate-limits':
                return <RateLimitCard user={user} />;

            default:
                return null;
        }
    };

    return (
        <div className="game-admin-dashboard">
            <div className="game-dashboard-card-container">
                <div className="card-header">
                    <div className="header-title-group">
                        <span>📊 GAME ADMIN DASHBOARD</span>
                    </div>
                    <div className="header-stats">
                        {renderConnectionStatus()}
                    </div>
                </div>
                <div className="card-body">
                    {renderTabNavigation()}
                    <div className="dashboard-content">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameAdminDashboard;