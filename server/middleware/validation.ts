/**
 * Validation middleware for request body, params, and query validation using Zod
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ErrorResponseSchema } from '../schemas/index.js';
import { logger } from '../lib/logger.js';

// Extended Request interface for validated data  
export interface ValidatedRequest<B = unknown, P = unknown, Q = unknown>
  extends Omit<Request, 'body' | 'params' | 'query'> {
  body: B;
  params: P;
  query: Q;
  validatedBody?: B;
  validatedParams?: P;
  validatedQuery?: Q;
}

// Validation error class
export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public details: Array<{
      field: string;
      message: string;
      code: string;
    }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (
    req: ValidatedRequest<T, unknown, unknown>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError(
          'body',
          'Invalid request body',
          error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          }))
        );

        logger.warn({
          error: validationError,
          path: req.path,
          method: req.method,
          body: req.body,
        }, 'Body validation failed');

        res.status(400).json(
          ErrorResponseSchema.parse({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validationError.message,
              details: validationError.details,
            },
            metadata: {
              timestamp: new Date(),
              path: req.path,
              correlationId: req.headers['x-correlation-id'] || 'unknown',
            },
          })
        );
        return;
      }
      next(error);
    }
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (
    req: ValidatedRequest<unknown, T, unknown>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const validated = schema.parse(req.params);
      req.validatedParams = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError(
          'params',
          'Invalid request parameters',
          error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          }))
        );

        logger.warn({
          error: validationError,
          path: req.path,
          method: req.method,
          params: req.params,
        }, 'Params validation failed');

        res.status(400).json(
          ErrorResponseSchema.parse({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validationError.message,
              details: validationError.details,
            },
            metadata: {
              timestamp: new Date(),
              path: req.path,
              correlationId: req.headers['x-correlation-id'] || 'unknown',
            },
          })
        );
        return;
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (
    req: ValidatedRequest<unknown, unknown, T>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const validated = schema.parse(req.query);
      req.validatedQuery = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError(
          'query',
          'Invalid query parameters',
          error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          }))
        );

        logger.warn({
          error: validationError,
          path: req.path,
          method: req.method,
          query: req.query,
        }, 'Query validation failed');

        res.status(400).json(
          ErrorResponseSchema.parse({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validationError.message,
              details: validationError.details,
            },
            metadata: {
              timestamp: new Date(),
              path: req.path,
              correlationId: req.headers['x-correlation-id'] || 'unknown',
            },
          })
        );
        return;
      }
      next(error);
    }
  };
}

// Utility function for validation with proper error handling
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        'schema',
        'Schema validation failed',
        error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }))
      );
    }
    throw error;
  }
}