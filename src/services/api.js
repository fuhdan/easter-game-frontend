/**
 * Service: api.js
 * Purpose: Centralized API service for ALL backend communication
 * Part of: Easter Quest 2025 Frontend Services
 * Location: frontend/src/services/api.js
 * 
 * This is the ONLY service that makes HTTP requests to the backend.
 * All components use this service instead of direct fetch calls.
 * 
 * Features:
 * - All API endpoints in one place
 * - Centralized authentication handling
 * - Built-in debugging and logging
 * - Consistent error handling
 * - Request/response formatting
 * - Network retry logic
 * 
 * Usage:
 * import api from '../services/api';
 * const result = await api.teams.create(players, config);
 * const users = await api.users.getAll();
 * 
 * @since 2025-08-31
 */

/**
 * Configuration
 */
const CONFIG = {
  BASE_URL: '', // Empty string since auth uses /api/auth/login directly
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  DEBUG: process.env.NODE_ENV === 'development'
};

/**
 * Debug logging
 */
const log = {
  info: (msg, data) => CONFIG.DEBUG && console.log(`🔵 [API] ${msg}`, data || ''),
  success: (msg, data) => CONFIG.DEBUG && console.log(`🟢 [API] ${msg}`, data || ''),
  error: (msg, error) => console.error(`🔴 [API] ${msg}`, error || ''),
  request: (method, url) => CONFIG.DEBUG && console.log(`📤 [${method}] ${url}`),
  response: (method, url, status) => CONFIG.DEBUG && console.log(`📥 [${method}] ${url} - ${status}`)
};

/**
 * Custom API Error
 */
class APIError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
  
  getUserMessage() {
    if (this.status === 401) return 'Please log in again';
    if (this.status === 403) return 'Permission denied';
    if (this.status === 404) return 'Resource not found';
    if (this.status >= 500) return 'Server error - please try again';
    return this.message || 'An error occurred';
  }
}

/**
 * Get auth token
 */
const getAuthToken = () => localStorage.getItem('auth_token') || '';

/**
 * Build headers
 */
const buildHeaders = (contentType = 'application/json') => {
  const headers = { 'Authorization': `Bearer ${getAuthToken()}` };
  if (contentType) headers['Content-Type'] = contentType;
  return headers;
};

/**
 * Core request function with retry logic
 */
const request = async (method, endpoint, data = null, options = {}) => {
  const url = `${CONFIG.BASE_URL}${endpoint}`;
  log.request(method, url);
  
  const config = {
    method,
    headers: buildHeaders(),
    ...options
  };
  
  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }
  
  let lastError;
  
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, config);
      log.response(method, url, response.status);
      
      const responseData = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text();
      
      if (!response.ok) {
        throw new APIError(
          responseData?.message || `HTTP ${response.status}`,
          response.status,
          responseData
        );
      }
      
      return responseData;
      
    } catch (error) {
      lastError = error;
      log.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt < CONFIG.MAX_RETRIES && error.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
      } else {
        break;
      }
    }
  }
  
  throw lastError;
};

/**
 * CENTRALIZED API SERVICE
 * All backend endpoints organized by domain
 */
