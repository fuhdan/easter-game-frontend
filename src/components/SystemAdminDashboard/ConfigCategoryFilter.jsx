/**
 * Component: ConfigCategoryFilter
 * Purpose: Category filter buttons for system configuration
 * Part of: Easter Quest 2025 Frontend - System Administration
 *
 * Features:
 * - Display category buttons
 * - Highlight active category
 * - Category selection callback
 *
 * @since 2025-11-20
 */

import React from 'react';

/**
 * ConfigCategoryFilter - Category filter buttons
 *
 * @param {Object} props
 * @param {string[]} props.categories - List of category names
 * @param {string} props.selectedCategory - Currently selected category
 * @param {Function} props.onCategoryChange - Category selection callback
 * @returns {JSX.Element}
 *
 * @example
 * <ConfigCategoryFilter
 *   categories={['all', 'auth', 'rate_limits']}
 *   selectedCategory="all"
 *   onCategoryChange={(cat) => setCategory(cat)}
 * />
 */
function ConfigCategoryFilter({ categories, selectedCategory, onCategoryChange }) {
  return (
    <div className="category-filter">
      {categories.map(cat => (
        <button
          key={cat}
          className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
          onClick={() => onCategoryChange(cat)}
        >
          {cat === 'all' ? 'All Categories' : cat}
        </button>
      ))}
    </div>
  );
}

export default ConfigCategoryFilter;
