/**
 * Robust offline/online status handling with queue for pending writes
 */

import { showOfflineNotification, showSyncNotification, showInfoNotification } from './errorNotifications';

// Types for queued operations
export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'sync';
  resource: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  timestamp: number;
  retries: number;
  maxRetries: number;
  metadata?: Record<string, unknown>;
}

export interface OfflineQueueState {
  isOnline: boolean;
  isProcessing: boolean;
  queue: QueuedOperation[];
  lastSyncAttempt?: number;
  consecutiveFailures: number;
}

// Queue manager class
export class OfflineQueue {
  private state: OfflineQueueState = {
    isOnline: navigator.onLine,
    isProcessing: false,
    queue: [],
    consecutiveFailures: 0,
  };

  private listeners: Set<(state: OfflineQueueState) => void> = new Set();
  private processingTimer?: number;
  private retryTimer?: number;
  private storageKey = 'offlineQueue';

  constructor() {
    this.loadQueueFromStorage();
    this.setupEventListeners();
    
    // Start processing if online
    if (this.state.isOnline) {
      this.scheduleProcessing();
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: OfflineQueueState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.state);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current state
   */
  getState(): OfflineQueueState {
    return { ...this.state };
  }

  /**
   * Add operation to queue
   */
  enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const queuedOp: QueuedOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retries: 0,
    };

    this.state.queue.push(queuedOp);
    this.saveQueueToStorage();
    this.notifyListeners();

    console.log(`[OfflineQueue] Enqueued ${operation.type} operation for ${operation.resource}`, queuedOp);

    // Try to process immediately if online
    if (this.state.isOnline && !this.state.isProcessing) {
      this.scheduleProcessing(100); // Small delay to batch operations
    }

    return id;
  }

  /**
   * Remove operation from queue
   */
  dequeue(operationId: string): boolean {
    const index = this.state.queue.findIndex(op => op.id === operationId);
    if (index === -1) return false;

    this.state.queue.splice(index, 1);
    this.saveQueueToStorage();
    this.notifyListeners();
    return true;
  }

  /**
   * Clear all operations for a specific resource
   */
  clearResource(resource: string): number {
    const initialLength = this.state.queue.length;
    this.state.queue = this.state.queue.filter(op => op.resource !== resource);
    const removedCount = initialLength - this.state.queue.length;
    
    if (removedCount > 0) {
      this.saveQueueToStorage();
      this.notifyListeners();
    }
    
    return removedCount;
  }

  /**
   * Clear entire queue
   */
  clearQueue(): void {
    this.state.queue = [];
    this.state.consecutiveFailures = 0;
    this.saveQueueToStorage();
    this.notifyListeners();
  }

  /**
   * Manually trigger queue processing
   */
  async processQueue(): Promise<void> {
    if (!this.state.isOnline || this.state.isProcessing) return;

    this.state.isProcessing = true;
    this.notifyListeners();

    try {
      await this.processQueuedOperations();
      this.state.consecutiveFailures = 0;
    } catch (error) {
      this.state.consecutiveFailures++;
      console.error('[OfflineQueue] Queue processing failed:', error);
    } finally {
      this.state.isProcessing = false;
      this.state.lastSyncAttempt = Date.now();
      this.notifyListeners();
    }
  }

  /**
   * Setup event listeners for online/offline status
   */
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Additional online check using a more reliable method
    this.startConnectivityChecking();
  }

  /**
   * Start periodic connectivity checking
   */
  private startConnectivityChecking(): void {
    setInterval(async () => {
      const wasOnline = this.state.isOnline;
      const isOnline = await this.checkConnectivity();
      
      if (wasOnline !== isOnline) {
        if (isOnline) {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * More reliable connectivity check
   */
  private async checkConnectivity(): Promise<boolean> {
    if (!navigator.onLine) return false;
    
    try {
      // Try to fetch a small resource with a timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/serverInfo', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });
      
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    const wasOffline = !this.state.isOnline;
    this.state.isOnline = true;
    this.notifyListeners();

    if (wasOffline) {
      console.log('[OfflineQueue] Back online, processing queue');
      showInfoNotification(
        'Wieder online',
        'Ausstehende Änderungen werden synchronisiert...',
        { duration: 3000 }
      );
      
      this.scheduleProcessing(1000); // Delay to ensure connection is stable
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.state.isOnline = false;
    this.notifyListeners();

    console.log('[OfflineQueue] Gone offline');
    showOfflineNotification();
    
    // Clear any pending processing
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
      this.processingTimer = undefined;
    }
  }

  /**
   * Schedule queue processing with optional delay
   */
  private scheduleProcessing(delay: number = 0): void {
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
    }

    this.processingTimer = window.setTimeout(() => {
      this.processQueue();
    }, delay);
  }

  /**
   * Process all queued operations
   */
  private async processQueuedOperations(): Promise<void> {
    if (this.state.queue.length === 0) return;

    console.log(`[OfflineQueue] Processing ${this.state.queue.length} queued operations`);

    // Sort by timestamp to maintain order
    const sortedQueue = [...this.state.queue].sort((a, b) => a.timestamp - b.timestamp);
    const results = { success: 0, failed: 0 };

    for (const operation of sortedQueue) {
      try {
        await this.processOperation(operation);
        this.dequeue(operation.id);
        results.success++;
      } catch (error) {
        console.error(`[OfflineQueue] Failed to process operation ${operation.id}:`, error);
        
        // Update retry count
        operation.retries++;
        
        // Remove if max retries exceeded
        if (operation.retries >= operation.maxRetries) {
          console.warn(`[OfflineQueue] Operation ${operation.id} exceeded max retries, removing`);
          this.dequeue(operation.id);
          results.failed++;
        } else {
          // Exponential backoff for retries
          const delay = Math.min(1000 * Math.pow(2, operation.retries), 30000);
          setTimeout(() => {
            if (this.state.isOnline) {
              this.scheduleProcessing();
            }
          }, delay);
        }
      }

      // Small delay between operations to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Show sync notification
    if (results.success > 0 || results.failed > 0) {
      const success = results.failed === 0;
      showSyncNotification(success, success ? undefined : () => this.processQueue());
    }

    this.saveQueueToStorage();
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: QueuedOperation): Promise<void> {
    const { endpoint, method, data } = operation;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && method !== 'DELETE') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`[OfflineQueue] Successfully processed ${operation.type} operation for ${operation.resource}`);
  }

  /**
   * Save queue to localStorage
   */
  private saveQueueToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state.queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue to storage:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.state.queue = JSON.parse(stored);
        console.log(`[OfflineQueue] Loaded ${this.state.queue.length} operations from storage`);
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue from storage:', error);
      this.state.queue = [];
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('[OfflineQueue] Listener error:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
    }
    
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    
    this.listeners.clear();
  }
}

// Global instance
export const offlineQueue = new OfflineQueue();

// Convenience functions
export const queueOperation = (operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>) => {
  return offlineQueue.enqueue(operation);
};

export const isOnline = () => offlineQueue.getState().isOnline;
export const getQueueLength = () => offlineQueue.getState().queue.length;
export const isProcessingQueue = () => offlineQueue.getState().isProcessing;
