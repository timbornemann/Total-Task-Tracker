/**
 * Zod schema definitions for request validation
 * Centralized validation schemas for all API endpoints
 */

import { z } from "zod";

// Base schemas
export const IdSchema = z.string().uuid().or(z.string().min(1));

export const TimestampSchema = z.preprocess(
  (arg) => (typeof arg === "string" ? new Date(arg) : arg),
  z.date(),
);

export const PrioritySchema = z.enum(["low", "medium", "high"]);
export const StatusSchema = z.enum([
  "todo",
  "in-progress",
  "completed",
  "cancelled",
]);

// Task schemas
export const TaskSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  completed: z.boolean(),
  status: StatusSchema,
  priority: PrioritySchema,
  dueDate: TimestampSchema.nullable().optional(),
  categoryId: IdSchema.optional(),
  parentId: IdSchema.optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  subtasks: z.array(z.lazy(() => TaskSchema)).default([]),
  pinned: z.boolean().default(false),
  visible: z.boolean().default(true),
  order: z.number().int().min(0),
});

export const CreateTaskSchema = TaskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  completed: true,
  status: true,
  priority: true,
  pinned: true,
  visible: true,
  order: true,
  subtasks: true,
});

export const UpdateTaskSchema = TaskSchema.partial().omit({
  id: true,
  createdAt: true,
});

// Category schemas
export const CategorySchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  order: z.number().int().min(0),
  visible: z.boolean().default(true),
});

export const CreateCategorySchema = CategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  visible: true,
  order: true,
});

export const UpdateCategorySchema = CategorySchema.partial().omit({
  id: true,
  createdAt: true,
});

// Note schemas
export const NoteSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(500),
  content: z.string(),
  categoryId: IdSchema.optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  pinned: z.boolean().default(false),
  archived: z.boolean().default(false),
  order: z.number().int().min(0),
  isTemplate: z.boolean().default(false),
});

export const CreateNoteSchema = NoteSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  pinned: true,
  archived: true,
  order: true,
  isTemplate: true,
});

export const UpdateNoteSchema = NoteSchema.partial().omit({
  id: true,
  createdAt: true,
});

// Habit schemas
export const HabitSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  targetDays: z.array(z.number().int().min(0).max(6)).min(1), // 0 = Sunday, 6 = Saturday
  currentStreak: z.number().int().min(0).default(0),
  longestStreak: z.number().int().min(0).default(0),
  completions: z.array(TimestampSchema).default([]),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  active: z.boolean().default(true),
});

export const CreateHabitSchema = HabitSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  currentStreak: true,
  longestStreak: true,
  completions: true,
  active: true,
});

export const UpdateHabitSchema = HabitSchema.partial().omit({
  id: true,
  createdAt: true,
});

// Inventory schemas
export const InventoryItemSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  quantity: z.number().int().min(0),
  unit: z.string().max(50).optional(),
  categoryId: IdSchema.optional(),
  tags: z.array(IdSchema).default([]),
  location: z.string().max(200).optional(),
  purchaseDate: TimestampSchema.optional(),
  expiryDate: TimestampSchema.optional(),
  cost: z.number().positive().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  archived: z.boolean().default(false),
});

export const CreateInventoryItemSchema = InventoryItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  tags: true,
  archived: true,
});

export const UpdateInventoryItemSchema = InventoryItemSchema.partial().omit({
  id: true,
  createdAt: true,
});

// Query parameter schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const FilterSchema = z.object({
  categoryId: IdSchema.optional(),
  status: StatusSchema.optional(),
  priority: PrioritySchema.optional(),
  search: z.string().optional(),
  completed: z.coerce.boolean().optional(),
  archived: z.coerce.boolean().optional(),
  pinned: z.coerce.boolean().optional(),
});

export const TaskQuerySchema =
  PaginationSchema.merge(SortSchema).merge(FilterSchema);

// Bulk operation schemas
export const BulkUpdateSchema = z.object({
  ids: z.array(IdSchema).min(1),
  updates: z.record(z.unknown()),
});

export const BulkDeleteSchema = z.object({
  ids: z.array(IdSchema).min(1),
});

// Health check schema
export const HealthCheckSchema = z.object({
  status: z.enum(["healthy", "unhealthy"]),
  timestamp: TimestampSchema,
  uptime: z.number(),
  version: z.string(),
  database: z.object({
    status: z.enum(["connected", "disconnected"]),
    responseTime: z.number().optional(),
    error: z.string().optional(),
  }),
  memory: z.object({
    used: z.number(),
    total: z.number(),
    percentage: z.number(),
  }),
});

// Error response schema
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    timestamp: TimestampSchema,
    path: z.string(),
    method: z.string(),
  }),
});

// Success response schema
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  metadata: z
    .object({
      timestamp: TimestampSchema,
      page: z.number().optional(),
      limit: z.number().optional(),
      total: z.number().optional(),
      hasNext: z.boolean().optional(),
      hasPrev: z.boolean().optional(),
    })
    .optional(),
});

// Type exports
export type Task = z.infer<typeof TaskSchema>;
export type CreateTask = z.infer<typeof CreateTaskSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;

export type Note = z.infer<typeof NoteSchema>;
export type CreateNote = z.infer<typeof CreateNoteSchema>;
export type UpdateNote = z.infer<typeof UpdateNoteSchema>;

export type Habit = z.infer<typeof HabitSchema>;
export type CreateHabit = z.infer<typeof CreateHabitSchema>;
export type UpdateHabit = z.infer<typeof UpdateHabitSchema>;

export type InventoryItem = z.infer<typeof InventoryItemSchema>;
export type CreateInventoryItem = z.infer<typeof CreateInventoryItemSchema>;
export type UpdateInventoryItem = z.infer<typeof UpdateInventoryItemSchema>;

export type TaskQuery = z.infer<typeof TaskQuerySchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type Sort = z.infer<typeof SortSchema>;
export type Filter = z.infer<typeof FilterSchema>;

export type BulkUpdate = z.infer<typeof BulkUpdateSchema>;
export type BulkDelete = z.infer<typeof BulkDeleteSchema>;

export type HealthCheck = z.infer<typeof HealthCheckSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

// Validation helper functions
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function validateSchemaAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): Promise<T> {
  return schema.parseAsync(data);
}

export function isValidSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): data is T {
  return schema.safeParse(data).success;
}
