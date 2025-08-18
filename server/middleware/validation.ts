/**
 * Validation middleware using Zod schemas
 * Provides request validation for body, params, and query parameters
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ErrorResponseSchema } from '../schemas/index.js';

// Extended Request interface for validated data
export interface ValidatedRequest<
  TBody = any,
  TParams = any,
  TQuery = any
> extends Request<TParams, any, TBody, TQuery> {
  validatedBody?: TBody;
  validatedParams?: TParams;
  validatedQuery?: TQuery;
}

// Validation error class
export class ValidationError extends Error {
  constructor(
    public field: string,
    public issues: z.ZodIssue[],
    message = 'Validation failed'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Create validation middleware
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: ValidatedRequest<T>, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse = {
          success: false as const,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request body validation failed',
            details: error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
            timestamp: new Date(),
            path: req.path,
            method: req.method,
          },
        };

        return res.status(400).json(errorResponse);
      }
      next(error);
    }
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: ValidatedRequest<any, T>, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.validatedParams = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse = {
          success: false as const,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'URL parameters validation failed',
            details: error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
            timestamp: new Date(),
            path: req.path,
            method: req.method,
          },
        };

        return res.status(400).json(errorResponse);
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: ValidatedRequest<any, any, T>, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.validatedQuery = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse = {
          success: false as const,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query parameters validation failed',
            details: error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
            timestamp: new Date(),
            path: req.path,
            method: req.method,
          },
        };

        return res.status(400).json(errorResponse);
      }
      next(error);
    }
  };
}

// Combined validation middleware
export function validate<TBody = any, TParams = any, TQuery = any>(options: {
  body?: z.ZodSchema<TBody>;
  params?: z.ZodSchema<TParams>;
  query?: z.ZodSchema<TQuery>;
}) {
  return [
    ...(options.body ? [validateBody(options.body)] : []),
    ...(options.params ? [validateParams(options.params)] : []),
    ...(options.query ? [validateQuery(options.query)] : []),
  ];
}

// Async validation wrapper
export function asyncValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  return schema.parseAsync(data);
}

// Safe validation (returns result instead of throwing)
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}

// Validation helpers for common patterns
export const validateId = validateParams(z.object({
  id: z.string().min(1),
}));

export const validatePagination = validateQuery(z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}));

export const validateSort = validateQuery(z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
}));

// Request size validation middleware
export function validateRequestSize(maxSize: number = 10 * 1024 * 1024) { // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('content-length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      const errorResponse = {
        success: false as const,
        error: {
          code: 'REQUEST_TOO_LARGE',
          message: `Request size exceeds maximum allowed size of ${maxSize} bytes`,
          details: { maxSize, receivedSize: parseInt(contentLength) },
          timestamp: new Date(),
          path: req.path,
          method: req.method,
        },
      };

      return res.status(413).json(errorResponse);
    }
    
    next();
  };
}
