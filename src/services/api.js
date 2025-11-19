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
    if (this.status === 429) {
      // Rate limit error - try to extract detailed message
      if (this.data && this.data.detail) {
        if (typeof this.data.detail === 'object' && this.data.detail.message) {
          return this.data.detail.message;
        } else if (typeof this.data.detail === 'string') {
          return this.data.detail;
        }
      }
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (this.status >= 500) return 'Server error - please try again';
    return this.message || 'An error occurred';
  }
}

/**
 * Token refresh mutex to prevent concurrent refresh attempts
 *
 * When multiple requests fail with 401 simultaneously, only one should
 * attempt to refresh the token. Others should wait for that refresh to complete.
 */
let refreshPromise = null;

/**
 * Event listeners for token refresh events.
 * Components (like SSE connections) can subscribe to reconnect after token refresh.
 */
const tokenRefreshListeners = new Set();

/**
 * Subscribe to token refresh events
 * @param {Function} callback - Function to call when tokens are refreshed
 * @returns {Function} Unsubscribe function
 */
export const onTokenRefresh = (callback) => {
  tokenRefreshListeners.add(callback);
  return () => tokenRefreshListeners.delete(callback);
};

/**
 * Notify all listeners that tokens were refreshed
 */
const notifyTokenRefresh = () => {
  tokenRefreshListeners.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('Token refresh listener error:', error);
    }
  });
};

/**
 * Build headers (without Authorization - using HTTPOnly cookies instead)
 *
 * SECURITY: Authentication via HTTPOnly cookies (automatic transmission).
 * No manual token handling required for browser clients.
 */
const buildHeaders = (contentType = 'application/json') => {
  const headers = {};
  if (contentType) headers['Content-Type'] = contentType;
  return headers;
};

/**
 * Core request function with retry logic and automatic token refresh
 *
 * SECURITY: Uses credentials: 'include' to automatically send HTTPOnly cookies
 *
 * STEP 7: Automatic Token Refresh Flow
 * 1. If request returns 401, attempt to refresh tokens
 * 2. If refresh succeeds, retry original request with new tokens
 * 3. If refresh fails, throw 401 (user must re-login)
 */
