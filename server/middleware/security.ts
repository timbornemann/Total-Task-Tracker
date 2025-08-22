/**
 * Security middleware for Express application
 * Implements rate limiting, security headers, CORS, and request size limits
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

// Rate limiting configurations
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        timestamp: new Date(),
      },
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests,
  });
};

// Different rate limiters for different endpoint types
export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
});

export const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
});

export const createLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 create operations per 5 minutes
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
});

// CORS configuration
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, only allow specific origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      'https://your-production-domain.com',
      // Add your production domain here
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Correlation-ID',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page',
    'X-Per-Page',
    'X-Correlation-ID',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
};

// Helmet configuration for security headers
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable if you need to embed external resources
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
};

// Request size limits
export const REQUEST_LIMITS = {
  json: '10mb',      // JSON payload limit
  urlencoded: '10mb', // URL-encoded payload limit
  raw: '10mb',       // Raw payload limit
  text: '10mb',      // Text payload limit
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Custom security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add correlation ID for request tracking
  const correlationId = req.headers['x-correlation-id'] as string || 
                       `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  res.setHeader('X-Correlation-ID', correlationId);
  req.headers['x-correlation-id'] = correlationId;
  
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const correlationId = req.headers['x-correlation-id'];
  
  // Log request start
  console.log(`[${new Date().toISOString()}] ${correlationId} ${req.method} ${req.url} - Start`);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: unknown, encoding?: BufferEncoding) {
    const duration = Date.now() - start;
    const size = res.get('content-length') || 0;
    
    console.log(
      `[${new Date().toISOString()}] ${correlationId} ${req.method} ${req.url} - ` +
      `${res.statusCode} ${duration}ms ${size}bytes`
    );
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error handling for security middleware
export const securityErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = req.headers['x-correlation-id'];
  
  console.error(`[${new Date().toISOString()}] ${correlationId} Security Error:`, err);
  
  // Handle CORS errors
  if (err.message?.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: 'Cross-origin request blocked',
        timestamp: new Date(),
        path: req.path,
        method: req.method,
      },
    });
  }
  
  // Handle rate limit errors
  if (err.message?.includes('rate limit')) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        timestamp: new Date(),
        path: req.path,
        method: req.method,
      },
    });
  }
  
  next(err);
};

// IP whitelist/blacklist middleware
export const createIPFilter = (options: {
  whitelist?: string[];
  blacklist?: string[];
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    
    if (options.blacklist?.includes(clientIP as string)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_BLOCKED',
          message: 'Access denied',
          timestamp: new Date(),
        },
      });
    }
    
    if (options.whitelist && !options.whitelist.includes(clientIP as string)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'IP_NOT_WHITELISTED',
          message: 'Access denied',
          timestamp: new Date(),
        },
      });
    }
    
    next();
  };
};

// Request validation for common attack patterns
export const inputSanitization = (req: Request, res: Response, next: NextFunction) => {
  const checkForMaliciousPatterns = (obj: unknown): boolean => {
    if (typeof obj === 'string') {
      // Check for SQL injection patterns
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
        /(--|\|\||&&)/,
        /['"]\s*(OR|AND)\s*['"]/i,
      ];
      
      // Check for XSS patterns
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/i,
        /on\w+\s*=/i,
      ];
      
      return [...sqlPatterns, ...xssPatterns].some(pattern => pattern.test(obj));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(checkForMaliciousPatterns);
    }
    
    return false;
  };
  
  if (checkForMaliciousPatterns(req.body) || 
      checkForMaliciousPatterns(req.query) || 
      checkForMaliciousPatterns(req.params)) {
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'MALICIOUS_INPUT',
        message: 'Potentially malicious input detected',
        timestamp: new Date(),
        path: req.path,
        method: req.method,
      },
    });
  }
  
  next();
};

export default {
  generalLimiter,
  strictLimiter,
  createLimiter,
  uploadLimiter,
  corsOptions,
  helmetOptions,
  securityHeaders,
  requestLogger,
  securityErrorHandler,
  inputSanitization,
  createIPFilter,
  createRateLimiter,
  REQUEST_LIMITS,
};

