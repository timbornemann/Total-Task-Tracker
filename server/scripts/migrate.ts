/**
 * Migration CLI Script
 * Provides command-line interface for database migrations
 */

import { migrationRunner } from '../migrations/migrationRunner.js';
import { logger } from '../lib/logger.js';

// Import all migrations to register them
import '../migrations/001_initial_schema.js';

const command = process.argv[2];
const args = process.argv.slice(3);

async function runMigrations() {
  try {
    switch (command) {
      case 'status':
        await showStatus();
        break;
        
      case 'migrate':
      case 'up':
        await runMigrate();
        break;
        
      case 'rollback':
      case 'down':
        await runRollback();
        break;
        
      case 'validate':
        await validateMigrations();
        break;
        
      case 'create':
        await createMigration();
        break;
        
      case 'reset':
        await resetMigrations();
        break;
        
      default:
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    logger.error({ error }, 'Migration command failed');
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function showStatus() {
  console.log('🔍 Checking migration status...\n');
  
  const status = await migrationRunner.getStatus();
  
  console.log(`📊 Migration Status:`);
  console.log(`   Current version: ${status.current}`);
  console.log(`   Latest version:  ${status.latest}`);
  console.log(`   Applied:         ${status.applied.length} migrations`);
  console.log(`   Pending:         ${status.pending.length} migrations\n`);
  
  if (status.applied.length > 0) {
    console.log('✅ Applied Migrations:');
    status.applied.forEach(migration => {
      console.log(`   ${migration.version}. ${migration.name} (${migration.appliedAt.toLocaleString()})`);
    });
    console.log();
  }
  
  if (status.pending.length > 0) {
    console.log('⏳ Pending Migrations:');
    status.pending.forEach(migration => {
      console.log(`   ${migration.version}. ${migration.name} - ${migration.description}`);
    });
    console.log();
  }
  
  if (status.pending.length === 0) {
    console.log('🎉 Database is up to date!');
  }
}

async function runMigrate() {
  console.log('🚀 Running migrations...\n');
  
  const executed = await migrationRunner.migrate();
  
  if (executed.length === 0) {
    console.log('✅ No migrations to run. Database is up to date.');
  } else {
    console.log(`✅ Successfully executed ${executed.length} migration(s):`);
    executed.forEach(migration => {
      console.log(`   ${migration.version}. ${migration.name}`);
    });
  }
}

async function runRollback() {
  const targetVersion = args[0] ? parseInt(args[0], 10) : undefined;
  
  if (targetVersion === undefined) {
    console.error('❌ Please specify target version: npm run migrate rollback <version>');
    process.exit(1);
  }
  
  console.log(`🔄 Rolling back to version ${targetVersion}...\n`);
  
  const rolledBack = await migrationRunner.rollback(targetVersion);
  
  if (rolledBack.length === 0) {
    console.log('✅ No migrations to rollback.');
  } else {
    console.log(`✅ Successfully rolled back ${rolledBack.length} migration(s):`);
    rolledBack.forEach(migration => {
      console.log(`   ${migration.version}. ${migration.name}`);
    });
  }
}

async function validateMigrations() {
  console.log('🔍 Validating migrations...\n');
  
  const validation = await migrationRunner.validate();
  
  if (validation.valid) {
    console.log('✅ All migrations are valid.');
  } else {
    console.log('❌ Migration validation failed:');
    validation.issues.forEach(issue => {
      console.log(`   • ${issue}`);
    });
    process.exit(1);
  }
}

async function createMigration() {
  const name = args[0];
  const description = args.slice(1).join(' ');
  
  if (!name) {
    console.error('❌ Please specify migration name: npm run migrate create <name> [description]');
    process.exit(1);
  }
  
  console.log(`📝 Creating migration: ${name}...\n`);
  
  const filepath = await migrationRunner.createMigration(name, description || '');
  
  console.log(`✅ Migration created: ${filepath}`);
  console.log('📝 Please edit the file to implement your migration logic.');
}

async function resetMigrations() {
  console.log('⚠️  This will reset the migration history. Are you sure? (y/N)');
  
  // In a real CLI, you'd want to add interactive confirmation
  // For now, require explicit confirmation via argument
  if (args[0] !== '--force') {
    console.log('❌ Use --force flag to confirm: npm run migrate reset --force');
    process.exit(1);
  }
  
  console.log('🔄 Resetting migration history...\n');
  
  await migrationRunner.reset();
  
  console.log('✅ Migration history reset.');
}

function showHelp() {
  console.log(`
📦 Migration CLI

Usage: npm run migrate <command> [options]

Commands:
  status                     Show migration status
  migrate, up               Run pending migrations
  rollback, down <version>  Rollback to specific version
  validate                  Validate migration integrity
  create <name> [desc]      Create new migration template
  reset --force             Reset migration history (dangerous!)

Examples:
  npm run migrate status
  npm run migrate up
  npm run migrate down 5
  npm run migrate create "add_user_roles" "Add role field to users"
  npm run migrate validate
`);
}

// Run the CLI
runMigrations();
