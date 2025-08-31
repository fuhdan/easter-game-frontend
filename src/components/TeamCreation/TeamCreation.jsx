/**
 * Component: TeamCreation
 * Purpose: Team management interface with CSV upload and team building
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 */

import React, { useState, useEffect } from 'react';
import CSVUploader from './CSVUploader';
import TeamBuilder from './TeamBuilder';
import UserTable from './UserTable';
import './TeamCreation.css';

/**
 * Team creation and management component.
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user
 * @returns {JSX.Element}
 */
const TeamCreation = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.role === 'super_admin') {
            loadUsersAndTeams();
        }
    }, [user]);

    /**
     * Load all users and teams from API.
     * @async
     * @returns {Promise<void>}
     */
    async function loadUsersAndTeams() {
        try {
            setLoading(true);
            setError(null);

            const [usersRes, teamsRes] = await Promise.all([
                fetch('/api/users', { credentials: 'include' }),
                fetch('/api/teams', { credentials: 'include' })
            ]);

            if (!usersRes.ok || !teamsRes.ok) {
                throw new Error('Failed to fetch users or teams');
            }

            const usersData = await usersRes.json();
            const teamsData = await teamsRes.json();

            setUsers(usersData);
            setTeams(teamsData);
        } catch (err) {
            console.error('Error loading users/teams:', err);
            setError(err.message || 'Error loading data');
        } finally {
            setLoading(false);
        }
    }

    // 🚫 Access control: Block non-super_admins
    if (user?.role !== 'super_admin') {
        return (
            <div className="team-creation">
                <p style={{ color: 'red', fontWeight: 'bold' }}>
                    Access denied – Team Creation is only available for Super Admins.
                </p>
            </div>
        );
    }

    return (
        <div className="team-creation">
            <h2>Team Creation & Management</h2>

            {loading && <p>Loading data...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div className="team-creation-grid">
                <CSVUploader onUpload={loadUsersAndTeams} />
                <TeamBuilder 
                    users={users}
                    teams={teams}
                    onTeamCreate={loadUsersAndTeams}
                />
            </div>
            
            <UserTable 
                users={users}
                teams={teams}
                onUserUpdate={loadUsersAndTeams}
            />
        </div>
    );
};

export default TeamCreation;
