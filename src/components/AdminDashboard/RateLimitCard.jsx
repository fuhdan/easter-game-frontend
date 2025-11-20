/**
 * Component: RateLimitCard
 * Purpose: Admin dashboard card for resetting login and API rate limits
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - Reset login rate limits (by IP address)
 * - Reset API rate limits (by user ID)
 * - Input validation
 * - Success/error toast notifications
 * - Matches existing dashboard styling
 *
 * @since 2025-11-06
 */

import React, { useState, useEffect, useCallback } from 'react';
import { onTokenRefresh, getConfig, resetRateLimitBulk, utils, getCurrentUser } from '../../services';
import './RateLimitCard.css';

/**
 * Rate Limit Reset Card Component
 *
 * @param {Object} props
 * @param {Object} props.user - Current authenticated admin user
 * @returns {JSX.Element}
 */
const RateLimitCard = ({ user }) => {
    // Blocked IP list state
    const [blockedIPs, setBlockedIPs] = useState([]);
    const [selectedIPs, setSelectedIPs] = useState(new Set());
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [eventSource, setEventSource] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [rateLimitConfig, setRateLimitConfig] = useState(null);

    /**
     * Show notification toast
     * @param {string} message - Notification message
     * @param {string} type - 'success' or 'error'
     */
    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    /**
     * Load rate limit configuration from system config
     */
    const loadRateLimitConfig = async () => {
        try {
            const response = await getConfig();

            // Extract rate limit config from system config
            const configs = response.configs || [];
            const config = {
                login: {
                    maxAttempts: configs.find(c => c.key === 'auth.login_max_attempts')?.value || 5,
                    windowSeconds: configs.find(c => c.key === 'auth.login_window_seconds')?.value || 60,
                    banDurationSeconds: configs.find(c => c.key === 'auth.login_ban_duration_seconds')?.value || 300
                },
                api: {
                    maxRequestsPerMinute: configs.find(c => c.key === 'rate_limits.api.max_requests')?.value || 100
                }
            };

            setRateLimitConfig(config);
        } catch (error) {
            console.error('Failed to load rate limit config:', error);
            // Use default values if fetch fails
            setRateLimitConfig({
                login: {
                    maxAttempts: 5,
                    windowSeconds: 60,
                    banDurationSeconds: 300
                },
                api: {
                    maxRequestsPerMinute: 100
                }
            });
        }
    };

    /**
     * Format TTL seconds to human-readable time
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    const formatTTL = (seconds) => {
        if (seconds <= 0) return 'Expired';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    };

    /**
     * Connect to SSE stream for real-time blocked IP updates
     */
    const connectToSSE = useCallback(() => {
        // Close existing connection if any
        setEventSource(prevES => {
            if (prevES) {
                console.log('Closing existing SSE connection');
                prevES.close();
            }
            return null;
        });

        setConnectionStatus('connecting');

        const es = new EventSource('/api/admin/blocked-ips/stream', {
            withCredentials: true  // Send cookies for authentication
        });

        // Handle blocked IPs updates
        es.addEventListener('blocked_ips_update', (event) => {
            const data = JSON.parse(event.data);
            setBlockedIPs(data.blocked_ips);
            setLastUpdated(new Date(data.timestamp));
            setConnectionStatus('connected');
        });

        // Handle heartbeat
        es.addEventListener('heartbeat', (event) => {
            // Just keep connection alive, no UI update needed
            console.log('SSE heartbeat received');
        });

        // Handle errors
        es.addEventListener('error', (event) => {
            if (event.data) {
                const data = JSON.parse(event.data);
                console.error('SSE error event:', data.error);
                showNotification('Failed to retrieve blocked IPs', 'error');
            }
        });

        // Handle connection errors (network issues, auth loss)
        es.onerror = (error) => {
            console.error('SSE connection error:', error);
            setConnectionStatus('disconnected');

            // EventSource automatically reconnects
            setTimeout(() => {
                if (es.readyState === EventSource.CONNECTING) {
                    setConnectionStatus('connecting');
                }
            }, 1000);
        };

        // Handle successful connection
        es.onopen = () => {
            console.log('SSE connection opened');
            setConnectionStatus('connected');
        };

        setEventSource(es);
        return es;
    }, []); // Empty dependency array - function never needs to be recreated

    /**
     * Handle bulk reset of selected IPs
     * SECURITY: Uses api service with automatic token refresh
     */
    const handleBulkReset = async () => {
        if (selectedIPs.size === 0) {
            showNotification('No IPs selected', 'error');
            return;
        }

        // Confirmation dialog
        if (!window.confirm(`Reset rate limits for ${selectedIPs.size} IP(s)?`)) {
            return;
        }

        setLoading(true);

        try {
            // Use api service instead of raw fetch - this handles token refresh automatically
            const data = await resetRateLimitBulk(Array.from(selectedIPs));

            if (data.success) {
                showNotification(`Successfully reset ${data.reset_count} IP(s)`, 'success');
                setSelectedIPs(new Set());
                // No need to manually refresh - SSE will push update within 2 seconds
            } else {
                showNotification(
                    `Reset ${data.reset_count} IP(s), ${data.failed_count} failed`,
                    'error'
                );

                // Remove successfully reset IPs from selection
                const failedIPs = data.results
                    .filter(r => !r.success)
                    .map(r => r.ip);
                setSelectedIPs(new Set(failedIPs));
            }
        } catch (error) {
            console.error('Error resetting IPs:', error);
            // Handle API error response
            utils.handleError(error, showNotification);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Toggle IP selection
     * @param {string} ip - IP address to toggle
     */
    const toggleIPSelection = (ip) => {
        const newSelected = new Set(selectedIPs);
        if (newSelected.has(ip)) {
            newSelected.delete(ip);
        } else {
            newSelected.add(ip);
        }
        setSelectedIPs(newSelected);
    };

    /**
     * Toggle all IPs selection
     */
    const toggleAllSelection = () => {
        if (selectedIPs.size === blockedIPs.length) {
            setSelectedIPs(new Set());
        } else {
            setSelectedIPs(new Set(blockedIPs.map(ip => ip.ip)));
        }
    };

    /**
     * Handle manual reconnect - check/refresh authentication before connecting
     * SECURITY: Ensures tokens are valid before establishing SSE connection
     */
    const handleManualReconnect = async () => {
        try {
            setConnectionStatus('connecting');
            setLoading(true);

            // Make a lightweight API call to trigger token refresh if needed
            // This will use the existing token refresh mechanism in api.js
            console.log('Checking authentication before SSE reconnect...');
            await getCurrentUser();

            // Small delay to ensure cookies are properly set
            setTimeout(() => {
                console.log('Authentication valid - connecting to SSE');
                connectToSSE();
                setLoading(false);
            }, 100);

        } catch (error) {
            console.error('Failed to reconnect SSE:', error);
            setConnectionStatus('disconnected');
            setLoading(false);
            showNotification('Failed to reconnect. Please try again.', 'error');
        }
    };

    // Connect to SSE when component mounts, disconnect on unmount
    useEffect(() => {
        // Load rate limit configuration
        loadRateLimitConfig();

        const es = connectToSSE();

        // Subscribe to token refresh events to reconnect SSE with new tokens
        const unsubscribe = onTokenRefresh(() => {
            console.log('Token refreshed - reconnecting SSE with new tokens');
            connectToSSE();
        });

        // Cleanup on unmount
        return () => {
            es.close();
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - only run once

    // Client-side countdown for ban TTL (updates every second between SSE updates)
    useEffect(() => {
        const intervalId = setInterval(() => {
            setBlockedIPs(prevIPs =>
                prevIPs.map(ip => {
                    if (ip.ban_ttl_seconds !== null && ip.ban_ttl_seconds > 0) {
                        return {
                            ...ip,
                            ban_ttl_seconds: ip.ban_ttl_seconds - 1
                        };
                    }
                    return ip;
                }).filter(ip => {
                    // Remove IPs whose ban has expired
                    if (ip.status === 'banned' && ip.ban_ttl_seconds <= 0) {
                        return false;
                    }
                    return true;
                })
            );
        }, 1000); // Update every second

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="rate-limit-card">
            <div className="card-header">
                🛡️ Rate Limit Management
            </div>

            <div className="card-body">
                {/* ========== BLOCKED IP LIST SECTION (Real-Time SSE) ========== */}
                <div className="blocked-ip-list-section">
                    <div className="section-header">
                        <h3>Currently Blocked IPs (Real-Time)</h3>
                    <div className="header-actions">
                        <span className="last-updated">
                            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                        </span>

                        {/* Connection Status */}
                        <div className={`connection-status status-${connectionStatus}`}>
                            {connectionStatus === 'connected' && '🟢 Live'}
                            {connectionStatus === 'connecting' && '🟡 Connecting...'}
                            {connectionStatus === 'disconnected' && '🔴 Disconnected'}
                        </div>

                        {/* Manual reconnect button (only show if disconnected) */}
                        {connectionStatus === 'disconnected' && (
                            <button
                                className="btn-reconnect"
                                onClick={handleManualReconnect}
                                disabled={loading}
                            >
                                🔄 Reconnect
                            </button>
                        )}
                    </div>
                </div>

                {blockedIPs.length === 0 ? (
                    <div className="empty-state">
                        ✅ No blocked IPs found
                    </div>
                ) : (
                    <>
                        <div className="bulk-actions">
                            <button
                                className="btn-select-all"
                                onClick={toggleAllSelection}
                            >
                                {selectedIPs.size === blockedIPs.length ? 'Deselect All' : 'Select All'}
                            </button>

                            <button
                                className="btn-reset-selected"
                                onClick={handleBulkReset}
                                disabled={selectedIPs.size === 0 || loading}
                            >
                                Reset Selected ({selectedIPs.size})
                            </button>
                        </div>

                        <table className="blocked-ip-table">
                            <thead>
                                <tr>
                                    <th width="50">
                                        <input
                                            type="checkbox"
                                            checked={selectedIPs.size === blockedIPs.length && blockedIPs.length > 0}
                                            onChange={toggleAllSelection}
                                        />
                                    </th>
                                    <th>IP Address</th>
                                    <th>Status</th>
                                    <th>Attempts</th>
                                    <th>Time Remaining</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blockedIPs.map((ipInfo) => (
                                    <tr key={ipInfo.ip} className={`status-${ipInfo.status}`}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIPs.has(ipInfo.ip)}
                                                onChange={() => toggleIPSelection(ipInfo.ip)}
                                            />
                                        </td>
                                        <td className="ip-address">{ipInfo.ip}</td>
                                        <td>
                                            <span className={`status-badge status-${ipInfo.status}`}>
                                                {ipInfo.status === 'banned' && '🔴 Banned'}
                                                {ipInfo.status === 'warning' && '🟡 Warning'}
                                                {ipInfo.status === 'active' && '🟢 Active'}
                                            </span>
                                        </td>
                                        <td>{ipInfo.attempt_count || '-'}</td>
                                        <td>
                                            {ipInfo.ban_ttl_seconds !== null
                                                ? formatTTL(ipInfo.ban_ttl_seconds)
                                                : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

                {/* Info Box */}
                <div className="rate-limit-info">
                    <h4>Rate Limits</h4>
                    {rateLimitConfig ? (
                        <>
                            <ul>
                                <li>
                                    <strong>Login:</strong> Maximum {rateLimitConfig.login.maxAttempts} failed attempts
                                    within {rateLimitConfig.login.windowSeconds} seconds per IP
                                </li>
                                <li>
                                    <strong>API:</strong> {rateLimitConfig.api.maxRequestsPerMinute} requests
                                    per minute per authenticated user
                                </li>
                            </ul>
                            <p className="info-note">
                                <strong>Login Protection:</strong> After {rateLimitConfig.login.maxAttempts} failed
                                attempts within {rateLimitConfig.login.windowSeconds} seconds, the IP is banned
                                for {Math.floor(rateLimitConfig.login.banDurationSeconds / 60)} minutes
                                ({rateLimitConfig.login.banDurationSeconds} seconds).
                                <br />
                                <strong>Aggressive Ban Extension:</strong> Each login attempt during an active ban
                                extends the ban by an additional {Math.floor(rateLimitConfig.login.banDurationSeconds / 60)} minutes
                                and increments the attempt counter.
                            </p>
                        </>
                    ) : (
                        <p>Loading configuration...</p>
                    )}
                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.type === 'success' ? '✓ ' : '✗ '}
                    {notification.message}
                </div>
            )}
        </div>
    );
};

export default RateLimitCard;