const api = {
  
  // =============================================================================
  // AUTHENTICATION
  // =============================================================================
  auth: {
    // Login user with 3-scenario support
    login: (credentials) => {
      log.info('Attempting login for:', credentials.username);
      return request('POST', '/api/auth/login', credentials);
    },

    // Account activation for scenarios 2 & 3
    activateAccount: (activationData) => {
      log.info('Activating account for:', activationData.username);
      return request('POST', '/api/users/change-password', activationData);
    },

    // Logout user
    logout: () => request('POST', '/api/auth/logout'),

    // Refresh token
    refresh: () => request('POST', '/api/auth/refresh'),

    // Verify token
    verify: () => request('GET', '/api/auth/verify')
  },
  
  // =============================================================================
  // USER MANAGEMENT
  // =============================================================================
  users: {
    // Get all users
    getAll: () => request('GET', '/api/users'),

    // Get user by user ID
    getById: (id) => request('GET', `/api/users/${id}`),

    // Create new user
    create: (userData) => request('POST', '/api/users', userData),

    // Update user
    update: (id, userData) => request('PUT', `/api/users/${id}`, userData),

    // Delete user
    delete: (id) => request('DELETE', `/api/users/${id}`),

    // Bulk create users from CSV data
    bulkCreate: (users) => request('POST', '/api/users/bulk-create', { users }),

    // Current user profile
    getCurrentUser: () => request('GET', '/api/users/me'),

    // Update current user profile
    updateProfile: (profileData) => request('PUT', '/api/users/me', profileData),

    // Change password current user
    changePassword: (passwordData) => request('PUT', '/api/users/me/password', passwordData)
  },
  
  // =============================================================================
  // TEAM MANAGEMENT
  // =============================================================================
  teams: {
    // Get all teams
    getAll: () => request('GET', '/api/teams'),
    
    // Get team by ID
    getById: (id) => request('GET', `/api/teams/${id}`),

    // Get team by team_captain ID
    getMyTeamPlayers: () => request('GET', '/api/teams/my'),
    
    // Create teams using backend algorithm
    create: (players, config) => {
      log.info(`Creating teams for ${players.length} players`);
      console.log('FRONTEND: Players being sent:', players.slice(0, 2));
      console.log('FRONTEND: Config being sent:', config);
      console.log('FRONTEND: Request payload:', JSON.stringify({ players, config }, null, 2));
      return request('POST', '/api/teams/create', { players, config });
    },
    
    // Update team
    update: (id, teamData) => request('PUT', `/api/teams/${id}`, teamData),
    
    // Delete team
    delete: (id) => request('DELETE', `/api/teams/${id}`),
    
    // Reset all teams
    reset: () => {
      log.info('Resetting all teams');
      return request('DELETE', '/api/teams/reset');
    },
    
    // Export teams as CSV
    export: () => request('GET', '/api/teams/export', null, {
      headers: { ...buildHeaders(false), 'Accept': 'text/csv' }
    }),
    
    // Add member to team
    addMember: (teamId, userId) => request('POST', `/api/teams/${teamId}/members`, { userId }),
    
    // Remove member from team
    removeMember: (teamId, userId) => request('DELETE', `/api/teams/${teamId}/members/${userId}`),
    
    // Set team captain
    setCaptain: (teamId, userId) => request('PUT', `/api/teams/${teamId}/captain`, { userId })
  },
  
  // =============================================================================
  // PLAYER MANAGEMENT
  // =============================================================================
  players: {
     // Get all players
    getAll: () => request('GET', '/api/players'),

    // Get all players by player ID
    getById: (id) => request('GET', `/api/players/${id}`),

    // Create player
    create: (playerData) => request('POST', '/api/players', playerData),

    // Update player
    update: (id, playerData) => request('PUT', `/api/players/${id}`, playerData),

    // Delete player
    delete: (id) => request('DELETE', `/api/players/${id}`),

    // Bulk create players from CSV data
    bulkCreate: (players) => {
      log.info(`Uploading ${players.length} players`);
      return request('POST', '/api/players/bulk-create', { players });
    },

    // Import players from CSV
    import: (csvData) => request('POST', '/api/players/import', { csvData }),

    // Export players as CSV
    export: () => request('GET', '/api/players/export'),

    // Generate one-time password for player
    generateOtp: (playerId) => {
      log.info(`Generating OTP for player ${playerId}`);
      return request('POST', `/api/players/${playerId}/generate-otp`);
    }
  },
  
  // =============================================================================
  // GAME MANAGEMENT
  // =============================================================================
  games: {
    // Get all games
    getAll: () => request('GET', '/api/games'),

    // Get game by ID
    getById: (id) => request('GET', `/api/games/${id}`),

    // Create new game
    create: (gameData) => request('POST', '/api/games', gameData),

    // Update game
    update: (id, gameData) => request('PUT', `/api/games/${id}`, gameData),

    // Delete game
    delete: (id) => request('DELETE', `/api/games/${id}`),
    
    // Game progress and solutions
    getProgress: (gameId, teamId) => request('GET', `/api/games/${gameId}/progress/${teamId}`),

    // Submit solution for a game
    submitSolution: (gameId, solution) => request('POST', `/api/games/${gameId}/submit`, { solution }),

    // Request a hint for a game
    useHint: (gameId) => request('POST', `/api/games/${gameId}/hint`),
    
    // Game ratings
    rate: (gameId, rating, comment) => request('POST', `/api/games/${gameId}/rate`, { rating, comment }),

    // Get all ratings for a game
    getRatings: (gameId) => request('GET', `/api/games/${gameId}/ratings`)
  },
  
  // =============================================================================
  // ADMIN DASHBOARD
  // =============================================================================
  admin: {
    // Dashboard statistics
    getStats: () => request('GET', '/api/admin/stats'),

    // Progress tracking
    getTeamProgress: () => request('GET', '/api/admin/teams/progress'),

    // Overall game progress
    getGameProgress: () => request('GET', '/api/admin/games/progress'),
    
    // Admin actions
    resetGame: (gameId) => request('POST', `/api/admin/games/${gameId}/reset`),

    // Reset all progress for all teams
    resetAllProgress: () => request('POST', '/api/admin/reset-all'),
    
    // System management
    getSystemInfo: () => request('GET', '/api/admin/system'),

    // Export all data
    exportAllData: () => request('GET', '/api/admin/export'),
    
    // User management
    promoteUser: (userId) => request('PUT', `/api/admin/users/${userId}/promote`),

    // Demote user
    demoteUser: (userId) => request('PUT', `/api/admin/users/${userId}/demote`),
    
    // Game content management
    updateGameContent: (gameId, content) => request('PUT', `/api/admin/games/${gameId}/content`, content)
  },
  
  // =============================================================================
  // CHAT SYSTEM
  // =============================================================================
  chat: {
    // Send message to AI
    sendToAI: (message, context) => {
      log.info('Sending message to AI assistant');
      return request('POST', '/api/chat/ai', { message, context });
    },
    
    // Send message to admin
    sendToAdmin: (message) => {
      log.info('Sending message to admin');
      return request('POST', '/api/chat/admin', { message });
    },
    
    // Get chat history
    getHistory: () => request('GET', '/api/chat/history'),
    
    // Mark messages as read
    markAsRead: (messageIds) => request('PUT', '/api/chat/read', { messageIds }),
    
    // Admin chat operations
    getAdminMessages: () => request('GET', '/api/admin/chat/messages'),

    // Replay to user
    replyToUser: (userId, message) => request('POST', `/admin/chat/reply/${userId}`, { message })
  },
  
  // =============================================================================
  // FILE UPLOADS
  // =============================================================================
  files: {
    // Upload CSV file
    uploadCSV: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return request('POST', '/api/files/csv', formData, {
        headers: buildHeaders(null) // No content-type for FormData
      });
    },
    
    // Upload image file
    uploadImage: (file) => {
      const formData = new FormData();
      formData.append('image', file);
      return request('POST', '/api/files/image', formData, {
        headers: buildHeaders(null)
      });
    }
  },
  
  // =============================================================================
  // SYSTEM
  // =============================================================================
  system: {
    // Health check
    health: () => request('GET', '/api/health'),

    // Get system version
    version: () => request('GET', '/api/version'),

    // Basic ping test
    ping: () => request('GET', '/api/ping')
  }
};

