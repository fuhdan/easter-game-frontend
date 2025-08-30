/**
 * Component: Profile
 * Purpose: User profile management and game rating interface
 * Part of: Easter Quest 2025 Frontend Dashboard
 */

import React, { useState, useEffect } from 'react';
import GameRating from './GameRating';
import ProfileSettings from './ProfileSettings';
import './Profile.css';

/**
 * User profile component with settings and game rating.
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user
 * @returns {JSX.Element}
 */
const Profile = ({ user }) => {
    const [ratings, setRatings] = useState([]);

    useEffect(() => {
        loadUserRatings();
    }, []);

    /**
     * Load user's game ratings.
     * @async
     * @returns {Promise<void>}
     */
    async function loadUserRatings() {
        // TODO: Implement ratings loading
    }

    return (
        <div className="profile">
            <div className="profile-grid">
                <GameRating 
                    onRatingSubmit={loadUserRatings}
                    existingRatings={ratings}
                />
                
                <ProfileSettings 
                    user={user}
                />
            </div>
        </div>
    );
};

export default Profile;