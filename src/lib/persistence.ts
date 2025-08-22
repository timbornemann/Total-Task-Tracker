/**
 * Unified persistence and sync pattern for all stores
 * Standardizes offline storage, API sync, and conflict resolution
 */

import { api } from "./apiClient";
import {
  showSyncNotification,
  showErrorNotification,
} from "./errorNotifications";
import { offlineQueue, queueOperation } from "./offlineQueue";

// Base interfaces for persisted data
export interface PersistableEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeletionRecord {
  id: string;
  type: string;
  deletedAt: Date;
}

export interface SyncState {
  lastSync?: Date;
  version?: number;
  conflicts?: ConflictRecord[];
  pendingOperations?: PendingOperation[];
}

export interface ConflictRecord {
  id: string;
  type: "update" | "delete";
  localData: unknown;
  serverData: unknown;
  timestamp: Date;
}

export interface PendingOperation {
  id: string;
  type: "create" | "update" | "delete";
  entityType: string;
  entityId: string;
  data?: unknown;
  timestamp: Date;
  retries: number;
}

// Persistence configuration for each store
export interface PersistenceConfig<T extends PersistableEntity> {
  storeName: string;
  apiEndpoint: string;
  syncInterval?: number; // milliseconds
  maxRetries?: number;
  enableConflictResolution?: boolean;
  customMerger?: (local: T[], server: T[], deletions: DeletionRecord[]) => T[];
  validator?: (data: T) => boolean;
}

// Storage utilities
export class PersistenceManager<T extends PersistableEntity> {
  private config: PersistenceConfig<T>;
  private syncTimer?: NodeJS.Timeout;
  private storageKey: string;
  private syncStateKey: string;
  private deletionsKey: string;

  constructor(config: PersistenceConfig<T>) {
    this.config = {
      syncInterval: 30000, // 30 seconds default
      maxRetries: 3,
      enableConflictResolution: true,
      ...config,
    };

    this.storageKey = `${config.storeName}_data`;
    this.syncStateKey = `${config.storeName}_sync`;
    this.deletionsKey = `${config.storeName}_deletions`;
  }

  // Local storage operations
  private saveToStorage(key: string, data: unknown): void {
    try {
      const serialized = JSON.stringify(data, this.dateReplacer);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(
        `[${this.config.storeName}] Failed to save to storage:`,
        error,
      );
      showErrorNotification(error as Error, {
        action: "Lokales Speichern",
        resource: this.config.storeName,
      });
    }
  }

