/**
 * Easter Game Frontend - Main Application Component
 * File: frontend/src/App.jsx
 * Description: Main React application component with API integration
 * Author: Daniel Fuhrer
 * Created: 2025
 * License: MIT
 * 
 * Features:
 * - API health check integration
 * - Game status display
 * - Environment-based configuration
 * - Responsive design
 * - Error handling
 * 
 * API Endpoints Used:
 * - GET /api/health - Backend health status
 * - GET /api/game/status - Game status information
 * 
 * Environment Variables:
 * - REACT_APP_API_URL: Backend API base URL
 * - REACT_APP_ENV: Environment (development/production)
 */

import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = `${window.location.protocol}//${window.location.host}/api`;
  const environment = process.env.REACT_APP_ENV || 'development';

  // Fetch backend health status
  const fetchBackendHealth = async () => {
    try {
      const response = await fetch(`${apiUrl}/health`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setBackendStatus(data);
    } catch (err) {
      console.error('Backend health check failed:', err);
      setError(`Backend connection failed: ${err.message}`);
    }
  };

  // Fetch game status
  const fetchGameStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/game/status`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setGameStatus(data);
    } catch (err) {
      console.error('Game status fetch failed:', err);
      setError(`Game status failed: ${err.message}`);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBackendHealth(), fetchGameStatus()]);
      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array is intentional - only run on mount

  // Render loading state
  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <h2>🐰 Loading Easter Game...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Render main application
  return (
    <div className="App">
      <header className="App-header">
        <h1>🐰 Easter Game</h1>
        <p>Welcome to the Easter Egg Hunt!</p>
      </header>

      <main className="App-main">
        {/* Environment Info */}
        <section className="info-section">
          <h2>🔧 Environment Info</h2>
          <div className="info-grid">
            <div className="info-card">
              <h3>Frontend</h3>
              <p>Environment: <strong>{environment}</strong></p>
              <p>API URL: <strong>{apiUrl}</strong></p>
            </div>
            
            {backendStatus && (
              <div className="info-card">
                <h3>Backend</h3>
                <p>Status: <strong>{backendStatus.status}</strong></p>
                <p>Environment: <strong>{backendStatus.environment}</strong></p>
                <p>Debug: <strong>{backendStatus.debug}</strong></p>
              </div>
            )}
          </div>
        </section>

        {/* Game Status */}
        {gameStatus && (
          <section className="game-section">
            <h2>🎮 Game Status</h2>
            <div className="game-card">
              <h3>{gameStatus.game}</h3>
              <p>Status: <strong>{gameStatus.status}</strong></p>
              <p>Players Online: <strong>{gameStatus.players_online}</strong></p>
            </div>
          </section>
        )}

        {/* Error Display */}
        {error && (
          <section className="error-section">
            <h2>⚠️ Connection Issue</h2>
            <div className="error-card">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                🔄 Retry Connection
              </button>
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <section className="actions-section">
          <h2>🚀 Actions</h2>
          <div className="button-group">
            <button onClick={fetchBackendHealth} className="action-btn">
              🔍 Check Backend Health
            </button>
            <button onClick={fetchGameStatus} className="action-btn">
              🎯 Refresh Game Status
            </button>
          </div>
        </section>
      </main>

      <footer className="App-footer">
        <p>Easter Game © 2025 - Environment: {environment}</p>
      </footer>
    </div>
  );
}

export default App;