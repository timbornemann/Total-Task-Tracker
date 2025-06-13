import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'url';
import Database from 'better-sqlite3';
import dialog from 'node-file-dialog';

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

let syncFolder = '';
let syncInterval = 5; // minutes
let syncTimer = null;
let lastSyncMtime = 0;

const initialSettings = loadSettings();
if (typeof initialSettings.syncInterval === 'number') {
  syncInterval = initialSettings.syncInterval;
}
if (initialSettings.syncFolder) {
  setSyncFolder(initialSettings.syncFolder);
}

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

function loadData() {
  return {
    tasks: loadTasks(),
    categories: loadCategories(),
    notes: loadNotes()
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

function saveData(data) {
  const tx = db.transaction(() => {
    saveTasks(data.tasks || []);
    saveCategories(data.categories || []);
    saveNotes(data.notes || []);
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
    flashcards: loadFlashcards(),
    decks: loadDecks(),
    settings: loadSettings()
  };
}

function saveAllData(data) {
  saveData(data);
  saveFlashcards(data.flashcards || []);
  saveDecks(data.decks || []);
  if (data.settings) {
    saveSettings(data.settings);
    if (data.settings.syncFolder !== undefined) {
      setSyncFolder(data.settings.syncFolder);
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
    flashcards: mergeLists(curr.flashcards, inc.flashcards, null),
    decks: mergeLists(curr.decks, inc.decks, null),
    settings: { ...curr.settings, ...inc.settings }
  };
}

function performSync() {
  if (!syncFolder) return;
  const file = path.join(syncFolder, 'total-task-tracker-sync.json');
  try {
    let incoming = null;
    if (fs.existsSync(file)) {
      const stat = fs.statSync(file);
      if (stat.mtimeMs > lastSyncMtime) {
        incoming = JSON.parse(fs.readFileSync(file, 'utf8'), dateReviver);
        if (incoming.settings) delete incoming.settings.syncFolder;
        lastSyncMtime = stat.mtimeMs;
      }
    }
    if (incoming) {
      const merged = mergeData(loadAllData(), incoming);
      saveAllData(merged);
    }
    const data = loadAllData();
    if (data.settings) delete data.settings.syncFolder;
    fs.mkdirSync(syncFolder, { recursive: true });
    fs.writeFileSync(
      file,
      JSON.stringify(
        data,
        (k, v) => (v instanceof Date ? v.toISOString() : v),
        2
      )
    );
    lastSyncMtime = Date.now();
  } catch (err) {
    console.error('Sync error', err);
  }
}

function setSyncFolder(folder) {
  syncFolder = folder || '';
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = null;
  if (syncFolder && syncInterval > 0) {
    performSync();
    syncTimer = setInterval(performSync, syncInterval * 60 * 1000);
  }
}

function setSyncInterval(minutes) {
  syncInterval = minutes || 0;
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = null;
  if (syncFolder && syncInterval > 0) {
    performSync();
    syncTimer = setInterval(performSync, syncInterval * 60 * 1000);
  }
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
      if (all.settings) delete all.settings.syncFolder;
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

  if (parsed.pathname === '/api/select-folder') {
    if (req.method === 'GET') {
      dialog({ type: 'directory' })
        .then(paths => {
          const folder = Array.isArray(paths) ? paths[0] : ''
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ folder }))
        })
        .catch(() => {
          res.writeHead(500)
          res.end(JSON.stringify({ folder: '' }))
        })
      return
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
          if (settings.syncFolder !== undefined) {
            setSyncFolder(settings.syncFolder);
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
server.listen(port, () => {
  console.log('Server listening on port', port);
});