  private loadFromStorage(key: string): unknown | null {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored, this.dateReviver) : null;
    } catch (error) {
      console.error(
        `[${this.config.storeName}] Failed to load from storage:`,
        error,
      );
      return null;
    }
  }

  // Date serialization helpers
  private dateReplacer = (_: string, value: unknown): unknown => {
    return value instanceof Date ? value.toISOString() : value;
  };

  private dateReviver = (_: string, value: unknown): unknown => {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value);
    }
    return value;
  };

  // Public API
  saveLocal(data: T[]): void {
    this.saveToStorage(this.storageKey, data);
  }

  loadLocal(): T[] {
    return this.loadFromStorage(this.storageKey) || [];
  }

  getSyncState(): SyncState {
    return this.loadFromStorage(this.syncStateKey) || {};
  }

  setSyncState(state: Partial<SyncState>): void {
    const current = this.getSyncState();
    this.saveToStorage(this.syncStateKey, { ...current, ...state });
  }

  getDeletions(): DeletionRecord[] {
    return this.loadFromStorage(this.deletionsKey) || [];
  }

  addDeletion(id: string, type: string): void {
    const deletions = this.getDeletions();
    deletions.push({
      id,
      type,
      deletedAt: new Date(),
    });
    this.saveToStorage(this.deletionsKey, deletions);
  }

  clearDeletions(): void {
    this.saveToStorage(this.deletionsKey, []);
  }

  // Sync operations
  async syncWithServer(localData: T[]): Promise<{
    data: T[];
    conflicts: ConflictRecord[];
    success: boolean;
  }> {
    try {
      console.log(`[${this.config.storeName}] Starting sync...`);

      // Get current state
      const syncState = this.getSyncState();
      const deletions = this.getDeletions();

      // Fetch server data
      const serverResponse = await api.get<T[]>(this.config.apiEndpoint);
      const serverData = serverResponse || [];

      // Merge data and handle conflicts
      const mergeResult = this.mergeData(localData, serverData, deletions);

      // Send merged data back to server if changes detected
      if (this.hasChanges(mergeResult.data, serverData)) {
        await api.put(this.config.apiEndpoint, mergeResult.data);
      }

      // Update sync state
      this.setSyncState({
        lastSync: new Date(),
        version: (syncState.version || 0) + 1,
        conflicts: mergeResult.conflicts,
      });

      // Clear processed deletions
      if (deletions.length > 0) {
        this.clearDeletions();
      }

      console.log(`[${this.config.storeName}] Sync completed successfully`);

      return {
        data: mergeResult.data,
        conflicts: mergeResult.conflicts,
        success: true,
      };
    } catch (error) {
      console.error(`[${this.config.storeName}] Sync failed:`, error);

      showErrorNotification(error as Error, {
        action: "Synchronisierung",
        resource: this.config.storeName,
        onRetry: () => this.syncWithServer(localData),
      });

      return {
        data: localData,
        conflicts: [],
        success: false,
      };
    }
  }

  // Data merging with conflict resolution
  private mergeData(
    local: T[],
    server: T[],
    deletions: DeletionRecord[],
  ): { data: T[]; conflicts: ConflictRecord[] } {
    if (this.config.customMerger) {
      return {
        data: this.config.customMerger(local, server, deletions),
        conflicts: [],
      };
    }

    const conflicts: ConflictRecord[] = [];
    const merged = new Map<string, T>();
    const deletionIds = new Set(deletions.map((d) => d.id));

    // Add server data first
    server.forEach((item) => {
      if (!deletionIds.has(item.id)) {
        merged.set(item.id, item);
      }
    });

    // Merge local changes
    local.forEach((localItem) => {
      if (deletionIds.has(localItem.id)) {
        // Item was deleted locally
        merged.delete(localItem.id);
        return;
      }

      const serverItem = merged.get(localItem.id);

      if (!serverItem) {
        // New local item
        merged.set(localItem.id, localItem);
      } else if (this.config.enableConflictResolution) {
        // Check for conflicts
        const localTime = localItem.updatedAt.getTime();
        const serverTime = serverItem.updatedAt.getTime();

        if (Math.abs(localTime - serverTime) > 1000) {
          // 1 second tolerance
          if (localTime > serverTime) {
            // Local is newer
            merged.set(localItem.id, localItem);
          } else if (serverTime > localTime) {
            // Server is newer, but record conflict
            conflicts.push({
              id: localItem.id,
              type: "update",
              localData: localItem,
              serverData: serverItem,
              timestamp: new Date(),
            });
            merged.set(localItem.id, serverItem);
          }
        } else {
          // Times are close, use local version
          merged.set(localItem.id, localItem);
        }
      } else {
        // No conflict resolution, prefer local
        merged.set(localItem.id, localItem);
      }
    });

    return {
      data: Array.from(merged.values()),
      conflicts,
    };
  }

  private hasChanges(merged: T[], server: T[]): boolean {
    if (merged.length !== server.length) return true;

    const serverMap = new Map(server.map((item) => [item.id, item]));

    return merged.some((item) => {
      const serverItem = serverMap.get(item.id);
      if (!serverItem) return true;

      // Compare updatedAt timestamps
      return item.updatedAt.getTime() !== serverItem.updatedAt.getTime();
    });
  }

  // Queue operations for offline support
  queueCreate(data: T): string {
    return queueOperation({
      type: "create",
      resource: this.config.storeName,
      endpoint: this.config.apiEndpoint,
      method: "POST",
      data,
      maxRetries: this.config.maxRetries || 3,
    });
  }

  queueUpdate(id: string, data: Partial<T>): string {
    return queueOperation({
      type: "update",
      resource: this.config.storeName,
      endpoint: `${this.config.apiEndpoint}/${id}`,
      method: "PUT",
      data,
      maxRetries: this.config.maxRetries || 3,
    });
  }

  queueDelete(id: string): string {
    this.addDeletion(id, this.config.storeName);
    return queueOperation({
      type: "delete",
      resource: this.config.storeName,
      endpoint: `${this.config.apiEndpoint}/${id}`,
      method: "DELETE",
      maxRetries: this.config.maxRetries || 3,
    });
  }

  // Automatic sync management
  startAutoSync(): void {
    if (this.syncTimer) return;

    if (this.config.syncInterval && this.config.syncInterval > 0) {
      this.syncTimer = setInterval(() => {
        if (navigator.onLine) {
          const localData = this.loadLocal();
          this.syncWithServer(localData);
        }
      }, this.config.syncInterval);

      console.log(
        `[${this.config.storeName}] Auto-sync started (${this.config.syncInterval}ms)`,
      );
    }
  }

  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
      console.log(`[${this.config.storeName}] Auto-sync stopped`);
    }
  }

  // Validation
  validateData(data: T[]): { valid: T[]; invalid: T[] } {
    if (!this.config.validator) {
      return { valid: data, invalid: [] };
    }

    const valid: T[] = [];
    const invalid: T[] = [];

    data.forEach((item) => {
      if (this.config.validator!(item)) {
        valid.push(item);
      } else {
        invalid.push(item);
      }
    });

    return { valid, invalid };
  }

  // Cleanup
  destroy(): void {
    this.stopAutoSync();
  }

  // Statistics
  getStats(): {
    lastSync?: Date;
    syncVersion: number;
    localCount: number;
    deletionCount: number;
    conflictCount: number;
  } {
    const syncState = this.getSyncState();
    const localData = this.loadLocal();
    const deletions = this.getDeletions();

    return {
      lastSync: syncState.lastSync,
      syncVersion: syncState.version || 0,
      localCount: localData.length,
      deletionCount: deletions.length,
      conflictCount: syncState.conflicts?.length || 0,
    };
  }
}

