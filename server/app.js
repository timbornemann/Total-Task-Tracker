import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import os from "os";
import { format } from "date-fns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "data.db");
const DIST_DIR = path.join(__dirname, "..", "dist");

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(DB_FILE);

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS recurring (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS decks (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    start INTEGER NOT NULL,
    end INTEGER NOT NULL,
    breakEnd INTEGER
  );
  CREATE TABLE IF NOT EXISTS timers (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workdays (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS inventory_categories (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS inventory_tags (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS deletions (
    type TEXT NOT NULL,
    id TEXT NOT NULL,
    deletedAt TEXT NOT NULL,
    PRIMARY KEY (type, id)
  );
`);
try {
  db.prepare("ALTER TABLE pomodoro_sessions ADD COLUMN breakEnd INTEGER").run();
} catch {}

let syncRole = "client";
let syncServerUrl = "";
let syncInterval = 5;
let syncEnabled = true;
let llmUrl = "";
let llmToken = "";
let llmModel = "gpt-3.5-turbo";
let syncTimer = null;
let lastSyncTime = 0;
let lastSyncError = null;
const syncLogs = [];
const sseClients = [];

export function notifyClients() {
  const msg = "data: update\n\n";
  sseClients.forEach((res) => res.write(msg));
}

const initialSettings = loadSettings();
if (typeof initialSettings.syncInterval === "number") {
  syncInterval = initialSettings.syncInterval;
}
if (initialSettings.syncRole) {
  syncRole = initialSettings.syncRole;
}
if (initialSettings.syncServerUrl) {
  syncServerUrl = initialSettings.syncServerUrl;
}
if (typeof initialSettings.syncEnabled === "boolean") {
  syncEnabled = initialSettings.syncEnabled;
}
if (initialSettings.llmUrl) {
  llmUrl = initialSettings.llmUrl;
}
if (initialSettings.llmToken) {
  llmToken = initialSettings.llmToken;
}
if (initialSettings.llmModel) {
  llmModel = initialSettings.llmModel;
}
log("Initial sync settings", {
  role: syncRole,
  url: syncServerUrl,
  interval: syncInterval,
  enabled: syncEnabled,
  llmConfigured: !!llmUrl,
});
startSyncTimer();
try {
  saveWorkDays(loadWorkDays());
} catch (err) {
  log("Failed to normalize workdays", err);
}

function dateReviver(key, value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return value;
}

function toJson(obj) {
  return JSON.stringify(obj, (key, value) =>
    value instanceof Date ? value.toISOString() : value,
  );
}

function normalizeDateField(value) {
  if (value instanceof Date) {
    return format(value, "yyyy-MM-dd HH:mm");
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      return value.slice(0, 16).replace("T", " ");
    }
    return value;
  }
  return String(value || "");
}

function normalizeWorkDay(d) {
  return {
    ...d,
    start: normalizeDateField(d.start),
    end: normalizeDateField(d.end),
  };
}

export function loadTasks() {
  try {
    return db
      .prepare("SELECT data FROM tasks")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

export function loadCategories() {
  try {
    return db
      .prepare("SELECT data FROM categories")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

export function loadNotes() {
  try {
    return db
      .prepare("SELECT data FROM notes")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

export function loadRecurring() {
  try {
    return db
      .prepare("SELECT data FROM recurring")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

export function loadHabits() {
  try {
    return db
      .prepare("SELECT data FROM habits")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

export function loadDeletions() {
  try {
    return db
      .prepare("SELECT type, id, deletedAt FROM deletions")
      .all()
      .map((row) => ({
        type: row.type,
        id: row.id,
        deletedAt: new Date(row.deletedAt),
      }));
  } catch {
    return [];
  }
}

export function loadData() {
  const data = {
    tasks: loadTasks(),
    categories: loadCategories(),
    notes: loadNotes(),
    recurring: loadRecurring(),
    habits: loadHabits(),
    pomodoroSessions: loadPomodoroSessions(),
    timers: loadTimers(),
    trips: loadTrips(),
    workDays: loadWorkDays(),
    items: loadItems(),
    itemCategories: loadItemCategories(),
    itemTags: loadItemTags(),
    deletions: loadDeletions(),
  };
  return applyDeletions(data);
}

export function saveTasks(tasks) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM tasks");
    for (const task of tasks || []) {
      db.prepare("INSERT INTO tasks (id, data) VALUES (?, ?)").run(
        task.id,
        toJson(task),
      );
    }
  });
  tx();
}

export function saveCategories(categories) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM categories");
    for (const cat of categories || []) {
      db.prepare("INSERT INTO categories (id, data) VALUES (?, ?)").run(
        cat.id,
        toJson(cat),
      );
    }
  });
  tx();
}

export function saveNotes(notes) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM notes");
    for (const note of notes || []) {
      db.prepare("INSERT INTO notes (id, data) VALUES (?, ?)").run(
        note.id,
        toJson(note),
      );
    }
  });
  tx();
}

export function saveRecurring(list) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM recurring");
    for (const item of list || []) {
      db.prepare("INSERT INTO recurring (id, data) VALUES (?, ?)").run(
        item.id,
        toJson(item),
      );
    }
  });
  tx();
}

export function saveHabits(list) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM habits");
    for (const item of list || []) {
      db.prepare("INSERT INTO habits (id, data) VALUES (?, ?)").run(
        item.id,
        toJson(item),
      );
    }
  });
  tx();
}

export function saveData(data) {
  const tx = db.transaction(() => {
    saveTasks(data.tasks || []);
    saveCategories(data.categories || []);
    saveNotes(data.notes || []);
    saveRecurring(data.recurring || []);
    saveHabits(data.habits || []);
    saveItems(data.items || []);
    saveItemCategories(data.itemCategories || []);
    saveItemTags(data.itemTags || []);
    savePomodoroSessions(data.pomodoroSessions || []);
    saveTimers(data.timers || []);
    saveDeletions(data.deletions || []);
  });
  tx();
}

export function loadFlashcards() {
  try {
    return db
      .prepare("SELECT data FROM flashcards")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

export function loadDecks() {
  try {
    return db
      .prepare("SELECT data FROM decks")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

export function loadSettings() {
  try {
    const row = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("default");
    return row ? JSON.parse(row.value, dateReviver) : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  const value = JSON.stringify(settings, (key, value) =>
    value instanceof Date ? value.toISOString() : value,
  );
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(
    "default",
    value,
  );
}

export function loadPomodoroSessions() {
  try {
    return db
      .prepare("SELECT start, end, breakEnd FROM pomodoro_sessions")
      .all();
  } catch {
    return [];
  }
}

export function loadTimers() {
  try {
    return db
      .prepare("SELECT data FROM timers")
      .all()
      .map((row) => JSON.parse(row.data));
  } catch {
    return [];
  }
}

export function loadTrips() {
  try {
    return db
      .prepare("SELECT data FROM trips")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

export function loadWorkDays() {
  try {
    return db
      .prepare("SELECT data FROM workdays")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver))
      .map((d) => normalizeWorkDay(d));
  } catch {
    return [];
  }
}

export function savePomodoroSessions(sessions) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM pomodoro_sessions");
    for (const s of sessions || []) {
      db.prepare(
        "INSERT INTO pomodoro_sessions (start, end, breakEnd) VALUES (?, ?, ?)",
      ).run(s.start, s.end, s.breakEnd ?? null);
    }
  });
  tx();
}

export function saveTimers(list) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM timers");
    for (const t of list || []) {
      db.prepare("INSERT INTO timers (id, data) VALUES (?, ?)").run(
        t.id,
        toJson(t),
      );
    }
  });
  tx();
}

export function saveTrips(list) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM trips");
    for (const t of list || []) {
      db.prepare("INSERT INTO trips (id, data) VALUES (?, ?)").run(
        t.id,
        toJson(t),
      );
    }
  });
  tx();
}

export function loadItems() {
  try {
    return db
      .prepare("SELECT data FROM inventory_items")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

export function saveItems(list) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM inventory_items");
    for (const item of list || []) {
      db.prepare("INSERT INTO inventory_items (id, data) VALUES (?, ?)").run(
        item.id,
        toJson(item),
      );
    }
  });
  tx();
}

export function saveWorkDays(list) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM workdays");
    for (const d of list || []) {
      db.prepare("INSERT INTO workdays (id, data) VALUES (?, ?)").run(
        d.id,
        toJson(normalizeWorkDay(d)),
      );
    }
  });
  tx();
}
export function loadItemCategories() {
  try {
    return db
      .prepare("SELECT data FROM inventory_categories")
      .all()
      .map((row) => JSON.parse(row.data));
  } catch {
    return [];
  }
}

export function saveItemCategories(list) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM inventory_categories");
    for (const c of list || []) {
      db.prepare(
        "INSERT INTO inventory_categories (id, data) VALUES (?, ?)",
      ).run(c.id, toJson(c));
    }
  });
  tx();
}

export function loadItemTags() {
  try {
    return db
      .prepare("SELECT data FROM inventory_tags")
      .all()
      .map((row) => JSON.parse(row.data));
  } catch {
    return [];
  }
}

export function saveItemTags(list) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM inventory_tags");
    for (const t of list || []) {
      db.prepare("INSERT INTO inventory_tags (id, data) VALUES (?, ?)").run(
        t.id,
        toJson(t),
      );
    }
  });
  tx();
}

export function saveFlashcards(cards) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM flashcards");
    for (const card of cards || []) {
      db.prepare("INSERT INTO flashcards (id, data) VALUES (?, ?)").run(
        card.id,
        toJson(card),
      );
    }
  });
  tx();
}

export function saveDecks(decks) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM decks");
    for (const deck of decks || []) {
      db.prepare("INSERT INTO decks (id, data) VALUES (?, ?)").run(
        deck.id,
        toJson(deck),
      );
    }
  });
  tx();
}

export function saveDeletions(list) {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM deletions");
    for (const d of list || []) {
      db.prepare(
        "INSERT INTO deletions (type, id, deletedAt) VALUES (?, ?, ?)",
      ).run(d.type, d.id, new Date(d.deletedAt).toISOString());
    }
  });
  tx();
}

export function loadAllData() {
  const data = {
    tasks: loadTasks(),
    categories: loadCategories(),
    notes: loadNotes(),
    recurring: loadRecurring(),
    habits: loadHabits(),
    flashcards: loadFlashcards(),
    decks: loadDecks(),
    pomodoroSessions: loadPomodoroSessions(),
    timers: loadTimers(),
    trips: loadTrips(),
    workDays: loadWorkDays(),
    items: loadItems(),
    itemCategories: loadItemCategories(),
    itemTags: loadItemTags(),
    settings: loadSettings(),
    deletions: loadDeletions(),
  };
  return applyDeletions(data);
}

export function saveAllData(data) {
  saveData(data);
  saveFlashcards(data.flashcards || []);
  saveDecks(data.decks || []);
  savePomodoroSessions(data.pomodoroSessions || []);
  saveTimers(data.timers || []);
  saveTrips(data.trips || []);
  saveWorkDays(data.workDays || []);
  saveItems(data.items || []);
  saveItemCategories(data.itemCategories || []);
  saveItemTags(data.itemTags || []);
  if (data.recurring) saveRecurring(data.recurring);
  if (data.habits) saveHabits(data.habits);
  if (data.deletions) saveDeletions(data.deletions);
  if (data.settings) {
    saveSettings(data.settings);
    if (data.settings.syncRole !== undefined) {
      setSyncRole(data.settings.syncRole);
    }
    if (data.settings.syncServerUrl !== undefined) {
      setSyncServerUrl(data.settings.syncServerUrl);
    }
    if (data.settings.syncInterval !== undefined) {
      setSyncInterval(data.settings.syncInterval);
    }
    if (data.settings.syncEnabled !== undefined) {
      setSyncEnabled(data.settings.syncEnabled);
    }
    if (data.settings.llmUrl !== undefined) {
      setLlmUrl(data.settings.llmUrl);
    }
    if (data.settings.llmToken !== undefined) {
      setLlmToken(data.settings.llmToken);
    }
    if (data.settings.llmModel !== undefined) {
      setLlmModel(data.settings.llmModel);
    }
  }
  notifyClients();
}

function mergeLists(curr = [], inc = [], compare = "updatedAt") {
  const map = new Map();
  for (const c of curr) map.set(c.id, c);
  for (const i of inc || []) {
    if (map.has(i.id)) {
      const ex = map.get(i.id);
      if (compare && ex[compare] && i[compare]) {
        if (new Date(i[compare]) > new Date(ex[compare])) map.set(i.id, i);
      }
    } else {
      map.set(i.id, i);
    }
  }
  return Array.from(map.values());
}

function mergeData(curr, inc) {
  return {
    tasks: mergeLists(curr.tasks, inc.tasks),
    categories: mergeLists(curr.categories, inc.categories),
    notes: mergeLists(curr.notes, inc.notes),
    recurring: mergeLists(curr.recurring, inc.recurring),
    habits: mergeLists(curr.habits, inc.habits),
    flashcards: mergeLists(curr.flashcards, inc.flashcards, null),
    decks: mergeLists(curr.decks, inc.decks, null),
    pomodoroSessions: mergeLists(
      curr.pomodoroSessions,
      inc.pomodoroSessions,
      null,
    ),
    timers: mergeLists(curr.timers, inc.timers, null),
    trips: mergeLists(curr.trips, inc.trips, null),
    workDays: mergeLists(curr.workDays, inc.workDays, null),
    items: mergeLists(curr.items, inc.items, null),
    itemCategories: mergeLists(curr.itemCategories, inc.itemCategories, null),
    itemTags: mergeLists(curr.itemTags, inc.itemTags, null),
    settings: { ...curr.settings, ...inc.settings },
    deletions: mergeLists(curr.deletions, inc.deletions, "deletedAt"),
  };
}

function applyDeletions(data) {
  const maps = {};
  for (const d of data.deletions || []) {
    maps[d.type] = maps[d.type] || new Map();
    const curr = maps[d.type].get(d.id);
    const time = new Date(d.deletedAt);
    if (!curr || time > curr) maps[d.type].set(d.id, time);
  }
  const shouldKeep = (type, item) => {
    const m = maps[type];
    if (!m) return true;
    const t = m.get(item.id);
    if (!t) return true;
    return !(item.updatedAt && new Date(item.updatedAt) <= t);
  };
  data.tasks = (data.tasks || []).filter((t) => shouldKeep("task", t));
  data.categories = (data.categories || []).filter((c) =>
    shouldKeep("category", c),
  );
  data.notes = (data.notes || []).filter((n) => shouldKeep("note", n));
  data.recurring = (data.recurring || []).filter((r) =>
    shouldKeep("recurring", r),
  );
  data.habits = (data.habits || []).filter((h) => shouldKeep("habit", h));
  data.flashcards = (data.flashcards || []).filter((f) =>
    shouldKeep("flashcard", f),
  );
  data.decks = (data.decks || []).filter((d) => shouldKeep("deck", d));
  data.trips = (data.trips || []).filter((t) => shouldKeep("trip", t));
  data.workDays = (data.workDays || []).filter((d) => shouldKeep("workday", d));
  data.items = (data.items || []).filter((i) => shouldKeep("inventoryItem", i));
  data.itemCategories = (data.itemCategories || []).filter((c) =>
    shouldKeep("inventoryCategory", c),
  );
  data.itemTags = (data.itemTags || []).filter((t) =>
    shouldKeep("inventoryTag", t),
  );
  data.pomodoroSessions = (data.pomodoroSessions || []).filter((s) =>
    shouldKeep("pomodoro", s),
  );
  data.timers = (data.timers || []).filter((t) => shouldKeep("timer", t));
  return data;
}

async function performSync() {
  if (syncRole !== "client" || !syncServerUrl) return;
  const url = `${syncServerUrl.replace(/\/$/, "")}/api/sync`;
  try {
    log("Starting sync with", url);
    const data = loadAllData();
    if (data.settings) {
      delete data.settings.syncServerUrl;
      delete data.settings.syncRole;
      delete data.settings.syncEnabled;
      delete data.settings.llmToken;
    }
    const post = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data, (k, v) =>
        v instanceof Date ? v.toISOString() : v,
      ),
    });
    if (!post.ok) throw new Error(`HTTP ${post.status}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const incoming = await res.json();
    const merged = applyDeletions(mergeData(loadAllData(), incoming));
    saveAllData(merged);
    lastSyncTime = Date.now();
    lastSyncError = null;
    log("Sync successful");
  } catch (err) {
    console.error("Sync error", err);
    lastSyncTime = Date.now();
    lastSyncError = err.message || String(err);
  }
}

function startSyncTimer() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = null;
  if (
    syncEnabled &&
    syncRole === "client" &&
    syncServerUrl &&
    syncInterval > 0
  ) {
    log("Sync timer started with interval", syncInterval, "minutes");
    performSync();
    syncTimer = setInterval(performSync, syncInterval * 60 * 1000);
  }
}

function setSyncRole(role) {
  const newRole = role === "server" ? "server" : "client";
  if (newRole === syncRole) return;
  syncRole = newRole;
  log("Sync role set to", syncRole);
  startSyncTimer();
}

function setSyncServerUrl(url) {
  if (url && !/^https?:\/\//i.test(url)) {
    url = "http://" + url;
  }
  const normalized = url ? url.replace(/\/$/, "") : "";
  if (normalized === syncServerUrl) return;
  syncServerUrl = normalized;
  log("Sync server URL set to", syncServerUrl || "(none)");
  startSyncTimer();
}

function setSyncInterval(minutes) {
  const val = Number(minutes) || 0;
  if (val === syncInterval) return;
  syncInterval = val;
  log("Sync interval set to", syncInterval);
  startSyncTimer();
}

function setSyncEnabled(val) {
  const enabled = Boolean(val);
  if (enabled === syncEnabled) return;
  syncEnabled = enabled;
  log("Sync enabled set to", syncEnabled);
  startSyncTimer();
}

function setLlmUrl(url) {
  llmUrl = url || "";
  log("LLM URL set to", llmUrl || "(none)");
}

function setLlmToken(token) {
  llmToken = token || "";
}

function setLlmModel(model) {
  llmModel = model || "gpt-3.5-turbo";
}

export const app = express();
app.use(express.json());

app.get("/api/updates", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");
  sseClients.push(res);
  req.on("close", () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

import createDataRouter from "./routes/data.js";
import createFlashcardsRouter from "./routes/flashcards.js";
import createDecksRouter from "./routes/decks.js";
import createRecurringRouter from "./routes/recurring.js";
import createHabitsRouter from "./routes/habits.js";
import createNotesRouter from "./routes/notes.js";
import createInventoryRouter from "./routes/inventory.js";
import createAllRouter from "./routes/all.js";
import createSettingsRouter from "./routes/settings.js";
import createPomodoroRouter from "./routes/pomodoro.js";
import createTimersRouter from "./routes/timers.js";
import createTripsRouter from "./routes/trips.js";
import createWorkdaysRouter from "./routes/workdays.js";
import createSyncRouter from "./routes/sync.js";
import createSyncLogRouter from "./routes/syncLog.js";
import createServerInfoRouter from "./routes/serverInfo.js";
import createSyncStatusRouter from "./routes/syncStatus.js";
import createLlmRouter from "./routes/llm.js";

app.use("/api/data", createDataRouter({ loadData, saveData, notifyClients }));
app.use(
  "/api/flashcards",
  createFlashcardsRouter({ loadFlashcards, saveFlashcards, notifyClients }),
);
app.use(
  "/api/decks",
  createDecksRouter({ loadDecks, saveDecks, notifyClients }),
);
app.use(
  "/api/recurring",
  createRecurringRouter({ loadRecurring, saveRecurring, notifyClients }),
);
app.use(
  "/api/habits",
  createHabitsRouter({ loadHabits, saveHabits, notifyClients }),
);
app.use(
  "/api/notes",
  createNotesRouter({ loadNotes, saveNotes, notifyClients }),
);
app.use(
  "/api/inventory",
  createInventoryRouter({
    loadItems,
    saveItems,
    loadItemCategories,
    saveItemCategories,
    loadItemTags,
    saveItemTags,
    notifyClients,
  }),
);
app.use("/api/all", createAllRouter({ loadAllData, saveAllData }));
app.use(
  "/api/settings",
  createSettingsRouter({
    loadSettings,
    saveSettings,
    setSyncRole,
    setSyncServerUrl,
    setSyncInterval,
    setSyncEnabled,
    setLlmUrl,
    setLlmToken,
    setLlmModel,
    notifyClients,
  }),
);
app.use(
  "/api/pomodoro-sessions",
  createPomodoroRouter({
    loadPomodoroSessions,
    savePomodoroSessions,
    notifyClients,
  }),
);
app.use(
  "/api/timers",
  createTimersRouter({ loadTimers, saveTimers, notifyClients }),
);
app.use(
  "/api/trips",
  createTripsRouter({ loadTrips, saveTrips, notifyClients }),
);
app.use(
  "/api/workdays",
  createWorkdaysRouter({ loadWorkDays, saveWorkDays, notifyClients }),
);
app.use(
  "/api/sync",
  createSyncRouter({
    loadAllData,
    saveAllData,
    syncLogs,
    notifyClients,
    dateReviver,
    syncRole: () => syncRole,
  }),
);
app.use(
  "/api/sync-log",
  createSyncLogRouter({ syncLogs, syncRole: () => syncRole }),
);
let activePort = 3002;
const publicIp = process.env.SERVER_PUBLIC_IP || null;
export function setActivePort(p) {
  activePort = p;
}
app.use(
  "/api/server-info",
  createServerInfoRouter({ os, activePort: () => activePort, publicIp }),
);
app.use(
  "/api/sync-status",
  createSyncStatusRouter({
    getStatus: () => ({
      last: lastSyncTime,
      error: lastSyncError,
      enabled: syncEnabled,
    }),
  }),
);
app.use(
  "/api/llm",
  createLlmRouter({ getConfig: () => ({ llmUrl, llmToken, llmModel }) }),
);

app.use(express.static(DIST_DIR));
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});
