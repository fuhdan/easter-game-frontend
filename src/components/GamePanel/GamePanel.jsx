/**
 * Component: GamePanel
 * Purpose: Game interface for players with challenges and progress
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 */

import React, { useState, useEffect } from 'react';
import CurrentGame from './CurrentGame';
import TeamProgress from './TeamProgress';
import './GamePanel.css';

/**
 * Game panel component for active game participation.
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user
 * @returns {JSX.Element}
 */
const GamePanel = ({ user }) => {
    const [gameState, setGameState] = useState(null);

    useEffect(() => {
        loadGameState();
    }, []);

    /**
     * Load current game state for user's team.
     * @async
     * @returns {Promise<void>}
     */
    async function loadGameState() {
        // TODO: Implement game state loading
    }

    return (
        <div className="game-panel">
            <CurrentGame 
                gameState={gameState}
                onSubmitSolution={loadGameState}
            />
            
            <TeamProgress 
                teamId={user.team_id}
                gameState={gameState}
            />
        </div>
    );
};

export default GamePanel;