// Factory function for creating persistence managers
export function createPersistenceManager<T extends PersistableEntity>(
  config: PersistenceConfig<T>,
): PersistenceManager<T> {
  return new PersistenceManager(config);
}

// Utility functions for common persistence patterns
export function createBasicMerger<T extends PersistableEntity>(): (
  local: T[],
  server: T[],
  deletions: DeletionRecord[],
) => T[] {
  return (local, server, deletions) => {
    const deletionIds = new Set(deletions.map((d) => d.id));
    const merged = new Map<string, T>();

    // Add server data
    server.forEach((item) => {
      if (!deletionIds.has(item.id)) {
        merged.set(item.id, item);
      }
    });

    // Override with local data (local wins)
    local.forEach((item) => {
      if (!deletionIds.has(item.id)) {
        merged.set(item.id, item);
      }
    });

    return Array.from(merged.values());
  };
}

export function createLastWriteWinsMerger<T extends PersistableEntity>(): (
  local: T[],
  server: T[],
  deletions: DeletionRecord[],
) => T[] {
  return (local, server, deletions) => {
    const deletionIds = new Set(deletions.map((d) => d.id));
    const merged = new Map<string, T>();

    // Combine all items
    [...server, ...local].forEach((item) => {
      if (deletionIds.has(item.id)) return;

      const existing = merged.get(item.id);
      if (!existing || item.updatedAt > existing.updatedAt) {
        merged.set(item.id, item);
      }
    });

    return Array.from(merged.values());
  };
}

// Export commonly used patterns
export { PersistenceManager };
export default createPersistenceManager;
