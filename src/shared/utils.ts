/**
 * Consolidated shared utilities
 * Common helper functions used across stores and components
 */

import type { 
  BaseEntity, 
  ValidationRule, 
  ValidationResult,
  BaseSort,
  BaseFilters 
} from './types';

// ID generation utilities
export function generateId(): string {
  return (crypto as { randomUUID?: () => string }).randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function generateTimestamp(): number {
  return Date.now();
}

// Date utilities
export function normalizeDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Gerade eben';
  if (diffMinutes < 60) return `vor ${diffMinutes} Min.`;
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
  return `vor ${Math.floor(diffDays / 30)} Monaten`;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isThisWeek(date: Date): boolean {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  return date >= startOfWeek;
}

export function isOverdue(dueDate: Date): boolean {
  return dueDate < new Date();
}

// Array utilities
export function sortBy<T>(
  array: T[], 
  key: keyof T | ((item: T) => any), 
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  const getter = typeof key === 'function' ? key : (item: T) => item[key];
  
  return [...array].sort((a, b) => {
    const aValue = getter(a);
    const bValue = getter(b);
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function groupBy<T>(
  array: T[], 
  key: keyof T | ((item: T) => string)
): Record<string, T[]> {
  const getter = typeof key === 'function' ? key : (item: T) => String(item[key]);
  
  return array.reduce((groups, item) => {
    const groupKey = getter(item);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

export function filterBy<T>(
  array: T[],
  filters: Partial<T> | ((item: T) => boolean)
): T[] {
  if (typeof filters === 'function') {
    return array.filter(filters);
  }
  
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      return item[key as keyof T] === value;
    });
  });
}

// Search utilities
export function searchItems<T>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  if (!query.trim()) return items;
  
  const searchLower = query.toLowerCase();
  
  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchLower);
      }
      return false;
    });
  });
}

export function highlightSearchTerms(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Validation utilities
export function validateEntity<T>(
  entity: T,
  rules: ValidationRule<T>[]
): ValidationResult {
  const errors: Record<string, string[]> = {};
  
  rules.forEach(rule => {
    const value = entity[rule.field];
    const fieldErrors: string[] = [];
    
    // Required validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push('Dieses Feld ist erforderlich');
    }
    
    // Skip other validations if value is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return;
    }
    
    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        fieldErrors.push(`Mindestens ${rule.minLength} Zeichen erforderlich`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        fieldErrors.push(`Maximal ${rule.maxLength} Zeichen erlaubt`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        fieldErrors.push('Ungültiges Format');
      }
    }
    
    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (typeof customResult === 'string') {
        fieldErrors.push(customResult);
      } else if (!customResult) {
        fieldErrors.push('Ungültiger Wert');
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[String(rule.field)] = fieldErrors;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Entity utilities
export function createEntity<T extends BaseEntity>(
  data: Omit<T, keyof BaseEntity>
): T {
  const now = new Date();
  return {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  } as T;
}

export function updateEntity<T extends BaseEntity>(
  entity: T,
  updates: Partial<Omit<T, 'id' | 'createdAt'>>
): T {
  return {
    ...entity,
    ...updates,
    updatedAt: new Date(),
  };
}

export function mergeLists<T extends BaseEntity>(
  local: T[],
  server: T[],
  deletions: string[] = []
): T[] {
  const deletionIds = new Set(deletions);
  const merged = new Map<string, T>();
  
  // Add server items first
  server.forEach(item => {
    if (!deletionIds.has(item.id)) {
      merged.set(item.id, item);
    }
  });
  
  // Merge local items (last write wins)
  local.forEach(item => {
    if (!deletionIds.has(item.id)) {
      const existing = merged.get(item.id);
      if (!existing || item.updatedAt > existing.updatedAt) {
        merged.set(item.id, item);
      }
    }
  });
  
  return Array.from(merged.values());
}

// Ordering utilities
export function reorder<T>(
  items: T[],
  startIndex: number,
  endIndex: number
): T[] {
  const result = Array.from(items);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export function moveItemToIndex<T>(
  items: T[],
  item: T,
  newIndex: number,
  keyField: keyof T = 'id' as keyof T
): T[] {
  const currentIndex = items.findIndex(i => i[keyField] === item[keyField]);
  if (currentIndex === -1 || currentIndex === newIndex) {
    return items;
  }
  
  return reorder(items, currentIndex, newIndex);
}

// Debouncing utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

// Throttling utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let lastCall = 0;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  }) as T;
}

// Deep cloning utility
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  const cloned = {} as T;
  Object.keys(obj).forEach(key => {
    cloned[key as keyof T] = deepClone((obj as any)[key]);
  });
  
  return cloned;
}

// Object comparison utilities
export function shallowEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => (a as any)[key] === (b as any)[key]);
}

export function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => deepEqual((a as any)[key], (b as any)[key]));
}

// Color utilities
export function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

export function lightenColor(color: string, amount: number): string {
  // Simple HSL lightening - in a real app you'd use a proper color library
  const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (match) {
    const [, h, s, l] = match;
    const newL = Math.min(100, parseInt(l) + amount);
    return `hsl(${h}, ${s}%, ${newL}%)`;
  }
  return color;
}

// Local storage utilities with error handling
export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    return defaultValue;
  }
}

export function safeLocalStorageSet<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to save to localStorage "${key}":`, error);
    return false;
  }
}

// URL utilities
export function parseSearchParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

export function buildSearchParams(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  
  return searchParams.toString();
}

// Type guards and assertions
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

// Performance utilities
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}
