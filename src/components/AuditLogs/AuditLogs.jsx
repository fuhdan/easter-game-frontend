/**
 * Module: components/AuditLogs/AuditLogs.jsx
 * Purpose: Audit log viewer for admin.db
 * Part of: Easter Quest 2025 Frontend - System Admin Panel
 *
 * Features:
 * - View all admin actions from centralized audit log
 * - Filter by admin user, event year, or action type
 * - Paginated display (100 logs per page by default)
 * - View detailed action information
 * - Statistics dashboard (total logs, recent activity, breakdown by action/admin)
 *
 * Access: Any admin role (transparency)
 *
 * @since 2026-03-18
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { getAuditLogs, getAuditStats } from '../../services/admin';
import AuditLogTable from './AuditLogTable';
import AuditLogFilters from './AuditLogFilters';
import './AuditLogs.css';

const AuditLogs = () => {
  // State management
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    limit: 100,
    offset: 0,
    total_count: 0,
    returned_count: 0
  });

  // Filter state
  const [filters, setFilters] = useState({
    admin_id: null,
    event_year: null,
    action: null
  });

  // Load logs and stats on mount and when filters/pagination change
  useEffect(() => {
    _loadLogs();
  }, [filters, pagination.offset]);

  useEffect(() => {
    _loadStats();
  }, []);

  /**
   * Load audit logs with current filters and pagination
   * @private
   */
  const _loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset
      };

      // Remove null filters
      Object.keys(filterParams).forEach((key) => {
        if (filterParams[key] === null || filterParams[key] === '') {
          delete filterParams[key];
        }
      });

      logger.debug('audit_load_logs', {
        filters: filterParams,
        module: 'AuditLogs'
      });

      const response = await getAuditLogs(filterParams);
      setLogs(response.logs);
      setPagination(response.pagination);

      logger.info('audit_logs_loaded', {
        count: response.logs.length,
        total: response.pagination.total_count,
        module: 'AuditLogs'
      });
    } catch (err) {
      logger.error('audit_load_logs_failed', {
        error: err.message,
        module: 'AuditLogs'
      }, err);
      setError(err.getUserMessage ? err.getUserMessage() : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load audit log statistics
   * @private
   */
  const _loadStats = async () => {
    try {
      logger.debug('audit_load_stats', { module: 'AuditLogs' });
      const response = await getAuditStats();
      setStats(response);
      logger.info('audit_stats_loaded', { module: 'AuditLogs' });
    } catch (err) {
      logger.error('audit_load_stats_failed', {
        error: err.message,
        module: 'AuditLogs'
      }, err);
      // Stats failure is not critical, don't show error
    }
  };

  /**
   * Handle filter change
   * @private
   * @param {string} field - Filter field name
   * @param {any} value - New filter value
   */
  const _handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, offset: 0 }));
    logger.debug('audit_filter_changed', { field, value, module: 'AuditLogs' });
  };

  /**
   * Handle clear all filters
   * @private
   */
  const _handleClearFilters = () => {
    setFilters({
      admin_id: null,
      event_year: null,
      action: null
    });
    setPagination((prev) => ({ ...prev, offset: 0 }));
    logger.info('audit_filters_cleared', { module: 'AuditLogs' });
  };

  /**
   * Handle page change
   * @private
   * @param {number} newOffset - New pagination offset
   */
  const _handlePageChange = (newOffset) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
    logger.debug('audit_page_changed', { offset: newOffset, module: 'AuditLogs' });
  };

  // Calculate current page number
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total_count / pagination.limit);

  return (
    <div className="audit-logs-container">
      {/* Header */}
      <div className="audit-logs-header">
        <div className="header-info">
          <h2>📋 Admin Audit Log</h2>
          <p className="header-description">
            View all admin actions from the centralized audit log (admin.db).
            All actions are logged for transparency and accountability.
          </p>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="stats-dashboard">
          <div className="stat-card">
            <div className="stat-value">{stats.total_count.toLocaleString()}</div>
            <div className="stat-label">Total Log Entries</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.recent_24h_count.toLocaleString()}</div>
            <div className="stat-label">Last 24 Hours</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.by_action.length}</div>
            <div className="stat-label">Action Types</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.by_admin.length}</div>
            <div className="stat-label">Admin Users</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <AuditLogFilters
        filters={filters}
        stats={stats}
        onFilterChange={_handleFilterChange}
        onClearFilters={_handleClearFilters}
      />

      {/* Error message */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="btn-retry" onClick={_loadLogs}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* Pagination Info */}
      {!loading && logs.length > 0 && (
        <div className="pagination-info">
          <span className="pagination-summary">
            Showing {pagination.offset + 1} - {pagination.offset + pagination.returned_count} of {pagination.total_count.toLocaleString()} entries
          </span>
          <span className="pagination-pages">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Audit Log Table */}
      <AuditLogTable
        logs={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={_handlePageChange}
      />
    </div>
  );
};

export default AuditLogs;
