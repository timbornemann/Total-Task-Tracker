/**
 * Consolidated shared types and interfaces
 * Central location for all common type definitions used across stores and components
 */

// Re-export all types from the main types file
export * from '@/types';

// Base interfaces for all persisted entities
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VisibilityMixin {
  visible?: boolean;
}

export interface OrderMixin {
  order: number;
}

export interface PinnedMixin {
  pinned: boolean;
}

export interface CategoryMixin {
  categoryId?: string;
}

export interface ArchiveMixin {
  archived?: boolean;
}

// Common filter interfaces
export interface BaseFilters {
  search?: string;
  categoryId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface BaseSort<T = string> {
  field: T;
  direction: 'asc' | 'desc';
}

// Store state interfaces
export interface BaseStoreState<T> {
  items: T[];
  loading: boolean;
  error?: string;
  lastUpdated?: Date;
}

export interface FilterableStoreState<T, F = BaseFilters> extends BaseStoreState<T> {
  filters: F;
  filteredItems: T[];
}

export interface SortableStoreState<T, S = BaseSort> extends BaseStoreState<T> {
  sort: S;
}

export interface PaginatableStoreState<T> extends BaseStoreState<T> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// CRUD operation types
export type CrudOperation = 'create' | 'read' | 'update' | 'delete';

export interface CrudOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  operation: CrudOperation;
  timestamp: Date;
}

// Sync and persistence types
export interface SyncMetadata {
  lastSync?: Date;
  syncVersion: number;
  pendingOperations: number;
  conflictCount: number;
}

export interface ConflictResolution<T = any> {
  strategy: 'local-wins' | 'server-wins' | 'last-write-wins' | 'manual';
  resolvedData?: T;
  timestamp: Date;
}

// Statistics interfaces
export interface BaseStatistics {
  total: number;
  active: number;
  hidden?: number;
  archived?: number;
}

export interface TimeBasedStatistics extends BaseStatistics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  overdue?: number;
}

// Form validation types
export interface ValidationRule<T = any> {
  field: keyof T;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

// API response types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  metadata?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  statusCode?: number;
}

// Event types for store communication
export interface StoreEvent<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
  source: string;
}

export interface StoreEventHandler<T = any> {
  (event: StoreEvent<T>): void | Promise<void>;
}

// Hook return types (for consistent hook interfaces)
export interface BaseHookReturn<T> {
  data: T;
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
}

export interface CrudHookReturn<T> extends BaseHookReturn<T[]> {
  create: (item: Omit<T, keyof BaseEntity>) => Promise<string>;
  update: (id: string, updates: Partial<T>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  findById: (id: string) => T | undefined;
}

export interface FilterableHookReturn<T, F = BaseFilters> extends BaseHookReturn<T[]> {
  filters: F;
  setFilters: (filters: Partial<F>) => void;
  filteredData: T[];
  clearFilters: () => void;
}

// Color and theme types
export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeConfig {
  name: string;
  colors: ColorScheme;
  isDark: boolean;
}

// Settings and preferences
export interface UserPreferences {
  theme: string;
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    frequency: 'realtime' | 'hourly' | 'daily';
  };
  sync: {
    autoSync: boolean;
    syncInterval: number;
    conflictResolution: 'ask' | 'local-wins' | 'server-wins';
  };
  display: {
    density: 'compact' | 'comfortable' | 'spacious';
    showCompletedTasks: boolean;
    defaultView: string;
  };
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface FormProps<T = any> extends BaseComponentProps {
  initialData?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  validationRules?: ValidationRule<T>[];
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

export type DateKeys<T> = {
  [K in keyof T]: T[K] extends Date ? K : never;
}[keyof T];

// Branded types for better type safety
export type EntityId = string & { readonly brand: unique symbol };
export type Timestamp = number & { readonly brand: unique symbol };
export type VersionNumber = number & { readonly brand: unique symbol };

// Function types
export type EntityValidator<T> = (entity: T) => ValidationResult;
export type EntityTransformer<T, U = T> = (entity: T) => U;
export type EntityMerger<T> = (local: T, server: T) => T;

// Store configuration types
export interface StoreConfig<T> {
  name: string;
  initialState: T;
  persistenceEnabled?: boolean;
  syncEnabled?: boolean;
  validationRules?: ValidationRule<T>[];
  middlewares?: StoreMiddleware<T>[];
}

export interface StoreMiddleware<T> {
  name: string;
  before?: (action: any, state: T) => any;
  after?: (action: any, state: T, result: any) => any;
}

// Export utility functions for type guards
export function isBaseEntity(obj: any): obj is BaseEntity {
  return obj && 
    typeof obj.id === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date;
}

export function hasCategory(obj: any): obj is CategoryMixin {
  return obj && (typeof obj.categoryId === 'string' || obj.categoryId === undefined);
}

export function isPinnable(obj: any): obj is PinnedMixin {
  return obj && typeof obj.pinned === 'boolean';
}

export function isOrderable(obj: any): obj is OrderMixin {
  return obj && typeof obj.order === 'number';
}

export function isArchivable(obj: any): obj is ArchiveMixin {
  return obj && (typeof obj.archived === 'boolean' || obj.archived === undefined);
}
