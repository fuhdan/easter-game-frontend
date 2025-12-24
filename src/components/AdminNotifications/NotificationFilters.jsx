/**
 * Module: AdminNotifications/NotificationFilters.jsx
 * Purpose: Filter controls for admin notifications
 * Part of: Easter Quest 2025 - Phase 5: Admin Notification Panel
 *
 * Features:
 * - Filter by priority (normal, high, urgent)
 * - Filter by escalation type (frustration, technical, timeout, manual, etc.)
 * - Filter by team ID
 * - Reset all filters button
 * - Visual active filter indicators
 *
 * @since 2025-11-12
 */

import React from 'react';
import { logger } from '../../utils/logger';
import './NotificationFilters.css';

/**
 * Notification Filters Component
 *
 * @param {Object} props
 * @param {string|null} props.priority - Current priority filter
 * @param {string|null} props.type - Current escalation type filter
 * @param {number|null} props.team - Current team ID filter
 * @param {Function} props.onFiltersChange - Callback when filters change
 * @param {Function} props.onReset - Callback when reset button clicked
 * @returns {JSX.Element}
 */
const NotificationFilters = ({ priority, type, team, onFiltersChange, onReset }) => {
    /**
     * Handle priority filter change
     */
    function handlePriorityChange(e) {
        const value = e.target.value || null;
        logger.info('notification_filter_changed', {
            filterType: 'priority',
            previousValue: priority,
            newValue: value,
            module: 'NotificationFilters'
        });
        onFiltersChange({ priority: value, type, team });
    }

    /**
     * Handle type filter change
     */
    function handleTypeChange(e) {
        const value = e.target.value || null;
        logger.info('notification_filter_changed', {
            filterType: 'escalation_type',
            previousValue: type,
            newValue: value,
            module: 'NotificationFilters'
        });
        onFiltersChange({ priority, type: value, team });
    }

    /**
     * Handle team filter change
     */
    function handleTeamChange(e) {
        const value = e.target.value ? parseInt(e.target.value, 10) : null;
        logger.info('notification_filter_changed', {
            filterType: 'team',
            previousValue: team,
            newValue: value,
            module: 'NotificationFilters'
        });
        onFiltersChange({ priority, type, team: value });
    }

    /**
     * Handle filter reset
     */
    function handleReset() {
        logger.info('notification_filters_reset', {
            previousPriority: priority,
            previousType: type,
            previousTeam: team,
            module: 'NotificationFilters'
        });
        onReset();
    }

    // Check if any filters are active
    const hasActiveFilters = priority || type || team;

    return (
        <div className="notification-filters">
            <div className="filters-row">
                {/* Priority Filter */}
                <div className="filter-group">
                    <label htmlFor="priority-filter">Priority</label>
                    <select
                        id="priority-filter"
                        value={priority || ''}
                        onChange={handlePriorityChange}
                        className={priority ? 'active' : ''}
                    >
                        <option value="">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                    </select>
                </div>

                {/* Type Filter */}
                <div className="filter-group">
                    <label htmlFor="type-filter">Escalation Type</label>
                    <select
                        id="type-filter"
                        value={type || ''}
                        onChange={handleTypeChange}
                        className={type ? 'active' : ''}
                    >
                        <option value="">All Types</option>
                        <option value="frustration">User Frustration</option>
                        <option value="technical">Technical Issue</option>
                        <option value="timeout">Response Timeout</option>
                        <option value="manual">Manual Escalation</option>
                        <option value="bug">Bug Report</option>
                        <option value="stuck">User Stuck</option>
                        <option value="explicit_request">Support Request</option>
                    </select>
                </div>

                {/* Team Filter */}
                <div className="filter-group">
                    <label htmlFor="team-filter">Team ID</label>
                    <input
                        id="team-filter"
                        type="number"
                        min="1"
                        placeholder="Filter by team..."
                        value={team || ''}
                        onChange={handleTeamChange}
                        className={team ? 'active' : ''}
                    />
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                    <div className="filter-group filter-actions">
                        <button
                            className="btn-reset-filters"
                            onClick={handleReset}
                            title="Clear all filters"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="active-filters">
                    <span className="active-filters-label">Active filters:</span>
                    {priority && (
                        <span className="filter-badge">
                            Priority: {priority}
                        </span>
                    )}
                    {type && (
                        <span className="filter-badge">
                            Type: {type}
                        </span>
                    )}
                    {team && (
                        <span className="filter-badge">
                            Team: {team}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationFilters;
