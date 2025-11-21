/**
 * Module: services/index.js
 * Purpose: Central export for all API services
 * Part of: Easter Quest 2025 Frontend Services
 *
 * This file provides a single import point for all API services.
 * Instead of importing from multiple files, components can import from here.
 *
 * Usage:
 * import { auth, users, teams } from '../services';
 * import api from '../services';
 *
 * Then use: auth.login(...), users.getAll(), teams.create(...)
 *
 * @since 2025-11-20
 */

// Domain-specific services - import as namespaces
import * as auth from './auth';
import * as users from './users';
import * as teams from './teams';
import * as players from './players';
import * as games from './games';
import * as events from './events';
import * as admin from './admin';
import * as chat from './chat';
import * as system from './system';
import * as aiTraining from './aiTraining';
import * as files from './files';

// Core API utilities
export { request, buildHeaders, onTokenRefresh, utils, log, CONFIG, APIError } from './api';

// Export namespaced services (no conflicts)
export { auth, users, teams, players, games, events, admin, chat, system, aiTraining, files };

// Export specific commonly used functions with prefixes to avoid conflicts
export const {
  login,
  logout,
  refresh,
  verify,
  reset,
  activateAccount
} = auth;

export const {
  getAll: getAllUsers,
  getById: getUserById,
  create: createUser,
  update: updateUser,
  deleteUser,
  bulkCreate: bulkCreateUsers,
  getCurrentUser,
  updateProfile,
  changePassword,
  promoteUser,
  demoteUser
} = users;

export const {
  getAllTeams,
  getById: getTeamById,
  create: createTeams,
  update: updateTeam,
  deleteTeam,
  reset: resetTeams,
  addMember,
  removeMember,
  setCaptain,
  getMyTeamPlayers,
  updateMyTeamName,
  exportTeams: exportTeamsData
} = teams;

export const {
  getAll: getAllPlayers,
  getById: getPlayerId,
  create: createPlayer,
  update: updatePlayer,
  deletePlayer,
  bulkCreate: bulkCreatePlayers,
  uploadCSV,
  exportPlayers,
  exportTeams,
  importPlayers,
  generateOtp
} = players;

export const {
  getAll: getAllGames,
  getById: getGameById,
  create: createGame,
  update: updateGame,
  deleteGame,
  getProgress,
  submitSolution,
  useHint,
  rate,
  getRatings
} = games;

export const {
  getAll: getAllEvents,
  getByYear,
  getActive,
  getGames: getEventGames
} = events;

// Export getEvents as alias for events.getAll
export const getEvents = events.getAll;

// Export getGames from events (gets games for a specific event)
export const getGames = events.getGames;

export const {
  getStats,
  getSystemInfo,
  exportAllData,
  resetRateLimit,
  resetRateLimitBulk,
  getHistory,
  getAdminMessages,
  markAsRead,
  replyToUser
} = admin;

export const {
  sendToAI,
  sendToAdmin
} = chat;

export const {
  getConfig,
  updateConfig,
  reloadConfig,
  ping,
  health,
  version
} = system;

export const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getHints,
  getHintsByGame,
  createHint,
  updateHint,
  deleteHint,
  bulkDeleteHints,
  getSystemPrompts,
  createSystemPrompt,
  updateSystemPrompt,
  deleteSystemPrompt,
  getAdminGuide,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
} = aiTraining;

export const {
  uploadImage
} = files;

// Default export - object with all services organized by domain
const api = {
  auth,
  users,
  teams,
  players,
  games,
  events,
  admin,
  chat,
  system,
  aiTraining,
  files,

  // Keep utils for backward compatibility
  utils: {
    processLoginResponse: (response) => {
      const log = { info: () => {}, success: () => {} };
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
    }
  }
};

export default api;
