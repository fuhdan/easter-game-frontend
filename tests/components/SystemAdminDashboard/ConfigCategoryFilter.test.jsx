/**
 * Module: ConfigCategoryFilter.test.jsx
 * Purpose: Tests for ConfigCategoryFilter component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfigCategoryFilter from '../../../src/components/SystemAdminDashboard/ConfigCategoryFilter';

describe('ConfigCategoryFilter Component', () => {
  const mockCategories = ['all', 'auth', 'rate_limits', 'security'];
  const mockOnCategoryChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders all category buttons', () => {
      render(
        <ConfigCategoryFilter
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      expect(screen.getByText('All Categories')).toBeInTheDocument();
      expect(screen.getByText('auth')).toBeInTheDocument();
      expect(screen.getByText('rate_limits')).toBeInTheDocument();
      expect(screen.getByText('security')).toBeInTheDocument();
    });

    test('displays "All Categories" for "all" category', () => {
      render(
        <ConfigCategoryFilter
          categories={['all', 'auth']}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      expect(screen.getByText('All Categories')).toBeInTheDocument();
    });

    test('displays category name as-is for non-all categories', () => {
      render(
        <ConfigCategoryFilter
          categories={['all', 'auth', 'rate_limits']}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      expect(screen.getByText('auth')).toBeInTheDocument();
      expect(screen.getByText('rate_limits')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    test('applies active class to selected category', () => {
      render(
        <ConfigCategoryFilter
          categories={mockCategories}
          selectedCategory="auth"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const authButton = screen.getByText('auth');
      expect(authButton).toHaveClass('active');
    });

    test('does not apply active class to unselected categories', () => {
      render(
        <ConfigCategoryFilter
          categories={mockCategories}
          selectedCategory="auth"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const allButton = screen.getByText('All Categories');
      expect(allButton).not.toHaveClass('active');
    });

    test('calls onCategoryChange when category clicked', () => {
      render(
        <ConfigCategoryFilter
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const authButton = screen.getByText('auth');
      fireEvent.click(authButton);

      expect(mockOnCategoryChange).toHaveBeenCalledWith('auth');
    });

    test('calls onCategoryChange with correct category', () => {
      render(
        <ConfigCategoryFilter
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const securityButton = screen.getByText('security');
      fireEvent.click(securityButton);

      expect(mockOnCategoryChange).toHaveBeenCalledWith('security');
    });

    test('allows switching between categories multiple times', () => {
      const { rerender } = render(
        <ConfigCategoryFilter
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const authButton = screen.getByText('auth');
      fireEvent.click(authButton);

      rerender(
        <ConfigCategoryFilter
          categories={mockCategories}
          selectedCategory="auth"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const securityButton = screen.getByText('security');
      fireEvent.click(securityButton);

      expect(mockOnCategoryChange).toHaveBeenCalledTimes(2);
      expect(mockOnCategoryChange).toHaveBeenNthCalledWith(1, 'auth');
      expect(mockOnCategoryChange).toHaveBeenNthCalledWith(2, 'security');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty categories array', () => {
      render(
        <ConfigCategoryFilter
          categories={[]}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    test('handles single category', () => {
      render(
        <ConfigCategoryFilter
          categories={['all']}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      expect(screen.getByText('All Categories')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    test('handles category names with special characters', () => {
      render(
        <ConfigCategoryFilter
          categories={['all', 'rate_limits.api', 'auth-v2']}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      expect(screen.getByText('rate_limits.api')).toBeInTheDocument();
      expect(screen.getByText('auth-v2')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('has correct CSS class', () => {
      const { container } = render(
        <ConfigCategoryFilter
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      expect(container.querySelector('.category-filter')).toBeInTheDocument();
    });

    test('all buttons have correct class', () => {
      const { container } = render(
        <ConfigCategoryFilter
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const buttons = container.querySelectorAll('.category-btn');
      expect(buttons.length).toBe(mockCategories.length);
    });
  });
});
