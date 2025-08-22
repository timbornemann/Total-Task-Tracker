/**
 * Optimized store hooks using selectors to minimize re-renders
 * These hooks provide fine-grained access to store state with memoization
 */

import { useMemo, useState, useEffect } from "react";
import { Task, Category, Note } from "@/types";
import type { RecurringTask } from "@/hooks/stores/useRecurringTasksStore";
import {
  taskSelectors,
  categorySelectors,
  noteSelectors,
  recurringTaskSelectors,
  combinedSelectors,
  shallowEqual,
} from "@/lib/selectors";

// Types for store states
interface TaskStoreState {
  tasks: Task[];
  allTasks: Task[];
  filters: unknown;
  sort: unknown;
  stats: unknown;
}

interface CategoryStoreState {
  categories: Category[];
  allCategories: Category[];
  recentlyDeleted: unknown[];
  stats: unknown;
}

interface NoteStoreState {
  notes: Note[];
  allNotes: Note[];
  pinnedNotes: Note[];
  recentNotes: Note[];
  filters: unknown;
  sort: unknown;
  stats: unknown;
}

interface RecurringTaskStoreState {
  recurringTasks: RecurringTask[];
  generatedTasks: Task[];
  stats: unknown;
}

// Task Store Selectors
export function useTaskById(store: TaskStoreState, taskId: string) {
  return useMemo(
    () => taskSelectors.getTaskById(store.allTasks, taskId),
    [store.allTasks, taskId],
  );
}

export function useTasksByCategory(store: TaskStoreState, categoryId: string) {
  return useMemo(
    () => taskSelectors.getTasksByCategory(store.allTasks, categoryId),
    [store.allTasks, categoryId],
  );
}

export function useCompletedTasks(store: TaskStoreState) {
  return useMemo(
    () => taskSelectors.getCompletedTasks(store.allTasks),
    [store.allTasks],
  );
}

export function usePendingTasks(store: TaskStoreState) {
  return useMemo(
    () => taskSelectors.getPendingTasks(store.allTasks),
    [store.allTasks],
  );
}

export function useOverdueTasks(store: TaskStoreState) {
  return useMemo(
    () => taskSelectors.getOverdueTasks(store.allTasks),
    [store.allTasks],
  );
}

export function useHighPriorityTasks(store: TaskStoreState) {
  return useMemo(
    () => taskSelectors.getHighPriorityTasks(store.allTasks),
    [store.allTasks],
  );
}

export function usePinnedTasks(store: TaskStoreState) {
  return useMemo(
    () => taskSelectors.getPinnedTasks(store.allTasks),
    [store.allTasks],
  );
}

export function useTaskStats(store: TaskStoreState) {
  return useMemo(
    () => taskSelectors.getTaskStats(store.allTasks),
    [store.allTasks],
  );
}

export function useTasksByStatus(store: TaskStoreState) {
  return useMemo(
    () => taskSelectors.getTasksByStatus(store.allTasks),
    [store.allTasks],
  );
}

export function useRecentTasks(store: TaskStoreState, days: number = 7) {
  return useMemo(
    () => taskSelectors.getRecentTasks(store.allTasks, days),
    [store.allTasks, days],
  );
}

export function useSearchTasks(store: TaskStoreState, query: string) {
  return useMemo(
    () => taskSelectors.searchTasks(store.allTasks, query),
    [store.allTasks, query],
  );
}

export function useTasksByDateRange(
  store: TaskStoreState,
  start: Date,
  end: Date,
) {
  return useMemo(
    () => taskSelectors.getTasksByDateRange(store.allTasks, start, end),
    [store.allTasks, start.getTime(), end.getTime()],
  );
}

// Category Store Selectors
export function useCategoryById(store: CategoryStoreState, categoryId: string) {
  return useMemo(
    () => categorySelectors.getCategoryById(store.allCategories, categoryId),
    [store.allCategories, categoryId],
  );
}

export function useVisibleCategories(store: CategoryStoreState) {
  return useMemo(
    () => categorySelectors.getVisibleCategories(store.allCategories),
    [store.allCategories],
  );
}

export function useSortedCategories(store: CategoryStoreState) {
  return useMemo(
    () => categorySelectors.getSortedCategories(store.allCategories),
    [store.allCategories],
  );
}

