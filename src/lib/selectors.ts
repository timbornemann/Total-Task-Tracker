/**
 * Selectors for optimized state access and re-render minimization
 * Provides memoized selectors to prevent unnecessary component re-renders
 */

import { useMemo } from "react";
import { Task, Category, Note } from "@/types";
import type { RecurringTask } from "@/hooks/stores/useRecurringTasksStore";

// Base selector types
export type Selector<T, R> = (state: T) => R;
export type EqualityFn<T> = (a: T, b: T) => boolean;

// Shallow equality function for arrays and objects
export const shallowEqual: EqualityFn<unknown> = (a, b) => {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (a === null || b === null) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => item === b[index]);
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => a[key] === b[key]);
};

// Memoized selector hook
export function useSelector<T, R>(
  state: T,
  selector: Selector<T, R>,
  equalityFn: EqualityFn<R> = Object.is,
): R {
  return useMemo(() => selector(state), [state, selector, equalityFn]);
}

// Task Selectors
export const taskSelectors = {
  // Basic selectors
  getAllTasks: (tasks: Task[]) => tasks,

  getTaskById: (tasks: Task[], id: string) =>
    tasks.find((task) => task.id === id),

  getTasksByCategory: (tasks: Task[], categoryId: string) =>
    tasks.filter(
      (task) =>
        task.categoryId === categoryId &&
        !task.parentId &&
        task.visible !== false,
    ),

  getSubtasks: (tasks: Task[], parentId: string) =>
    tasks.filter((task) => task.parentId === parentId),

  // Status-based selectors
  getCompletedTasks: (tasks: Task[]) =>
    tasks.filter((task) => task.completed && task.visible !== false),

  getPendingTasks: (tasks: Task[]) =>
    tasks.filter((task) => !task.completed && task.visible !== false),

  getOverdueTasks: (tasks: Task[]) => {
    const now = new Date();
    return tasks.filter(
      (task) =>
        task.dueDate &&
        task.dueDate < now &&
        !task.completed &&
        task.visible !== false,
    );
  },

  // Priority-based selectors
  getHighPriorityTasks: (tasks: Task[]) =>
    tasks.filter((task) => task.priority === "high" && task.visible !== false),

  getMediumPriorityTasks: (tasks: Task[]) =>
    tasks.filter(
      (task) => task.priority === "medium" && task.visible !== false,
    ),

  getLowPriorityTasks: (tasks: Task[]) =>
    tasks.filter((task) => task.priority === "low" && task.visible !== false),

  // Aggregated selectors
  getPinnedTasks: (tasks: Task[]) =>
    tasks.filter((task) => task.pinned && task.visible !== false),

  getRecentTasks: (tasks: Task[], days: number = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return tasks.filter(
      (task) => task.createdAt >= cutoff && task.visible !== false,
    );
  },

  getTasksByDateRange: (tasks: Task[], start: Date, end: Date) =>
    tasks.filter((task) => {
      const taskDate = task.dueDate || task.createdAt;
      return taskDate >= start && taskDate <= end && task.visible !== false;
    }),

  // Search selectors
  searchTasks: (tasks: Task[], query: string) => {
    if (!query.trim()) return tasks.filter((task) => task.visible !== false);

    const searchLower = query.toLowerCase();
    return tasks.filter(
      (task) =>
        task.visible !== false &&
        (task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)),
    );
  },

  // Statistics selectors
  getTaskStats: (tasks: Task[]) => {
    const visibleTasks = tasks.filter((task) => task.visible !== false);
    const now = new Date();

    return {
      total: visibleTasks.length,
      completed: visibleTasks.filter((task) => task.completed).length,
      pending: visibleTasks.filter((task) => !task.completed).length,
      overdue: visibleTasks.filter(
        (task) => task.dueDate && task.dueDate < now && !task.completed,
      ).length,
      highPriority: visibleTasks.filter((task) => task.priority === "high")
        .length,
      withDueDate: visibleTasks.filter((task) => task.dueDate).length,
      pinned: visibleTasks.filter((task) => task.pinned).length,
    };
  },

  getTasksByStatus: (tasks: Task[]) => {
    const visibleTasks = tasks.filter((task) => task.visible !== false);
    return {
      todo: visibleTasks.filter((task) => task.status === "todo"),
      inProgress: visibleTasks.filter((task) => task.status === "in-progress"),
      completed: visibleTasks.filter((task) => task.status === "completed"),
      cancelled: visibleTasks.filter((task) => task.status === "cancelled"),
    };
  },
};

