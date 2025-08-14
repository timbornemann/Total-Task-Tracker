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
          const mainObj = main as Record<string, unknown>;
          const rowValues: unknown[] = insertColsSql.map((c) => mainObj[c] ?? null);
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
          const objRec = obj as Record<string, unknown>;
          const rowValues: unknown[] = insertColsSql.map((c) => (c in objRec ? objRec[c] : null));
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
      createdAt: obj.createdAt
        ? new Date(obj.createdAt as string).toISOString()
        : null,
      updatedAt: obj.updatedAt
        ? new Date(obj.updatedAt as string).toISOString()
        : null,
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
      createdAt: obj.createdAt
        ? new Date(obj.createdAt as string).toISOString()
        : null,
      updatedAt: obj.updatedAt
        ? new Date(obj.updatedAt as string).toISOString()
        : null,
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
      dueDate: obj.dueDate
        ? new Date(obj.dueDate as string).toISOString()
        : null,
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
    const getAs = <T>(o: Record<string, unknown>, k: string): T | undefined => o[k] as T | undefined;
    const main = {
      id: getAs<string>(obj, "id"),
      name: getAs<string>(obj, "name"),
      description: getAs<string>(obj, "description"),
      quantity: getAs<number>(obj, "quantity") ?? 0,
      categoryId: getAs<string>(obj, "categoryId") ?? null,
      buyAgain: getAs<boolean>(obj, "buyAgain") ? 1 : 0,
      createdAt: getAs<string>(obj, "createdAt")
        ? new Date(getAs<string>(obj, "createdAt") as string).toISOString()
        : null,
      updatedAt: getAs<string>(obj, "updatedAt")
        ? new Date(getAs<string>(obj, "updatedAt") as string).toISOString()
        : null,
    };
    const child: Array<{ table: string; row: Record<string, unknown> }> = [];
    const tagIds: string[] = Array.isArray(getAs<string[]>(obj, "tagIds"))
      ? (getAs<string[]>(obj, "tagIds") as string[])
      : [];
    for (const tagId of tagIds) {
      child.push({ table: "inventory_item_tags", row: { itemId: getAs<string>(obj, "id"), tagId } });
    }
    return { main, child };
  });

  const extractTask = (
    obj: Record<string, unknown>,
    parentId: string | null,
    acc: Array<Record<string, unknown>>,
  ) => {
    const getAs = <T>(o: Record<string, unknown>, k: string): T | undefined => o[k] as T | undefined;
    const row = {
      id: getAs<string>(obj, "id") as string,
      title: (getAs<string>(obj, "title") as string) || "",
      description: (getAs<string>(obj, "description") as string) || "",
      priority: (getAs<string>(obj, "priority") as string) || "low",
      color: (getAs<number>(obj, "color") as number) ?? null,
      completed: getAs<boolean>(obj, "completed") ? 1 : 0,
      status: (getAs<string>(obj, "status") as string) || "todo",
      categoryId: getAs<string>(obj, "categoryId") ?? null,
      parentId: parentId,
      createdAt: getAs<string>(obj, "createdAt")
        ? new Date(getAs<string>(obj, "createdAt") as string).toISOString()
        : null,
      updatedAt: getAs<string>(obj, "updatedAt")
        ? new Date(getAs<string>(obj, "updatedAt") as string).toISOString()
        : null,
      dueDate: getAs<string>(obj, "dueDate")
        ? new Date(getAs<string>(obj, "dueDate") as string).toISOString()
        : null,
      isRecurring: getAs<boolean>(obj, "isRecurring") ? 1 : 0,
      recurrencePattern: getAs<string>(obj, "recurrencePattern") ?? null,
      lastCompleted: getAs<string>(obj, "lastCompleted")
        ? new Date(getAs<string>(obj, "lastCompleted") as string).toISOString()
        : null,
      nextDue: getAs<string>(obj, "nextDue")
        ? new Date(getAs<string>(obj, "nextDue") as string).toISOString()
        : null,
      dueOption: getAs<string>(obj, "dueOption") ?? null,
      dueAfterDays: getAs<number>(obj, "dueAfterDays") ?? null,
      startOption: getAs<string>(obj, "startOption") ?? null,
      startWeekday: getAs<number>(obj, "startWeekday") ?? null,
      startDate: getAs<string>(obj, "startDate")
        ? new Date(getAs<string>(obj, "startDate") as string).toISOString()
        : null,
      startTime: getAs<string>(obj, "startTime") ?? null,
      endTime: getAs<string>(obj, "endTime") ?? null,
      orderIndex: (getAs<number>(obj, "order") as number) ?? 0,
      pinned: getAs<boolean>(obj, "pinned") ? 1 : 0,
      recurringId: getAs<string>(obj, "recurringId") ?? null,
      template: getAs<boolean>(obj, "template") ? 1 : 0,
      titleTemplate: getAs<string>(obj, "titleTemplate") ?? null,
      customIntervalDays: getAs<number>(obj, "customIntervalDays") ?? null,
      visible: getAs<boolean>(obj, "visible") === false ? 0 : 1,
    };
    acc.push(row);
    const subsRaw = getAs<Array<Record<string, unknown>>>(obj, "subtasks");
    const subs: Array<Record<string, unknown>> = Array.isArray(subsRaw)
      ? (subsRaw as Array<Record<string, unknown>>)
      : [];
    for (const s of subs) extractTask(s, getAs<string>(obj, "id") as string, acc);
  };

  const migrateTaskTable = (logicalName: "tasks" | "recurring") => {
    migrateJsonTableToNormalized(logicalName, (obj) => {
      const acc: Array<Record<string, unknown>> = [];
      extractTask(obj, null, acc);
      const child: Array<{ table: string; row: Record<string, unknown> }> = [];
      for (let i = 1; i < acc.length; i++) {
        child.push({ table: logicalName, row: acc[i] });
      }
      const main = acc[0] || { id: (obj as Record<string, unknown>)["id"] };
      return { main, child };
    });
  };

  migrateTaskTable("tasks");
  migrateTaskTable("recurring");

  migrateJsonTableToNormalized("habits", (obj) => {
    const getAs = <T>(o: Record<string, unknown>, k: string): T | undefined => o[k] as T | undefined;
    const main = {
      id: getAs<string>(obj, "id"),
      title: getAs<string>(obj, "title"),
      color: getAs<number>(obj, "color") ?? null,
      recurrencePattern: getAs<string>(obj, "recurrencePattern") ?? null,
      customIntervalDays: getAs<number>(obj, "customIntervalDays") ?? null,
      startWeekday: getAs<number>(obj, "startWeekday") ?? null,
      startDate: getAs<string>(obj, "startDate")
        ? new Date(getAs<string>(obj, "startDate") as string).toISOString()
        : null,
      createdAt: getAs<string>(obj, "createdAt")
        ? new Date(getAs<string>(obj, "createdAt") as string).toISOString()
        : null,
      updatedAt: getAs<string>(obj, "updatedAt")
        ? new Date(getAs<string>(obj, "updatedAt") as string).toISOString()
        : null,
      orderIndex: (getAs<number>(obj, "order") as number) ?? 0,
      pinned: getAs<boolean>(obj, "pinned") ? 1 : 0,
    };
    const child: Array<{ table: string; row: Record<string, unknown> }> = [];
    const completionsRaw = getAs<string[]>(obj, "completions");
    const completions: string[] = Array.isArray(completionsRaw)
      ? (completionsRaw as string[])
      : [];
    for (const d of completions) {
      child.push({ table: "habit_completions", row: { habitId: getAs<string>(obj, "id"), date: d } });
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
