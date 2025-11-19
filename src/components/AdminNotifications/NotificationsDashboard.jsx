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

import React, { useState, useEffect } from 'react';
import NotificationCard from './NotificationCard';
import NotificationFilters from './NotificationFilters';
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

    // Filter states
    const [activeTab, setActiveTab] = useState('open'); // 'open', 'resolved'
    const [priorityFilter, setPriorityFilter] = useState(null);
    const [typeFilter, setTypeFilter] = useState(null);
    const [teamFilter, setTeamFilter] = useState(null);

    // Pagination
    const [limit] = useState(50);

    useEffect(() => {
        loadNotifications();
        // Poll for updates every 10 seconds
        const interval = setInterval(loadNotifications, 10000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, priorityFilter, typeFilter, teamFilter]);

    /**
     * Load notifications from API with current filters
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
                limit: limit
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

            const response = await fetch(`/api/chat/admin/notifications?${params.toString()}`, {
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
            const response = await fetch(`/api/chat/admin/notifications/${notificationId}/resolve`, {
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
            const response = await fetch(`/api/chat/admin/notifications/${notificationId}/acknowledge`, {
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

    // Calculate stats
    const totalNotifications = notifications.length;
    const highPriorityCount = notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length;

    return (
        <div className="notifications-dashboard">
            <div className="notifications-card-container">
                <div className="card-header">
                    <span>Admin Notifications</span>
                    <div className="header-stats">
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
                    Open
                    {activeTab === 'open' && totalNotifications > 0 && (
                        <span className="tab-badge">{totalNotifications}</span>
                    )}
                </button>
                <button
                    className={`tab-button ${activeTab === 'acknowledged' ? 'active' : ''}`}
                    onClick={() => setActiveTab('acknowledged')}
                >
                    Acknowledged
                    {activeTab === 'acknowledged' && totalNotifications > 0 && (
                        <span className="tab-badge">{totalNotifications}</span>
                    )}
                </button>
                <button
                    className={`tab-button ${activeTab === 'resolved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('resolved')}
                >
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
