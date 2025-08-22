/**
 * React hook for offline queue management
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  offlineQueue,
  OfflineQueueState,
  QueuedOperation,
  queueOperation,
  isOnline,
  getQueueLength,
  isProcessingQueue,
} from "@/lib/offlineQueue";

export interface UseOfflineQueueOptions {
  /** Resource name for filtering operations */
  resource?: string;
  /** Auto-process queue when going online */
  autoProcess?: boolean;
}

export function useOfflineQueue(options: UseOfflineQueueOptions = {}) {
  const { resource, autoProcess = true } = options;
  const [state, setState] = useState<OfflineQueueState>(
    offlineQueue.getState(),
  );

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe(setState);
    return unsubscribe;
  }, []);

  // Get operations for specific resource if specified
  const filteredOperations = useMemo(() => {
    if (!resource) return state.queue;
    return state.queue.filter((op) => op.resource === resource);
  }, [state.queue, resource]);

  // Enqueue operation with resource context
  const enqueue = useCallback(
    (
      type: QueuedOperation["type"],
      endpoint: string,
      method: QueuedOperation["method"],
      data?: unknown,
      metadata?: Record<string, unknown>,
      maxRetries: number = 3,
    ) => {
      const targetResource = resource || "unknown";
      return queueOperation({
        type,
        resource: targetResource,
        endpoint,
        method,
        data,
        metadata,
        maxRetries,
      });
    },
    [resource],
  );

  // Enqueue specific operation types
  const enqueueCreate = useCallback(
    (endpoint: string, data: unknown, metadata?: Record<string, unknown>) => {
      return enqueue("create", endpoint, "POST", data, metadata);
    },
    [enqueue],
  );

  const enqueueUpdate = useCallback(
    (endpoint: string, data: unknown, metadata?: Record<string, unknown>) => {
      return enqueue("update", endpoint, "PUT", data, metadata);
    },
    [enqueue],
  );

  const enqueueDelete = useCallback(
    (endpoint: string, metadata?: Record<string, unknown>) => {
      return enqueue("delete", endpoint, "DELETE", undefined, metadata);
    },
    [enqueue],
  );

  const enqueueSync = useCallback(
    (endpoint: string, data: unknown, metadata?: Record<string, unknown>) => {
      return enqueue("sync", endpoint, "PUT", data, metadata);
    },
    [enqueue],
  );

  // Clear operations for current resource
  const clearResourceQueue = useCallback(() => {
    if (resource) {
      return offlineQueue.clearResource(resource);
    }
    return 0;
  }, [resource]);

  // Process queue manually
  const processQueue = useCallback(() => {
    return offlineQueue.processQueue();
  }, []);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    offlineQueue.clearQueue();
  }, []);

  return {
    // State
    isOnline: state.isOnline,
    isProcessing: state.isProcessing,
    queueLength: filteredOperations.length,
    totalQueueLength: state.queue.length,
    operations: filteredOperations,
    allOperations: state.queue,
    lastSyncAttempt: state.lastSyncAttempt,
    consecutiveFailures: state.consecutiveFailures,

    // Actions
    enqueue,
    enqueueCreate,
    enqueueUpdate,
    enqueueDelete,
    enqueueSync,
    processQueue,
    clearResourceQueue,
    clearQueue,

    // Status helpers
    hasQueuedOperations: filteredOperations.length > 0,
    hasPendingWrites: filteredOperations.some((op) =>
      ["create", "update", "delete"].includes(op.type),
    ),
    isRetrying: state.consecutiveFailures > 0,
  };
}

/**
 * Hook for online/offline status only
 */
export function useOnlineStatus() {
  const [isOnlineState, setIsOnlineState] = useState(isOnline());

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe((state) => {
      setIsOnlineState(state.isOnline);
    });
    return unsubscribe;
  }, []);

  return isOnlineState;
}

/**
 * Hook for queue statistics
 */
export function useQueueStats() {
  const [stats, setStats] = useState(() => ({
    queueLength: getQueueLength(),
    isProcessing: isProcessingQueue(),
  }));

  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe((state) => {
      setStats({
        queueLength: state.queue.length,
        isProcessing: state.isProcessing,
      });
    });
    return unsubscribe;
  }, []);

  return stats;
}

/**
 * Hook for specific resource queue management
 */
export function useResourceQueue(resourceName: string) {
  const queue = useOfflineQueue({ resource: resourceName });

  // Create convenient methods for CRUD operations
  const create = useCallback(
    async (data: unknown, endpoint?: string) => {
      const url = endpoint || `/api/${resourceName}`;
      return queue.enqueueCreate(url, data, { operation: "create" });
    },
    [queue, resourceName],
  );

  const update = useCallback(
    async (id: string, data: unknown, endpoint?: string) => {
      const url = endpoint || `/api/${resourceName}/${id}`;
      return queue.enqueueUpdate(url, data, { operation: "update", id });
    },
    [queue, resourceName],
  );

  const remove = useCallback(
    async (id: string, endpoint?: string) => {
      const url = endpoint || `/api/${resourceName}/${id}`;
      return queue.enqueueDelete(url, { operation: "delete", id });
    },
    [queue, resourceName],
  );

  const sync = useCallback(
    async (data: unknown, endpoint?: string) => {
      const url = endpoint || `/api/${resourceName}`;
      return queue.enqueueSync(url, data, { operation: "sync" });
    },
    [queue, resourceName],
  );

  return {
    ...queue,
    // CRUD operations
    create,
    update,
    delete: remove,
    sync,

    // Resource-specific helpers
    resourceName,
    hasUnsavedChanges: queue.hasPendingWrites,
  };
}

/**
 * Hook that automatically enqueues operations when offline
 */
export function useOfflineAwareApi(resourceName: string) {
  const { isOnline } = useOnlineStatus();
  const resourceQueue = useResourceQueue(resourceName);

  const makeRequest = useCallback(
    async <T>(
      operation: () => Promise<T>,
      fallback: {
        type: QueuedOperation["type"];
        endpoint: string;
        method: QueuedOperation["method"];
        data?: unknown;
      },
    ): Promise<T | null> => {
      if (isOnline) {
        try {
          return await operation();
        } catch (error) {
          // If request fails and it's a network error, queue it
          if (
            error instanceof TypeError ||
            (error as DOMException)?.message?.includes("fetch")
          ) {
            resourceQueue.enqueue(
              fallback.type,
              fallback.endpoint,
              fallback.method,
              fallback.data,
            );
          }
          throw error;
        }
      } else {
        // Queue operation for later
        resourceQueue.enqueue(
          fallback.type,
          fallback.endpoint,
          fallback.method,
          fallback.data,
        );
        return null;
      }
    },
    [isOnline, resourceQueue],
  );

  return {
    ...resourceQueue,
    makeRequest,
    isOnline,
  };
}
