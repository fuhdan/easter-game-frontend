/**
 * Module: components/AuditLogs/AuditLogTable.jsx
 * Purpose: Paginated table display for audit logs
 * Part of: Easter Quest 2025 Frontend - Audit Logs
 *
 * Features:
 * - Display audit log entries in table format
 * - Show details (action, admin, timestamp, IP, etc.)
 * - Expandable rows for detailed JSON data
 * - Pagination controls
 * - Format timestamps for readability
 * - Color-coded action types
 *
 * @since 2026-03-18
 */

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';

/**
 * Get action badge class based on action type
 * @param {string} action - Action type
 * @returns {string} CSS class name
 */
const getActionBadgeClass = (action) => {
  if (action.includes('created')) return 'action-badge action-create';
  if (action.includes('updated') || action.includes('modified')) return 'action-badge action-update';
  if (action.includes('deleted') || action.includes('removed')) return 'action-badge action-delete';
  if (action.includes('reset')) return 'action-badge action-reset';
  if (action.includes('login') || action.includes('authenticated')) return 'action-badge action-auth';
  return 'action-badge action-default';
};

/**
 * Format action name for display
 * @param {string} action - Action type
 * @returns {string} Formatted action name
 */
const formatActionName = (action) => {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Format timestamp to human-readable format
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted timestamp
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    return format(parseISO(timestamp), 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return 'Invalid date';
  }
};

const AuditLogTable = ({ logs, loading, pagination, onPageChange }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  /**
   * Toggle row expansion
   * @param {number} logId - Log entry ID
   */
  const _toggleRowExpansion = (logId) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  /**
   * Handle previous page button
   */
  const _handlePreviousPage = () => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    onPageChange(newOffset);
  };

  /**
   * Handle next page button
   */
  const _handleNextPage = () => {
    const newOffset = pagination.offset + pagination.limit;
    if (newOffset < pagination.total_count) {
      onPageChange(newOffset);
    }
  };

  // Render loading state
  if (loading && logs.length === 0) {
    return (
      <div className="audit-log-table-container">
        <div className="loading-spinner">Loading audit logs...</div>
      </div>
    );
  }

  // Render empty state
  if (!loading && logs.length === 0) {
    return (
      <div className="audit-log-table-container">
        <div className="empty-state">
          <p>No audit logs found</p>
          <p className="empty-hint">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-log-table-container">
      <table className="audit-log-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}></th>
            <th>Timestamp</th>
            <th>Admin User</th>
            <th>Action</th>
            <th>Event Year</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const isExpanded = expandedRows.has(log.id);

            return (
              <React.Fragment key={log.id}>
                {/* Main row */}
                <tr className="audit-log-row">
                  <td className="expand-cell">
                    <button
                      className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => _toggleRowExpansion(log.id)}
                      title={isExpanded ? 'Collapse details' : 'Expand details'}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </td>
                  <td className="timestamp-cell">{formatTimestamp(log.timestamp)}</td>
                  <td className="admin-cell">{log.admin_username}</td>
                  <td className="action-cell">
                    <span className={getActionBadgeClass(log.action)}>
                      {formatActionName(log.action)}
                    </span>
                  </td>
                  <td className="year-cell">{log.event_year || 'N/A'}</td>
                  <td className="ip-cell">{log.ip_address || 'N/A'}</td>
                </tr>

                {/* Expanded details row */}
                {isExpanded && (
                  <tr className="details-row">
                    <td colSpan="6">
                      <div className="details-content">
                        <div className="detail-section">
                          <h4>Log Details</h4>
                          <div className="detail-grid">
                            <div className="detail-item">
                              <span className="detail-label">Log ID:</span>
                              <span className="detail-value">{log.id}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Admin ID:</span>
                              <span className="detail-value">{log.admin_id}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">User Agent:</span>
                              <span className="detail-value">{log.user_agent || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="detail-section">
                            <h4>Action Details</h4>
                            <pre className="json-details">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {pagination.total_count > pagination.limit && (
        <div className="pagination-controls">
          <button
            className="btn-page"
            onClick={_handlePreviousPage}
            disabled={pagination.offset === 0}
          >
            ← Previous
          </button>
          <span className="pagination-text">
            Page {Math.floor(pagination.offset / pagination.limit) + 1} of{' '}
            {Math.ceil(pagination.total_count / pagination.limit)}
          </span>
          <button
            className="btn-page"
            onClick={_handleNextPage}
            disabled={pagination.offset + pagination.limit >= pagination.total_count}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogTable;
