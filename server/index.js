import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'url';
import Database from 'better-sqlite3';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'data.db');
const DIST_DIR = path.join(__dirname, '..', 'dist');

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(DB_FILE);
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
`);
try {
  db.prepare('ALTER TABLE pomodoro_sessions ADD COLUMN breakEnd INTEGER').run();
} catch {}

let syncRole = 'client'; // 'server' or 'client'
let syncServerUrl = '';
let syncInterval = 5; // minutes
let syncTimer = null;
let lastSyncTime = 0;
let lastSyncError = null;
const syncLogs = [];

const initialSettings = loadSettings();
if (typeof initialSettings.syncInterval === 'number') {
  syncInterval = initialSettings.syncInterval;
}
if (initialSettings.syncRole) {
  syncRole = initialSettings.syncRole;
}
if (initialSettings.syncServerUrl) {
  syncServerUrl = initialSettings.syncServerUrl;
}
startSyncTimer();

function dateReviver(key, value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return value;
}

function toJson(obj) {
  return JSON.stringify(
    obj,
    (key, value) => (value instanceof Date ? value.toISOString() : value)
  );
}

function loadTasks() {
  try {
    return db
      .prepare('SELECT data FROM tasks')
      .all()
      .map(row => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

function loadCategories() {
  try {
    return db
      .prepare('SELECT data FROM categories')
      .all()
      .map(row => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

function loadNotes() {
  try {
    return db
      .prepare('SELECT data FROM notes')
      .all()
      .map(row => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

function loadRecurring() {
  try {
    return db
      .prepare('SELECT data FROM recurring')
      .all()
      .map(row => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

function loadData() {
  return {
    tasks: loadTasks(),
    categories: loadCategories(),
    notes: loadNotes(),
    recurring: loadRecurring()
  };
}

function saveTasks(tasks) {
  const tx = db.transaction(() => {
    db.exec('DELETE FROM tasks');
    for (const task of tasks || []) {
      db.prepare('INSERT INTO tasks (id, data) VALUES (?, ?)')
        .run(task.id, toJson(task));
    }
  });
  tx();
}

function saveCategories(categories) {
  const tx = db.transaction(() => {
    db.exec('DELETE FROM categories');
    for (const cat of categories || []) {
      db.prepare('INSERT INTO categories (id, data) VALUES (?, ?)')
        .run(cat.id, toJson(cat));
    }
  });
  tx();
}

function saveNotes(notes) {
  const tx = db.transaction(() => {
    db.exec('DELETE FROM notes');
    for (const note of notes || []) {
      db.prepare('INSERT INTO notes (id, data) VALUES (?, ?)')
        .run(note.id, toJson(note));
    }
  });
  tx();
}

function saveRecurring(list) {
  const tx = db.transaction(() => {
    db.exec('DELETE FROM recurring');
    for (const item of list || []) {
      db.prepare('INSERT INTO recurring (id, data) VALUES (?, ?)')
        .run(item.id, toJson(item));
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
  });
  tx();
}

function loadFlashcards() {
  try {
    return db.prepare('SELECT data FROM flashcards').all()
      .map(row => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

function loadDecks() {
  try {
    return db.prepare('SELECT data FROM decks').all()
      .map(row => JSON.parse(row.data, dateReviver));
  } catch {
    return [];
  }
}

function loadSettings() {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('default');
    return row ? JSON.parse(row.value, dateReviver) : {};
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  const value = JSON.stringify(settings, (key, value) =>
    value instanceof Date ? value.toISOString() : value
  );
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .run('default', value);
}

function loadPomodoroSessions() {
  try {
    return db.prepare('SELECT start, end, breakEnd FROM pomodoro_sessions').all();
  } catch {
    return [];
  }
}

function savePomodoroSessions(sessions) {
  const tx = db.transaction(() => {
    db.exec('DELETE FROM pomodoro_sessions');
    for (const s of sessions || []) {
      db.prepare(
        'INSERT INTO pomodoro_sessions (start, end, breakEnd) VALUES (?, ?, ?)'
      ).run(s.start, s.end, s.breakEnd ?? null);
    }
  });
  tx();
}

function saveFlashcards(cards) {
  const tx = db.transaction(() => {
    db.exec('DELETE FROM flashcards');
    for (const card of cards || []) {
      db.prepare('INSERT INTO flashcards (id, data) VALUES (?, ?)')
        .run(card.id, toJson(card));
    }
  });
  tx();
}

function saveDecks(decks) {
  const tx = db.transaction(() => {
    db.exec('DELETE FROM decks');
    for (const deck of decks || []) {
      db.prepare('INSERT INTO decks (id, data) VALUES (?, ?)')
        .run(deck.id, toJson(deck));
    }
  });
  tx();
}

function loadAllData() {
  return {
    tasks: loadTasks(),
    categories: loadCategories(),
    notes: loadNotes(),
    recurring: loadRecurring(),
    flashcards: loadFlashcards(),
    decks: loadDecks(),
    settings: loadSettings()
  };
}

function saveAllData(data) {
  saveData(data);
  saveFlashcards(data.flashcards || []);
  saveDecks(data.decks || []);
  if (data.recurring) saveRecurring(data.recurring);
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
  }
}

function mergeLists(curr = [], inc = [], compare = 'updatedAt') {
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
    settings: { ...curr.settings, ...inc.settings }
  };
}

async function performSync() {
  if (syncRole !== 'client' || !syncServerUrl) return;
  const url = `${syncServerUrl.replace(/\/$/, '')}/api/sync`;
  try {
    const data = loadAllData();
    if (data.settings) {
      delete data.settings.syncServerUrl;
      delete data.settings.syncRole;
    }
    const post = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        data,
        (k, v) => (v instanceof Date ? v.toISOString() : v)
      )
    });
    if (!post.ok) throw new Error(`HTTP ${post.status}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const incoming = await res.json();
    const merged = mergeData(loadAllData(), incoming);
    saveAllData(merged);
    lastSyncTime = Date.now();
    lastSyncError = null;
  } catch (err) {
    console.error('Sync error', err);
    lastSyncTime = Date.now();
    lastSyncError = err.message || String(err);
  }
}

