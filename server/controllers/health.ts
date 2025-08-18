/**
 * Health Check Controller
 * Provides health check endpoints for monitoring and load balancer integration
 */

import { Router, Request, Response } from 'express';
import { healthService } from '../services/healthService.js';
import { getRequestLogger } from '../lib/logger.js';
import { validateQuery } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

// Health check query schema
const HealthQuerySchema = z.object({
  detailed: z.coerce.boolean().optional().default(false),
  timeout: z.coerce.number().optional().default(5000),
});

// Main health check endpoint
router.get('/health', validateQuery(HealthQuerySchema), async (req: Request, res: Response) => {
  const logger = getRequestLogger(req);
  const { detailed, timeout } = (req as any).validatedQuery;
  
  try {
    logger.info({ detailed, timeout }, 'Health check requested');
    
    // Set timeout for health check
    const healthCheckPromise = healthService.getHealthStatus({ 
      includeDetailed: detailed,
      timeout 
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), timeout);
    });
    
    const healthStatus = await Promise.race([healthCheckPromise, timeoutPromise]) as any;
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: healthStatus.status === 'healthy',
      data: healthStatus,
      metadata: {
        timestamp: new Date(),
        endpoint: '/health',
        detailed,
      },
    });
    
    logger.info({ 
      status: healthStatus.status, 
      statusCode,
      detailed 
    }, 'Health check completed');
    
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    
    res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        path: req.path,
        method: req.method,
      },
    });
  }
});

// Kubernetes readiness probe
router.get('/ready', async (req: Request, res: Response) => {
  const logger = getRequestLogger(req);
  
  try {
    logger.debug('Readiness check requested');
    
    const readinessStatus = await healthService.getReadinessStatus();
    
    if (readinessStatus.ready) {
      res.status(200).json({
        ready: true,
        timestamp: new Date(),
      });
      logger.debug('Readiness check: ready');
    } else {
      res.status(503).json({
        ready: false,
        reason: readinessStatus.reason,
        timestamp: new Date(),
      });
      logger.warn({ reason: readinessStatus.reason }, 'Readiness check: not ready');
    }
  } catch (error) {
    logger.error({ error }, 'Readiness check failed');
    
    res.status(503).json({
      ready: false,
      reason: 'Readiness check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    });
  }
});

// Kubernetes liveness probe
router.get('/live', async (req: Request, res: Response) => {
  const logger = getRequestLogger(req);
  
  try {
    logger.debug('Liveness check requested');
    
    const livenessStatus = await healthService.getLivenessStatus();
    
    if (livenessStatus.alive) {
      res.status(200).json({
        alive: true,
        timestamp: new Date(),
      });
      logger.debug('Liveness check: alive');
    } else {
      res.status(503).json({
        alive: false,
        reason: livenessStatus.reason,
        timestamp: new Date(),
      });
      logger.warn({ reason: livenessStatus.reason }, 'Liveness check: not alive');
    }
  } catch (error) {
    logger.error({ error }, 'Liveness check failed');
    
    res.status(503).json({
      alive: false,
      reason: 'Liveness check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    });
  }
});

// Kubernetes startup probe
router.get('/startup', async (req: Request, res: Response) => {
  const logger = getRequestLogger(req);
  
  try {
    logger.debug('Startup check requested');
    
    const startupStatus = await healthService.getStartupStatus();
    
    if (startupStatus.started) {
      res.status(200).json({
        started: true,
        timestamp: new Date(),
      });
      logger.debug('Startup check: started');
    } else {
      res.status(503).json({
        started: false,
        reason: startupStatus.reason,
        timestamp: new Date(),
      });
      logger.warn({ reason: startupStatus.reason }, 'Startup check: not started');
    }
  } catch (error) {
    logger.error({ error }, 'Startup check failed');
    
    res.status(503).json({
      started: false,
      reason: 'Startup check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    });
  }
});

// Performance metrics endpoint
router.get('/metrics', async (req: Request, res: Response) => {
  const logger = getRequestLogger(req);
  
  try {
    logger.debug('Performance metrics requested');
    
    const metrics = await healthService.getPerformanceMetrics();
    
    res.status(200).json({
      success: true,
      data: metrics,
      metadata: {
        timestamp: new Date(),
        endpoint: '/metrics',
      },
    });
    
    logger.debug('Performance metrics delivered');
    
  } catch (error) {
    logger.error({ error }, 'Failed to get performance metrics');
    
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: 'Failed to retrieve performance metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        path: req.path,
        method: req.method,
      },
    });
  }
});

// Basic ping endpoint
router.get('/ping', (req: Request, res: Response) => {
  const logger = getRequestLogger(req);
  
  logger.debug('Ping requested');
  
  res.status(200).json({
    message: 'pong',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Version endpoint
router.get('/version', (req: Request, res: Response) => {
  const logger = getRequestLogger(req);
  
  logger.debug('Version requested');
  
  res.status(200).json({
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date(),
  });
});

export default router;
