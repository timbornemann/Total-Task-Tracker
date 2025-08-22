/**
 * Database Migration System
 * Handles schema evolution and data migrations for SQLite JSON files
 */

import { promises as fs } from 'fs';
import path from 'path';
import { logger, createServiceLogger } from '../lib/logger.js';

export interface Migration {
  id: string;
  name: string;
  version: number;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  timestamp: Date;
}

export interface MigrationRecord {
  id: string;
  name: string;
  version: number;
  appliedAt: Date;
  checksum: string;
}

export interface MigrationStatus {
  applied: MigrationRecord[];
  pending: Migration[];
  current: number;
  latest: number;
}

const migrationLogger = createServiceLogger('migration');

export class MigrationRunner {
  private dataDir: string;
  private migrationFile: string;
  private migrations: Map<string, Migration> = new Map();

  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.migrationFile = path.join(dataDir, 'migrations.json');
  }

  // Register a migration
  registerMigration(migration: Migration) {
    if (this.migrations.has(migration.id)) {
      throw new Error(`Migration with ID ${migration.id} already registered`);
    }
    
    this.migrations.set(migration.id, migration);
    migrationLogger.info({ migrationId: migration.id, version: migration.version }, 'Migration registered');
  }

  // Get migration history
  private async getMigrationHistory(): Promise<MigrationRecord[]> {
    try {
      await fs.access(this.migrationFile);
      const content = await fs.readFile(this.migrationFile, 'utf8');
      return JSON.parse(content, this.dateReviver);
    } catch (error) {
      // Migration file doesn't exist yet, return empty array
      return [];
    }
  }

  // Save migration history
  private async saveMigrationHistory(history: MigrationRecord[]): Promise<void> {
    const content = JSON.stringify(history, this.dateReplacer, 2);
    await fs.writeFile(this.migrationFile, content, 'utf8');
  }

  // Date serialization helpers
  private dateReplacer = (_: string, value: unknown): unknown => {
    return value instanceof Date ? value.toISOString() : value;
  };

  private dateReviver = (_: string, value: unknown): unknown => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value);
    }
    return value;
  };

  // Calculate migration checksum
  private calculateChecksum(migration: Migration): string {
    const content = migration.id + migration.name + migration.version + migration.description;
    return Buffer.from(content).toString('base64');
  }

  // Get migration status
  async getStatus(): Promise<MigrationStatus> {
    const history = await this.getMigrationHistory();
    const allMigrations = Array.from(this.migrations.values()).sort((a, b) => a.version - b.version);
    
    const appliedIds = new Set(history.map(record => record.id));
    const pending = allMigrations.filter(migration => !appliedIds.has(migration.id));
    
    const currentVersion = history.length > 0 
      ? Math.max(...history.map(record => record.version))
      : 0;
    
    const latestVersion = allMigrations.length > 0
      ? Math.max(...allMigrations.map(migration => migration.version))
      : 0;

    return {
      applied: history,
      pending,
      current: currentVersion,
      latest: latestVersion,
    };
  }

  // Run pending migrations
  async migrate(): Promise<MigrationRecord[]> {
    migrationLogger.info({}, 'Starting migration process');
    
    // Ensure data directory exists
    await fs.mkdir(this.dataDir, { recursive: true });
    
    const status = await this.getStatus();
    
    if (status.pending.length === 0) {
      migrationLogger.info({}, 'No pending migrations');
      return status.applied;
    }

    const history = [...status.applied];
    const executedMigrations: MigrationRecord[] = [];

    for (const migration of status.pending) {
      try {
        migrationLogger.info({ 
          migrationId: migration.id, 
          version: migration.version,
          name: migration.name 
        }, 'Running migration');

        const startTime = Date.now();
        
        // Execute migration
        await migration.up();
        
        const duration = Date.now() - startTime;
        const record: MigrationRecord = {
          id: migration.id,
          name: migration.name,
          version: migration.version,
          appliedAt: new Date(),
          checksum: this.calculateChecksum(migration),
        };

        history.push(record);
        executedMigrations.push(record);
        
        migrationLogger.info({ 
          migrationId: migration.id,
          duration 
        }, 'Migration completed successfully');

      } catch (error) {
        migrationLogger.error({ 
          migrationId: migration.id,
          error 
        }, 'Migration failed');
        
        throw new Error(`Migration ${migration.id} failed: ${error}`);
      }
    }

    // Save updated history
    await this.saveMigrationHistory(history);
    
    migrationLogger.info({ 
      executedCount: executedMigrations.length 
    }, 'Migration process completed');

    return executedMigrations;
  }

  // Rollback to specific version
  async rollback(targetVersion: number): Promise<MigrationRecord[]> {
    migrationLogger.info({ targetVersion }, 'Starting rollback process');
    
    const history = await this.getMigrationHistory();
    const toRollback = history
      .filter(record => record.version > targetVersion)
      .sort((a, b) => b.version - a.version); // Rollback in reverse order

    if (toRollback.length === 0) {
      migrationLogger.info({ targetVersion }, 'No migrations to rollback');
      return history;
    }

    const rolledBackMigrations: MigrationRecord[] = [];

    for (const record of toRollback) {
      const migration = this.migrations.get(record.id);
      
      if (!migration) {
        throw new Error(`Migration ${record.id} not found for rollback`);
      }

      try {
        migrationLogger.info({ 
          migrationId: record.id,
          version: record.version 
        }, 'Rolling back migration');

        const startTime = Date.now();
        
        // Execute rollback
        await migration.down();
        
        const duration = Date.now() - startTime;
        rolledBackMigrations.push(record);
        
        migrationLogger.info({ 
          migrationId: record.id,
          duration 
        }, 'Migration rolled back successfully');

      } catch (error) {
        migrationLogger.error({ 
          migrationId: record.id,
          error 
        }, 'Rollback failed');
        
        throw new Error(`Rollback of migration ${record.id} failed: ${error}`);
      }
    }

    // Update history
    const updatedHistory = history.filter(record => record.version <= targetVersion);
    await this.saveMigrationHistory(updatedHistory);
    
    migrationLogger.info({ 
      rolledBackCount: rolledBackMigrations.length,
      targetVersion 
    }, 'Rollback process completed');

    return rolledBackMigrations;
  }

  // Validate migration integrity
  async validate(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    const history = await this.getMigrationHistory();

    // Check for missing migrations
    for (const record of history) {
      const migration = this.migrations.get(record.id);
      if (!migration) {
        issues.push(`Applied migration ${record.id} not found in current migrations`);
        continue;
      }

      // Validate checksum
      const currentChecksum = this.calculateChecksum(migration);
      if (currentChecksum !== record.checksum) {
        issues.push(`Migration ${record.id} checksum mismatch - migration may have been modified`);
      }

      // Validate version consistency
      if (migration.version !== record.version) {
        issues.push(`Migration ${record.id} version mismatch: expected ${record.version}, got ${migration.version}`);
      }
    }

    // Check for version gaps
    const versions = history.map(record => record.version).sort((a, b) => a - b);
    for (let i = 1; i < versions.length; i++) {
      if (versions[i] !== versions[i - 1] + 1) {
        issues.push(`Version gap detected: missing version ${versions[i - 1] + 1}`);
      }
    }

    const valid = issues.length === 0;
    
    migrationLogger.info({ valid, issueCount: issues.length }, 'Migration validation completed');
    
    return { valid, issues };
  }

  // Create a new migration template
  async createMigration(name: string, description: string): Promise<string> {
    const timestamp = new Date();
    const version = Math.max(...Array.from(this.migrations.values()).map(m => m.version), 0) + 1;
    const id = `${timestamp.getTime()}_${name.replace(/\s+/g, '_').toLowerCase()}`;
    
    const migrationTemplate = `
/**
 * Migration: ${name}
 * Version: ${version}
 * Description: ${description}
 * Created: ${timestamp.toISOString()}
 */

import { migrationRunner } from './migrationRunner.js';

const migration = {
  id: '${id}',
  name: '${name}',
  version: ${version},
  description: '${description}',
  timestamp: new Date('${timestamp.toISOString()}'),
  
  async up() {
    // TODO: Implement migration logic
    console.log('Running migration: ${name}');
    
    // Example: Create new data structure
    // const data = loadSomeData();
    // const migratedData = data.map(item => ({ ...item, newField: 'defaultValue' }));
    // saveSomeData(migratedData);
  },
  
  async down() {
    // TODO: Implement rollback logic
    console.log('Rolling back migration: ${name}');
    
    // Example: Remove new data structure
    // const data = loadSomeData();
    // const rolledBackData = data.map(({ newField, ...item }) => item);
    // saveSomeData(rolledBackData);
  },
};

migrationRunner.registerMigration(migration);

export default migration;
`;

    const filename = `${id}.ts`;
    const filepath = path.join('./server/migrations', filename);
    
    await fs.writeFile(filepath, migrationTemplate.trim(), 'utf8');
    
    migrationLogger.info({ 
      migrationId: id,
      version,
      filename 
    }, 'Migration template created');
    
    return filepath;
  }

  // Reset migration history (dangerous!)
  async reset(): Promise<void> {
    migrationLogger.warn({}, 'Resetting migration history');
    
    try {
      await fs.unlink(this.migrationFile);
    } catch (error) {
      // File doesn't exist, that's okay
    }
    
    migrationLogger.info({}, 'Migration history reset');
  }
}

// Export singleton instance
export const migrationRunner = new MigrationRunner();

