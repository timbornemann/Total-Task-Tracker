import { Router } from "express";
import db from "../lib/db.js";

interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  pk: boolean;
  defaultValue: string | null;
}

interface TableMetadata {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
}

interface TableRowsResponse {
  rows: Array<Record<string, unknown>>;
  columns: ColumnInfo[];
  total: number;
}

const router = Router();
const TABLE_NAME_REGEX = /^[A-Za-z0-9_]+$/;

function isValidTableName(name: string): boolean {
  return TABLE_NAME_REGEX.test(name);
}

function tableExists(table: string): boolean {
  try {
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
      .get(table) as { name?: string } | undefined;
    return !!row?.name;
  } catch {
    return false;
  }
}

function getTableColumns(table: string): ColumnInfo[] {
  try {
    const rows = db
      .prepare(`PRAGMA table_info(${table})`)
      .all() as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        pk: number;
        dflt_value: string | null;
    }>;
    return rows.map((col) => ({
      name: col.name,
      type: col.type,
      notNull: !!col.notnull,
      pk: !!col.pk,
      defaultValue: col.dflt_value ?? null,
    }));
  } catch {
    return [];
  }
}

function serializeTable(table: string): TableMetadata {
  const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as
    | { count?: number }
    | undefined;
  return {
    name: table,
    columns: getTableColumns(table),
    rowCount: row?.count ?? 0,
  };
}

router.get("/tables", (_req, res) => {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all() as Array<{ name: string }>;
  const result = tables
    .map((entry) => entry.name)
    .filter((name) => isValidTableName(name))
    .map((name) => serializeTable(name));
  res.json(result);
});

router.get("/tables/:table", (req, res) => {
  const { table } = req.params;
  if (!isValidTableName(table)) {
    res.status(400).json({ error: "Invalid table name" });
    return;
  }
  if (!tableExists(table)) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  const limitParam = Number(req.query.limit) || 200;
  const offsetParam = Number(req.query.offset) || 0;
  const limit = Math.min(Math.max(limitParam, 1), 500);
  const offset = Math.max(offsetParam, 0);
  try {
    const rows = db
      .prepare(
        `SELECT rowid as rowid, * FROM ${table} ORDER BY rowid LIMIT ? OFFSET ?`,
      )
      .all(limit, offset);
    const response: TableRowsResponse = {
      rows,
      columns: getTableColumns(table),
      total: serializeTable(table).rowCount,
    };
    res.json(response);
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Failed to load table",
    });
  }
});

router.put("/tables/:table/:rowid", (req, res) => {
  const { table } = req.params;
  const rowid = Number(req.params.rowid);
  if (!isValidTableName(table) || !Number.isInteger(rowid)) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }
  if (!tableExists(table)) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  const columns = new Set(getTableColumns(table).map((col) => col.name));
  const updates = Object.entries(req.body || {})
    .filter(([key]) => columns.has(key))
    .map(([key, value]) => ({ key, value }));
  if (!updates.length) {
    res.status(400).json({ error: "No valid columns provided" });
    return;
  }
  const assignments = updates.map((entry) => `"${entry.key}" = ?`).join(", ");
  try {
    const stmt = db.prepare(
      `UPDATE ${table} SET ${assignments} WHERE rowid = ?`,
    );
    const result = stmt.run(...updates.map((entry) => entry.value), rowid);
    res.json({ changes: result.changes });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Failed to update row",
    });
  }
});

router.post("/tables/:table", (req, res) => {
  const { table } = req.params;
  if (!isValidTableName(table)) {
    res.status(400).json({ error: "Invalid table name" });
    return;
  }
  if (!tableExists(table)) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  const columns = new Set(getTableColumns(table).map((col) => col.name));
  const entries = Object.entries(req.body || {})
    .filter(([key]) => columns.has(key))
    .map(([key, value]) => ({ key, value }));
  if (!entries.length) {
    res.status(400).json({ error: "No valid columns provided" });
    return;
  }
  const columnNames = entries.map((entry) => `"${entry.key}"`).join(", ");
  const placeholders = entries.map(() => "?").join(", ");
  try {
    const stmt = db.prepare(
      `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`,
    );
    const result = stmt.run(...entries.map((entry) => entry.value));
    res.json({ rowid: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Failed to insert row",
    });
  }
});

router.delete("/tables/:table/:rowid", (req, res) => {
  const { table } = req.params;
  const rowid = Number(req.params.rowid);
  if (!isValidTableName(table) || !Number.isInteger(rowid)) {
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }
  if (!tableExists(table)) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  try {
    const stmt = db.prepare(`DELETE FROM ${table} WHERE rowid = ?`);
    const result = stmt.run(rowid);
    res.json({ changes: result.changes });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Failed to delete row",
    });
  }
});

router.post("/query", (req, res) => {
  const sql = typeof req.body?.sql === "string" ? req.body.sql : "";
  const trimmed = sql.trim();
  if (!trimmed) {
    res.status(400).json({ error: "SQL query is required" });
    return;
  }
  const normalized = trimmed.replace(/^\(+/, "").toLowerCase();
  if (!/^(select|pragma|with|explain)/.test(normalized)) {
    res
      .status(400)
      .json({
        error:
          "Only read-only SELECT, PRAGMA, WITH or EXPLAIN queries are allowed",
      });
    return;
  }
  try {
    const stmt = db.prepare(sql);
    if (stmt.reader) {
      const rows = stmt.all();
      res.json({ rows });
    } else {
      const result = stmt.run();
      res.json({
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid,
      });
    }
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Failed to execute query",
    });
  }
});

export default router;
