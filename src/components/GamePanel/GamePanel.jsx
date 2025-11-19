/**
 * Component: GamePanel
 * Purpose: Game interface for players with challenges and progress
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 */

import React, { useState, useEffect } from 'react';
import CurrentGame from './CurrentGame';
import TeamProgress from './TeamProgress';
import api from '../../services/api';
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

    useEffect(() => {
        loadEventAndGames();
    }, []);

    /**
     * Replace {{EVENT_IMAGE}} placeholder with actual base64 image in story HTML.
     * @param {string} html - Story HTML with placeholder
     * @param {string} imageData - Base64 image data
     * @returns {string} - HTML with image tag
     */
    function replaceImagePlaceholder(html, imageData) {
        if (!html || !imageData) return html;

        // Detect image type from base64 prefix (if present) or default to jpeg
        let mimeType = 'image/jpeg';
        if (imageData.startsWith('iVBOR')) {
            mimeType = 'image/png';
        } else if (imageData.startsWith('/9j/')) {
            mimeType = 'image/jpeg';
        } else if (imageData.startsWith('R0lGOD')) {
            mimeType = 'image/gif';
        }

        // Create the base64 data URI
        const dataUri = `data:${mimeType};base64,${imageData}`;

        // Replace all instances of <img src="{{EVENT_IMAGE}}" ... />
        // This regex finds img tags with src="{{EVENT_IMAGE}}"
        return html.replace(
            /<img\s+([^>]*\s+)?src=["']{{EVENT_IMAGE}}["']([^>]*)>/gi,
            (match, beforeSrc, afterSrc) => {
                // Preserve other attributes from the original tag
                const before = beforeSrc || '';
                const after = afterSrc || '';
                return `<img ${before}src="${dataUri}"${after}>`;
            }
        );
    }

    /**
     * Load active event and its games.
     * @async
     * @returns {Promise<void>}
     */
    async function loadEventAndGames() {
        try {
            setLoading(true);

            // Fetch active event with full story
            const event = await api.events.getActive();
            setActiveEvent(event);

            // Fetch games for this event
            if (event && event.id) {
                const eventGames = await api.events.getGames(event.id);
                setGames(eventGames);
            }
        } catch (err) {
            console.error('Error loading event and games:', err);
            setError(err.message || 'Failed to load games');
        } finally {
            setLoading(false);
        }
    }

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
                        <p style={{color: 'red'}}>Error: {error}</p>
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
                        <div className="event-story-card profile-card" style={{marginBottom: '20px'}}>
                            <div
                                className="card-header clickable"
                                onClick={() => setStoryCollapsed(!storyCollapsed)}
                                style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                            >
                                <div>
                                    📖 {activeEvent.title}
                                    {activeEvent.author && <small style={{marginLeft: '10px', opacity: 0.7}}>by {activeEvent.author}</small>}
                                </div>
                                <span>{storyCollapsed ? '▼' : '▲'}</span>
                            </div>
                            {!storyCollapsed && (
                                <div className="card-body">
                                    <div
                                        className="event-story-content"
                                        dangerouslySetInnerHTML={{
                                            __html: replaceImagePlaceholder(
                                                activeEvent.story_html,
                                                activeEvent.image_data
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
                        teamId={user.team_id}
                        games={games}
                    />
                </div>
            </div>
        </div>
    );
};

export default GamePanel;