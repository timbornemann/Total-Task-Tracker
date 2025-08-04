import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import { format } from "date-fns";
import db from "./lib/db.js";
import { loadTable, saveTable } from "./lib/table.js";
import { notifyClients, registerClient } from "./lib/sse.js";
import type {
  Task,
  Category,
  Note,
  Habit,
  Flashcard,
  Deck,
  Deletion,
  Timer,
  Trip,
  WorkDay,
  InventoryItem,
  ItemCategory,
  ItemTag,
  PomodoroSession,
} from "../src/types";
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
  syncLogs,
  getSyncRole,
  getSyncStatus,
  getLlmConfig,
  mergeLists,
  mergeData,
  applyDeletions
} from "./lib/sync.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, "..", "dist");
function log(...args) {
  console.log(new Date().toISOString(), ...args);
}



function dateReviver(key, value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return value;
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

export function loadTasks(): Task[] {
  return loadTable<Task>("tasks", dateReviver);
}

export function loadCategories(): Category[] {
  return loadTable<Category>("categories", dateReviver);
}

export function loadNotes(): Note[] {
  return loadTable<Note>("notes", dateReviver);
}

export function loadRecurring(): Task[] {
  return loadTable<Task>("recurring", dateReviver);
}

export function loadHabits(): Habit[] {
  return loadTable<Habit>("habits", dateReviver);
}

export function loadDeletions(): Deletion[] {
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
    return [] as Deletion[];
  }
}

export function loadData(): any {
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

export function saveTasks(tasks: Task[]): void {
  saveTable<Task>("tasks", tasks);
}

export function saveCategories(categories: Category[]): void {
  saveTable<Category>("categories", categories);
}

export function saveNotes(notes: Note[]): void {
  saveTable<Note>("notes", notes);
}

export function saveRecurring(list: Task[]): void {
  saveTable<Task>("recurring", list);
}

export function saveHabits(list: Habit[]): void {
  saveTable<Habit>("habits", list);
}

export function saveData(data: any): void {
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

export function loadFlashcards(): Flashcard[] {
  return loadTable<Flashcard>("flashcards", dateReviver);
}

export function loadDecks(): Deck[] {
  return loadTable<Deck>("decks", dateReviver);
}

export function loadSettings(): Record<string, any> {
  try {
    const row = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("default");
    return row ? JSON.parse(row.value, dateReviver) : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings: Record<string, any>): void {
  const value = JSON.stringify(settings, (key, value) =>
    value instanceof Date ? value.toISOString() : value,
  );
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(
    "default",
    value,
  );
}

export function loadPomodoroSessions(): PomodoroSession[] {
  try {
    return db
      .prepare("SELECT start, end, breakEnd FROM pomodoro_sessions")
      .all();
  } catch {
    return [] as PomodoroSession[];
  }
}

export function loadTimers(): Timer[] {
  return loadTable<Timer>("timers", dateReviver);
}

export function loadTrips(): Trip[] {
  return loadTable<Trip>("trips", dateReviver);
}

export function loadWorkDays(): WorkDay[] {
  return loadTable<WorkDay>("workdays", dateReviver).map((d) => normalizeWorkDay(d));
}

export function savePomodoroSessions(sessions: PomodoroSession[]): void {
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

export function saveTimers(list: Timer[]): void {
  saveTable<Timer>("timers", list);
}

export function saveTrips(list: Trip[]): void {
  saveTable<Trip>("trips", list);
}

export function loadItems(): InventoryItem[] {
  return loadTable<InventoryItem>("inventory_items", dateReviver);
}

export function saveItems(list: InventoryItem[]): void {
  saveTable<InventoryItem>("inventory_items", list);
}

export function saveWorkDays(list: WorkDay[]): void {
  saveTable(
    "workdays",
    (list || []).map((d) => normalizeWorkDay(d)),
  );
}
export function loadItemCategories(): ItemCategory[] {
  return loadTable<ItemCategory>("inventory_categories");
}

export function saveItemCategories(list: ItemCategory[]): void {
  saveTable<ItemCategory>("inventory_categories", list);
}

export function loadItemTags(): ItemTag[] {
  return loadTable<ItemTag>("inventory_tags");
}

export function saveItemTags(list: ItemTag[]): void {
  saveTable<ItemTag>("inventory_tags", list);
}

export function saveFlashcards(cards: Flashcard[]): void {
  saveTable<Flashcard>("flashcards", cards);
}

export function saveDecks(decks: Deck[]): void {
  saveTable<Deck>("decks", decks);
}

export function saveDeletions(list: Deletion[]): void {
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

export function loadAllData(): any {
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

export function saveAllData(data: any): void {
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
  interval: initialSettings.syncInterval || 0,
  enabled: initialSettings.syncEnabled !== false,
  llmConfigured: !!initialSettings.llmUrl,
});
startSyncTimer();
try {
  saveWorkDays(loadWorkDays());
} catch (err) {
  log("Failed to normalize workdays", err);
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
  registerClient(req, res);
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
export function setActivePort(p: number): void {
  activePort = p;
}
app.use(
  "/api/server-info",
  createServerInfoRouter({ os, activePort: () => activePort, publicIp }),
);
app.use(
  "/api/sync-status",
  createSyncStatusRouter({
    getStatus: getSyncStatus,
  }),
);
app.use(
  "/api/llm",
  createLlmRouter({ getConfig: getLlmConfig }),
);

app.use(express.static(DIST_DIR));
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});
