/**
 * Module: AdminNotifications/NotificationCard.jsx
 * Purpose: Individual notification card display component
 * Part of: Easter Quest 2025 - Phase 5: Admin Notification Panel
 *
 * Features:
 * - Display notification details (team, message, priority, type)
 * - Color-coded priority indicators (🔴 red, 🟡 yellow, 🟢 green)
 * - Relative timestamps ("5 minutes ago", "2 hours ago")
 * - Resolve button for unresolved notifications
 * - Acknowledge button for open notifications
 * - Team context display (if available)
 * - Triggered by users list
 *
 * @since 2025-11-12
 */

import React, { useState } from 'react';
import { logger } from '../../utils/logger';
import api from '../../services/api';
import './NotificationCard.css';

/**
 * Format timestamp to relative time
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Relative time string
 */
function formatRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    // Format as date if older than 7 days
    return time.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

/**
 * Get priority display information
 * @param {string} priority - Priority level (normal, high, urgent)
 * @returns {Object} Priority config { color, label, icon }
 */
function getPriorityConfig(priority) {
    switch (priority) {
        case 'urgent':
        case 'high':
            return { color: 'red', label: 'High Priority', icon: '🔴' };
        case 'medium':
            return { color: 'yellow', label: 'Medium Priority', icon: '🟡' };
        case 'low':
        case 'normal':
        default:
            return { color: 'green', label: 'Normal Priority', icon: '🟢' };
    }
}

/**
 * Get escalation type display name
 * @param {string} type - Escalation type
 * @returns {string} Display name
 */
function getEscalationTypeLabel(type) {
    const labels = {
        'frustration': 'User Frustration',
        'technical': 'Technical Issue',
        'timeout': 'Response Timeout',
        'manual': 'Manual Escalation',
        'bug': 'Bug Report',
        'stuck': 'User Stuck',
        'explicit_request': 'Support Request',
        'provision_failed': 'Provision Failed'
    };
    return labels[type] || type;
}

/**
 * Notification Card Component
 *
 * @param {Object} props
 * @param {Object} props.notification - Notification object from API
 * @param {Function} props.onResolve - Callback when resolve button clicked
 * @param {Function} props.onAcknowledge - Callback when acknowledge button clicked
 * @param {string} props.currentTab - Current active tab ('open', 'acknowledged', 'resolved')
 * @returns {JSX.Element}
 */
