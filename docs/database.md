# Database Guide

The backend uses a SQLite database located at `server/data/data.db`. The schema
is created and verified when the server starts through
[`server/lib/db.ts`](../server/lib/db.ts).

## Core Tables

- **`tasks`** – stores individual tasks with metadata such as priority, due
  dates and recurrence information.
- **`recurring`** – template tasks that generate upcoming instances.
- **`notes`** – free-form notes with optional categories and pinning.
- **`decks`/`flashcards`** – spaced‑repetition learning data.
- **`habits`** – recurring habits with completion tracking.

The `tasks` table definition shows the breadth of fields available to describe a
single task:

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  priority TEXT,
  color INTEGER,
  completed INTEGER,
  status TEXT,
  categoryId TEXT,
  parentId TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  dueDate TEXT,
  isRecurring INTEGER,
  recurrencePattern TEXT,
  lastCompleted TEXT,
  nextDue TEXT,
  dueOption TEXT,
  dueAfterDays INTEGER,
  startOption TEXT,
  startWeekday INTEGER,
  startDate TEXT,
  startTime TEXT,
  endTime TEXT,
  orderIndex INTEGER,
  pinned INTEGER,
  recurringId TEXT,
  template INTEGER,
  titleTemplate TEXT,
  customIntervalDays INTEGER,
  visible INTEGER
);
```

## Migrations

Migrations live in [`server/migrations`](../server/migrations) and are managed by
the [`MigrationRunner`](../server/migrations/migrationRunner.ts). New migration
scripts register themselves with the runner and are executed in order on startup.
The runner also records applied versions in `server/data/migrations.json` to
avoid re‑running migrations.

## Backups and Data Files

A `backups` directory is created under `server/data` for snapshotting data.
Legacy JSON data files are kept for compatibility but new development should
interact with the SQLite database through the repository layer.
