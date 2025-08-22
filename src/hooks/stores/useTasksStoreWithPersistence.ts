/**
 * Example: Tasks Store with unified persistence pattern
 * Demonstrates how to integrate the new persistence system with existing stores
 */

import { useState, useCallback, useMemo } from "react";
import { Task } from "@/types";
import {
  useTasksStore,
  TaskFilters,
  TaskSort,
  UseTasksStoreOptions,
} from "./useTasksStore";
import {
  usePersistence,
  useCreatePersistenceConfig,
  useSyncConflicts,
} from "@/hooks/usePersistence";
import { createLastWriteWinsMerger } from "@/lib/persistence";

// Enhanced options with persistence configuration
export interface UseTasksStoreWithPersistenceOptions
  extends UseTasksStoreOptions {
  enablePersistence?: boolean;
  syncInterval?: number;
  apiEndpoint?: string;
  enableConflictResolution?: boolean;
}

export function useTasksStoreWithPersistence(
  options: UseTasksStoreWithPersistenceOptions = {},
) {
  const {
    enablePersistence = true,
    syncInterval = 30000,
    apiEndpoint = "/api/tasks",
    enableConflictResolution = true,
    ...taskStoreOptions
  } = options;

  // Initialize base tasks store
  const [tasks, setTasks] = useState<Task[]>(
    taskStoreOptions.initialTasks || [],
  );

  const taskStore = useTasksStore({
    ...taskStoreOptions,
    initialTasks: tasks,
  });

  // Create persistence configuration
  const persistenceConfig = useCreatePersistenceConfig<Task>(
    "tasks",
    apiEndpoint,
    {
      syncInterval,
      enableConflictResolution,
      customMerger: createLastWriteWinsMerger<Task>(),
      validator: (task: Task) => {
        // Validate task data
        return !!(
          task.id &&
          task.title &&
          task.createdAt &&
          task.updatedAt &&
          task.status &&
          task.priority
        );
      },
    },
  );

  // Initialize persistence
  const persistence = usePersistence(
    persistenceConfig,
    taskStore.allTasks,
    (syncedTasks) => {
      setTasks(syncedTasks);
      taskStore.setTasks(syncedTasks);
    },
  );

  // Handle sync conflicts
  const conflictManager = useSyncConflicts<Task>(persistence.conflicts);

  // Enhanced CRUD operations with persistence
  const addTaskWithPersistence = useCallback(
    async (taskData: Parameters<typeof taskStore.addTask>[0]) => {
      const taskId = taskStore.addTask(taskData);

      if (enablePersistence) {
        const newTask = taskStore.findTaskById(taskId);
        if (newTask) {
          if (persistence.isOnline) {
            // Try immediate sync
            try {
              await persistence.syncWithServer();
            } catch (error) {
              // Queue for later if sync fails
              persistence.queueCreate(newTask);
            }
          } else {
            // Queue for when online
            persistence.queueCreate(newTask);
          }
        }
      }

      return taskId;
    },
    [taskStore, persistence, enablePersistence],
  );

  const updateTaskWithPersistence = useCallback(
    async (
      taskId: string,
      updates: Parameters<typeof taskStore.updateTask>[1],
    ) => {
      taskStore.updateTask(taskId, updates);

      if (enablePersistence) {
        if (persistence.isOnline) {
          try {
            await persistence.syncWithServer();
          } catch (error) {
            persistence.queueUpdate(taskId, updates);
          }
        } else {
          persistence.queueUpdate(taskId, updates);
        }
      }
    },
    [taskStore, persistence, enablePersistence],
  );

  const deleteTaskWithPersistence = useCallback(
    async (taskId: string) => {
      taskStore.deleteTask(taskId);

      if (enablePersistence) {
        if (persistence.isOnline) {
          try {
            await persistence.syncWithServer();
          } catch (error) {
            persistence.queueDelete(taskId);
          }
        } else {
          persistence.queueDelete(taskId);
        }
      }
    },
    [taskStore, persistence, enablePersistence],
  );

  // Batch operations with persistence
  const bulkUpdateTasksWithPersistence = useCallback(
    async (taskIds: string[], updates: Partial<Task>) => {
      taskStore.bulkUpdateTasks(taskIds, updates);

      if (enablePersistence) {
        if (persistence.isOnline) {
          try {
            await persistence.syncWithServer();
          } catch (error) {
            // Queue each update individually
            taskIds.forEach((id) => persistence.queueUpdate(id, updates));
          }
        } else {
          taskIds.forEach((id) => persistence.queueUpdate(id, updates));
        }
      }
    },
    [taskStore, persistence, enablePersistence],
  );

  const bulkDeleteTasksWithPersistence = useCallback(
    async (taskIds: string[]) => {
      taskStore.bulkDeleteTasks(taskIds);

      if (enablePersistence) {
        if (persistence.isOnline) {
          try {
            await persistence.syncWithServer();
          } catch (error) {
            taskIds.forEach((id) => persistence.queueDelete(id));
          }
        } else {
          taskIds.forEach((id) => persistence.queueDelete(id));
        }
      }
    },
    [taskStore, persistence, enablePersistence],
  );

  // Manual sync operations
  const forceSyncWithServer = useCallback(async () => {
    if (enablePersistence) {
      return await persistence.syncWithServer();
    }
    return { data: taskStore.allTasks, conflicts: [], success: true };
  }, [persistence, taskStore, enablePersistence]);

  // Conflict resolution helpers
  const resolveTaskConflict = useCallback(
    (
      conflictId: string,
      resolution: "local" | "server" | "merge",
      mergedTask?: Task,
    ) => {
      const conflict = persistence.conflicts.find((c) => c.id === conflictId);
      if (!conflict) return;

      let resolvedTask: Task;

      switch (resolution) {
        case "local":
          resolvedTask = conflict.localData;
          break;
        case "server":
          resolvedTask = conflict.serverData;
          break;
        case "merge":
          resolvedTask = mergedTask || {
            ...conflict.serverData,
            ...conflict.localData,
            updatedAt: new Date(),
          };
          break;
      }

      // Update the task in the store
      taskStore.updateTask(resolvedTask.id, resolvedTask);

      // Mark conflict as resolved
      conflictManager.resolveConflict(conflictId, resolution, resolvedTask);
    },
    [persistence.conflicts, taskStore, conflictManager],
  );

  // Enhanced statistics including sync info
  const enhancedStats = useMemo(() => {
    const persistenceStats = persistence.getStats();
    const baseStats = taskStore.stats;

    return {
      ...baseStats,
      sync: {
        lastSync: persistenceStats.lastSync,
        syncVersion: persistenceStats.syncVersion,
        deletionCount: persistenceStats.deletionCount,
        conflictCount: persistenceStats.conflictCount,
        isOnline: persistence.isOnline,
        isSyncing: persistence.isSyncing,
      },
    };
  }, [taskStore.stats, persistence]);

  // Connection status helpers
  const connectionStatus = useMemo(
    () => ({
      isOnline: persistence.isOnline,
      isSyncing: persistence.isSyncing,
      hasConflicts: conflictManager.hasUnresolvedConflicts,
      unresolvedConflictCount: conflictManager.unresolvedConflicts.length,
      lastSync: persistence.syncState.lastSync,
    }),
    [persistence, conflictManager],
  );

  return {
    // All original task store functionality
    ...taskStore,

    // Enhanced CRUD with persistence
    addTask: addTaskWithPersistence,
    updateTask: updateTaskWithPersistence,
    deleteTask: deleteTaskWithPersistence,
    bulkUpdateTasks: bulkUpdateTasksWithPersistence,
    bulkDeleteTasks: bulkDeleteTasksWithPersistence,

    // Sync operations
    syncWithServer: forceSyncWithServer,

    // Conflict management
    conflicts: persistence.conflicts,
    unresolvedConflicts: conflictManager.unresolvedConflicts,
    resolveConflict: resolveTaskConflict,

    // Enhanced statistics
    stats: enhancedStats,
    connectionStatus,

    // Sync control
    startAutoSync: persistence.startAutoSync,
    stopAutoSync: persistence.stopAutoSync,

    // Queue management (from offline queue)
    queueCreate: persistence.queueCreate,
    queueUpdate: persistence.queueUpdate,
    queueDelete: persistence.queueDelete,

    // Raw persistence access for advanced use cases
    persistence,
  };
}

// Helper hook for creating task store with common configurations
export function useStandardTaskStore(categoryId?: string) {
  return useTasksStoreWithPersistence({
    enablePersistence: true,
    syncInterval: 30000, // 30 seconds
    apiEndpoint: "/api/tasks",
    enableConflictResolution: true,
    defaultFilters: {
      categoryId,
      showCompleted: false,
    },
    defaultSort: {
      field: "order",
      direction: "asc",
    },
  });
}

// Hook for read-only task access (no sync overhead)
export function useReadOnlyTaskStore(options: UseTasksStoreOptions = {}) {
  return useTasksStoreWithPersistence({
    ...options,
    enablePersistence: false,
  });
}

// Hook for task store with custom sync behavior
export function useCustomSyncTaskStore(
  syncInterval: number,
  customApiEndpoint?: string,
) {
  return useTasksStoreWithPersistence({
    enablePersistence: true,
    syncInterval,
    apiEndpoint: customApiEndpoint || "/api/tasks",
    enableConflictResolution: true,
  });
}
