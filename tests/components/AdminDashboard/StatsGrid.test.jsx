/**
 * Test: StatsGrid Component
 * Purpose: Test statistics grid display component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-21
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import StatsGrid from '../../../src/components/AdminDashboard/StatsGrid';

describe('StatsGrid', () => {
  describe('Default Data Rendering', () => {
    it('should render with default data when no data prop provided', () => {
      render(<StatsGrid />);

      // Check default values are displayed
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('156')).toBeInTheDocument();
      expect(screen.getByText('89%')).toBeInTheDocument();
      expect(screen.getByText('4.2')).toBeInTheDocument();
    });

    it('should render all stat labels', () => {
      render(<StatsGrid />);

      expect(screen.getByText('Active Teams')).toBeInTheDocument();
      expect(screen.getByText('Games Completed')).toBeInTheDocument();
      expect(screen.getByText('Participation Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Rating')).toBeInTheDocument();
    });

    it('should render card header', () => {
      render(<StatsGrid />);

      expect(screen.getByText('📊 Dashboard Statistics')).toBeInTheDocument();
    });
  });

  describe('API Data Rendering', () => {
    it('should render with API data when provided', () => {
      const apiData = {
        active_teams: 30,
        games_completed: 200,
        participation_rate: 95,
        avg_rating: 4.5,
      };

      render(<StatsGrid data={apiData} />);

      // Check API values are displayed
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      const apiData = {
        active_teams: 0,
        games_completed: 0,
        participation_rate: 0,
        avg_rating: 0,
      };

      render(<StatsGrid data={apiData} />);

      // Should display zeros
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
    });

    it('should handle partial data (missing fields)', () => {
      const partialData = {
        active_teams: 10,
        // Missing games_completed, participation_rate, avg_rating
      };

      render(<StatsGrid data={partialData} />);

      // Should render with partial data (undefined will be displayed)
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Structure', () => {
    it('should render stats grid container', () => {
      const { container } = render(<StatsGrid />);

      expect(container.querySelector('.stats-card-container')).toBeInTheDocument();
      expect(container.querySelector('.stats-grid')).toBeInTheDocument();
    });

    it('should render exactly 4 stat cards', () => {
      const { container } = render(<StatsGrid />);

      const statCards = container.querySelectorAll('.stat-card');
      expect(statCards).toHaveLength(4);
    });

    it('should have correct structure for each stat card', () => {
      const { container } = render(<StatsGrid />);

      const statCards = container.querySelectorAll('.stat-card');
      statCards.forEach((card) => {
        expect(card.querySelector('.stat-number')).toBeInTheDocument();
        expect(card.querySelector('.stat-label')).toBeInTheDocument();
      });
    });
  });

  describe('Data Precedence', () => {
    it('should prefer API data over default data', () => {
      const apiData = {
        active_teams: 99,
        games_completed: 999,
        participation_rate: 100,
        avg_rating: 5.0,
      };

      render(<StatsGrid data={apiData} />);

      // Should show API data, not defaults
      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.getByText('999')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // JavaScript displays 5.0 as 5

      // Should NOT show default data
      expect(screen.queryByText('24')).not.toBeInTheDocument();
      expect(screen.queryByText('156')).not.toBeInTheDocument();
    });

    it('should handle null data prop', () => {
      render(<StatsGrid data={null} />);

      // Should fall back to defaults
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('156')).toBeInTheDocument();
    });

    it('should handle undefined data prop', () => {
      render(<StatsGrid data={undefined} />);

      // Should fall back to defaults
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('156')).toBeInTheDocument();
    });
  });
});
