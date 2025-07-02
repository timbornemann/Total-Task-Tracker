import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "url";
import Database from "better-sqlite3";
import os from "os";

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

let syncRole = "client"; // 'server' or 'client'
let syncServerUrl = "";
let syncInterval = 5; // minutes
let syncEnabled = true;
let llmUrl = "";
let llmToken = "";
let llmModel = "gpt-3.5-turbo";
let syncTimer = null;
let lastSyncTime = 0;
let lastSyncError = null;
const syncLogs = [];
const sseClients = [];

function notifyClients() {
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

function loadTasks() {
  try {
    return db
      .prepare("SELECT data FROM tasks")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

function loadCategories() {
  try {
    return db
      .prepare("SELECT data FROM categories")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

function loadNotes() {
  try {
    return db
      .prepare("SELECT data FROM notes")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

function loadRecurring() {
  try {
    return db
      .prepare("SELECT data FROM recurring")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

function loadDeletions() {
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

function loadData() {
  const data = {
    tasks: loadTasks(),
    categories: loadCategories(),
    notes: loadNotes(),
    recurring: loadRecurring(),
    deletions: loadDeletions(),
  };
  return applyDeletions(data);
}

function saveTasks(tasks) {
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

function saveCategories(categories) {
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

function saveNotes(notes) {
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

function saveRecurring(list) {
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

function saveData(data) {
  const tx = db.transaction(() => {
    saveTasks(data.tasks || []);
    saveCategories(data.categories || []);
    saveNotes(data.notes || []);
    saveRecurring(data.recurring || []);
    saveDeletions(data.deletions || []);
  });
  tx();
}

function loadFlashcards() {
  try {
    return db
      .prepare("SELECT data FROM flashcards")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

function loadDecks() {
  try {
    return db
      .prepare("SELECT data FROM decks")
      .all()
      .map((row) => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

function loadSettings() {
  try {
    const row = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("default");
    return row ? JSON.parse(row.value, dateReviver) : {};
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  const value = JSON.stringify(settings, (key, value) =>
    value instanceof Date ? value.toISOString() : value,
  );
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(
    "default",
    value,
  );
}

function loadPomodoroSessions() {
  try {
    return db
      .prepare("SELECT start, end, breakEnd FROM pomodoro_sessions")
      .all();
  } catch {
    return [];
  }
}

function savePomodoroSessions(sessions) {
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

function saveFlashcards(cards) {
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

function saveDecks(decks) {
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

function saveDeletions(list) {
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

function loadAllData() {
  const data = {
    tasks: loadTasks(),
    categories: loadCategories(),
    notes: loadNotes(),
    recurring: loadRecurring(),
    flashcards: loadFlashcards(),
    decks: loadDecks(),
    settings: loadSettings(),
    deletions: loadDeletions(),
  };
  return applyDeletions(data);
}

function saveAllData(data) {
  saveData(data);
  saveFlashcards(data.flashcards || []);
  saveDecks(data.decks || []);
  if (data.recurring) saveRecurring(data.recurring);
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
    flashcards: mergeLists(curr.flashcards, inc.flashcards, null),
    decks: mergeLists(curr.decks, inc.decks, null),
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
  data.flashcards = (data.flashcards || []).filter((f) =>
    shouldKeep("flashcard", f),
  );
  data.decks = (data.decks || []).filter((d) => shouldKeep("deck", d));
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

function serveStatic(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end();
      return;
    }
    const ext = path.extname(filePath);
    const type =
      ext === ".js"
        ? "text/javascript"
        : ext === ".css"
          ? "text/css"
          : ext === ".json"
            ? "application/json"
            : ext === ".webmanifest"
              ? "application/manifest+json"
              : ext === ".svg"
                ? "image/svg+xml"
                : ext === ".ico"
                  ? "image/x-icon"
                  : "text/html";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  log(req.method, req.url, "from", req.socket.remoteAddress);
  const parsed = parse(req.url, true);

  if (parsed.pathname === "/api/updates") {
    res.writeHead(200, {
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
    return;
  }

  if (parsed.pathname === "/api/data") {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(loadData()));
      return;
    }
    if (req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body || "{}");
          saveData(data);
          notifyClients();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok" }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (
    parsed.pathname === "/api/flashcards" ||
    parsed.pathname === "/api/flashcards/"
  ) {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(loadFlashcards()));
      return;
    }
    if (req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const cards = JSON.parse(body || "[]");
          saveFlashcards(cards);
          notifyClients();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok" }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === "/api/decks" || parsed.pathname === "/api/decks/") {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(loadDecks()));
      return;
    }
    if (req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const decks = JSON.parse(body || "[]");
          saveDecks(decks);
          notifyClients();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok" }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (
    parsed.pathname === "/api/recurring" ||
    parsed.pathname === "/api/recurring/"
  ) {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(loadRecurring()));
      return;
    }
    if (req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const list = JSON.parse(body || "[]");
          saveRecurring(list);
          notifyClients();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok" }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === "/api/notes" || parsed.pathname === "/api/notes/") {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(loadNotes()));
      return;
    }
    if (req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const notes = JSON.parse(body || "[]");
          saveNotes(notes);
          notifyClients();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok" }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === "/api/all") {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      const all = loadAllData();
      if (all.settings) {
        delete all.settings.syncServerUrl;
        delete all.settings.syncRole;
        delete all.settings.llmToken;
      }
      res.end(
        JSON.stringify(all, (k, v) =>
          v instanceof Date ? v.toISOString() : v,
        ),
      );
      return;
    }
    if (req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body || "{}");
          saveAllData(data);
          notifyClients();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok" }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === "/api/settings") {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(loadSettings()));
      return;
    }
    if (req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const settings = JSON.parse(body || "{}");
          saveSettings(settings);
          if (settings.syncRole !== undefined) {
            setSyncRole(settings.syncRole);
          }
          if (settings.syncServerUrl !== undefined) {
            setSyncServerUrl(settings.syncServerUrl);
          }
          if (settings.syncInterval !== undefined) {
            setSyncInterval(settings.syncInterval);
          }
          if (settings.syncEnabled !== undefined) {
            setSyncEnabled(settings.syncEnabled);
          }
          if (settings.llmUrl !== undefined) {
            setLlmUrl(settings.llmUrl);
          }
          if (settings.llmToken !== undefined) {
            setLlmToken(settings.llmToken);
          }
          if (settings.llmModel !== undefined) {
            setLlmModel(settings.llmModel);
          }
          notifyClients();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok" }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === "/api/pomodoro-sessions") {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(loadPomodoroSessions()));
      return;
    }
    if (req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const sessions = JSON.parse(body || "[]");
          savePomodoroSessions(sessions);
          notifyClients();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok" }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === "/api/sync") {
    if (syncRole !== "server") {
      res.writeHead(403);
      res.end();
      return;
    }
    if (req.method === "GET") {
      const data = loadAllData();
      if (data.settings) {
        delete data.settings.syncServerUrl;
        delete data.settings.syncRole;
        delete data.settings.syncEnabled;
        delete data.settings.llmToken;
      }
      syncLogs.push({
        time: Date.now(),
        ip: req.socket.remoteAddress,
        method: "GET",
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify(data, (k, v) =>
          v instanceof Date ? v.toISOString() : v,
        ),
      );
      return;
    }
    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const incoming = JSON.parse(body || "{}", dateReviver);
          if (incoming.settings) {
            delete incoming.settings.syncServerUrl;
            delete incoming.settings.syncRole;
            delete incoming.settings.syncEnabled;
            delete incoming.settings.llmToken;
          }
          const merged = applyDeletions(mergeData(loadAllData(), incoming));
          saveAllData(merged);
          syncLogs.push({
            time: Date.now(),
            ip: req.socket.remoteAddress,
            method: "POST",
          });
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok" }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === "/api/sync-log") {
    if (syncRole !== "server") {
      res.writeHead(403);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(syncLogs, (k, v) =>
        v instanceof Date ? v.toISOString() : v,
      ),
    );
    return;
  }

  if (parsed.pathname === "/api/server-info") {
    const ips = [];
    const ifaces = os.networkInterfaces();
    let wifiIp = null;
    Object.entries(ifaces).forEach(([name, list]) => {
      for (const iface of list || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          ips.push(iface.address);
          if (!wifiIp && /^(wl|wlan|wi-?fi)/i.test(name)) {
            wifiIp = iface.address;
          }
        }
      }
    });
    if (publicIp && !ips.includes(publicIp)) {
      ips.push(publicIp);
      if (!wifiIp) wifiIp = publicIp;
    }
    const info = {
      ips,
      port: activePort,
      urls: ips.map((ip) => `http://${ip}:${activePort}/`),
      wifiIp,
      wifiUrl: wifiIp ? `http://${wifiIp}:${activePort}/` : null,
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(info));
    return;
  }

  if (parsed.pathname === "/api/sync-status") {
    const info = {
      last: lastSyncTime,
      error: lastSyncError,
      enabled: syncEnabled,
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(info));
    return;
  }

  if (parsed.pathname === "/api/llm") {
    if (req.method === "POST") {
      let body = "";
      req.on("data", (c) => {
        body += c;
      });
      req.on("end", async () => {
        try {
          if (!llmUrl || !llmToken) throw new Error("LLM not configured");
          const payload = JSON.parse(body || "{}");
          const resp = await fetch(llmUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${llmToken}`,
            },
            body: JSON.stringify({ model: llmModel, ...payload }),
          });
          const text = await resp.text();
          res.writeHead(resp.status, { "Content-Type": "application/json" });
          res.end(text);
        } catch (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: "llm_error" }));
        }
      });
      return;
    }
    res.writeHead(405);
    res.end();
    return;
  }

  // serve static files
  let filePath = path.join(DIST_DIR, parsed.pathname);
  if (filePath.endsWith("/")) filePath += "index.html";
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(DIST_DIR, "index.html");
    }
    serveStatic(filePath, res);
  });
});

let port = Number(process.env.PORT) || 3002;
let activePort = port;
const publicIp = process.env.SERVER_PUBLIC_IP || null;
server.listen(port, () => {
  activePort = server.address().port;
  log("Server listening on port", activePort, "DB", DB_FILE);
});
