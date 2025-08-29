import React, { useState, useEffect } from 'react';
import Login from './components/Login/Login';
import './App.css';

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');

    // Check authentication status on app load
    useEffect(() => {
        checkAuthStatus();
    }, []);

    async function checkAuthStatus() {
        try {
            setLoading(true);
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(username, password) {
        try {
            setError(null);
            setLoading(true);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setUser(data.user);
                return { success: true, message: data.message };
            } else {
                const errorMsg = data.detail || data.message || 'Login failed';
                setError(errorMsg);
                return { success: false, message: errorMsg };
            }
        } catch (err) {
            const errorMsg = 'Network error. Please try again.';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        try {
            setLoading(true);
            
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            setUser(null);
            setError(null);
        } catch (err) {
            console.error('Logout error:', err);
            setUser(null);
            setError(null);
        } finally {
            setLoading(false);
        }
    }

    const handleLogin = async (username, password) => {
        const result = await login(username, password);
        return result;
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="ypsomed-logo">
                    <img src="/assets/ypsomed-logo.png" alt="Ypsomed Logo" />
                </div>
                <p>Loading Easter Quest 2025...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <Login 
                onLogin={handleLogin}
                loading={loading}
                error={error}
            />
        );
    }

    // Dashboard view - matches Image 3
    return (
        <div className="app" style={{maxWidth: '1200px'}}>
            <div className="dashboard">
                <div className="dashboard-header">
                    <div className="dashboard-logo">
                        <div className="ypsomed-logo">
                            <img src="/assets/ypsomed-logo.png" alt="Ypsomed Logo" />
                        </div>
                        <div className="dashboard-title">
                            <h1>Easter Quest 2025</h1>
                            <p>Ypsomed Innovation Challenge</p>
                        </div>
                    </div>
                    
                    <div className="user-info">
                        <div className="user-avatar">
                            {(user.display_name || user.username || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div>{user.display_name || user.username}</div>
                            <div style={{fontSize: '0.8rem', opacity: 0.8}}>{user.role}</div>
                        </div>
                        <button onClick={logout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
                
                <div className="nav-tabs">
                    <button 
                        className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        📊 Admin Dashboard
                    </button>
                    <button 
                        className={`nav-tab ${activeTab === 'teams' ? 'active' : ''}`}
                        onClick={() => setActiveTab('teams')}
                    >
                        👥 Team Creation
                    </button>
                    <button 
                        className={`nav-tab ${activeTab === 'game' ? 'active' : ''}`}
                        onClick={() => setActiveTab('game')}
                    >
                        🎮 Game Panel
                    </button>
                    <button 
                        className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        👤 Profile
                    </button>
                </div>
                
                {activeTab === 'dashboard' && (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-number">24</div>
                                <div className="stat-label">Active Teams</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">156</div>
                                <div className="stat-label">Games Completed</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">89%</div>
                                <div className="stat-label">Participation Rate</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">4.2</div>
                                <div className="stat-label">Avg Rating</div>
                            </div>
                        </div>
                        
                        <div className="data-section">
                            <h3>View Options</h3>
                            <div className="view-options">
                                <button className="view-btn active">Summary</button>
                                <button className="view-btn">Per Game</button>
                                <button className="view-btn">Per Team</button>
                            </div>
                            
                            <div className="data-table">
                                <div className="table-header">
                                    <div>TEAM</div>
                                    <div>PROGRESS</div>
                                    <div>GAMES COMPLETED</div>
                                    <div>HELP REQUESTS</div>
                                    <div>STATUS</div>
                                </div>
                                
                                <div className="table-row">
                                    <div>Team Alpha</div>
                                    <div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{width: '95%'}}></div>
                                        </div>
                                        <div style={{fontSize: '0.8rem', marginTop: '4px'}}>95%</div>
                                    </div>
                                    <div>9/10</div>
                                    <div>3</div>
                                    <div><span className="status-badge status-active">Active</span></div>
                                </div>
                                
                                <div className="table-row">
                                    <div>Team Beta</div>
                                    <div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{width: '100%'}}></div>
                                        </div>
                                        <div style={{fontSize: '0.8rem', marginTop: '4px'}}>100%</div>
                                    </div>
                                    <div>10/10</div>
                                    <div>1</div>
                                    <div><span className="status-badge status-completed">Completed</span></div>
                                </div>
                                
                                <div className="table-row">
                                    <div>Team Gamma</div>
                                    <div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{width: '70%'}}></div>
                                        </div>
                                        <div style={{fontSize: '0.8rem', marginTop: '4px'}}>70%</div>
                                    </div>
                                    <div>7/10</div>
                                    <div>8</div>
                                    <div><span className="status-badge status-help">Needs Help</span></div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                
                {activeTab !== 'dashboard' && (
                    <div style={{padding: '3rem', textAlign: 'center', color: '#666'}}>
                        <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Panel</h3>
                        <p>This feature is coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;