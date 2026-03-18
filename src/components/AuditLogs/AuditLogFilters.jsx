/**
 * Module: components/AuditLogs/AuditLogFilters.jsx
 * Purpose: Filter controls for audit log viewer
 * Part of: Easter Quest 2025 Frontend - Audit Logs
 *
 * Features:
 * - Filter by admin user (dropdown populated from stats)
 * - Filter by event year (dropdown populated from stats)
 * - Filter by action type (dropdown populated from stats)
 * - Clear all filters button
 * - Show active filter count
 *
 * @since 2026-03-18
 */

import React from 'react';

/**
 * Get unique event years from stats
 * @param {Object} stats - Audit log statistics
 * @returns {Array<number>} Sorted array of event years
 */
const getEventYears = (stats) => {
  if (!stats || !stats.by_action) return [];

  // For now, return common years (can be extracted from backend later)
  const currentYear = new Date().getFullYear();
  return [currentYear - 1, currentYear, currentYear + 1];
};

const AuditLogFilters = ({ filters, stats, onFilterChange, onClearFilters }) => {
  // Count active filters
  const activeFilterCount = Object.values(filters).filter((v) => v !== null && v !== '').length;

  return (
    <div className="audit-log-filters-container">
      <div className="filters-header">
        <h3>🔍 Filters</h3>
        {activeFilterCount > 0 && (
          <button className="btn-clear-filters" onClick={onClearFilters}>
            ✕ Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div className="filters-grid">
        {/* Filter by Admin User */}
        <div className="filter-group">
          <label htmlFor="filter-admin">Admin User</label>
          <select
            id="filter-admin"
            value={filters.admin_id || ''}
            onChange={(e) => onFilterChange('admin_id', e.target.value || null)}
          >
            <option value="">All Admins</option>
            {stats &&
              stats.by_admin &&
              stats.by_admin.map((admin) => (
                <option key={admin.admin_username} value={admin.admin_username}>
                  {admin.admin_username} ({admin.count})
                </option>
              ))}
          </select>
        </div>

        {/* Filter by Event Year */}
        <div className="filter-group">
          <label htmlFor="filter-year">Event Year</label>
          <select
            id="filter-year"
            value={filters.event_year || ''}
            onChange={(e) => onFilterChange('event_year', e.target.value || null)}
          >
            <option value="">All Years</option>
            {getEventYears(stats).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Action Type */}
        <div className="filter-group">
          <label htmlFor="filter-action">Action Type</label>
          <select
            id="filter-action"
            value={filters.action || ''}
            onChange={(e) => onFilterChange('action', e.target.value || null)}
          >
            <option value="">All Actions</option>
            {stats &&
              stats.by_action &&
              stats.by_action.map((action) => (
                <option key={action.action} value={action.action}>
                  {action.action.replace(/_/g, ' ')} ({action.count})
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default AuditLogFilters;
