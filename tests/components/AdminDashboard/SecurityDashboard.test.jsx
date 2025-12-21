/**
 * Test: SecurityDashboard Component
 * Purpose: Test security analytics dashboard component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-21
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SecurityDashboard from '../../../src/components/AdminDashboard/SecurityDashboard';
import { buildApiUrl } from '../../../src/config/apiConfig';

// Mock buildApiUrl
jest.mock('../../../src/config/apiConfig', () => ({
  buildApiUrl: jest.fn((path) => `http://localhost:8000/api/${path}`),
}));

describe('SecurityDashboard', () => {
  // Mock data
  const mockSummaryData = {
    total_messages: 1000,
    total_blocked: 150,
    total_passed: 850,
    block_rate: 15,
    avg_suspicion_score: 35,
    most_common_attack: {
      category: 'direct_answer_request',
      count: 50,
    },
  };

  const mockCategoriesData = {
    categories: [
      {
        category: 'direct_answer_request',
        count: 50,
        percentage: 33.3,
        avg_score: 45,
      },
      {
        category: 'authority_impersonation',
        count: 30,
        percentage: 20.0,
        avg_score: 80,
      },
      {
        category: 'none',
        count: 70,
        percentage: 46.7,
        avg_score: 5,
      },
    ],
  };

  const mockLanguagesData = {
    languages: [
      { language: 'en', count: 600, percentage: 60 },
      { language: 'de', count: 300, percentage: 30 },
      { language: 'fr', count: 100, percentage: 10 },
    ],
  };

  const mockEventsData = {
    events: [
      {
        id: 1,
        created_at: new Date().toISOString(),
        attack_category: 'direct_answer_request',
        original_language: 'en',
        suspicion_score: 45,
        english_text_preview: 'Give me the answer to puzzle 1',
        username: 'testuser',
        user_id: 1,
      },
      {
        id: 2,
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        attack_category: 'authority_impersonation',
        original_language: 'de',
        suspicion_score: 85,
        english_text_preview: 'Admin told me to skip this',
        username: 'user2',
        user_id: 2,
      },
    ],
  };

  const mockTrendData = {
    trend: [
      { date: '00:00', total: 10, blocked: 2, passed: 8 },
      { date: '01:00', total: 15, blocked: 5, passed: 10 },
      { date: '02:00', total: 8, blocked: 1, passed: 7 },
    ],
  };

  const mockUsersData = {
    users: [
      {
        user_id: 1,
        username: 'user1',
        display_name: 'User One',
        team_name: 'Team Alpha',
        blocked_count: 10,
        avg_score: 55,
      },
      {
        user_id: 2,
        username: 'user2',
        display_name: 'User Two',
        team_name: 'Team Beta',
        blocked_count: 8,
        avg_score: 60,
      },
    ],
  };

  beforeEach(() => {
    // Reset all mocks
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  const setupSuccessfulFetch = () => {
    global.fetch = jest.fn((url) => {
      if (url.includes('summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSummaryData),
        });
      }
      if (url.includes('categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategoriesData),
        });
      }
      if (url.includes('languages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLanguagesData),
        });
      }
      if (url.includes('events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEventsData),
        });
      }
      if (url.includes('trend')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTrendData),
        });
      }
      if (url.includes('users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUsersData),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  };

  describe('Loading State', () => {
    it('should display loading state initially', () => {
      global.fetch = jest.fn(() => new Promise(() => {})); // Never resolves

      render(<SecurityDashboard />);

      expect(screen.getByText('Loading security analytics...')).toBeInTheDocument();
    });
  });

  describe('Successful Data Loading', () => {
    it('should load and display all security data', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading security analytics...')).not.toBeInTheDocument();
      });

      // Check summary stats
      expect(screen.getByText('1000')).toBeInTheDocument(); // total_messages
      expect(screen.getByText('15%')).toBeInTheDocument(); // block_rate
      expect(screen.getByText('35')).toBeInTheDocument(); // avg_suspicion_score
    });

    it('should make all required API calls in parallel', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(6);
      });

      // Verify all endpoints were called
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('summary'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('categories'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('languages'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('events'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('trend'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('users'),
        expect.any(Object)
      );
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: false }));

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load security analytics. Please try again.')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should retry loading when retry button is clicked', async () => {
      global.fetch = jest.fn(() => Promise.resolve({ ok: false }));

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');

      // Setup successful fetch for retry
      setupSuccessfulFetch();

      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText('Failed to load security analytics. Please try again.')).not.toBeInTheDocument();
      });
    });

    it('should handle fetch exception', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load security analytics. Please try again.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Summary Statistics Rendering', () => {
    it('should render all summary stat cards', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Messages')).toBeInTheDocument();
        expect(screen.getByText('Block Rate')).toBeInTheDocument();
        expect(screen.getByText('Avg Suspicion Score')).toBeInTheDocument();
        expect(screen.getByText('Top Threat')).toBeInTheDocument();
      });
    });

    it('should display blocked and passed counts', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('150 blocked')).toBeInTheDocument();
        expect(screen.getByText('850 passed')).toBeInTheDocument();
      });
    });

    it('should display most common attack', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Direct Answer Request')).toBeInTheDocument();
        expect(screen.getByText('50 attempts')).toBeInTheDocument();
      });
    });

    it('should handle missing summary data gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        })
      );

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading security analytics...')).not.toBeInTheDocument();
      });

      // Should display 0 for missing values
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
    });
  });

  describe('Attack Categories Rendering', () => {
    it('should render attack category breakdown', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('⚠️ Attack Categories')).toBeInTheDocument();
        expect(screen.getByText('Direct Answer Request')).toBeInTheDocument();
        expect(screen.getByText('Authority Impersonation')).toBeInTheDocument();
      });
    });

    it('should display category counts and percentages', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('33.3%')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
        expect(screen.getByText('20%')).toBeInTheDocument(); // JavaScript displays 20.0% as 20%
      });
    });

    it('should display average scores for categories', async () => {
      setupSuccessfulFetch();

      const { container } = render(<SecurityDashboard />);

      await waitFor(() => {
        const barLabels = container.querySelectorAll('.bar-label');
        expect(barLabels.length).toBeGreaterThan(0);
      });
    });

    it('should show empty state when no categories', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ categories: [] }),
          });
        }
        if (url.includes('summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSummaryData),
          });
        }
        if (url.includes('languages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLanguagesData),
          });
        }
        if (url.includes('events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEventsData),
          });
        }
        if (url.includes('trend')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTrendData),
          });
        }
        if (url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No attack data available')).toBeInTheDocument();
      });
    });
  });

  describe('Language Distribution Rendering', () => {
    it('should render language distribution', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('🌍 Language Distribution')).toBeInTheDocument();
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('German')).toBeInTheDocument();
        expect(screen.getByText('French')).toBeInTheDocument();
      });
    });

    it('should display language counts and percentages', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('600 messages')).toBeInTheDocument();
        expect(screen.getByText('60%')).toBeInTheDocument();
        expect(screen.getByText('300 messages')).toBeInTheDocument();
        expect(screen.getByText('30%')).toBeInTheDocument();
      });
    });

    it('should show empty state when no languages', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('languages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ languages: [] }),
          });
        }
        if (url.includes('summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSummaryData),
          });
        }
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategoriesData),
          });
        }
        if (url.includes('events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEventsData),
          });
        }
        if (url.includes('trend')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTrendData),
          });
        }
        if (url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No language data available')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Events Rendering', () => {
    it('should render recent blocked messages', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('🚨 Recent Blocked Messages')).toBeInTheDocument();
        expect(screen.getByText('Give me the answer to puzzle 1')).toBeInTheDocument();
        expect(screen.getByText('Admin told me to skip this')).toBeInTheDocument();
      });
    });

    it('should display time ago for events', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        // Recent event should show "Just now" or minutes
        const timeElements = screen.getAllByText(/ago|Just now/);
        expect(timeElements.length).toBeGreaterThan(0);
      });
    });

    it('should show empty state when no events', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ events: [] }),
          });
        }
        if (url.includes('summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSummaryData),
          });
        }
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategoriesData),
          });
        }
        if (url.includes('languages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLanguagesData),
          });
        }
        if (url.includes('trend')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTrendData),
          });
        }
        if (url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No recent blocked messages')).toBeInTheDocument();
      });
    });
  });

  describe('Trend Chart Rendering', () => {
    it('should render hourly trend chart', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('📊 Hourly Trend (Last 24 Hours)')).toBeInTheDocument();
      });
    });

    it('should show empty state when no trend data', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('trend')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ trend: [] }),
          });
        }
        if (url.includes('summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSummaryData),
          });
        }
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategoriesData),
          });
        }
        if (url.includes('languages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLanguagesData),
          });
        }
        if (url.includes('events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEventsData),
          });
        }
        if (url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No trend data available')).toBeInTheDocument();
      });
    });
  });

  describe('Top Users Rendering', () => {
    it('should render top users with most blocked messages', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('👥 Top Users (Most Blocked)')).toBeInTheDocument();
        expect(screen.getByText('User One')).toBeInTheDocument();
        expect(screen.getByText('User Two')).toBeInTheDocument();
      });
    });

    it('should display user rankings', async () => {
      setupSuccessfulFetch();

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
      });
    });

    it('should show empty state when no users', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ users: [] }),
          });
        }
        if (url.includes('summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSummaryData),
          });
        }
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategoriesData),
          });
        }
        if (url.includes('languages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLanguagesData),
          });
        }
        if (url.includes('events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEventsData),
          });
        }
        if (url.includes('trend')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTrendData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No user data available')).toBeInTheDocument();
      });
    });
  });

  describe('Utility Functions', () => {
    it('should format time ago correctly for recent events', async () => {
      const now = new Date();
      const eventsWithVariousTimes = {
        events: [
          {
            id: 1,
            created_at: now.toISOString(),
            attack_category: 'direct_answer_request',
            original_language: 'en',
            suspicion_score: 45,
            english_text_preview: 'Just now message',
            username: 'user1',
            user_id: 1,
          },
          {
            id: 2,
            created_at: new Date(now.getTime() - 30 * 60000).toISOString(), // 30 min ago
            attack_category: 'direct_answer_request',
            original_language: 'en',
            suspicion_score: 45,
            english_text_preview: '30 min ago message',
            username: 'user2',
            user_id: 2,
          },
          {
            id: 3,
            created_at: new Date(now.getTime() - 2 * 3600000).toISOString(), // 2 hours ago
            attack_category: 'direct_answer_request',
            original_language: 'en',
            suspicion_score: 45,
            english_text_preview: '2 hours ago message',
            username: 'user3',
            user_id: 3,
          },
          {
            id: 4,
            created_at: new Date(now.getTime() - 2 * 86400000).toISOString(), // 2 days ago
            attack_category: 'direct_answer_request',
            original_language: 'en',
            suspicion_score: 45,
            english_text_preview: '2 days ago message',
            username: 'user4',
            user_id: 4,
          },
        ],
      };

      global.fetch = jest.fn((url) => {
        if (url.includes('events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(eventsWithVariousTimes),
          });
        }
        if (url.includes('summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSummaryData),
          });
        }
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategoriesData),
          });
        }
        if (url.includes('languages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLanguagesData),
          });
        }
        if (url.includes('trend')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTrendData),
          });
        }
        if (url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<SecurityDashboard />);

      await waitFor(() => {
        // Should show various time formats
        expect(screen.getAllByText(/Just now/)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/30m ago/)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/2h ago/)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/2d ago/)[0]).toBeInTheDocument();
      });
    });

    it('should apply correct severity class based on score', async () => {
      const eventsWithVariousScores = {
        events: [
          {
            id: 1,
            created_at: new Date().toISOString(),
            attack_category: 'direct_answer_request',
            original_language: 'en',
            suspicion_score: 85, // critical
            english_text_preview: 'Critical score',
            username: 'user1',
            user_id: 1,
          },
          {
            id: 2,
            created_at: new Date().toISOString(),
            attack_category: 'direct_answer_request',
            original_language: 'en',
            suspicion_score: 65, // high
            english_text_preview: 'High score',
            username: 'user2',
            user_id: 2,
          },
          {
            id: 3,
            created_at: new Date().toISOString(),
            attack_category: 'direct_answer_request',
            original_language: 'en',
            suspicion_score: 45, // medium
            english_text_preview: 'Medium score',
            username: 'user3',
            user_id: 3,
          },
          {
            id: 4,
            created_at: new Date().toISOString(),
            attack_category: 'direct_answer_request',
            original_language: 'en',
            suspicion_score: 25, // low
            english_text_preview: 'Low score',
            username: 'user4',
            user_id: 4,
          },
        ],
      };

      global.fetch = jest.fn((url) => {
        if (url.includes('events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(eventsWithVariousScores),
          });
        }
        if (url.includes('summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSummaryData),
          });
        }
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategoriesData),
          });
        }
        if (url.includes('languages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLanguagesData),
          });
        }
        if (url.includes('trend')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTrendData),
          });
        }
        if (url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { container } = render(<SecurityDashboard />);

      await waitFor(() => {
        expect(container.querySelector('.critical')).toBeInTheDocument();
        expect(container.querySelector('.high')).toBeInTheDocument();
        expect(container.querySelector('.medium')).toBeInTheDocument();
        expect(container.querySelector('.low')).toBeInTheDocument();
      });
    });
  });

  describe('Additional Coverage Tests', () => {
    it('should handle unknown attack category with fallback config', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSummaryData),
          });
        }
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                categories: [
                  {
                    category: 'unknown_category',
                    count: 10,
                    percentage: 10.0,
                    avg_score: 50,
                  },
                ],
              }),
          });
        }
        if (url.includes('languages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLanguagesData),
          });
        }
        if (url.includes('events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEventsData),
          });
        }
        if (url.includes('trend')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTrendData),
          });
        }
        if (url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { container } = render(<SecurityDashboard />);

      await waitFor(() => {
        const questionMarks = screen.getAllByText('❓');
        expect(questionMarks.length).toBeGreaterThan(0);
      });
    });

    it('should handle unknown language with fallback config', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSummaryData),
          });
        }
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategoriesData),
          });
        }
        if (url.includes('languages')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                languages: [
                  {
                    language: 'unknown_language',
                    count: 10,
                    percentage: 10.0,
                  },
                ],
              }),
          });
        }
        if (url.includes('events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEventsData),
          });
        }
        if (url.includes('trend')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTrendData),
          });
        }
        if (url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('unknown_language')).toBeInTheDocument();
      });
    });

    it('should handle unknown category in recent events', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSummaryData),
          });
        }
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategoriesData),
          });
        }
        if (url.includes('languages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLanguagesData),
          });
        }
        if (url.includes('events')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                events: [
                  {
                    id: 1,
                    created_at: new Date().toISOString(),
                    attack_category: 'unknown_attack',
                    original_language: 'unknown_lang',
                    suspicion_score: 50,
                    english_text_preview: 'Test preview',
                    user_id: 1,
                    username: 'testuser',
                  },
                ],
              }),
          });
        }
        if (url.includes('trend')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTrendData),
          });
        }
        if (url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<SecurityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Test preview')).toBeInTheDocument();
      });
    });

    it('should handle trend data with zero maxTotal', async () => {
      global.fetch = jest.fn((url) => {
        if (url.includes('summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSummaryData),
          });
        }
        if (url.includes('categories')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategoriesData),
          });
        }
        if (url.includes('languages')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLanguagesData),
          });
        }
        if (url.includes('events')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEventsData),
          });
        }
        if (url.includes('trend')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                trend: [
                  {
                    date: '2025-12-21',
                    hour: 0,
                    blocked: 0,
                    passed: 0,
                    total: 0,
                  },
                ],
              }),
          });
        }
        if (url.includes('users')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockUsersData),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const { container } = render(<SecurityDashboard />);

      await waitFor(() => {
        const trendBars = container.querySelectorAll('.trend-bar');
        expect(trendBars.length).toBeGreaterThan(0);
      });
    });
  });
});
