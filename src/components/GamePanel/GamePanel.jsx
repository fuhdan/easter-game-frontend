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

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import CurrentGame from './CurrentGame';
import TeamProgress from './TeamProgress';
import { getActive, getGames } from '../../services';
import { replaceImagePlaceholder } from '../../utils/imageUtils';
import TeamGameUpdatesSSE from '../../services/TeamGameUpdatesSSE';
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

    // SSE client reference for real-time team game updates
    const sseClient = useRef(null);

    useEffect(() => {
        loadEventAndGames();
    }, []);

    // SSE: Set up real-time team game updates
    useEffect(() => {
        console.log('[GamePanel] Setting up SSE for team game updates');

        // Create SSE client if not exists
        if (!sseClient.current) {
            sseClient.current = new TeamGameUpdatesSSE();

            // Handle game_started event
            sseClient.current.on('game_started', (data) => {
                console.log('[GamePanel] Team member started game:', data);
                // Refresh games list to show updated progress
                loadEventAndGames();
            });

            // Handle game_completed event
            sseClient.current.on('game_completed', (data) => {
                console.log('[GamePanel] Team member completed game:', data);
                // Refresh games list to show completion
                loadEventAndGames();
            });

            // Handle hint_used event (optional)
            sseClient.current.on('hint_used', (data) => {
                console.log('[GamePanel] Team member used hint:', data);
                // Optionally refresh to show updated hint count
            });

            // Handle connection status
            sseClient.current.on('connected', () => {
                console.log('[GamePanel] SSE connected');
            });

            sseClient.current.on('disconnected', () => {
                console.log('[GamePanel] SSE disconnected');
            });

            sseClient.current.on('error', (errorData) => {
                console.error('[GamePanel] SSE error:', errorData);
            });
        }

        // Connect to SSE
        sseClient.current.connect();

        // Cleanup on unmount
        return () => {
            if (sseClient.current) {
                console.log('[GamePanel] Disconnecting SSE');
                sseClient.current.disconnect();
                sseClient.current = null;
            }
        };
    }, []); // Empty deps = only runs on mount/unmount

    /**
     * Load active event and its games.
     * @async
     * @returns {Promise<void>}
     */
    async function loadEventAndGames() {
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
            console.error('Error loading event and games:', err);
            setError(err.message || 'Failed to load games');
        } finally {
            setLoading(false);
        }
    }

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
                        onRefresh={loadEventAndGames}
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