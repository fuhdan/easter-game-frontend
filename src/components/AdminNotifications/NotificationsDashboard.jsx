/**
 * Module: AdminNotifications/NotificationsDashboard.jsx
 * Purpose: Main admin notification panel for viewing and managing escalations
 * Part of: Easter Quest 2025 - Phase 5: Admin Notification Panel
 *
 * Features:
 * - View all admin notifications (unresolved and resolved)
 * - Filter by priority (high, medium, low)
 * - Filter by escalation type (frustration, technical, timeout, manual)
 * - Sort by created_at (newest first)
 * - Resolve notifications
 * - View team progress from notifications
 * - Tab-based interface (Unresolved / Resolved)
 *
 * @since 2025-11-12
 */

import React, { useState, useEffect, useRef } from 'react';
import { buildApiUrl } from '../../config/apiConfig';
import NotificationCard from './NotificationCard';
import NotificationFilters from './NotificationFilters';
import NotificationsSSE from '../../services/notificationsSSE';
import './NotificationsDashboard.css';

/**
 * Admin Notifications Dashboard Component
 *
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user (must be admin)
 * @returns {JSX.Element}
 */
const NotificationsDashboard = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected', 'connecting', 'disconnected'

    // Filter states
    const [activeTab, setActiveTab] = useState('open'); // 'open', 'resolved'
    const [priorityFilter, setPriorityFilter] = useState(null);
    const [typeFilter, setTypeFilter] = useState(null);
    const [teamFilter, setTeamFilter] = useState(null);

    // SSE client reference
    const sseClient = useRef(null);

    // Initialize SSE connection for 'open' tab only
    useEffect(() => {
        // Only use SSE for 'open' notifications (real-time updates)
        // For 'acknowledged' and 'resolved', use traditional API calls
        if (activeTab === 'open') {
            console.log('[NotificationsDashboard] Setting up SSE connection for open notifications');
            setConnectionStatus('connecting');

            // BUGFIX: Load initial data before connecting to SSE
            // This ensures we start with a clean slate when switching tabs
            loadNotifications().then(() => {
                console.log('[NotificationsDashboard] Initial notifications loaded, connecting to SSE');
            });

            // Create SSE client if not exists
            if (!sseClient.current) {
                sseClient.current = new NotificationsSSE();

                // Handle notification events
                sseClient.current.on('notification', (notificationData) => {
                    console.log('[NotificationsDashboard] Received notification:', notificationData);

                    // Apply filters
                    if (!matchesFilters(notificationData)) {
                        console.log('[NotificationsDashboard] Notification filtered out');
                        return;
                    }

                    // Update or add notification with proper priority ordering
                    setNotifications(prevNotifications => {
                        const existingIndex = prevNotifications.findIndex(n => n.id === notificationData.id);

                        if (existingIndex >= 0) {
                            // Update existing notification and re-sort
                            const updated = [...prevNotifications];
                            updated[existingIndex] = notificationData;
                            return sortNotificationsByPriority(updated);
                        } else {
                            // Add new notification and sort
                            const updated = [...prevNotifications, notificationData];
                            return sortNotificationsByPriority(updated);
                        }
                    });
                });

                // Handle connection status
                sseClient.current.on('connected', () => {
                    console.log('[NotificationsDashboard] SSE connected');
                    setConnectionStatus('connected');
                    setError(null);
                    setLoading(false);
                });

                sseClient.current.on('disconnected', () => {
                    console.log('[NotificationsDashboard] SSE disconnected');
                    setConnectionStatus('disconnected');
                });

                sseClient.current.on('error', (errorData) => {
                    console.error('[NotificationsDashboard] SSE error:', errorData);
                    setError(errorData.message || 'Connection error');
                    setLoading(false);
                });
            }

            // Connect to SSE
            sseClient.current.connect();
        } else {
            // Disconnect SSE for non-open tabs and use traditional API
            if (sseClient.current) {
                console.log('[NotificationsDashboard] Disconnecting SSE for non-open tab');
                sseClient.current.disconnect();
            }

            // Load notifications via API for acknowledged/resolved tabs
            loadNotifications();
        }

        // Cleanup on unmount or tab change
        return () => {
            // SECURITY: Always disconnect when component unmounts (e.g., on logout)
            // Only skip disconnect if staying on 'open' tab
            if (sseClient.current && activeTab !== 'open') {
                console.log('[NotificationsDashboard] Cleaning up SSE connection (tab change)');
                sseClient.current.disconnect();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // SECURITY: Cleanup SSE connection on component unmount (e.g., logout)
    useEffect(() => {
        return () => {
            if (sseClient.current) {
                console.log('[NotificationsDashboard] Component unmounting - disconnecting SSE');
                sseClient.current.disconnect();
                sseClient.current = null;
            }
        };
    }, []); // Empty deps = only runs on mount/unmount

    // Reload when filters change (for non-SSE tabs)
    useEffect(() => {
        if (activeTab !== 'open') {
            loadNotifications();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priorityFilter, typeFilter, teamFilter]);

    /**
     * Sort notifications by priority, repeat count, and timestamp
     *
     * Sort order:
     * 1. Priority (urgent > high > normal)
     * 2. Repeat count (more repeats = higher urgency)
     * 3. Last seen timestamp (newest first)
     *
     * @param {Array} notifications - Array of notification objects
     * @returns {Array} Sorted array
     */
    function sortNotificationsByPriority(notifications) {
        const priorityOrder = {
            'urgent': 3,
            'high': 2,
            'normal': 1
        };

        return [...notifications].sort((a, b) => {
            // First, sort by priority
            const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            if (priorityDiff !== 0) {
                return priorityDiff;
            }

            // Second, sort by repeat count (higher count = more urgent)
            const repeatDiff = (b.repeat_count || 0) - (a.repeat_count || 0);
            if (repeatDiff !== 0) {
                return repeatDiff;
            }

            // Third, sort by last_seen_at (newest first)
            const dateA = new Date(a.last_seen_at);
            const dateB = new Date(b.last_seen_at);
            return dateB - dateA;
        });
    }

    /**
     * Check if notification matches current filters
     * @param {Object} notification - Notification object
     * @returns {boolean} True if matches filters
     */
    function matchesFilters(notification) {
        // Check priority filter
        if (priorityFilter && notification.priority !== priorityFilter) {
            return false;
        }

        // Check type filter
        if (typeFilter && notification.escalation_type !== typeFilter) {
            return false;
        }

        // Check team filter
        if (teamFilter && notification.team_id !== teamFilter) {
            return false;
        }

        return true;
    }

    /**
     * Load notifications from API with current filters (for non-SSE tabs)
     * @async
     * @returns {Promise<void>}
     */
    async function loadNotifications() {
        try {
            setLoading(true);
            setError(null);

            // Build query params
            const params = new URLSearchParams({
                status: activeTab, // 'open', 'acknowledged', 'resolved'
                limit: 50
            });

            if (priorityFilter) {
                params.append('priority', priorityFilter);
            }

            if (typeFilter) {
                params.append('escalation_type', typeFilter);
            }

            if (teamFilter) {
                params.append('team_id', teamFilter);
            }

            const response = await fetch(`${buildApiUrl('chat/admin/notifications')}?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load notifications: ${response.status}`);
            }

            const data = await response.json();
            setNotifications(data || []);

        } catch (err) {
            console.error('Failed to load notifications:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Handle notification resolution
     * @param {number} notificationId
     * @returns {Promise<void>}
     */
    async function handleResolve(notificationId) {
        try {
            const response = await fetch(buildApiUrl(`chat/admin/notifications/${notificationId}/resolve`), {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to resolve notification');
            }

            // Reload notifications after resolving
            await loadNotifications();

        } catch (err) {
            console.error('Failed to resolve notification:', err);
            alert('Failed to resolve notification: ' + err.message);
        }
    }

    /**
     * Handle notification acknowledgement
     * @param {number} notificationId
     * @returns {Promise<void>}
     */
    async function handleAcknowledge(notificationId) {
        try {
            const response = await fetch(buildApiUrl(`chat/admin/notifications/${notificationId}/acknowledge`), {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to acknowledge notification');
            }

            // Reload notifications after acknowledging
            await loadNotifications();

        } catch (err) {
            console.error('Failed to acknowledge notification:', err);
            alert('Failed to acknowledge notification: ' + err.message);
        }
    }

    /**
     * Handle filter changes
     */
    function handleFiltersChange({ priority, type, team }) {
        setPriorityFilter(priority);
        setTypeFilter(type);
        setTeamFilter(team);
    }

    /**
     * Handle filter reset
     */
    function handleResetFilters() {
        setPriorityFilter(null);
        setTypeFilter(null);
        setTeamFilter(null);
    }

    /**
     * Create a test notification (development only)
     */
    async function createTestNotification() {
        try {
            const response = await fetch(buildApiUrl('test/create-test-notification'), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create test notification');
            }

            const result = await response.json();
            console.log('[NotificationsDashboard] Test notification created:', result);
            alert(`Test notification created! Priority: ${result.priority}`);

        } catch (err) {
            console.error('Failed to create test notification:', err);
            alert('Failed to create test notification: ' + err.message);
        }
    }

    // Calculate stats
    const totalNotifications = notifications.length;
    const highPriorityCount = notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length;

    return (
        <div className="notifications-dashboard">
            <div className="notifications-card-container">
                <div className="card-header">
                    <div className="header-title-group">
                        <span>Admin Notifications</span>
                        {/* Test button (development only) */}
                        <button
                            className="test-notification-btn"
                            onClick={createTestNotification}
                            title="Create test notification (dev only)"
                        >
                            + Test
                        </button>
                    </div>
                    <div className="header-stats">
                        {/* SSE Connection Status (only for 'open' tab) */}
                        {activeTab === 'open' && (
                            <div className={`stat-badge connection-status ${connectionStatus}`}>
                                <span className="status-indicator"></span>
                                <span className="stat-label">
                                    {connectionStatus === 'connected' && 'Live'}
                                    {connectionStatus === 'connecting' && 'Connecting...'}
                                    {connectionStatus === 'disconnected' && 'Disconnected'}
                                </span>
                            </div>
                        )}

                        <div className="stat-badge">
                            <span className="stat-value">{totalNotifications}</span>
                            <span className="stat-label">Total</span>
                        </div>
                        {highPriorityCount > 0 && (
                            <div className="stat-badge high-priority">
                                <span className="stat-value">{highPriorityCount}</span>
                                <span className="stat-label">High Priority</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card-body">
                    {/* Tab Navigation */}
                    <div className="notifications-tabs">
                <button
                    className={`tab-button ${activeTab === 'open' ? 'active' : ''}`}
                    onClick={() => setActiveTab('open')}
                >
                    <span className="tab-icon">🔔</span>
                    Open
                    {activeTab === 'open' && totalNotifications > 0 && (
                        <span className="tab-badge">{totalNotifications}</span>
                    )}
                </button>
                <button
                    className={`tab-button ${activeTab === 'acknowledged' ? 'active' : ''}`}
                    onClick={() => setActiveTab('acknowledged')}
                >
                    <span className="tab-icon">👁️</span>
                    Acknowledged
                    {activeTab === 'acknowledged' && totalNotifications > 0 && (
                        <span className="tab-badge">{totalNotifications}</span>
                    )}
                </button>
                <button
                    className={`tab-button ${activeTab === 'resolved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('resolved')}
                >
                    <span className="tab-icon">✅</span>
                    Resolved
                </button>
            </div>

            {/* Filters */}
            <NotificationFilters
                priority={priorityFilter}
                type={typeFilter}
                team={teamFilter}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
            />

            {/* Notifications List */}
            <div className="notifications-container">
                {loading && notifications.length === 0 && (
                    <div className="notifications-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading notifications...</p>
                    </div>
                )}

                {error && (
                    <div className="notifications-error">
                        <p>⚠️ Error: {error}</p>
                        <button onClick={loadNotifications} className="retry-button">
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && notifications.length === 0 && (
                    <div className="notifications-empty">
                        <div className="empty-icon">✓</div>
                        <h3>No notifications found</h3>
                        <p>
                            {activeTab === 'open' && 'All clear! No open escalations.'}
                            {activeTab === 'acknowledged' && 'No acknowledged notifications.'}
                            {activeTab === 'resolved' && 'No resolved notifications yet.'}
                        </p>
                    </div>
                )}

                {!loading && !error && notifications.length > 0 && (
                    <div className="notifications-list">
                        {notifications.map(notification => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onResolve={handleResolve}
                                onAcknowledge={handleAcknowledge}
                                currentTab={activeTab}
                            />
                        ))}
                    </div>
                )}
            </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationsDashboard;
