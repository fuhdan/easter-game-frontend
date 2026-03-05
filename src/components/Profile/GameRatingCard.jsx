/**
 * Component: GameRatingCard
 * Purpose: Game rating and feedback system for completed games
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 * 
 * Features:
 * - Interactive 5-star rating system
 * - Game selection dropdown for completed games
 * - Optional comment textarea
 * - Rating submission with validation
 * - Rating history display with previous ratings
 */

import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import * as gamesService from '../../services/games';

const GameRatingCard = () => {
    // State for completed games and ratings
    const [completedGames, setCompletedGames] = useState([]);
    const [userRatings, setUserRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Component state
    const [selectedGame, setSelectedGame] = useState('');
    const [currentRating, setCurrentRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    /**
     * Fetch completed games and user ratings on component mount
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch all games with progress
                const gamesResponse = await gamesService.getAll();

                // Validate response structure
                if (!gamesResponse || !Array.isArray(gamesResponse.games)) {
                    throw new Error('Invalid games response structure');
                }

                // Filter for completed games only
                const completed = gamesResponse.games.filter(game =>
                    game.progress && game.progress.status === 'completed'
                );

                setCompletedGames(completed);

                // Fetch user's rating history
                const ratingsResponse = await gamesService.getMyRatings();
                setUserRatings(ratingsResponse.ratings || []);

                logger.info('rating_data_loaded', {
                    completedGamesCount: completed.length,
                    ratingsCount: ratingsResponse.ratings?.length || 0,
                    module: 'GameRatingCard'
                });
            } catch (err) {
                logger.error('rating_data_load_failed', {
                    error: err.message,
                    errorName: err.name,
                    errorStatus: err.status,
                    module: 'GameRatingCard'
                });
                setError(`Failed to load game data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    /**
     * Handle rating form submission
     *
     * @param {Event} e - Form submit event
     */
    const handleSubmitRating = async (e) => {
        e.preventDefault();
        if (!selectedGame || currentRating === 0) return;

        const gameId = parseInt(selectedGame);
        const game = completedGames.find(g => g.id === gameId);
        const gameName = game?.title || 'Unknown';

        try {
            setSubmitting(true);
            setError(null);

            logger.info('game_rating_submitted', {
                gameId,
                gameName,
                rating: currentRating,
                hasComment: !!ratingComment,
                isUpdate: userRatings.some(r => r.game_id === gameId),
                module: 'GameRatingCard'
            });

            // Submit rating to API
            await gamesService.rate(gameId, currentRating, ratingComment || '');

            // Refresh user's ratings after successful submission
            const ratingsResponse = await gamesService.getMyRatings();
            setUserRatings(ratingsResponse.ratings || []);

            // Reset form after successful submission
            setSelectedGame('');
            setCurrentRating(0);
            setRatingComment('');

            logger.info('game_rating_success', {
                gameId,
                gameName,
                module: 'GameRatingCard'
            });
        } catch (err) {
            logger.error('game_rating_failed', {
                gameId,
                gameName,
                error: err.message,
                module: 'GameRatingCard'
            });
            setError(err.message || 'Failed to submit rating');
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Format date string to user-friendly format
     * 
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="profile-card">
            <div className="card-header">
                Game Rating & Feedback
            </div>
            <div className="card-body">
                {loading && (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>Loading game data...</p>
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            padding: '1rem',
                            marginBottom: '1rem',
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                            borderRadius: '4px'
                        }}
                    >
                        {error}
                    </div>
                )}

                {!loading && completedGames.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        <p>No completed games yet. Complete a game to rate it!</p>
                    </div>
                )}

                {!loading && completedGames.length > 0 && (
                    <form onSubmit={handleSubmitRating}>
                        <div className="form-group">
                            <label className="form-label">Select Game to Rate</label>
                            <select
                                className="form-control"
                                value={selectedGame}
                                onChange={(e) => setSelectedGame(e.target.value)}
                                required
                                disabled={submitting}
                            >
                                <option value="">Choose a completed game...</option>
                                {completedGames.map(game => (
                                    <option key={game.id} value={game.id}>
                                        {game.title}
                                        {game.progress?.completed_at &&
                                            ` (Completed: ${formatDate(game.progress.completed_at)})`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Your Rating</label>
                            <StarRating
                                rating={currentRating}
                                onRatingChange={setCurrentRating}
                                disabled={submitting}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Comments (Optional)</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                placeholder="Share your feedback about this game..."
                                value={ratingComment}
                                onChange={(e) => setRatingComment(e.target.value)}
                                disabled={submitting}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!selectedGame || currentRating === 0 || submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Rating'}
                        </button>
                    </form>
                )}

                {/* Rating History Section */}
                {!loading && userRatings.length > 0 && (
                    <div className="rating-history">
                        <h4 style={{ marginBottom: '1rem', color: 'var(--primary-blue)' }}>
                            Your Previous Ratings
                        </h4>
                        {userRatings.map(rating => (
                            <div key={rating.id} className="rating-item">
                                <div className="rating-header">
                                    <strong>{rating.game_title}</strong>
                                    <div className="star-rating">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span
                                                key={star}
                                                className={`star ${star <= rating.rating ? 'active' : ''}`}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {rating.comment && (
                                    <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
                                        "{rating.comment}"
                                    </p>
                                )}
                                <div className="rating-date">
                                    Rated on {formatDate(rating.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Star Rating Component
 * Interactive 5-star rating system
 *
 * @param {Object} props - Component props
 * @param {number} props.rating - Current rating value (1-5)
 * @param {Function} props.onRatingChange - Callback when rating changes
 * @param {boolean} props.disabled - Whether the rating is disabled
 */
const StarRating = ({ rating, onRatingChange, disabled = false }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const handleMouseEnter = (star) => {
        if (!disabled) {
            setHoverRating(star);
        }
    };

    const handleMouseLeave = () => {
        setHoverRating(0);
    };

    const displayRating = hoverRating || rating;

    return (
        <div className="star-rating" onMouseLeave={handleMouseLeave}>
            {[1, 2, 3, 4, 5].map(star => (
                <span
                    key={star}
                    className={`star ${star <= displayRating ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && onRatingChange(star)}
                    onMouseEnter={() => handleMouseEnter(star)}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    style={{
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.6 : 1
                    }}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

export default GameRatingCard;