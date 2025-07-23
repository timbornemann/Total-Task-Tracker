import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import db from "./lib/db.js";
import { registerClient, notifyClients } from "./lib/sse.js";
import {
  initSync,
  startSyncTimer,
  setSyncRole,
  setSyncServerUrl,
  setSyncInterval,
  setSyncEnabled,
  setLlmUrl,
  setLlmToken,
  setLlmModel,
  getSyncRole,
  getStatus,
  getLlmConfig,
  syncLogs,
  log,
} from "./lib/sync.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, "..", "dist");

initSync({ loadAllData, saveAllData });
const initialSettings = loadSettings();
if (typeof initialSettings.syncInterval === "number") {
  setSyncInterval(initialSettings.syncInterval);
}
if (initialSettings.syncRole) {
  setSyncRole(initialSettings.syncRole);
}
if (initialSettings.syncServerUrl) {
  setSyncServerUrl(initialSettings.syncServerUrl);
}
if (typeof initialSettings.syncEnabled === "boolean") {
  setSyncEnabled(initialSettings.syncEnabled);
}
if (initialSettings.llmUrl) {
  setLlmUrl(initialSettings.llmUrl);
}
if (initialSettings.llmToken) {
  setLlmToken(initialSettings.llmToken);
}
if (initialSettings.llmModel) {
  setLlmModel(initialSettings.llmModel);
}
log("Initial sync settings", {
  role: getSyncRole(),
  url: initialSettings.syncServerUrl || "",
  interval: initialSettings.syncInterval || 5,
  enabled: initialSettings.syncEnabled !== false,
  llmConfigured: !!initialSettings.llmUrl,
});
startSyncTimer();

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
      .map((row) => JSON.parse(row.data, dateReviver));
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
        toJson(d),
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


export const app = express();
app.use(express.json());

app.get("/api/updates", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");
  registerClient(res);
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
    syncRole: getSyncRole,
  }),
);
app.use(
  "/api/sync-log",
  createSyncLogRouter({ syncLogs, syncRole: getSyncRole }),
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
app.use("/api/sync-status", createSyncStatusRouter({ getStatus }));
app.use("/api/llm", createLlmRouter({ getConfig: getLlmConfig }));

app.use(express.static(DIST_DIR));
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});