// Category Selectors
export const categorySelectors = {
  // Basic selectors
  getAllCategories: (categories: Category[]) => categories,

  getCategoryById: (categories: Category[], id: string) =>
    categories.find((category) => category.id === id),

  getVisibleCategories: (categories: Category[]) =>
    categories.filter((category) => category.visible !== false),

  getSortedCategories: (categories: Category[]) =>
    [...categories].sort((a, b) => a.order - b.order),

  // Search selectors
  searchCategories: (categories: Category[], query: string) => {
    if (!query.trim()) return categories;

    const searchLower = query.toLowerCase();
    return categories.filter((category) =>
      category.name.toLowerCase().includes(searchLower),
    );
  },

  // Utility selectors
  getCategoriesByColor: (categories: Category[], color: string) =>
    categories.filter((category) => category.color === color),

  getUsedColors: (categories: Category[]) => [
    ...new Set(categories.map((category) => category.color)),
  ],

  // Statistics selectors
  getCategoryStats: (categories: Category[]) => ({
    total: categories.length,
    visible: categories.filter((cat) => cat.visible !== false).length,
    hidden: categories.filter((cat) => cat.visible === false).length,
  }),
};

// Note Selectors
export const noteSelectors = {
  // Basic selectors
  getAllNotes: (notes: Note[]) => notes,

  getNoteById: (notes: Note[], id: string) =>
    notes.find((note) => note.id === id),

  getNotesByCategory: (notes: Note[], categoryId: string) =>
    notes.filter((note) => note.categoryId === categoryId),

  // Status-based selectors
  getPinnedNotes: (notes: Note[]) =>
    notes.filter((note) => note.pinned && !note.archived),

  getArchivedNotes: (notes: Note[]) => notes.filter((note) => note.archived),

  getActiveNotes: (notes: Note[]) => notes.filter((note) => !note.archived),

  // Sorted selectors
  getSortedNotes: (notes: Note[]) => {
    const pinned = notes
      .filter((note) => note.pinned && !note.archived)
      .sort((a, b) => a.order - b.order);
    const unpinned = notes
      .filter((note) => !note.pinned && !note.archived)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return [...pinned, ...unpinned];
  },

  getRecentNotes: (notes: Note[], count: number = 10) =>
    [...notes]
      .filter((note) => !note.archived)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, count),

  // Search selectors
  searchNotes: (notes: Note[], query: string) => {
    if (!query.trim()) return notes.filter((note) => !note.archived);

    const searchLower = query.toLowerCase();
    return notes.filter(
      (note) =>
        !note.archived &&
        (note.title.toLowerCase().includes(searchLower) ||
          note.content.toLowerCase().includes(searchLower)),
    );
  },

  // Template selectors
  getTemplateNotes: (notes: Note[]) => notes.filter((note) => note.isTemplate),

  // Statistics selectors
  getNoteStats: (notes: Note[]) => ({
    total: notes.length,
    active: notes.filter((note) => !note.archived).length,
    pinned: notes.filter((note) => note.pinned && !note.archived).length,
    archived: notes.filter((note) => note.archived).length,
    templates: notes.filter((note) => note.isTemplate).length,
    withCategory: notes.filter((note) => note.categoryId).length,
  }),
};

