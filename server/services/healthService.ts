/**
 * Health Check Service
 * Monitors application health including database, memory, and system metrics
 */

import { promises as fs } from 'fs';
import os from 'os';
import { HealthCheck, HealthCheckSchema } from '../schemas/index.js';
import { logger, logHealthCheck } from '../lib/logger.js';

export interface HealthCheckOptions {
  includeDetailed?: boolean;
  timeout?: number;
}

export interface DatabaseHealthStatus {
  status: 'connected' | 'disconnected';
  responseTime?: number;
  error?: string;
}

export interface MemoryStatus {
  used: number;
  total: number;
  percentage: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export interface SystemStatus {
  uptime: number;
  loadAverage?: number[];
  platform: string;
  nodeVersion: string;
  pid: number;
}

export interface DetailedHealthCheck extends HealthCheck {
  system?: SystemStatus;
  environment?: {
    nodeEnv: string;
    version: string;
    port: number;
  };
  dependencies?: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
  };
}

export class HealthService {
  private startTime: number;
  private version: string;

  constructor() {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '1.0.0';
  }

  // Main health check endpoint
  async getHealthStatus(options: HealthCheckOptions = {}): Promise<HealthCheck | DetailedHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Basic health check
      const basicHealth = await this.getBasicHealthCheck();
      
      if (!options.includeDetailed) {
        logHealthCheck(basicHealth.status, basicHealth);
        return basicHealth;
      }

      // Detailed health check
      const detailedHealth = await this.getDetailedHealthCheck(basicHealth);
      
      logHealthCheck(detailedHealth.status, detailedHealth as Record<string, unknown>);
      return detailedHealth;
      
    } catch (error) {
      const errorHealth: HealthCheck = {
        status: 'unhealthy',
        timestamp: new Date(),
        uptime: this.getUptime(),
        version: this.version,
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        memory: this.getMemoryStatus(),
      };

      logHealthCheck('unhealthy', { error, responseTime: Date.now() - startTime });
      return errorHealth;
    }
  }

  // Basic health check (lightweight)
  private async getBasicHealthCheck(): Promise<HealthCheck> {
    const memoryStatus = this.getMemoryStatus();
    const databaseStatus = await this.checkDatabaseHealth();
    
    // Determine overall status
    const isHealthy = 
      databaseStatus.status === 'connected' &&
      memoryStatus.percentage < 90; // Memory usage below 90%

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      uptime: this.getUptime(),
      version: this.version,
      database: databaseStatus,
      memory: memoryStatus,
    };
  }

  // Detailed health check (comprehensive)
  private async getDetailedHealthCheck(basicHealth: HealthCheck): Promise<DetailedHealthCheck> {
    const systemStatus = this.getSystemStatus();
    const environmentStatus = this.getEnvironmentStatus();
    const dependenciesStatus = await this.checkDependencies();

    return {
      ...basicHealth,
      system: systemStatus,
      environment: environmentStatus,
      dependencies: dependenciesStatus,
    };
  }

  // Check database connectivity
  private async checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test database by trying to read data files
      await fs.access('./data', fs.constants.F_OK);
      
      // Try to read a data file to ensure read access
      const tasksPath = './data/tasks.json';
      try {
        await fs.access(tasksPath, fs.constants.R_OK);
      } catch {
        // Create empty file if it doesn't exist
        await fs.writeFile(tasksPath, '[]', 'utf8');
      }

      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'disconnected',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  // Get memory usage statistics
  private getMemoryStatus(): MemoryStatus {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal + memUsage.external;
    const usedMemory = memUsage.heapUsed + memUsage.external;
    
    return {
      used: usedMemory,
      total: totalMemory,
      percentage: Math.round((usedMemory / totalMemory) * 100),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
    };
  }

  // Get system information
  private getSystemStatus(): SystemStatus {
    return {
      uptime: this.getUptime(),
      loadAverage: process.platform !== 'win32' ? os.loadavg() : undefined,
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
    };
  }

  // Get environment information
  private getEnvironmentStatus() {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      version: this.version,
      port: parseInt(process.env.PORT || '3001', 10),
    };
  }

  // Check external dependencies
  private async checkDependencies(): Promise<{
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
  }> {
    const dependencies: {
      [key: string]: {
        status: 'healthy' | 'unhealthy';
        responseTime?: number;
        error?: string;
      };
    } = {};

    // Check file system
    dependencies.filesystem = await this.checkFileSystemHealth();
    
    // Check required directories
    dependencies.dataDirectory = await this.checkDataDirectory();
    
    // Add more dependency checks as needed
    // dependencies.externalAPI = await this.checkExternalAPI();
    
    return dependencies;
  }

  // Check file system health
  private async checkFileSystemHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Test file operations
      const testFile = './test-health-check.tmp';
      const testData = 'health-check-test';
      
      await fs.writeFile(testFile, testData, 'utf8');
      const readData = await fs.readFile(testFile, 'utf8');
      await fs.unlink(testFile);
      
      if (readData !== testData) {
        throw new Error('File system read/write test failed');
      }
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown file system error',
      };
    }
  }

  // Check data directory
  private async checkDataDirectory(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      await fs.access('./data', fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK);
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: 'Data directory not accessible',
      };
    }
  }

  // Get application uptime in seconds
  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  // Readiness check (for Kubernetes)
  async getReadinessStatus(): Promise<{ ready: boolean; reason?: string }> {
    try {
      const dbHealth = await this.checkDatabaseHealth();
      const memoryStatus = this.getMemoryStatus();
      
      if (dbHealth.status !== 'connected') {
        return { ready: false, reason: 'Database not connected' };
      }
      
      if (memoryStatus.percentage > 95) {
        return { ready: false, reason: 'Memory usage too high' };
      }
      
      return { ready: true };
    } catch (error) {
      return { 
        ready: false, 
        reason: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Liveness check (for Kubernetes)
  async getLivenessStatus(): Promise<{ alive: boolean; reason?: string }> {
    try {
      // Basic liveness check - just ensure process is responsive
      const uptime = this.getUptime();
      
      if (uptime < 5) {
        return { alive: false, reason: 'Application still starting' };
      }
      
      return { alive: true };
    } catch (error) {
      return { 
        alive: false, 
        reason: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Startup check
  async getStartupStatus(): Promise<{ started: boolean; reason?: string }> {
    try {
      const dbHealth = await this.checkDatabaseHealth();
      const uptime = this.getUptime();
      
      if (uptime < 2) {
        return { started: false, reason: 'Application still initializing' };
      }
      
      if (dbHealth.status !== 'connected') {
        return { started: false, reason: 'Database not ready' };
      }
      
      return { started: true };
    } catch (error) {
      return { 
        started: false, 
        reason: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Performance metrics
  async getPerformanceMetrics() {
    const memoryStatus = this.getMemoryStatus();
    const systemStatus = this.getSystemStatus();
    
    return {
      memory: memoryStatus,
      uptime: systemStatus.uptime,
      loadAverage: systemStatus.loadAverage,
      processId: systemStatus.pid,
      nodeVersion: systemStatus.nodeVersion,
      timestamp: new Date(),
    };
  }
}

// Export singleton instance
export const healthService = new HealthService();
