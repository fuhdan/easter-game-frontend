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
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { buildApiUrl } from '../../config/apiConfig';
import { logger } from '../../utils/logger';
import StatsGrid from './StatsGrid';
import TeamProgressTable from './TeamProgressTable.jsx';
import RateLimitCard from './RateLimitCard.jsx';
import GamesAnalyticsTab from './GamesAnalyticsTab.jsx';
import SecurityDashboard from './SecurityDashboard.jsx';
import { useSSE } from '../../hooks/useSSE';
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
            const response = await fetch(buildApiUrl('admin/dashboard'), {
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

            logger.info('game_admin_dashboard_data_loaded', {
                activeTeams: realData.stats.active_teams,
                gamesCompleted: realData.stats.games_completed,
                totalGames,
                module: 'GameAdminDashboard'
            });
            setDashboardData(realData);

        } catch (err) {
            logger.error('game_admin_dashboard_data_load_failed', {
                errorMessage: err.message,
                module: 'GameAdminDashboard'
            }, err);
            // Keep showing default data on error - no error state needed
        }
    }

    /**
     * Handle SSE message events
     */
    const handleSSEMessage = useCallback((eventType, data) => {
        switch (eventType) {
            case 'stats_update':
                logger.debug('game_admin_dashboard_stats_update', {
                    hasData: !!data,
                    module: 'GameAdminDashboard'
                });
                setDashboardData(prev => ({
                    ...prev,
                    stats: data
                }));
                break;

            case 'team_progress_update':
                logger.debug('game_admin_dashboard_team_progress_update', {
                    teamName: data.team_name,
                    progressPercentage: data.progress_percentage,
                    completedGames: data.completed_games,
                    module: 'GameAdminDashboard'
                });
                setDashboardData(prev => {
                    if (!prev || !prev.teams) {
                        return prev;
                    }

                    // Update the specific team in the teams array
                    const updatedTeams = prev.teams.map(team => {
                        if (team.team_id === data.team_id) {
                            return {
                                ...team,
                                team_id: data.team_id,
                                team_name: data.team_name,
                                progress: data.progress_percentage,
                                games_completed: data.completed_games,
                                help_requests: data.help_requests,
                                status: data.status
                            };
                        }
                        return team;
                    });

                    return {
                        ...prev,
                        teams: updatedTeams
                    };
                });
                break;

            case 'heartbeat':
                // PERF: Don't log heartbeats - they happen frequently
                break;

            default:
                logger.warn('game_admin_dashboard_unknown_sse_event', {
                    eventType,
                    module: 'GameAdminDashboard'
                });
        }
    }, []);

    /**
     * Handle SSE connection established
     */
    const handleSSEConnect = useCallback(() => {
        logger.info('game_admin_dashboard_sse_connected', {
            module: 'GameAdminDashboard'
        });
    }, []);

    /**
     * Handle SSE disconnection
     */
    const handleSSEDisconnect = useCallback(() => {
        logger.info('game_admin_dashboard_sse_disconnected', {
            module: 'GameAdminDashboard'
        });
    }, []);

    /**
     * Handle SSE errors
     */
    const handleSSEError = useCallback((errorData) => {
        logger.error('game_admin_dashboard_sse_error', {
            errorMessage: errorData.message,
            module: 'GameAdminDashboard'
        });
    }, []);

    // Set up SSE connection for real-time updates (only for Overview and Games Analytics tabs)
    const shouldConnectSSE = activeTab !== 'security' && activeTab !== 'rate-limits';

    // Memoize endpoint to prevent reconnections
    const sseEndpoint = useMemo(() => {
        return shouldConnectSSE ? buildApiUrl('admin/game-dashboard/stream') : null;
    }, [shouldConnectSSE]);

    // Memoize event types array to prevent reconnections
    const sseEventTypes = useMemo(() => {
        return ['stats_update', 'team_progress_update', 'heartbeat', 'error'];
    }, []);

    const { isConnected } = useSSE({
        endpoint: sseEndpoint,
        eventTypes: sseEventTypes,
        onMessage: handleSSEMessage,
        onConnect: handleSSEConnect,
        onDisconnect: handleSSEDisconnect,
        onError: handleSSEError,
        maxReconnectAttempts: 5,
        reconnectDelay: 1000,
        maxReconnectDelay: 30000,
        name: 'GameDashboardSSE'
    });

    /**
     * Render connection status indicator
     * @returns {JSX.Element}
     */
    const renderConnectionStatus = () => {
        // Don't show status on Security and Rate Limits tabs
        if (activeTab === 'security' || activeTab === 'rate-limits') {
            return null;
        }

        const connectionStatus = isConnected ? 'connected' : 'disconnected';

        return (
            <div className={`stat-badge connection-status ${connectionStatus}`}>
                <div className="status-indicator"></div>
                <span>{isConnected ? 'Live' : 'Disconnected'}</span>
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
            { id: 'security', label: '🛡️ Security' },
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

            case 'security':
                return <SecurityDashboard />;

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