// Recurring Task Selectors
export const recurringTaskSelectors = {
  // Basic selectors
  getAllRecurringTasks: (tasks: RecurringTask[]) => tasks,

  getRecurringTaskById: (tasks: RecurringTask[], id: string) =>
    tasks.find((task) => task.id === id),

  getActiveRecurringTasks: (tasks: RecurringTask[]) =>
    tasks.filter((task) => task.isActive),

  getInactiveRecurringTasks: (tasks: RecurringTask[]) =>
    tasks.filter((task) => !task.isActive),

  // Status-based selectors
  getOverdueRecurringTasks: (tasks: RecurringTask[]) => {
    const now = new Date();
    return tasks.filter((task) => task.isActive && task.nextGeneration < now);
  },

  getUpcomingRecurringTasks: (tasks: RecurringTask[], hours: number = 24) => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);

    return tasks.filter(
      (task) =>
        task.isActive &&
        task.nextGeneration >= now &&
        task.nextGeneration <= cutoff,
    );
  },

  // Category-based selectors
  getRecurringTasksByCategory: (tasks: RecurringTask[], categoryId: string) =>
    tasks.filter((task) => task.categoryId === categoryId),

  // Type-based selectors
  getDailyRecurringTasks: (tasks: RecurringTask[]) =>
    tasks.filter((task) => task.recurrence.type === "daily"),

  getWeeklyRecurringTasks: (tasks: RecurringTask[]) =>
    tasks.filter((task) => task.recurrence.type === "weekly"),

  getMonthlyRecurringTasks: (tasks: RecurringTask[]) =>
    tasks.filter((task) => task.recurrence.type === "monthly"),

  getYearlyRecurringTasks: (tasks: RecurringTask[]) =>
    tasks.filter((task) => task.recurrence.type === "yearly"),

  // Statistics selectors
  getRecurringTaskStats: (tasks: RecurringTask[]) => {
    const now = new Date();
    const active = tasks.filter((task) => task.isActive);
    const overdue = tasks.filter(
      (task) => task.isActive && task.nextGeneration < now,
    );

    return {
      total: tasks.length,
      active: active.length,
      inactive: tasks.length - active.length,
      overdue: overdue.length,
      daily: tasks.filter((task) => task.recurrence.type === "daily").length,
      weekly: tasks.filter((task) => task.recurrence.type === "weekly").length,
      monthly: tasks.filter((task) => task.recurrence.type === "monthly")
        .length,
      yearly: tasks.filter((task) => task.recurrence.type === "yearly").length,
    };
  },
};

// Combined Selectors (cross-store)
export const combinedSelectors = {
  // Tasks with category information
  getTasksWithCategories: (tasks: Task[], categories: Category[]) =>
    tasks.map((task) => ({
      ...task,
      category: categories.find((cat) => cat.id === task.categoryId),
    })),

  // Notes with category information
  getNotesWithCategories: (notes: Note[], categories: Category[]) =>
    notes.map((note) => ({
      ...note,
      category: categories.find((cat) => cat.id === note.categoryId),
    })),

  // Category usage statistics
  getCategoryUsage: (tasks: Task[], notes: Note[], categories: Category[]) =>
    categories.map((category) => ({
      ...category,
      taskCount: tasks.filter((task) => task.categoryId === category.id).length,
      noteCount: notes.filter((note) => note.categoryId === category.id).length,
      totalItems:
        tasks.filter((task) => task.categoryId === category.id).length +
        notes.filter((note) => note.categoryId === category.id).length,
    })),

  // Global statistics
  getGlobalStats: (
    tasks: Task[],
    categories: Category[],
    notes: Note[],
    recurringTasks: RecurringTask[],
  ) => ({
    tasks: taskSelectors.getTaskStats(tasks),
    categories: categorySelectors.getCategoryStats(categories),
    notes: noteSelectors.getNoteStats(notes),
    recurringTasks:
      recurringTaskSelectors.getRecurringTaskStats(recurringTasks),
    totalItems: tasks.length + notes.length + recurringTasks.length,
  }),
};

// Selector composition utilities
export function createSelector<T, R1, R2, R3>(
  selector1: Selector<T, R1>,
  selector2: Selector<T, R2>,
  combiner: (result1: R1, result2: R2) => R3,
) {
  return (state: T): R3 => combiner(selector1(state), selector2(state));
}

export function createMemoizedSelector<T, R>(
  selector: Selector<T, R>,
  equalityFn: EqualityFn<R> = Object.is,
) {
  let lastArgs: T;
  let lastResult: R;

  return (state: T): R => {
    if (!equalityFn(state, lastArgs)) {
      lastArgs = state;
      lastResult = selector(state);
    }
    return lastResult;
  };
}
