/**
 * Structured logging with Pino
 * Provides correlation IDs, structured data, and different log levels
 */

import pino from 'pino';
import { Request, Response, NextFunction } from 'express';

// Logger configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Create main logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  
  // Pretty print in development
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: '{correlationId} {msg}',
      },
    },
  }),

  // Structured logging in production
  ...(isProduction && {
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),

  // Base fields for all logs
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'unknown',
    service: 'total-task-tracker-server',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
});

// Logger with correlation ID
export const createLoggerWithCorrelationId = (correlationId: string) => {
  return logger.child({ correlationId });
};

// Request logging middleware
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Get or create correlation ID
  const correlationId = (req.headers['x-correlation-id'] as string) || 
                       `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Add correlation ID to request and response headers
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Create request-scoped logger
  const requestLogger = createLoggerWithCorrelationId(correlationId);
  
  // Add logger to request object
  (req as RequestWithLogger).logger = requestLogger;
  
  // Log request start
  requestLogger.info({
    event: 'request_start',
    method: req.method,
    url: req.url,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    contentLength: req.get('content-length'),
    contentType: req.get('content-type'),
  }, 'Request started');

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: unknown, encoding?: BufferEncoding) {
    const duration = Date.now() - startTime;
    const contentLength = res.get('content-length') || 0;
    
    requestLogger.info({
      event: 'request_end',
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength,
      responseSize: contentLength,
    }, 'Request completed');
    
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
export const errorLoggingMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestLogger = (req as RequestWithLogger).logger || logger;
  const correlationId = req.headers['x-correlation-id'];
  
  requestLogger.error({
    event: 'request_error',
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    method: req.method,
    url: req.url,
    path: req.path,
    statusCode: res.statusCode || 500,
    correlationId,
  }, 'Request error occurred');

  next(err);
};

// Database operation logger
export const createDbLogger = (operation: string) => {
  return {
    info: (data: Record<string, unknown>, message: string) => {
      logger.info({
        event: 'db_operation',
        operation,
        ...data,
      }, message);
    },
    error: (data: Record<string, unknown>, message: string) => {
      logger.error({
        event: 'db_error',
        operation,
        ...data,
      }, message);
    },
  };
};

// Service operation logger
export const createServiceLogger = (service: string) => {
  return {
    info: (data: Record<string, unknown>, message: string) => {
      logger.info({
        event: 'service_operation',
        service,
        ...data,
      }, message);
    },
    warn: (data: Record<string, unknown>, message: string) => {
      logger.warn({
        event: 'service_warning',
        service,
        ...data,
      }, message);
    },
    error: (data: Record<string, unknown>, message: string) => {
      logger.error({
        event: 'service_error',
        service,
        ...data,
      }, message);
    },
  };
};

// Performance measurement logger
export const logPerformance = (operation: string, startTime: number, data?: Record<string, unknown>) => {
  const duration = Date.now() - startTime;
  
  logger.info({
    event: 'performance_measurement',
    operation,
    duration,
    ...data,
  }, `Operation ${operation} completed in ${duration}ms`);
};

// Security event logger
export const logSecurityEvent = (event: string, data: Record<string, unknown>, req?: Request) => {
  const correlationId = req?.headers['x-correlation-id'];
  
  logger.warn({
    event: 'security_event',
    securityEvent: event,
    ip: req?.ip || req?.connection.remoteAddress,
    userAgent: req?.get('User-Agent'),
    correlationId,
    ...data,
  }, `Security event: ${event}`);
};

// Business event logger
export const logBusinessEvent = (event: string, data: Record<string, unknown>, correlationId?: string) => {
  logger.info({
    event: 'business_event',
    businessEvent: event,
    correlationId,
    ...data,
  }, `Business event: ${event}`);
};

// Application lifecycle logger
export const logAppEvent = (event: string, data?: Record<string, unknown>) => {
  logger.info({
    event: 'app_lifecycle',
    lifecycleEvent: event,
    ...data,
  }, `Application event: ${event}`);
};

// Health check logger
export const logHealthCheck = (status: 'healthy' | 'unhealthy', data: Record<string, unknown>) => {
  const logLevel = status === 'healthy' ? 'info' : 'error';
  
  logger[logLevel]({
    event: 'health_check',
    status,
    ...data,
  }, `Health check: ${status}`);
};

// Export logger types for TypeScript
export interface RequestWithLogger extends Request {
  logger: pino.Logger;
}

// Utility function to get logger from request
export const getRequestLogger = (req: Request): pino.Logger => {
  return (req as RequestWithLogger).logger || logger;
};

export default logger;

