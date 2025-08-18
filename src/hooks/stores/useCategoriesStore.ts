/**
 * Categories Store - Handles category management
 * Extracted from useTaskStore to reduce complexity and improve maintainability
 */

import { useState, useCallback, useMemo } from 'react';
import { Category } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { defaultColorPalette } from '@/lib/themes';

export interface UseCategoriesStoreOptions {
  initialCategories?: Category[];
}

export interface RecentlyDeletedCategory {
  category: Category;
  taskIds: string[];
}

export function useCategoriesStore(options: UseCategoriesStoreOptions = {}) {
  const { initialCategories = [] } = options;
  const { colorPalette } = useSettings();

  // State
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [recentlyDeleted, setRecentlyDeleted] = useState<RecentlyDeletedCategory[]>([]);

  // Utility functions
  const generateId = useCallback(() => {
    return (crypto as { randomUUID?: () => string }).randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, []);

  const getNextColor = useCallback(() => {
    const availableColors = colorPalette || defaultColorPalette;
    const usedColors = categories.map(cat => cat.color);
    const unusedColors = availableColors.filter(color => !usedColors.includes(color));
    
    if (unusedColors.length > 0) {
      return unusedColors[0];
    }
    
    // If all colors are used, cycle through them
    return availableColors[categories.length % availableColors.length];
  }, [categories, colorPalette]);

  // CRUD operations
  const addCategory = useCallback((
    categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'order'>
  ) => {
    const newCategory: Category = {
      ...categoryData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      color: categoryData.color || getNextColor(),
      order: categories.length,
    };

    setCategories(prev => [...prev, newCategory]);
    return newCategory.id;
  }, [categories.length, generateId, getNextColor]);

  const updateCategory = useCallback((categoryId: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(category => 
      category.id === categoryId 
        ? { ...category, ...updates, updatedAt: new Date() }
        : category
    ));
  }, []);

  const deleteCategory = useCallback((categoryId: string, taskIds: string[] = []) => {
    const categoryToDelete = categories.find(cat => cat.id === categoryId);
    
    if (categoryToDelete) {
      // Add to recently deleted for potential undo
      setRecentlyDeleted(prev => [
        ...prev,
        { category: categoryToDelete, taskIds }
      ]);

      // Remove from categories
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));

      // Clean up old recently deleted items (keep only last 5)
      setRecentlyDeleted(prev => prev.slice(-4));
    }
  }, [categories]);

  const undoDeleteCategory = useCallback((categoryId: string) => {
    const recentlyDeletedItem = recentlyDeleted.find(
      item => item.category.id === categoryId
    );

    if (recentlyDeletedItem) {
      // Restore the category
      setCategories(prev => [...prev, recentlyDeletedItem.category]);
      
      // Remove from recently deleted
      setRecentlyDeleted(prev => 
        prev.filter(item => item.category.id !== categoryId)
      );

      return recentlyDeletedItem.taskIds;
    }

    return [];
  }, [recentlyDeleted]);

  const reorderCategories = useCallback((startIndex: number, endIndex: number) => {
    setCategories(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const [movedCategory] = sorted.splice(startIndex, 1);
      sorted.splice(endIndex, 0, movedCategory);
      
      // Update order for all categories
      return sorted.map((category, index) => ({
        ...category,
        order: index,
      }));
    });
  }, []);

  // Query functions
  const getCategoryById = useCallback((categoryId: string): Category | undefined => {
    return categories.find(cat => cat.id === categoryId);
  }, [categories]);

  const getCategoriesByName = useCallback((name: string): Category[] => {
    const searchLower = name.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(searchLower)
    );
  }, [categories]);

  const getSortedCategories = useCallback((): Category[] => {
    return [...categories].sort((a, b) => a.order - b.order);
  }, [categories]);

  const getVisibleCategories = useCallback((): Category[] => {
    return categories.filter(cat => cat.visible !== false);
  }, [categories]);

  // Bulk operations
  const bulkUpdateCategories = useCallback((
    categoryIds: string[], 
    updates: Partial<Category>
  ) => {
    setCategories(prev => prev.map(category => 
      categoryIds.includes(category.id)
        ? { ...category, ...updates, updatedAt: new Date() }
        : category
    ));
  }, []);

  const bulkDeleteCategories = useCallback((categoryIds: string[]) => {
    const categoriesToDelete = categories.filter(cat => 
      categoryIds.includes(cat.id)
    );

    categoriesToDelete.forEach(category => {
      deleteCategory(category.id);
    });
  }, [categories, deleteCategory]);

  // Computed values
  const categoryStats = useMemo(() => {
    const visible = categories.filter(cat => cat.visible !== false);
    return {
      total: categories.length,
      visible: visible.length,
      hidden: categories.length - visible.length,
      recentlyDeleted: recentlyDeleted.length,
    };
  }, [categories, recentlyDeleted]);

  const availableColors = useMemo(() => {
    const palette = colorPalette || defaultColorPalette;
    const usedColors = categories.map(cat => cat.color);
    return palette.filter(color => !usedColors.includes(color));
  }, [categories, colorPalette]);

  // Validation functions
  const validateCategoryName = useCallback((name: string, excludeId?: string): string | null => {
    if (!name.trim()) {
      return 'Category name cannot be empty';
    }

    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === name.toLowerCase() && cat.id !== excludeId
    );

    if (existingCategory) {
      return 'A category with this name already exists';
    }

    return null;
  }, [categories]);

  const canDeleteCategory = useCallback((categoryId: string): boolean => {
    // Add any business logic for when categories can't be deleted
    // For example, if they have active tasks
    return true;
  }, []);

  return {
    // State
    categories: getSortedCategories(),
    allCategories: categories,
    recentlyDeleted,
    stats: categoryStats,
    availableColors,

    // Actions
    addCategory,
    updateCategory,
    deleteCategory,
    undoDeleteCategory,
    reorderCategories,
    bulkUpdateCategories,
    bulkDeleteCategories,

    // Queries
    getCategoryById,
    getCategoriesByName,
    getSortedCategories,
    getVisibleCategories,
    getNextColor,

    // Validation
    validateCategoryName,
    canDeleteCategory,

    // Utilities
    clearRecentlyDeleted: () => setRecentlyDeleted([]),
    
    // Raw setters for external sync
    setCategories,
    setRecentlyDeleted,
  };
}
