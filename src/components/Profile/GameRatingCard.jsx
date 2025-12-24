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

import React, { useState } from 'react';
import { logger } from '../../utils/logger';

const GameRatingCard = () => {
    // Mock data for game rating - TODO: Replace with API calls
    const mockCompletedGames = [
        { id: 1, name: 'Easter Riddle #1', completed_at: '2025-08-28T14:30:00Z' },
        { id: 2, name: 'Company Quiz', completed_at: '2025-08-29T09:15:00Z' },
        { id: 3, name: 'Mystery Hunt', completed_at: '2025-08-29T16:45:00Z' }
    ];

    // Use state for ratings so they update dynamically
    const [userRatings, setUserRatings] = useState([
        { game_id: 1, rating: 5, comment: 'Fun challenge!', created_at: '2025-08-28T15:00:00Z' },
        { game_id: 2, rating: 4, comment: 'Good learning experience', created_at: '2025-08-29T10:00:00Z' }
    ]);

    // Component state
    const [selectedGame, setSelectedGame] = useState('');
    const [currentRating, setCurrentRating] = useState(0);
    const [ratingComment, setRatingComment] = useState('');

    /**
     * Handle rating form submission
     *
     * @param {Event} e - Form submit event
     */
    const handleSubmitRating = (e) => {
        e.preventDefault();
        if (!selectedGame || currentRating === 0) return;

        const gameId = parseInt(selectedGame);
        const gameName = mockCompletedGames.find(g => g.id === gameId)?.name;

        // Create new rating object
        const newRating = {
            game_id: gameId,
            rating: currentRating,
            comment: ratingComment || null,
            created_at: new Date().toISOString()
        };

        logger.info('game_rating_submitted', {
            gameId,
            gameName,
            rating: currentRating,
            hasComment: !!ratingComment,
            isUpdate: userRatings.some(r => r.game_id === gameId),
            module: 'GameRatingCard'
        });

        // Update ratings state - replace existing rating for same game or add new
        setUserRatings(prevRatings => {
            const existingRatingIndex = prevRatings.findIndex(r => r.game_id === gameId);
            if (existingRatingIndex >= 0) {
                // Update existing rating
                const updatedRatings = [...prevRatings];
                updatedRatings[existingRatingIndex] = newRating;
                return updatedRatings;
            } else {
                // Add new rating
                return [...prevRatings, newRating];
            }
        });

        // Mock API call - TODO: Replace with actual API endpoint

        // Reset form after successful submission
        setSelectedGame('');
        setCurrentRating(0);
        setRatingComment('');

        // TODO: Replace with actual API call in production
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
                <form onSubmit={handleSubmitRating}>
                    <div className="form-group">
                        <label className="form-label">Select Game to Rate</label>
                        <select 
                            className="form-control"
                            value={selectedGame}
                            onChange={(e) => setSelectedGame(e.target.value)}
                            required
                        >
                            <option value="">Choose a completed game...</option>
                            {mockCompletedGames.map(game => (
                                <option key={game.id} value={game.id}>
                                    {game.name} (Completed: {formatDate(game.completed_at)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Your Rating</label>
                        <StarRating 
                            rating={currentRating} 
                            onRatingChange={setCurrentRating} 
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
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={!selectedGame || currentRating === 0}
                    >
                        Submit Rating
                    </button>
                </form>

                {/* Rating History Section */}
                {userRatings.length > 0 && (
                    <div className="rating-history">
                        <h4 style={{ marginBottom: '1rem', color: 'var(--primary-blue)' }}>
                            Your Previous Ratings
                        </h4>
                        {userRatings.map(rating => {
                            const game = mockCompletedGames.find(g => g.id === rating.game_id);
                            return (
                                <div key={rating.game_id} className="rating-item">
                                    <div className="rating-header">
                                        <strong>{game?.name}</strong>
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
                            );
                        })}
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
 */
const StarRating = ({ rating, onRatingChange }) => {
    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map(star => (
                <span
                    key={star}
                    className={`star ${star <= rating ? 'active' : ''}`}
                    onClick={() => onRatingChange(star)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

export default GameRatingCard;