const request = async (method, endpoint, data = null, options = {}) => {
  const url = `${CONFIG.BASE_URL}${endpoint}`;
  log.request(method, url);

  const config = {
    method,
    credentials: 'include',  // SECURITY: Send HTTPOnly cookies with every request
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

      // STEP 7: Handle 401 with automatic token refresh (with mutex)
      if (error.status === 401 && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login') {
        log.info('401 Unauthorized - attempting token refresh');

        try {
          // MUTEX: Check if a refresh is already in progress
          if (!refreshPromise) {
            log.info('Starting token refresh (no refresh in progress)');

            // Start the refresh and store the promise
            // eslint-disable-next-line no-loop-func
            refreshPromise = fetch(`${CONFIG.BASE_URL}/api/auth/refresh`, {
              method: 'POST',
              credentials: 'include'
            })
            // eslint-disable-next-line no-loop-func
            .then(async (response) => {
              if (!response.ok) {
                // Clear the promise on failure
                refreshPromise = null;
                throw new APIError(`Refresh failed: HTTP ${response.status}`, response.status);
              }
              // Clear the promise on success
              refreshPromise = null;
              log.success('Token refresh completed successfully');
              return response;
            })
            // eslint-disable-next-line no-loop-func
            .catch((err) => {
              // Clear the promise on error
              refreshPromise = null;
              throw err;
            });
          } else {
            log.info('Token refresh already in progress - waiting for it to complete');
          }

          // Wait for the refresh to complete (either this one or an existing one)
          await refreshPromise;

          log.success('Token refresh successful - retrying original request');

          // Notify listeners (e.g., SSE connections) to reconnect with new tokens
          notifyTokenRefresh();

          // Retry original request with new tokens (don't count as retry attempt)
          const retryResponse = await fetch(url, config);
          const retryData = retryResponse.headers.get('content-type')?.includes('application/json')
            ? await retryResponse.json()
            : await retryResponse.text();

          if (!retryResponse.ok) {
            throw new APIError(
              retryData?.message || `HTTP ${retryResponse.status}`,
              retryResponse.status,
              retryData
            );
          }

          return retryData;

        } catch (refreshError) {
          log.error('Token refresh failed:', refreshError);

          // STEP 8: Dispatch auth-error event for AuthContext to handle
          window.dispatchEvent(new CustomEvent('auth-error', {
            detail: { error, refreshError }
          }));

          // If refresh fails, throw original 401 error
          // Frontend should redirect to login
          throw error;
        }
      }

      // Retry logic for 5xx errors
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

    // Get current user (also validates authentication)
    me: () => request('GET', '/api/auth/me'),

    // Verify token (alias for me())
    verify: () => request('GET', '/api/auth/me')
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
    setCaptain: (teamId, userId) => request('PUT', `/api/teams/${teamId}/captain`, { userId }),

    // Update team name (team leaders only)
    updateMyTeamName: (name) => {
      log.info('Updating team name to:', name);
      return request('PUT', '/api/teams/my-team/name', { name });
    }
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
  // EVENT MANAGEMENT
  // =============================================================================
  events: {
    // Get all events
    getAll: () => {
      log.info('Fetching all events');
      return request('GET', '/api/events');
    },

    // Get currently active event with full story
    getActive: () => {
      log.info('Fetching active event with story');
      return request('GET', '/api/events/active');
    },

    // Get event by year
    getByYear: (year) => {
      log.info(`Fetching event for year ${year}`);
      return request('GET', `/api/events/${year}`);
    },

    // Get all games for an event
    getGames: (eventId) => {
      log.info(`Fetching games for event ${eventId}`);
      return request('GET', `/api/events/${eventId}/games`);
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
    updateGameContent: (gameId, content) => request('PUT', `/api/admin/games/${gameId}/content`, content),

    // Rate limit management
    resetRateLimit: (target, identifier) => {
      log.info(`Resetting ${target} rate limit for: ${identifier}`);
      return request('POST', '/api/admin/reset-rate-limit', { target, identifier });
    },

    // Bulk rate limit reset
    resetRateLimitBulk: (ips) => {
      log.info(`Bulk resetting rate limits for ${ips.length} IP(s)`);
      return request('POST', '/api/admin/reset-rate-limit-bulk', { ips });
    }
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
    ping: () => request('GET', '/api/ping'),

    // =============================================================================
    // SYSTEM CONFIGURATION (super_admin only)
    // =============================================================================

    // Get all system configuration (optionally filtered by category)
    getConfig: (category = null) => {
      const url = category ? `/api/system/config?category=${category}` : '/api/system/config';
      log.info(`Fetching system configuration${category ? ` (category: ${category})` : ''}`);
      return request('GET', url);
    },

    // Update a configuration value
    updateConfig: (key, value) => {
      log.info(`Updating configuration: ${key} = ${value}`);
      return request('PATCH', `/api/system/config/${key}`, { value });
    },

    // Reload configuration cache
    reloadConfig: () => {
      log.info('Reloading configuration cache');
      return request('POST', '/api/system/config/reload');
    }
  },

  // =============================================================================
  // AI TRAINING MANAGEMENT (super_admin only)
  // =============================================================================
  aiTraining: {
    // Get all training hints (with optional filters)
    getHints: (filters = {}) => {
      const params = new URLSearchParams();
      if (filters.game_id) params.append('game_id', filters.game_id);
      if (filters.hint_type) params.append('hint_type', filters.hint_type);
      if (filters.hint_level) params.append('hint_level', filters.hint_level);

      const url = `/api/admin/ai/training-hints${params.toString() ? '?' + params.toString() : ''}`;
      log.info('Fetching AI training hints', filters);
      return request('GET', url);
    },

    // Get training hints organized by game
    getHintsByGame: () => {
      log.info('Fetching AI training hints by game');
      return request('GET', '/api/admin/ai/training-hints/by-game');
    },

    // Create new training hint
    createHint: (hintData) => {
      log.info('Creating AI training hint', hintData);
      return request('POST', '/api/admin/ai/training-hints', hintData);
    },

    // Update existing training hint
    updateHint: (hintId, updates) => {
      log.info(`Updating AI training hint ${hintId}`, updates);
      return request('PUT', `/api/admin/ai/training-hints/${hintId}`, updates);
    },

    // Delete training hint
    deleteHint: (hintId) => {
      log.info(`Deleting AI training hint ${hintId}`);
      return request('DELETE', `/api/admin/ai/training-hints/${hintId}`);
    },

    // Bulk delete hints for a game (cleanup old year)
    bulkDeleteHints: (gameId) => {
      log.info(`Bulk deleting AI training hints for game ${gameId}`);
      return request('POST', '/api/admin/ai/training-hints/bulk-delete', { game_id: gameId });
    },

    // Get system prompts
    getSystemPrompts: () => {
      log.info('Fetching AI system prompts');
      return request('GET', '/api/admin/ai/system-prompts');
    },

    // Create system prompt
    createSystemPrompt: (promptData) => {
      log.info('Creating AI system prompt', promptData);
      return request('POST', '/api/admin/ai/system-prompts', promptData);
    },

    // Update system prompt
    updateSystemPrompt: (promptId, updates) => {
      log.info(`Updating AI system prompt ${promptId}`, updates);
      return request('PUT', `/api/admin/ai/system-prompts/${promptId}`, updates);
    },

    // Delete system prompt
    deleteSystemPrompt: (promptId) => {
      log.info(`Deleting AI system prompt ${promptId}`);
      return request('DELETE', `/api/admin/ai/system-prompts/${promptId}`);
    },

    // Get admin guide
    getAdminGuide: () => {
      log.info('Fetching AI training admin guide');
      return request('GET', '/api/admin/ai/admin-guide');
    },

    // Event Management
    getEvents: () => {
      log.info('Fetching all events');
      return request('GET', '/api/admin/ai/events');
    },

    getEvent: (eventId) => {
      log.info(`Fetching event ${eventId}`);
      return request('GET', `/api/admin/ai/events/${eventId}`);
    },

    createEvent: (eventData) => {
      log.info('Creating new event', eventData);
      return request('POST', '/api/admin/events/', eventData);
    },

    updateEvent: (eventId, updates) => {
      log.info(`Updating event ${eventId}`, updates);
      return request('PUT', `/api/admin/ai/events/${eventId}`, updates);
    },

    deleteEvent: (eventId) => {
      log.info(`Deleting event ${eventId}`);
      return request('DELETE', `/api/admin/events/${eventId}`);
    },

    // System Prompts (reusing existing methods above)
    getSystemPrompts: () => {
      log.info('Fetching AI system prompts');
      return request('GET', '/api/admin/ai/system-prompts');
    },

    createSystemPrompt: (promptData) => {
      log.info('Creating AI system prompt', promptData);
      return request('POST', '/api/admin/ai/system-prompts', promptData);
    },

    updateSystemPrompt: (promptId, updates) => {
      log.info(`Updating AI system prompt ${promptId}`, updates);
      return request('PUT', `/api/admin/ai/system-prompts/${promptId}`, updates);
    },

    deleteSystemPrompt: (promptId) => {
      log.info(`Deleting AI system prompt ${promptId}`);
      return request('DELETE', `/api/admin/ai/system-prompts/${promptId}`);
    },

    // Game Categories
    getCategories: (activeOnly = false) => {
      const url = `/api/admin/ai/categories${activeOnly ? '?active_only=true' : ''}`;
      log.info('Fetching game categories');
      return request('GET', url);
    },

    createCategory: (categoryData) => {
      log.info('Creating game category', categoryData);
      return request('POST', '/api/admin/ai/categories', categoryData);
    },

    updateCategory: (categoryId, updates) => {
      log.info(`Updating game category ${categoryId}`, updates);
      return request('PUT', `/api/admin/ai/categories/${categoryId}`, updates);
    },

    deleteCategory: (categoryId) => {
      log.info(`Deleting game category ${categoryId}`);
      return request('DELETE', `/api/admin/ai/categories/${categoryId}`);
    }
  },

  // =============================================================================
  // GAME CONTENT MANAGEMENT (super_admin only)
  // =============================================================================
  games: {
    // Get all games with full content
    getAll: (includeInactive = false) => {
      const url = `/api/admin/ai/games${includeInactive ? '?include_inactive=true' : ''}`;
      log.info('Fetching all games with full content');
      return request('GET', url);
    },

    // Get single game with full content
    get: (gameId) => {
      log.info(`Fetching game ${gameId} with full content`);
      return request('GET', `/api/admin/ai/games/${gameId}`);
    },

    // Create new game
    create: (gameData) => {
      log.info('Creating new game', gameData);
      return request('POST', '/api/admin/ai/games', gameData);
    },

    // Update game content
    update: (gameId, updates) => {
      log.info(`Updating game ${gameId}`, updates);
      return request('PUT', `/api/admin/ai/games/${gameId}`, updates);
    },

    // Delete game (soft delete)
    delete: (gameId) => {
      log.info(`Deleting game ${gameId}`);
      return request('DELETE', `/api/admin/ai/games/${gameId}`);
    }
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
   * Check if user is authenticated (async - checks session with backend)
   *
   * SECURITY: Cannot read HTTPOnly cookies from JavaScript.
   * Instead, verify session by calling /api/auth/me endpoint.
   */
  isAuthenticated: async () => {
    try {
      await request('GET', '/api/auth/me');
      return true;
    } catch (error) {
      return false;
    }
  }

  // REMOVED: clearAuth() - Cookie cleared by backend on logout
  // REMOVED: setAuth() - Cookie set by backend on login
  // REMOVED: getAuthToken() - Cannot access HTTPOnly cookies from JavaScript
};

export default api;