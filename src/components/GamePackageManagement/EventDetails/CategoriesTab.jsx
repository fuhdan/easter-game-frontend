/**
 * Component: CategoriesTab
 * Purpose: Manage game categories
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - List all categories
 * - Create/edit/delete categories
 * - Toggle active status
 *
 * @since 2025-11-20
 */

import React, { useState } from 'react';
import { createCategory, updateCategory, deleteCategory } from '../../../services';
import CategoryModal from '../Modals/CategoryModal';

function CategoriesTab({ categories, onCategoriesChanged }) {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    color: '#005da0',
    icon: '🎮',
    order_index: 0
  });

  const _handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      description: '',
      color: '#005da0',
      icon: '🎮',
      order_index: categories.length
    });
    setShowCategoryModal(true);
  };

  const _handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#005da0',
      icon: category.icon || '🎮',
      order_index: category.order_index || 0
    });
    setShowCategoryModal(true);
  };

  const _handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryFormData);
        console.log(`✅ Category updated: ${editingCategory.id}`);
      } else {
        await createCategory(categoryFormData);
        console.log(`✅ Category created`);
      }

      setShowCategoryModal(false);
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert(`❌ Failed to save category: ${error.response?.data?.detail || error.message}`);
    }
  };

  const _handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?\n\nThis will fail if any games use this category.`)) {
      return;
    }

    try {
      await deleteCategory(category.id);
      console.log(`✅ Category deleted: ${category.id}`);
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert(`❌ Failed to delete category: ${error.response?.data?.detail || error.message}`);
    }
  };

  const _handleToggleCategoryActive = async (category) => {
    try {
      await updateCategory(category.id, { is_active: !category.is_active });
      console.log(`✅ Category ${category.is_active ? 'deactivated' : 'activated'}: ${category.id}`);
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (error) {
      console.error('Failed to toggle category:', error);
      alert('❌ Failed to update category');
    }
  };

  return (
    <>
      <div className="categories-content">
        <div className="categories-header">
          <button className="btn btn-success" onClick={_handleCreateCategory}>
            ➕ Create New Category
          </button>
        </div>

        <div className="categories-list">
          {categories.map(category => (
            <div key={category.id} className={`category-item ${!category.is_active ? 'inactive' : ''}`}>
              <div className="category-badge" style={{ backgroundColor: category.color || '#005da0' }}>
                {category.icon || '🎮'}
              </div>
              <div className="category-info-section">
                <div className="category-name">{category.name}</div>
                {category.description && (
                  <div className="category-description">{category.description}</div>
                )}
                <div className="category-meta">
                  Order: {category.order_index} |
                  {category.is_active ? ' Active' : ' Inactive'}
                </div>
              </div>
              <div className="category-actions">
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => _handleEditCategory(category)}
                >
                  ✏️ Edit
                </button>
                <button
                  className={`btn btn-sm ${category.is_active ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => _handleToggleCategoryActive(category)}
                >
                  {category.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => _handleDeleteCategory(category)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="empty-state">
            No categories found. Click "Create New Category" to add one.
          </div>
        )}
      </div>

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          formData={categoryFormData}
          onFormChange={setCategoryFormData}
          onSave={_handleSaveCategory}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </>
  );
}

export default CategoriesTab;