const NotificationCard = ({ notification, onResolve, onAcknowledge, currentTab }) => {
    const priorityConfig = getPriorityConfig(notification.priority);
    const relativeTime = formatRelativeTime(notification.created_at);
    const [isRetrying, setIsRetrying] = useState(false);
    const [detailsExpanded, setDetailsExpanded] = useState(false);

    // Check if this is a provision failure notification
    const isProvisionFailure = notification.escalation_type === 'provision_failed';
    const provisionId = notification.context_data?.team_reward_provision_id;

    /**
     * Handle resolve button click
     */
    function handleResolve() {
        if (window.confirm('Mark this notification as resolved?')) {
            logger.info('notification_resolved', {
                notificationId: notification.id,
                teamName: notification.team_name,
                escalationType: notification.escalation_type,
                priority: notification.priority,
                currentTab,
                module: 'NotificationCard'
            });
            onResolve(notification.id);
        } else {
            logger.debug('notification_resolve_cancelled', {
                notificationId: notification.id,
                module: 'NotificationCard'
            });
        }
    }

    /**
     * Handle acknowledge button click
     */
    function handleAcknowledge() {
        logger.info('notification_acknowledged', {
            notificationId: notification.id,
            teamName: notification.team_name,
            escalationType: notification.escalation_type,
            priority: notification.priority,
            module: 'NotificationCard'
        });
        onAcknowledge(notification.id);
    }

    /**
     * Handle retry provisioning click
     */
    async function handleRetryProvisioning() {
        if (!provisionId) {
            return;
        }

        setIsRetrying(true);
        logger.info('provision_retry_started', {
            notificationId: notification.id,
            provisionId: provisionId,
            teamName: notification.team_name,
            module: 'NotificationCard'
        });

        try {
            await api.retryProvision(provisionId);

            logger.info('provision_retry_success', {
                notificationId: notification.id,
                provisionId: provisionId,
                module: 'NotificationCard'
            });

            // Automatically resolve the notification after successful retry
            onResolve(notification.id);
        } catch (error) {
            logger.error('provision_retry_failed', {
                notificationId: notification.id,
                provisionId: provisionId,
                error: error.message,
                module: 'NotificationCard'
            });

            // Just log the error, no popup - the notification will be updated by SSE
        } finally {
            setIsRetrying(false);
        }
    }

    return (
        <div className={`notification-card priority-${priorityConfig.color} ${currentTab === 'resolved' ? 'resolved' : ''}`}>
            {/* Priority Indicator */}
            <div className="notification-priority-bar"></div>

            {/* Card Header */}
            <div className="notification-header">
                <div className="notification-meta">
                    <div className="notification-priority">
                        <span className="priority-icon">{priorityConfig.icon}</span>
                        <span className="priority-label">{priorityConfig.label}</span>
                    </div>
                    <div className="notification-type">
                        {getEscalationTypeLabel(notification.escalation_type)}
                    </div>
                </div>
                <div className="notification-time">
                    {relativeTime}
                </div>
            </div>

            {/* Team Info */}
            <div className="notification-team">
                <strong>Triggered by:</strong> {notification.team_name}
                {notification.repeat_count > 1 && (
                    <span className="repeat-badge">
                        ×{notification.repeat_count}
                    </span>
                )}
            </div>

            {/* Message */}
            <div className="notification-message">
                {notification.message.split('\n').map((line, idx) => (
                    <React.Fragment key={idx}>
                        {line}
                        {idx < notification.message.split('\n').length - 1 && <br />}
                    </React.Fragment>
                ))}
            </div>

            {/* Provision Failure Details */}
            {isProvisionFailure && notification.context_data && (
                <div className="provision-failure-details">
                    <button
                        className="details-toggle"
                        onClick={() => setDetailsExpanded(!detailsExpanded)}
                    >
                        {detailsExpanded ? '▼' : '▶'} {detailsExpanded ? 'Hide' : 'Show'} Technical Details
                    </button>
                    {detailsExpanded && (
                        <div className="provision-details-content">
                            <div className="detail-row">
                                <strong>Reward:</strong> {notification.context_data.reward_name}
                            </div>
                            <div className="detail-row">
                                <strong>Type:</strong> {notification.context_data.reward_type}
                            </div>
                            <div className="detail-row">
                                <strong>Game Trigger:</strong> {notification.context_data.triggered_by_game_name}
                            </div>
                            <div className="detail-row">
                                <strong>API URL:</strong> <code>{notification.context_data.api_url}</code>
                            </div>
                            <div className="detail-row">
                                <strong>Error:</strong> <span className="error-text">{notification.context_data.error_message}</span>
                            </div>
                            {notification.context_data.http_status_code && (
                                <div className="detail-row">
                                    <strong>HTTP Status:</strong> {notification.context_data.http_status_code}
                                </div>
                            )}
                            {notification.context_data.retry_count > 0 && (
                                <div className="detail-row">
                                    <strong>Retry Attempts:</strong> {notification.context_data.retry_count}
                                </div>
                            )}
                            <div className="detail-row">
                                <strong>Failed At:</strong> {new Date(notification.context_data.failed_at).toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Context Data (for non-provision failures) */}
            {!isProvisionFailure && notification.context_data && (
                <div className="notification-context">
                    <details>
                        <summary>View Team Context</summary>
                        <pre>{JSON.stringify(notification.context_data, null, 2)}</pre>
                    </details>
                </div>
            )}

            {/* Acknowledged Info */}
            {currentTab === 'acknowledged' && notification.acknowledged_at && (
                <div className="notification-acknowledged-info">
                    <span>👁️ Acknowledged {formatRelativeTime(notification.acknowledged_at)}</span>
                    {notification.acknowledged_by_username && (
                        <span> by @{notification.acknowledged_by_username}</span>
                    )}
                </div>
            )}

            {/* Status Info (for resolved notifications) */}
            {currentTab === 'resolved' && notification.resolved_at && (
                <div className="notification-resolved-info">
                    <span>✓ Resolved {formatRelativeTime(notification.resolved_at)}</span>
                    {notification.resolved_by_username && (
                        <span> by @{notification.resolved_by_username}</span>
                    )}
                </div>
            )}

            {/* Actions */}
            {currentTab !== 'resolved' && (
                <div className="notification-actions">
                    {/* Show "Retry Provisioning" button for provision failures */}
                    {isProvisionFailure && provisionId && (
                        <button
                            className="btn-retry-provision"
                            onClick={handleRetryProvisioning}
                            disabled={isRetrying}
                            title="Retry the provision webhook call"
                        >
                            {isRetrying ? 'Retrying...' : '🔄 Retry Provisioning'}
                        </button>
                    )}
                    {/* Show "Acknowledge" button only for open notifications */}
                    {currentTab === 'open' && (
                        <button
                            className="btn-acknowledge"
                            onClick={handleAcknowledge}
                            title="Mark as acknowledged (seen by admin)"
                        >
                            Acknowledge
                        </button>
                    )}
                    {/* Show "Resolve" button for both open and acknowledged notifications */}
                    <button
                        className="btn-resolve"
                        onClick={handleResolve}
                        title="Mark as resolved (issue fixed)"
                    >
                        Resolve
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationCard;
