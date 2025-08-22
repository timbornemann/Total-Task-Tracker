/**
 * Centralized exports for all shared utilities, types, and constants
 * Single import point for all shared functionality
 */

// Export all types
export * from "./types";

// Export all utilities
export * from "./utils";

// Export existing sync utilities (maintain backward compatibility)
export * from "./syncUtils";

// Re-export commonly used utilities with shorter names
export {
  generateId as createId,
  normalizeDate as toDate,
  formatRelativeTime as timeAgo,
  searchItems as search,
  sortBy as sort,
  groupBy as group,
  filterBy as filter,
  debounce,
  throttle,
  deepClone as clone,
  shallowEqual,
  deepEqual,
  safeLocalStorageGet as getStorage,
  safeLocalStorageSet as setStorage,
} from "./utils";

// Export validation helpers
export {
  validateEntity as validate,
  createEntity as create,
  updateEntity as update,
  mergeLists as merge,
} from "./utils";

// Export type guards
export {
  isBaseEntity,
  hasCategory,
  isPinnable,
  isOrderable,
  isArchivable,
  isNotNullOrUndefined,
  isDefined,
} from "./types";

// Constants commonly used across the application
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_DEBOUNCE_DELAY = 300;
export const DEFAULT_SYNC_INTERVAL = 30000; // 30 seconds
export const MAX_RETRIES = 3;
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  phone: /^\+?[\d\s\-()]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  slug: /^[a-z0-9-]+$/,
};

// Common date formats
export const DATE_FORMATS = {
  short: "dd.MM.yyyy",
  long: "dd. MMMM yyyy",
  time: "HH:mm",
  datetime: "dd.MM.yyyy HH:mm",
  iso: "yyyy-MM-dd",
};

// Priority levels with consistent ordering
export const PRIORITY_LEVELS = {
  low: { value: "low", label: "Niedrig", order: 1, color: "blue" },
  medium: { value: "medium", label: "Mittel", order: 2, color: "yellow" },
  high: { value: "high", label: "Hoch", order: 3, color: "red" },
} as const;

// Status types with consistent ordering
export const STATUS_TYPES = {
  todo: { value: "todo", label: "Zu erledigen", order: 1, color: "gray" },
  "in-progress": {
    value: "in-progress",
    label: "In Bearbeitung",
    order: 2,
    color: "blue",
  },
  completed: {
    value: "completed",
    label: "Erledigt",
    order: 3,
    color: "green",
  },
  cancelled: {
    value: "cancelled",
    label: "Abgebrochen",
    order: 4,
    color: "red",
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  required: "Dieses Feld ist erforderlich",
  invalidEmail: "Ungültige E-Mail-Adresse",
  invalidUrl: "Ungültige URL",
  minLength: (min: number) => `Mindestens ${min} Zeichen erforderlich`,
  maxLength: (max: number) => `Maximal ${max} Zeichen erlaubt`,
  networkError: "Netzwerkfehler - bitte versuchen Sie es erneut",
  syncError: "Synchronisierungsfehler - Änderungen werden später übertragen",
  saveError: "Fehler beim Speichern - bitte versuchen Sie es erneut",
  loadError: "Fehler beim Laden der Daten",
  unauthorized: "Nicht autorisiert",
  forbidden: "Zugriff verweigert",
  notFound: "Nicht gefunden",
  conflict: "Konflikt mit vorhandenen Daten",
  validationError: "Eingabedaten sind ungültig",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  saved: "Erfolgreich gespeichert",
  deleted: "Erfolgreich gelöscht",
  created: "Erfolgreich erstellt",
  updated: "Erfolgreich aktualisiert",
  synced: "Erfolgreich synchronisiert",
  imported: "Erfolgreich importiert",
  exported: "Erfolgreich exportiert",
} as const;

// Feature flags for conditional functionality
export const FEATURE_FLAGS = {
  enableOfflineSupport: true,
  enableConflictResolution: true,
  enableAutoSync: true,
  enablePerformanceMonitoring: process.env.NODE_ENV === "development",
  enableDebugMode: process.env.NODE_ENV === "development",
  enableAdvancedFiltering: true,
  enableBulkOperations: true,
  enableDataExport: true,
  enableNotifications: true,
} as const;

// Configuration defaults
export const CONFIG_DEFAULTS = {
  sync: {
    interval: DEFAULT_SYNC_INTERVAL,
    retries: MAX_RETRIES,
    timeout: REQUEST_TIMEOUT,
    enableConflictResolution: true,
  },
  pagination: {
    pageSize: DEFAULT_PAGE_SIZE,
    maxPageSize: 100,
  },
  search: {
    debounceDelay: DEFAULT_DEBOUNCE_DELAY,
    minQueryLength: 2,
  },
  validation: {
    showErrorsOnBlur: true,
    showErrorsOnSubmit: true,
    validateOnChange: false,
  },
} as const;

// Theme and UI constants
export const UI_CONSTANTS = {
  borderRadius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
} as const;
