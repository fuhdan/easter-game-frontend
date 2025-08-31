/**
 * Component: Profile
 * Purpose: User profile management with role-based functionality
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - All roles: Password change
 * - Team Captains: Team management + game rating
 * - Admins: Team management
 * - Super Admins: System administration
 * 
 * Notes:
 * - Uses proper grid layout for team management
 * - Team management gets full width when present
 * - Responsive design with mobile support
 */

import React, { useState } from 'react';
import PasswordChangeCard from './PasswordChangeCard';
import TeamManagementCard from './TeamManagementCard';
import './Profile.css';

const Profile = ({ user }) => {
    const [activeUser] = useState(user || {
        id: 1,
        username: 'admin',
        email: 'admin@ypsomed.com',
        display_name: 'Admin User',
        role: 'team_captain', // Changed to team_captain to test team management
        team_id: 1,
        team_name: 'Team Alpha'
    });

    const currentUser = user ? user : activeUser;

    // Check if user has team management access
    const hasTeamManagement = currentUser.role === 'team_captain' || 
                             currentUser.role === 'super_admin' || 
                             currentUser.role === 'admin';

    // Placeholder components for future implementation
    const SuperAdminCard = () => (
        <div className="profile-card">
            <div className="card-header">
                🔧 System Administration
            </div>
            <div className="card-body">
                <p>Super admin features will be implemented later</p>
                <p><small>Note: Full system access and admin management</small></p>
            </div>
        </div>
    );

    const GameRatingCard = () => (
        <div className="profile-card">
            <div className="card-header">
                ⭐ Rate Games
            </div>
            <div className="card-body">
                <p>Game rating system will be implemented in Step 7</p>
                <p><small>Features: Rate completed games, submit feedback</small></p>
            </div>
        </div>
    );

    return (
        <div className="profile">
            {hasTeamManagement ? (
                // Layout with team management - uses full width layout
                <div className="profile-grid-with-team">
                    {/* Top row: Smaller cards side by side */}
                    <div className="profile-grid-team-row">
                        <PasswordChangeCard />
                        {currentUser.role === 'team_captain' && <GameRatingCard />}
                    </div>
                    
                    {/* Full width: Team Management */}
                    <div className="team-management-full">
                        <TeamManagementCard user={currentUser} />
                    </div>
                    
                    {/* Super admin card if needed */}
                    {currentUser.role === 'super_admin' && <SuperAdminCard />}
                </div>
            ) : (
                // Simple layout for basic users - standard grid
                <div className="profile-grid">
                    <PasswordChangeCard />
                </div>
            )}

            <div className="role-info">
                <h4 className="role-title">
                    Current Role: {currentUser.role.replace('_', ' ').toUpperCase()}
                </h4>
                <p className="role-description">
                    {currentUser.role === 'player' && 'You can change your password.'}
                    {currentUser.role === 'team_captain' && 'You can manage your team members, change your password, and rate games.'}
                    {currentUser.role === 'admin' && 'You can change your password and manage team members.'}
                    {currentUser.role === 'super_admin' && 'You have full system access including admin management and system configuration.'}
                </p>
            </div>
        </div>
    );
};

export default Profile;