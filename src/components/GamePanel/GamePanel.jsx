/**
 * Component: GamePanel
 * Purpose: Game interface for players with challenges and progress
 * Part of: Easter Quest Frontend
 *
 * Features:
 * - Display active Easter event story
 * - Show available games for current event
 * - Game selection and solution submission
 * - Team progress tracking
 * - Category-based game organization
 * - Collapsible story section
 *
 * @since 2025-08-27
 */

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../../utils/logger';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import CurrentGame from './CurrentGame';
import TeamProgress from './TeamProgress';
import { getActive, getGames } from '../../services';
import { replaceImagePlaceholder } from '../../utils/imageUtils';
import { useTeamGameUpdates } from '../../hooks/useTeamGameUpdates';
import './GamePanel.css';

/**
 * Game panel component for active game participation.
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user
 * @returns {JSX.Element}
 */
const GamePanel = ({ user }) => {
    const [activeEvent, setActiveEvent] = useState(null);
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [storyCollapsed, setStoryCollapsed] = useState(false);
    const [teamProgressRefreshKey, setTeamProgressRefreshKey] = useState(0);

    /**
     * Load active event and its games.
     * @async
     * @returns {Promise<void>}
     */
    const loadEventAndGames = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch active event with full story
            const event = await getActive();
            setActiveEvent(event);

            // Fetch games for this event
            if (event && event.id) {
                const eventGames = await getGames(event.id);
                setGames(eventGames);
            }
        } catch (err) {
            logger.error('Error loading event and games:', err);
            setError(err.message || 'Failed to load games');
        } finally {
            setLoading(false);
            // Increment refresh key to trigger TeamProgress refresh
            setTeamProgressRefreshKey(prev => prev + 1);
        }
    }, []); // No dependencies needed

    // SSE event handlers (wrapped in useCallback to prevent reconnection loops)
    const handleGameStarted = useCallback((data) => {
        logger.debug('[GamePanel] Team member started game:', data);
        // Refresh games list to show updated progress
        loadEventAndGames();
    }, [loadEventAndGames]);

    const handleGameCompleted = useCallback((data) => {
        logger.debug('[GamePanel] Team member completed game:', data);
        // Only refresh if another team member completed (not current user)
        // Current user's completion already refreshes via onSubmitSolution
        if (data.completed_by_user_id !== user.id) {
            logger.debug('[GamePanel] Refreshing for teammate completion');
            loadEventAndGames();
        } else {
            logger.debug('[GamePanel] Skipping refresh - current user already refreshed');
        }
    }, [user.id, loadEventAndGames]);

    const handleHintUsed = useCallback((data) => {
        logger.debug('[GamePanel] Team member used hint:', data);
        // Optionally refresh to show updated hint count
    }, []);

    const handleSSEConnect = useCallback(() => {
        logger.debug('[GamePanel] SSE connected');
    }, []);

    const handleSSEDisconnect = useCallback(() => {
        logger.debug('[GamePanel] SSE disconnected');
    }, []);

    const handleSSEError = useCallback((errorData) => {
        logger.error('[GamePanel] SSE error:', errorData);
    }, []);

    // SSE: Set up real-time team game updates using hook
    useTeamGameUpdates({
        onGameStarted: handleGameStarted,
        onGameCompleted: handleGameCompleted,
        onHintUsed: handleHintUsed,
        onConnect: handleSSEConnect,
        onDisconnect: handleSSEDisconnect,
        onError: handleSSEError
    });

    useEffect(() => {
        loadEventAndGames();
    }, [loadEventAndGames]);

    // AI-BASED PROGRESS TRACKING: Listen for progress updates from AI
    useEffect(() => {
        const handleProgressUpdate = (event) => {
            logger.info('[GamePanel] AI updated game progress - refreshing', {
                gameId: event.detail.gameId,
                source: event.detail.source
            });
            loadEventAndGames();
        };

        window.addEventListener('gameProgressUpdated', handleProgressUpdate);

        return () => {
            window.removeEventListener('gameProgressUpdated', handleProgressUpdate);
        };
    }, [loadEventAndGames]);

    /**
     * Get current game ID (if user has one in progress).
     *
     * @returns {number|null} Current game ID or null
     */
    const getCurrentGameId = () => {
        if (!games || games.length === 0) return null;

        const currentGame = games.find(
            (g) => g.progress && g.progress.status === 'in_progress'
        );

        return currentGame?.id || null;
    };

    if (loading) {
        return (
            <div className="game-panel">
                <div className="profile-card">
                    <div className="card-body">
                        <p>Loading event and games...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="game-panel">
                <div className="profile-card">
                    <div className="card-body">
                        <p className="error-text">Error: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="game-panel">
            <div className="game-panel-layout">
                <div className="game-panel-left">
                    {/* Event Story Section - Collapsible */}
                    {activeEvent && (
                        <div className="event-story-card profile-card">
                            <div
                                className="card-header clickable"
                                onClick={() => setStoryCollapsed(!storyCollapsed)}
                            >
                                <div>
                                    📖 {activeEvent.title}
                                    {activeEvent.author && <small className="author-text">by {activeEvent.author}</small>}
                                </div>
                                <span>{storyCollapsed ? '▼' : '▲'}</span>
                            </div>
                            {!storyCollapsed && (
                                <div className="card-body">
                                    <div
                                        className="event-story-content"
                                        dangerouslySetInnerHTML={{
                                            // SECURITY: Sanitize HTML to prevent XSS attacks
                                            __html: DOMPurify.sanitize(
                                                replaceImagePlaceholder(
                                                    activeEvent.story_html,
                                                    activeEvent.image_data
                                                ),
                                                {
                                                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'img', 'div', 'span', 'a', 'blockquote', 'pre', 'code'],
                                                    ALLOWED_ATTR: ['class', 'src', 'alt', 'style', 'href', 'target', 'rel']
                                                }
                                            )
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Games Section */}
                    <CurrentGame
                        games={games}
                        activeEvent={activeEvent}
                        showPoints={activeEvent?.show_points !== false}
                        user={user}
                        onSubmitSolution={loadEventAndGames}
                    />
                </div>

                <div className="game-panel-right">
                    {/* Team Progress */}
                    <TeamProgress
                        user={user}
                        teamId={user.team_id}
                        eventId={activeEvent?.id}
                        currentGameId={getCurrentGameId()}
                        showPoints={activeEvent?.show_points !== false}
                        refreshKey={teamProgressRefreshKey}
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * PropTypes validation for GamePanel component
 */
GamePanel.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        username: PropTypes.string.isRequired,
        team_id: PropTypes.number,
        team_name: PropTypes.string,
        role: PropTypes.string.isRequired
    }).isRequired
};

export default GamePanel;