function startSyncTimer() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = null;
  if (syncRole === 'client' && syncServerUrl && syncInterval > 0) {
    performSync();
    syncTimer = setInterval(performSync, syncInterval * 60 * 1000);
  }
}

function setSyncRole(role) {
  syncRole = role === 'server' ? 'server' : 'client';
  startSyncTimer();
}

function setSyncServerUrl(url) {
  if (url && !/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }
  syncServerUrl = url ? url.replace(/\/$/, '') : '';
  startSyncTimer();
}

function setSyncInterval(minutes) {
  syncInterval = minutes || 0;
  startSyncTimer();
}

function serveStatic(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end();
      return;
    }
    const ext = path.extname(filePath);
    const type = ext === '.js' ? 'text/javascript'
      : ext === '.css' ? 'text/css'
      : ext === '.json' ? 'application/json'
      : 'text/html';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = parse(req.url, true);

  if (parsed.pathname === '/api/data') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadData()));
      return;
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          saveData(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === '/api/flashcards' ||
      parsed.pathname === '/api/flashcards/') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadFlashcards()));
      return;
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const cards = JSON.parse(body || '[]');
          saveFlashcards(cards);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === '/api/decks' || parsed.pathname === '/api/decks/') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadDecks()));
      return;
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const decks = JSON.parse(body || '[]');
          saveDecks(decks);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === '/api/recurring' || parsed.pathname === '/api/recurring/') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadRecurring()));
      return;
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const list = JSON.parse(body || '[]');
          saveRecurring(list);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === '/api/notes' || parsed.pathname === '/api/notes/') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadNotes()));
      return;
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const notes = JSON.parse(body || '[]');
          saveNotes(notes);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === '/api/all') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const all = loadAllData();
      if (all.settings) {
        delete all.settings.syncServerUrl;
        delete all.settings.syncRole;
      }
      res.end(
        JSON.stringify(
          all,
          (k, v) => (v instanceof Date ? v.toISOString() : v)
        )
      );
      return;
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          saveAllData(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }


  if (parsed.pathname === '/api/settings') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadSettings()));
      return;
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const settings = JSON.parse(body || '{}');
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
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === '/api/pomodoro-sessions') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadPomodoroSessions()));
      return;
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const sessions = JSON.parse(body || '[]');
          savePomodoroSessions(sessions);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === '/api/sync') {
    if (syncRole !== 'server') {
      res.writeHead(403);
      res.end();
      return;
    }
    if (req.method === 'GET') {
      const data = loadAllData();
      if (data.settings) {
        delete data.settings.syncServerUrl;
        delete data.settings.syncRole;
      }
      syncLogs.push({ time: Date.now(), ip: req.socket.remoteAddress, method: 'GET' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data, (k, v) => (v instanceof Date ? v.toISOString() : v)));
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const incoming = JSON.parse(body || '{}', dateReviver);
          if (incoming.settings) {
            delete incoming.settings.syncServerUrl;
            delete incoming.settings.syncRole;
          }
          const merged = mergeData(loadAllData(), incoming);
          saveAllData(merged);
          syncLogs.push({ time: Date.now(), ip: req.socket.remoteAddress, method: 'POST' });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        } catch {
          res.writeHead(400);
          res.end();
        }
      });
      return;
    }
  }

  if (parsed.pathname === '/api/sync-log') {
    if (syncRole !== 'server') {
      res.writeHead(403);
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(syncLogs, (k, v) => (v instanceof Date ? v.toISOString() : v)));
    return;
  }

  if (parsed.pathname === '/api/server-info') {
    const ips = [];
    const ifaces = os.networkInterfaces();
    let wifiIp = null;
    Object.entries(ifaces).forEach(([name, list]) => {
      for (const iface of list || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push(iface.address);
          if (!wifiIp && /^wl|wlan|wi-?fi/i.test(name)) {
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
      port,
      urls: ips.map(ip => `http://${ip}:${port}/`),
      wifiIp,
      wifiUrl: wifiIp ? `http://${wifiIp}:${port}/` : null
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(info));
    return;
  }

  if (parsed.pathname === '/api/sync-status') {
    const info = {
      last: lastSyncTime,
      error: lastSyncError
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(info));
    return;
  }

  // serve static files
  let filePath = path.join(DIST_DIR, parsed.pathname);
  if (filePath.endsWith('/')) filePath += 'index.html';
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
    serveStatic(filePath, res);
  });
});

const port = process.env.PORT || 3002;
const publicIp = process.env.SERVER_PUBLIC_IP || null;
server.listen(port, () => {
  console.log('Server listening on port', port);
});
