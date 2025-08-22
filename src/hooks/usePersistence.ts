/**
 * React hooks for unified persistence and sync
 * Provides easy integration with React components and stores
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  PersistenceManager,
  PersistenceConfig,
  PersistableEntity,
  SyncState,
  ConflictRecord,
} from "@/lib/persistence";
import { useOnlineStatus } from "./useOfflineQueue";

// Hook for managing persistence with a store
export function usePersistence<T extends PersistableEntity>(
  config: PersistenceConfig<T>,
  data: T[],
  onDataChange: (data: T[]) => void,
) {
  const managerRef = useRef<PersistenceManager<T>>();
  const [syncState, setSyncState] = useState<SyncState>({});
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const isOnline = useOnlineStatus();

  // Initialize persistence manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new PersistenceManager(config);

      // Load initial sync state
      setSyncState(managerRef.current.getSyncState());

      // Start auto-sync if configured
      if (config.syncInterval && config.syncInterval > 0) {
        managerRef.current.startAutoSync();
      }
    }

    return () => {
      managerRef.current?.destroy();
    };
  }, [config]);

  // Save to local storage whenever data changes
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.saveLocal(data);
    }
  }, [data]);

  // Load initial data from local storage
  useEffect(() => {
    if (managerRef.current) {
      const localData = managerRef.current.loadLocal();
      if (localData.length > 0) {
        onDataChange(localData);
      }
    }
  }, [onDataChange]);

  // Sync functions
  const syncWithServer = useCallback(async () => {
    if (!managerRef.current || isSyncing) return;

    setIsSyncing(true);

    try {
      const result = await managerRef.current.syncWithServer(data);

      if (result.success) {
        onDataChange(result.data);
        setConflicts(result.conflicts);
        setSyncState(managerRef.current.getSyncState());
      }

      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [data, onDataChange, isSyncing]);

  // Queue operations for offline support
  const queueCreate = useCallback((item: T) => {
    return managerRef.current?.queueCreate(item) || "";
  }, []);

  const queueUpdate = useCallback((id: string, updates: Partial<T>) => {
    return managerRef.current?.queueUpdate(id, updates) || "";
  }, []);

  const queueDelete = useCallback((id: string) => {
    return managerRef.current?.queueDelete(id) || "";
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && !isSyncing) {
      // Small delay to ensure connection is stable
      const timer = setTimeout(() => {
        syncWithServer();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, syncWithServer, isSyncing]);

  // Statistics
  const getStats = useCallback(() => {
    return (
      managerRef.current?.getStats() || {
        syncVersion: 0,
        localCount: 0,
        deletionCount: 0,
        conflictCount: 0,
      }
    );
  }, []);

  return {
    // State
    syncState,
    conflicts,
    isSyncing,
    isOnline,

    // Actions
    syncWithServer,
    queueCreate,
    queueUpdate,
    queueDelete,

    // Utilities
    getStats,

    // Manual control
    startAutoSync: () => managerRef.current?.startAutoSync(),
    stopAutoSync: () => managerRef.current?.stopAutoSync(),

    // Direct manager access for advanced use cases
    manager: managerRef.current,
  };
}

// Simplified hook for basic persistence without real-time sync
export function useLocalPersistence<T>(
  storeName: string,
  data: T,
  defaultValue: T,
): [T, (newData: T) => void] {
  const [localData, setLocalData] = useState<T>(defaultValue);
  const storageKey = `${storeName}_data`;

  // Load initial data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored, (_, value) => {
          if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            return new Date(value);
          }
          return value;
        });
        setLocalData(parsed);
      }
    } catch (error) {
      console.error(`Failed to load ${storeName} from localStorage:`, error);
    }
  }, [storeName, storageKey]);

  // Save function
  const saveData = useCallback(
    (newData: T) => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify(newData, (_, value) => {
            return value instanceof Date ? value.toISOString() : value;
          }),
        );
        setLocalData(newData);
      } catch (error) {
        console.error(`Failed to save ${storeName} to localStorage:`, error);
      }
    },
    [storageKey, storeName],
  );

  // Auto-save when data prop changes
  useEffect(() => {
    if (data !== defaultValue) {
      saveData(data);
    }
  }, [data, saveData, defaultValue]);

  return [localData, saveData];
}

// Hook for handling sync conflicts
export function useSyncConflicts<T extends PersistableEntity>(
  conflicts: ConflictRecord[],
) {
  const [resolvedConflicts, setResolvedConflicts] = useState<Set<string>>(
    new Set(),
  );

  const resolveConflict = useCallback(
    (
      conflictId: string,
      resolution: "local" | "server" | "merge",
      mergedData?: T,
    ) => {
      setResolvedConflicts((prev) => new Set([...prev, conflictId]));

      // Here you would typically update the store with the resolved data
      console.log(
        `Conflict ${conflictId} resolved with ${resolution}`,
        mergedData,
      );
    },
    [],
  );

  const unresolvedConflicts = conflicts.filter(
    (conflict) => !resolvedConflicts.has(conflict.id),
  );

  return {
    unresolvedConflicts,
    resolvedConflicts: Array.from(resolvedConflicts),
    resolveConflict,
    hasUnresolvedConflicts: unresolvedConflicts.length > 0,
  };
}

// Hook for batch sync operations
export function useBatchSync<T extends PersistableEntity>(
  managers: PersistenceManager<T>[],
) {
  const [batchSyncStatus, setBatchSyncStatus] = useState<{
    isRunning: boolean;
    completed: number;
    total: number;
    errors: string[];
  }>({
    isRunning: false,
    completed: 0,
    total: 0,
    errors: [],
  });

  const runBatchSync = useCallback(async () => {
    setBatchSyncStatus({
      isRunning: true,
      completed: 0,
      total: managers.length,
      errors: [],
    });

    const errors: string[] = [];

    for (let i = 0; i < managers.length; i++) {
      try {
        const manager = managers[i];
        const localData = manager.loadLocal();
        await manager.syncWithServer(localData);

        setBatchSyncStatus((prev) => ({
          ...prev,
          completed: i + 1,
        }));
      } catch (error) {
        errors.push(`Manager ${i}: ${error}`);
      }
    }

    setBatchSyncStatus((prev) => ({
      ...prev,
      isRunning: false,
      errors,
    }));
  }, [managers]);

  return {
    batchSyncStatus,
    runBatchSync,
  };
}

// Hook for persistence statistics across multiple stores
export function usePersistenceStats(managers: PersistenceManager<unknown>[]) {
  const [stats, setStats] = useState<{
    totalItems: number;
    totalConflicts: number;
    lastGlobalSync?: Date;
    storeStats: Array<{ storeName: string; stats: unknown }>;
  }>({
    totalItems: 0,
    totalConflicts: 0,
    storeStats: [],
  });

  const updateStats = useCallback(() => {
    const storeStats = managers.map((manager) => ({
      storeName: manager["config"]?.storeName || "unknown",
      stats: manager.getStats(),
    }));

    const totalItems = storeStats.reduce(
      (sum, store) => sum + store.stats.localCount,
      0,
    );
    const totalConflicts = storeStats.reduce(
      (sum, store) => sum + store.stats.conflictCount,
      0,
    );

    const lastSyncs = storeStats
      .map((store) => store.stats.lastSync)
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime());

    const lastGlobalSync = lastSyncs[0];

    setStats({
      totalItems,
      totalConflicts,
      lastGlobalSync,
      storeStats,
    });
  }, [managers]);

  // Update stats periodically
  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  return {
    stats,
    updateStats,
  };
}

// Utility hook for creating persistence configs
export function useCreatePersistenceConfig<T extends PersistableEntity>(
  storeName: string,
  apiEndpoint: string,
  options: Partial<PersistenceConfig<T>> = {},
): PersistenceConfig<T> {
  return {
    storeName,
    apiEndpoint,
    syncInterval: 30000, // 30 seconds default
    maxRetries: 3,
    enableConflictResolution: true,
    ...options,
  };
}