export function useSearchCategories(store: CategoryStoreState, query: string) {
  return useMemo(
    () => categorySelectors.searchCategories(store.allCategories, query),
    [store.allCategories, query],
  );
}

export function useCategoriesByColor(store: CategoryStoreState, color: string) {
  return useMemo(
    () => categorySelectors.getCategoriesByColor(store.allCategories, color),
    [store.allCategories, color],
  );
}

export function useUsedColors(store: CategoryStoreState) {
  return useMemo(
    () => categorySelectors.getUsedColors(store.allCategories),
    [store.allCategories],
  );
}

export function useCategoryStats(store: CategoryStoreState) {
  return useMemo(
    () => categorySelectors.getCategoryStats(store.allCategories),
    [store.allCategories],
  );
}

// Note Store Selectors
export function useNoteById(store: NoteStoreState, noteId: string) {
  return useMemo(
    () => noteSelectors.getNoteById(store.allNotes, noteId),
    [store.allNotes, noteId],
  );
}

export function useNotesByCategory(store: NoteStoreState, categoryId: string) {
  return useMemo(
    () => noteSelectors.getNotesByCategory(store.allNotes, categoryId),
    [store.allNotes, categoryId],
  );
}

export function usePinnedNotes(store: NoteStoreState) {
  return useMemo(
    () => noteSelectors.getPinnedNotes(store.allNotes),
    [store.allNotes],
  );
}

export function useArchivedNotes(store: NoteStoreState) {
  return useMemo(
    () => noteSelectors.getArchivedNotes(store.allNotes),
    [store.allNotes],
  );
}

export function useActiveNotes(store: NoteStoreState) {
  return useMemo(
    () => noteSelectors.getActiveNotes(store.allNotes),
    [store.allNotes],
  );
}

export function useSortedNotes(store: NoteStoreState) {
  return useMemo(
    () => noteSelectors.getSortedNotes(store.allNotes),
    [store.allNotes],
  );
}

export function useRecentNotes(store: NoteStoreState, count: number = 10) {
  return useMemo(
    () => noteSelectors.getRecentNotes(store.allNotes, count),
    [store.allNotes, count],
  );
}

export function useSearchNotes(store: NoteStoreState, query: string) {
  return useMemo(
    () => noteSelectors.searchNotes(store.allNotes, query),
    [store.allNotes, query],
  );
}

export function useTemplateNotes(store: NoteStoreState) {
  return useMemo(
    () => noteSelectors.getTemplateNotes(store.allNotes),
    [store.allNotes],
  );
}

export function useNoteStats(store: NoteStoreState) {
  return useMemo(
    () => noteSelectors.getNoteStats(store.allNotes),
    [store.allNotes],
  );
}

// Recurring Task Store Selectors
export function useRecurringTaskById(
  store: RecurringTaskStoreState,
  taskId: string,
) {
  return useMemo(
    () =>
      recurringTaskSelectors.getRecurringTaskById(store.recurringTasks, taskId),
    [store.recurringTasks, taskId],
  );
}

export function useActiveRecurringTasks(store: RecurringTaskStoreState) {
  return useMemo(
    () => recurringTaskSelectors.getActiveRecurringTasks(store.recurringTasks),
    [store.recurringTasks],
  );
}

export function useOverdueRecurringTasks(store: RecurringTaskStoreState) {
  return useMemo(
    () => recurringTaskSelectors.getOverdueRecurringTasks(store.recurringTasks),
    [store.recurringTasks],
  );
}

export function useUpcomingRecurringTasks(
  store: RecurringTaskStoreState,
  hours: number = 24,
) {
  return useMemo(
    () =>
      recurringTaskSelectors.getUpcomingRecurringTasks(
        store.recurringTasks,
        hours,
      ),
    [store.recurringTasks, hours],
  );
}

export function useRecurringTasksByCategory(
  store: RecurringTaskStoreState,
  categoryId: string,
) {
  return useMemo(
    () =>
      recurringTaskSelectors.getRecurringTasksByCategory(
        store.recurringTasks,
        categoryId,
      ),
    [store.recurringTasks, categoryId],
  );
}

