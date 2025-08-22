/**
 * Centralized exports for all selector-related utilities
 * Provides easy access to optimized selectors and hooks
 */

// Export all selectors
export * from "@/lib/selectors";

// Export optimized store hooks
export * from "./useOptimizedStores";

// Re-export commonly used selector utilities
export {
  shallowEqual,
  useSelector,
  taskSelectors,
  categorySelectors,
  noteSelectors,
  recurringTaskSelectors,
  combinedSelectors,
  createSelector,
  createMemoizedSelector,
} from "@/lib/selectors";

// Export specialized hooks for common use cases
export {
  useTaskById,
  useTasksByCategory,
  useCompletedTasks,
  usePendingTasks,
  useOverdueTasks,
  useHighPriorityTasks,
  usePinnedTasks,
  useTaskStats,
  useTasksByStatus,
  useRecentTasks,
  useSearchTasks,
  useTasksByDateRange,
  useCategoryById,
  useVisibleCategories,
  useSortedCategories,
  useSearchCategories,
  useCategoriesByColor,
  useUsedColors,
  useCategoryStats,
  useNoteById,
  useNotesByCategory,
  usePinnedNotes,
  useArchivedNotes,
  useActiveNotes,
  useSortedNotes,
  useRecentNotes,
  useSearchNotes,
  useTemplateNotes,
  useNoteStats,
  useRecurringTaskById,
  useActiveRecurringTasks,
  useOverdueRecurringTasks,
  useUpcomingRecurringTasks,
  useRecurringTasksByCategory,
  useDailyRecurringTasks,
  useWeeklyRecurringTasks,
  useMonthlyRecurringTasks,
  useRecurringTaskStats,
  useTasksWithCategories,
  useNotesWithCategories,
  useCategoryUsage,
  useGlobalStats,
  useRenderCount,
  useStorePerformance,
  createComposedSelector,
  useDebouncedSelector,
} from "./useOptimizedStores";