/**
 * Utility functions - COMPLETE WITH ALL METHODS
 */
api.utils = {
  /**
   * Handle login response based on scenario
   * @param {Object} response - Login response from backend
   * @returns {Object} Processed response with scenario info
   */
  processLoginResponse: (response) => {
    // Scenario 1: Successful login
    if (response.success === true) {
      log.success('Login successful - user authenticated');
      return {
        success: true,
        scenario: 1,
        user: response.user,
        message: response.message
      };
    }
    
    // Scenarios 2 & 3: Password change required
    if (response.success === false) {
      const user = response.user || {};
      
      if (user.requiresOTP === true) {
        log.info('Login requires password change + OTP (Scenario 3)');
        return {
          success: false,
          scenario: 3,
          username: user.username,
          requiresPasswordChange: true,
          requiresOTP: true,
          message: response.message
        };
      } else if (user.requiresPasswordChange === true) {
        log.info('Login requires password change only (Scenario 2)');
        return {
          success: false,
          scenario: 2,
          username: user.username,
          requiresPasswordChange: true,
          requiresOTP: false,
          message: response.message
        };
      }
    }
    
    // Fallback
    return {
      success: false,
      scenario: 0,
      message: response.message || 'Login failed'
    };
  },

  /**
   * Handle API errors consistently across components
   */
  handleError: (error, showNotification) => {
    const message = error instanceof APIError 
      ? error.getUserMessage() 
      : 'An unexpected error occurred';
    
    log.error('API Error:', error);
    if (showNotification) {
      showNotification(message, 'error');
    }
    
    return message;
  },
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!getAuthToken();
  },
  
  /**
   * Clear authentication
   */
  clearAuth: () => {
    localStorage.removeItem('auth_token');
    log.info('Authentication cleared');
  },
  
  /**
   * Set authentication token
   */
  setAuth: (token) => {
    localStorage.setItem('auth_token', token);
    log.info('Authentication token set');
  }
};

export default api;