export function useDailyRecurringTasks(store: RecurringTaskStoreState) {
  return useMemo(
    () => recurringTaskSelectors.getDailyRecurringTasks(store.recurringTasks),
    [store.recurringTasks],
  );
}

export function useWeeklyRecurringTasks(store: RecurringTaskStoreState) {
  return useMemo(
    () => recurringTaskSelectors.getWeeklyRecurringTasks(store.recurringTasks),
    [store.recurringTasks],
  );
}

export function useMonthlyRecurringTasks(store: RecurringTaskStoreState) {
  return useMemo(
    () => recurringTaskSelectors.getMonthlyRecurringTasks(store.recurringTasks),
    [store.recurringTasks],
  );
}

export function useRecurringTaskStats(store: RecurringTaskStoreState) {
  return useMemo(
    () => recurringTaskSelectors.getRecurringTaskStats(store.recurringTasks),
    [store.recurringTasks],
  );
}

// Combined Selectors (cross-store)
export function useTasksWithCategories(
  taskStore: TaskStoreState,
  categoryStore: CategoryStoreState,
) {
  return useMemo(
    () =>
      combinedSelectors.getTasksWithCategories(
        taskStore.allTasks,
        categoryStore.allCategories,
      ),
    [taskStore.allTasks, categoryStore.allCategories],
  );
}

export function useNotesWithCategories(
  noteStore: NoteStoreState,
  categoryStore: CategoryStoreState,
) {
  return useMemo(
    () =>
      combinedSelectors.getNotesWithCategories(
        noteStore.allNotes,
        categoryStore.allCategories,
      ),
    [noteStore.allNotes, categoryStore.allCategories],
  );
}

export function useCategoryUsage(
  taskStore: TaskStoreState,
  noteStore: NoteStoreState,
  categoryStore: CategoryStoreState,
) {
  return useMemo(
    () =>
      combinedSelectors.getCategoryUsage(
        taskStore.allTasks,
        noteStore.allNotes,
        categoryStore.allCategories,
      ),
    [taskStore.allTasks, noteStore.allNotes, categoryStore.allCategories],
  );
}

export function useGlobalStats(
  taskStore: TaskStoreState,
  categoryStore: CategoryStoreState,
  noteStore: NoteStoreState,
  recurringStore: RecurringTaskStoreState,
) {
  return useMemo(
    () =>
      combinedSelectors.getGlobalStats(
        taskStore.allTasks,
        categoryStore.allCategories,
        noteStore.allNotes,
        recurringStore.recurringTasks,
      ),
    [
      taskStore.allTasks,
      categoryStore.allCategories,
      noteStore.allNotes,
      recurringStore.recurringTasks,
    ],
  );
}

// Performance monitoring hooks
export function useRenderCount(name: string) {
  const count = useMemo(() => {
    let renderCount = 0;
    return () => {
      renderCount++;
      console.log(`[${name}] Render count: ${renderCount}`);
      return renderCount;
    };
  }, [name]);

  count();
}

export function useStorePerformance<T>(
  storeName: string,
  storeState: T,
  equalityFn = shallowEqual,
) {
  const previousState = useMemo(() => storeState, []);

  useMemo(() => {
    if (!equalityFn(storeState, previousState)) {
      console.log(`[${storeName}] State changed, triggering re-render`, {
        previous: previousState,
        current: storeState,
      });
    }
  }, [storeName, storeState, previousState, equalityFn]);
}

// Selector composition helpers
export function createComposedSelector<T1, T2, R1, R2, R>(
  selector1: (store: T1) => R1,
  selector2: (store: T2) => R2,
  combiner: (result1: R1, result2: R2) => R,
) {
  return (store1: T1, store2: T2): R => {
    const result1 = selector1(store1);
    const result2 = selector2(store2);
    return combiner(result1, result2);
  };
}

// Debounced selectors for expensive operations
export function useDebouncedSelector<T, R>(
  state: T,
  selector: (state: T) => R,
  delay: number = 300,
  equalityFn = Object.is,
) {
  const [debouncedResult, setDebouncedResult] = useState<R>(() =>
    selector(state),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const newResult = selector(state);
      if (!equalityFn(debouncedResult, newResult)) {
        setDebouncedResult(newResult);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [state, selector, delay, debouncedResult, equalityFn]);

  return debouncedResult;
}
