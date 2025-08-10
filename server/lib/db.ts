import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "data.db");

fs.mkdirSync(DATA_DIR, { recursive: true });
const db: DatabaseType = new Database(DB_FILE);

function tableHasColumn(table: string, column: string): boolean {
  try {
    const rows: Array<{ name: string }> = db
      .prepare(`PRAGMA table_info(${table})`)
      .all();
    return rows.some((r) => r.name === column);
  } catch {
    return false;
  }
}

function tableExists(table: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(table);
  return !!row;
}

function ensureSchema() {
  // Always ensure auxiliary tables that never used JSON
db.exec(`
    CREATE TABLE IF NOT EXISTS deletions (
      type TEXT NOT NULL,
      id TEXT NOT NULL,
      deletedAt TEXT NOT NULL,
      PRIMARY KEY (type, id)
  );
  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    start INTEGER NOT NULL,
    end INTEGER NOT NULL,
    breakEnd INTEGER
  );
  `);

  // If settings table does not exist, create a simple key-value store.
  // Note: The app still reads a JSON blob today; we keep compatibility for now.
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Define creators for normalized tables
  const createStatements: Record<string, string> = {
    tasks: `CREATE TABLE IF NOT EXISTS tasks (
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
    );`,
    recurring: `CREATE TABLE IF NOT EXISTS recurring (
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
    );`,
    categories: `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      color INTEGER,
      createdAt TEXT,
      updatedAt TEXT,
      orderIndex INTEGER,
      pinned INTEGER
    );`,
    notes: `CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT,
      text TEXT,
      color INTEGER,
      createdAt TEXT,
      updatedAt TEXT,
      orderIndex INTEGER,
      pinned INTEGER
    );`,
    habits: `CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      title TEXT,
      color INTEGER,
      recurrencePattern TEXT,
      customIntervalDays INTEGER,
      startWeekday INTEGER,
      startDate TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      orderIndex INTEGER,
      pinned INTEGER
    );`,
    habit_completions: `CREATE TABLE IF NOT EXISTS habit_completions (
      habitId TEXT NOT NULL,
      date TEXT NOT NULL,
      PRIMARY KEY (habitId, date)
    );`,
    flashcards: `CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      front TEXT,
      back TEXT,
      deckId TEXT,
      interval INTEGER,
      dueDate TEXT,
      easyCount INTEGER,
      mediumCount INTEGER,
      hardCount INTEGER,
      typedCorrect INTEGER,
      typedTotal INTEGER
    );`,
    decks: `CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      name TEXT
    );`,
    timers: `CREATE TABLE IF NOT EXISTS timers (
    id TEXT PRIMARY KEY,
      title TEXT,
      color INTEGER,
      baseDuration INTEGER,
      duration INTEGER,
      remaining INTEGER,
      isRunning INTEGER,
      isPaused INTEGER,
      startTime INTEGER,
      lastTick INTEGER,
      pauseStart INTEGER
    );`,
    trips: `CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
      name TEXT,
      location TEXT,
      color INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    );`,
    workdays: `CREATE TABLE IF NOT EXISTS workdays (
    id TEXT PRIMARY KEY,
      start TEXT,
      end TEXT,
      tripId TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );`,
    inventory_items: `CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
      name TEXT,
      description TEXT,
      quantity INTEGER,
      categoryId TEXT,
      buyAgain INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    );`,
    inventory_categories: `CREATE TABLE IF NOT EXISTS inventory_categories (
    id TEXT PRIMARY KEY,
      name TEXT
    );`,
    inventory_tags: `CREATE TABLE IF NOT EXISTS inventory_tags (
    id TEXT PRIMARY KEY,
      name TEXT
    );`,
    inventory_item_tags: `CREATE TABLE IF NOT EXISTS inventory_item_tags (
      itemId TEXT NOT NULL,
      tagId TEXT NOT NULL,
      PRIMARY KEY (itemId, tagId)
    );`,
  };

  // For each normalized table, if the old JSON layout exists (has 'data' column), migrate.
  function migrateJsonTableToNormalized(
    logicalName: keyof typeof createStatements,
    extract:
      | ((row: Record<string, unknown>) => { main: Record<string, unknown>; child?: Array<{ table: string; row: Record<string, unknown> }> })
      | null,
  ) {
    const name = logicalName as string;
    if (!tableExists(name)) {
      // Create fresh normalized table
      db.exec(createStatements[logicalName]);
      return;
    }
    const hasData = tableHasColumn(name, "data");
    if (!hasData) {
      // Already normalized; ensure table exists
      db.exec(createStatements[logicalName]);
      return;
    }
    // Old JSON table: create temp normalized, copy, swap
    const tempName = `${name}_norm_temp`;
    db.exec(createStatements[logicalName].replace(` ${name} `, ` ${tempName} `));

    // Read all JSON rows
    const rows = db.prepare(`SELECT id, data FROM ${name}`).all();

    const insertColsSql = (db
      .prepare(`PRAGMA table_info(${tempName})`)
      .all() as Array<{ name: string }>)
      .map((r) => r.name)
      .filter((c: string) => c !== "") as string[];
    const placeholders = insertColsSql.map(() => "?").join(", ");
    const insert = db.prepare(
      `INSERT INTO ${tempName} (${insertColsSql.join(", ")}) VALUES (${placeholders})`,
    );

    const tx = db.transaction(() => {
      for (const r of rows) {
        let obj: Record<string, unknown>;
        try {
          obj = JSON.parse(r.data);
        } catch {
          obj = {} as Record<string, unknown>;
        }
        if (extract) {
          const { main, child } = extract(obj);
          const rowValues = insertColsSql.map((c) => (main as any)[c] ?? null);
          insert.run(...rowValues);
          if (child) {
            for (const ch of child) {
              const targetTable = ch.table === name ? tempName : ch.table;
              const childCols = Object.keys(ch.row);
              const childInsert = db.prepare(
                `INSERT OR IGNORE INTO ${targetTable} (${childCols.join(", ")}) VALUES (${childCols
                  .map(() => "?")
                  .join(", ")})`,
              );
              childInsert.run(...childCols.map((k) => ch.row[k]));
            }
          }
        } else {
          // No extractor provided; assume flat object with matching columns
          const rowValues = insertColsSql.map((c) => (c in obj ? (obj as any)[c] : null));
          insert.run(...rowValues);
        }
      }
      db.exec(`DROP TABLE ${name}`);
      db.exec(`ALTER TABLE ${tempName} RENAME TO ${name}`);
    });
    tx();
  }

  // Create auxiliary child tables first
  db.exec(createStatements.habit_completions);
  db.exec(createStatements.inventory_item_tags);

  // Migrations per table
  migrateJsonTableToNormalized("categories", (obj) => ({
    main: {
      id: obj.id,
      name: obj.name,
      description: obj.description,
      color: obj.color ?? null,
      createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : null,
      updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : null,
      orderIndex: obj.order ?? 0,
      pinned: obj.pinned ? 1 : 0,
    },
  }));
  migrateJsonTableToNormalized("notes", (obj) => ({
    main: {
      id: obj.id,
      title: obj.title,
      text: obj.text,
      color: obj.color,
      createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : null,
      updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : null,
      orderIndex: obj.order ?? 0,
      pinned: obj.pinned ? 1 : 0,
    },
  }));
  migrateJsonTableToNormalized("decks", null);
  migrateJsonTableToNormalized("flashcards", (obj) => ({
    main: {
      id: obj.id,
      front: obj.front,
      back: obj.back,
      deckId: obj.deckId,
      interval: obj.interval ?? 0,
      dueDate: obj.dueDate ? new Date(obj.dueDate).toISOString() : null,
      easyCount: obj.easyCount ?? 0,
      mediumCount: obj.mediumCount ?? 0,
      hardCount: obj.hardCount ?? 0,
      typedCorrect: obj.typedCorrect ?? null,
      typedTotal: obj.typedTotal ?? null,
    },
  }));
  migrateJsonTableToNormalized("timers", null);
  migrateJsonTableToNormalized("trips", null);
  migrateJsonTableToNormalized("workdays", null);
  migrateJsonTableToNormalized("inventory_categories", null);
  migrateJsonTableToNormalized("inventory_tags", null);
  migrateJsonTableToNormalized("inventory_items", (obj) => {
    const main = {
      id: (obj as any).id,
      name: (obj as any).name,
      description: (obj as any).description,
      quantity: (obj as any).quantity ?? 0,
      categoryId: (obj as any).categoryId ?? null,
      buyAgain: (obj as any).buyAgain ? 1 : 0,
      createdAt: (obj as any).createdAt ? new Date((obj as any).createdAt).toISOString() : null,
      updatedAt: (obj as any).updatedAt ? new Date((obj as any).updatedAt).toISOString() : null,
    };
    const child: Array<{ table: string; row: Record<string, unknown> }> = [];
    const tagIds: string[] = Array.isArray((obj as any).tagIds) ? ((obj as any).tagIds as string[]) : [];
    for (const tagId of tagIds) {
      child.push({ table: "inventory_item_tags", row: { itemId: (obj as any).id, tagId } });
    }
    return { main, child };
  });

  const extractTask = (
    obj: Record<string, any>,
    parentId: string | null,
    acc: Array<Record<string, unknown>>,
  ) => {
    const row = {
      id: obj.id as string,
      title: obj.title as string,
      description: obj.description as string,
      priority: obj.priority as string,
      color: (obj.color as number) ?? null,
      completed: (obj.completed as boolean) ? 1 : 0,
      status: obj.status as string,
      categoryId: (obj.categoryId as string) ?? null,
      parentId: parentId,
      createdAt: obj.createdAt ? new Date(obj.createdAt as string).toISOString() : null,
      updatedAt: obj.updatedAt ? new Date(obj.updatedAt as string).toISOString() : null,
      dueDate: obj.dueDate ? new Date(obj.dueDate as string).toISOString() : null,
      isRecurring: (obj.isRecurring as boolean) ? 1 : 0,
      recurrencePattern: (obj.recurrencePattern as string) ?? null,
      lastCompleted: obj.lastCompleted ? new Date(obj.lastCompleted as string).toISOString() : null,
      nextDue: obj.nextDue ? new Date(obj.nextDue as string).toISOString() : null,
      dueOption: (obj.dueOption as string) ?? null,
      dueAfterDays: (obj.dueAfterDays as number) ?? null,
      startOption: (obj.startOption as string) ?? null,
      startWeekday: (obj.startWeekday as number) ?? null,
      startDate: obj.startDate ? new Date(obj.startDate as string).toISOString() : null,
      startTime: (obj.startTime as string) ?? null,
      endTime: (obj.endTime as string) ?? null,
      orderIndex: (obj as any).order ?? 0,
      pinned: (obj.pinned as boolean) ? 1 : 0,
      recurringId: (obj.recurringId as string) ?? null,
      template: (obj.template as boolean) ? 1 : 0,
      titleTemplate: (obj.titleTemplate as string) ?? null,
      customIntervalDays: (obj.customIntervalDays as number) ?? null,
      visible: obj.visible === false ? 0 : 1,
    };
    acc.push(row);
    const subs: Array<Record<string, any>> = Array.isArray((obj as any).subtasks)
      ? ((obj as any).subtasks as Array<Record<string, any>>)
      : [];
    for (const s of subs) extractTask(s, obj.id as string, acc);
  };

  const migrateTaskTable = (logicalName: "tasks" | "recurring") => {
    migrateJsonTableToNormalized(logicalName, (obj) => {
      const acc: Array<Record<string, unknown>> = [];
      extractTask(obj, null, acc);
      const child: Array<{ table: string; row: Record<string, unknown> }> = [];
      for (let i = 1; i < acc.length; i++) {
        child.push({ table: logicalName, row: acc[i] });
      }
      const main = acc[0] || { id: obj.id };
      return { main, child };
    });
  };

  migrateTaskTable("tasks");
  migrateTaskTable("recurring");

  migrateJsonTableToNormalized("habits", (obj) => {
    const main = {
      id: (obj as any).id,
      title: (obj as any).title,
      color: (obj as any).color ?? null,
      recurrencePattern: (obj as any).recurrencePattern ?? null,
      customIntervalDays: (obj as any).customIntervalDays ?? null,
      startWeekday: (obj as any).startWeekday ?? null,
      startDate: (obj as any).startDate ? new Date((obj as any).startDate).toISOString() : null,
      createdAt: (obj as any).createdAt ? new Date((obj as any).createdAt).toISOString() : null,
      updatedAt: (obj as any).updatedAt ? new Date((obj as any).updatedAt).toISOString() : null,
      orderIndex: (obj as any).order ?? 0,
      pinned: (obj as any).pinned ? 1 : 0,
    };
    const child: Array<{ table: string; row: Record<string, unknown> }> = [];
    const completions: string[] = Array.isArray((obj as any).completions)
      ? ((obj as any).completions as string[])
      : [];
    for (const d of completions) {
      child.push({ table: "habit_completions", row: { habitId: (obj as any).id, date: d } });
    }
    return { main, child };
  });
}

ensureSchema();

try {
  db.prepare("ALTER TABLE pomodoro_sessions ADD COLUMN breakEnd INTEGER").run();
} catch (_) {
  /* ignore */
}

export default db;
