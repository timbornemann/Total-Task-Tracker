/**
 * Migration: Initial Schema Setup
 * Version: 1
 * Description: Set up initial data structure and ensure all required files exist
 * Created: 2024-01-01T00:00:00.000Z
 */

import { promises as fs } from 'fs';
import path from 'path';
import { migrationRunner } from './migrationRunner.js';

const migration = {
  id: '001_initial_schema',
  name: 'Initial Schema Setup',
  version: 1,
  description: 'Set up initial data structure and ensure all required files exist',
  timestamp: new Date('2024-01-01T00:00:00.000Z'),
  
  async up() {
    console.log('Running migration: Initial Schema Setup');
    
    // Ensure data directory exists
    const dataDir = './data';
    await fs.mkdir(dataDir, { recursive: true });
    
    // Initialize data files with empty arrays if they don't exist
    const dataFiles = [
      'tasks.json',
      'categories.json',
      'notes.json',
      'recurring.json',
      'habits.json',
      'pomodoroSessions.json',
      'timers.json',
      'trips.json',
      'workDays.json',
      'commutes.json',
      'items.json',
      'itemCategories.json',
      'itemTags.json',
      'deletions.json',
      'settings.json',
      'flashcards.json',
      'decks.json',
    ];
    
    for (const filename of dataFiles) {
      const filepath = path.join(dataDir, filename);
      try {
        await fs.access(filepath);
        console.log(`Data file ${filename} already exists`);
      } catch {
        // File doesn't exist, create it
        const initialData = filename === 'settings.json' ? {} : [];
        await fs.writeFile(filepath, JSON.stringify(initialData, null, 2), 'utf8');
        console.log(`Created data file: ${filename}`);
      }
    }
    
    // Create backup directory
    const backupDir = path.join(dataDir, 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    console.log('Created backup directory');
    
    console.log('Initial schema setup completed successfully');
  },
  
  async down() {
    console.log('Rolling back migration: Initial Schema Setup');
    
    // Note: This is a destructive rollback - normally you wouldn't want to delete all data
    // In a real scenario, you might want to create a backup before rolling back
    
    console.log('Warning: This rollback will remove all data files');
    console.log('Rollback completed (no action taken to preserve data)');
  },
};

migrationRunner.registerMigration(migration);

export default migration;
