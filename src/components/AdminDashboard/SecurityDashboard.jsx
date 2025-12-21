/**
 * Component: SecurityDashboard
 * Purpose: Security analytics dashboard for monitoring AI chat security
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - Summary statistics (today's blocks, week's blocks, block rate)
 * - Attack category breakdown with visual charts
 * - Language distribution analysis
 * - Recent security events table
 * - Daily trend visualization
 * - User activity monitoring
 *
 * @since 2025-12-17
 */

import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../../config/apiConfig';
import './SecurityDashboard.css';

/**
 * Attack category display configuration
 * Maps backend category codes to user-friendly display information
 */
const ATTACK_CATEGORIES = {
    'authority_impersonation': { icon: '👮', label: 'Authority Impersonation', color: '#dc3545' },
    'instruction_override': { icon: '⚠️', label: 'Instruction Override', color: '#fd7e14' },
    'direct_answer_request': { icon: '❓', label: 'Direct Answer Request', color: '#ffc107' },
    'cheating_attempt': { icon: '🎯', label: 'Cheating Attempt', color: '#ff6b6b' },
    'system_extraction': { icon: '🔓', label: 'System Extraction', color: '#e74c3c' },
    'social_engineering': { icon: '🎭', label: 'Social Engineering', color: '#f39c12' },
    'obfuscation_attack': { icon: '🔣', label: 'Obfuscation Attack', color: '#9b59b6' },
    'roleplay_bypass': { icon: '🎬', label: 'Roleplay Bypass', color: '#3498db' },
    'none': { icon: '✅', label: 'Safe Message', color: '#28a745' }
};

/**
 * Language display configuration
 */
const LANGUAGES = {
    'en': { flag: '🇬🇧', label: 'English' },
    'de': { flag: '🇩🇪', label: 'German' },
    'fr': { flag: '🇫🇷', label: 'French' },
    'it': { flag: '🇮🇹', label: 'Italian' },
    'es': { flag: '🇪🇸', label: 'Spanish' },
    'unknown': { flag: '❓', label: 'Unknown' }
};

/**
 * Security Dashboard Component
 *
 * Displays comprehensive security analytics for the AI chat system.
 * Monitors attack patterns, languages, and trends.
 *
 * @returns {JSX.Element}
 */
const SecurityDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [categories, setCategories] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [recentEvents, setRecentEvents] = useState([]);
    const [trend, setTrend] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadSecurityData();
    }, []);

    /**
     * Load all security analytics data
     * @async
     */
    const loadSecurityData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Load all endpoints in parallel (using 9999 days to get all event data)
            const [summaryRes, categoriesRes, languagesRes, eventsRes, trendRes, usersRes] = await Promise.all([
                fetch(buildApiUrl('admin/security/summary'), {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }),
                fetch(buildApiUrl('admin/security/stats/categories?days=9999'), {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }),
                fetch(buildApiUrl('admin/security/stats/languages?days=9999'), {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }),
                fetch(buildApiUrl('admin/security/events?limit=10&blocked_only=true'), {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }),
                fetch(buildApiUrl('admin/security/stats/trend?days=1'), {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                }),
                fetch(buildApiUrl('admin/security/stats/users?days=9999&limit=5'), {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' }
                })
            ]);

            // Check all responses
            if (!summaryRes.ok || !categoriesRes.ok || !languagesRes.ok ||
                !eventsRes.ok || !trendRes.ok || !usersRes.ok) {
                throw new Error('Failed to fetch security data');
            }

            // Parse all responses
            const summaryData = await summaryRes.json();
            const categoriesData = await categoriesRes.json();
            const languagesData = await languagesRes.json();
            const eventsData = await eventsRes.json();
            const trendData = await trendRes.json();
            const usersData = await usersRes.json();

            setSummary(summaryData);
            setCategories(categoriesData.categories || []);
            setLanguages(languagesData.languages || []);
            setRecentEvents(eventsData.events || []);
            setTrend(trendData.trend || []);
            setTopUsers(usersData.users || []);

            console.log('Security data loaded successfully');
            console.log('Summary data:', summaryData);
        } catch (err) {
            console.error('Failed to load security data:', err);
            setError('Failed to load security analytics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Render summary statistics cards
     * @returns {JSX.Element}
     */
    const renderSummaryStats = () => {
        if (!summary) return null;

        return (
            <div className="security-summary-grid">
                <div className="security-stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <div className="stat-label">Total Messages</div>
                        <div className="stat-value">{summary.total_messages || 0}</div>
                        <div className="stat-detail">
                            <span className="blocked">{summary.total_blocked || 0} blocked</span>
                            <span className="passed">{summary.total_passed || 0} passed</span>
                        </div>
                    </div>
                </div>

                <div className="security-stat-card">
                    <div className="stat-icon">🛡️</div>
                    <div className="stat-content">
                        <div className="stat-label">Block Rate</div>
                        <div className="stat-value">{summary.block_rate || 0}%</div>
                        <div className="stat-detail">Security effectiveness</div>
                    </div>
                </div>

                <div className="security-stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <div className="stat-label">Avg Suspicion Score</div>
                        <div className="stat-value">{summary.avg_suspicion_score || 0}</div>
                        <div className="stat-detail">Attack severity level</div>
                    </div>
                </div>

                <div className="security-stat-card">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <div className="stat-label">Top Threat</div>
                        <div className="stat-value-small">
                            {ATTACK_CATEGORIES[summary.most_common_attack?.category]?.icon || '❓'}
                            {ATTACK_CATEGORIES[summary.most_common_attack?.category]?.label || 'None'}
                        </div>
                        <div className="stat-detail">{summary.most_common_attack?.count || 0} attempts</div>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * Render attack categories breakdown
     * @returns {JSX.Element}
     */
    const renderCategoryBreakdown = () => {
        if (categories.length === 0) {
            return <div className="no-data">No attack data available</div>;
        }

        // Get max count for scaling bars
        const maxCount = Math.max(...categories.map(c => c.count));

        return (
            <div className="security-section">
                <h3>⚠️ Attack Categories</h3>
                <div className="category-list">
                    {categories.map((cat) => {
                        const config = ATTACK_CATEGORIES[cat.category] || { icon: '❓', label: cat.category, color: '#6c757d' };
                        const barWidth = (cat.count / maxCount) * 100;

                        return (
                            <div key={cat.category} className="category-item">
                                <div className="category-header">
                                    <span className="category-icon">{config.icon}</span>
                                    <span className="category-label">{config.label}</span>
                                    <span className="category-count">{cat.count}</span>
                                    <span className="category-percentage">{cat.percentage}%</span>
                                </div>
                                <div className="category-bar-container">
                                    <div
                                        className="category-bar"
                                        style={{
                                            width: `${barWidth}%`,
                                            backgroundColor: config.color
                                        }}
                                    >
                                        <span className="bar-label">Avg Score: {cat.avg_score}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    /**
     * Render language distribution
     * @returns {JSX.Element}
     */
    const renderLanguageDistribution = () => {
        if (languages.length === 0) {
            return <div className="no-data">No language data available</div>;
        }

        return (
            <div className="security-section">
                <h3>🌍 Language Distribution</h3>
                <div className="language-grid">
                    {languages.map((lang) => {
                        const config = LANGUAGES[lang.language] || { flag: '❓', label: lang.language };
                        return (
                            <div key={lang.language} className="language-item">
                                <div className="language-flag">{config.flag}</div>
                                <div className="language-info">
                                    <div className="language-label">{config.label}</div>
                                    <div className="language-stats">
                                        <span className="language-count">{lang.count} messages</span>
                                        <span className="language-percentage">{lang.percentage}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    /**
     * Render recent security events table
     * @returns {JSX.Element}
     */
    const renderRecentEvents = () => {
        if (recentEvents.length === 0) {
            return <div className="no-data">No recent blocked messages</div>;
        }

        return (
            <div className="security-section">
                <h3>🚨 Recent Blocked Messages</h3>
                <div className="events-table-container">
                    <table className="events-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Category</th>
                                <th>Lang</th>
                                <th>Score</th>
                                <th>Preview</th>
                                <th>User</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentEvents.map((event) => {
                                const config = ATTACK_CATEGORIES[event.attack_category] || { icon: '❓', label: event.attack_category };
                                const langConfig = LANGUAGES[event.original_language] || { flag: '❓' };
                                const timeAgo = getTimeAgo(event.created_at);

                                return (
                                    <tr key={event.id}>
                                        <td className="event-time">{timeAgo}</td>
                                        <td className="event-category">
                                            <span
                                                className="category-badge"
                                                style={{ borderColor: config.color }}
                                                title={config.label}
                                            >
                                                {config.icon}
                                            </span>
                                        </td>
                                        <td className="event-language">{langConfig.flag}</td>
                                        <td className="event-score">
                                            <span className={`score-badge ${getSeverityClass(event.suspicion_score)}`}>
                                                {event.suspicion_score}
                                            </span>
                                        </td>
                                        <td className="event-preview">
                                            {event.english_text_preview || 'N/A'}
                                        </td>
                                        <td className="event-user">{event.username || `User #${event.user_id}`}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    /**
     * Render daily trend chart
     * @returns {JSX.Element}
     */
    const renderDailyTrend = () => {
        if (trend.length === 0) {
            return <div className="no-data">No trend data available</div>;
        }

        const maxTotal = Math.max(...trend.map(t => t.total));

        return (
            <div className="security-section">
                <h3>📊 Hourly Trend (Last 24 Hours)</h3>
                <div className="trend-chart">
                    {trend.map((day) => {
                        const blockedHeight = maxTotal > 0 ? (day.blocked / maxTotal) * 100 : 0;
                        const passedHeight = maxTotal > 0 ? (day.passed / maxTotal) * 100 : 0;

                        return (
                            <div key={day.date} className="trend-bar-group">
                                <div className="trend-bars">
                                    <div
                                        className="trend-bar blocked"
                                        style={{ height: `${blockedHeight}%` }}
                                        title={`Blocked: ${day.blocked}`}
                                    />
                                    <div
                                        className="trend-bar passed"
                                        style={{ height: `${passedHeight}%` }}
                                        title={`Passed: ${day.passed}`}
                                    />
                                </div>
                                <div className="trend-label">{day.date}</div>
                                <div className="trend-count">{day.total}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="trend-legend">
                    <span className="legend-item"><span className="legend-color blocked"></span> Blocked</span>
                    <span className="legend-item"><span className="legend-color passed"></span> Passed</span>
                </div>
            </div>
        );
    };

    /**
     * Render top users with blocked messages
     * @returns {JSX.Element}
     */
    const renderTopUsers = () => {
        if (topUsers.length === 0) {
            return <div className="no-data">No user data available</div>;
        }

        return (
            <div className="security-section">
                <h3>👥 Top Users (Most Blocked)</h3>
                <div className="users-list">
                    {topUsers.map((user, index) => (
                        <div key={user.user_id} className="user-item">
                            <div className="user-rank">#{index + 1}</div>
                            <div className="user-info">
                                <div className="user-name">{user.display_name || user.username}</div>
                                <div className="user-details">
                                    <span className="user-team">{user.team_name}</span>
                                </div>
                            </div>
                            <div className="user-stats">
                                <div className="user-blocked-count">{user.blocked_count} blocked</div>
                                <div className="user-avg-score">Avg: {user.avg_score}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    /**
     * Get time ago string from ISO date
     * @param {string} isoDate - ISO date string
     * @returns {string} Time ago string
     */
    const getTimeAgo = (isoDate) => {
        const date = new Date(isoDate);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    /**
     * Get severity class based on score
     * @param {number} score - Suspicion score
     * @returns {string} CSS class
     */
    const getSeverityClass = (score) => {
        if (score >= 80) return 'critical';
        if (score >= 60) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    };

    // Loading state
    if (loading) {
        return (
            <div className="security-dashboard">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading security analytics...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="security-dashboard">
                <div className="error-state">
                    <p className="error-message">{error}</p>
                    <button onClick={loadSecurityData} className="retry-button">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="security-dashboard">
            {renderSummaryStats()}

            <div className="security-grid">
                <div className="security-col-main">
                    {renderCategoryBreakdown()}
                    {renderDailyTrend()}
                </div>

                <div className="security-col-side">
                    {renderLanguageDistribution()}
                    {renderTopUsers()}
                </div>
            </div>

            {renderRecentEvents()}
        </div>
    );
};

export default SecurityDashboard;
