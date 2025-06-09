import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'url';
import Database from 'better-sqlite3';

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

function dateReviver(key, value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return value;
}

function loadData() {
  try {
    const tasks = db.prepare('SELECT data FROM tasks').all()
      .map(row => JSON.parse(row.data, dateReviver));
    const categories = db.prepare('SELECT data FROM categories').all()
      .map(row => JSON.parse(row.data, dateReviver));
    const notes = db.prepare('SELECT data FROM notes').all()
      .map(row => JSON.parse(row.data, dateReviver));
    return { tasks, categories, notes };
  } catch {
    return { tasks: [], categories: [], notes: [] };
  }
}

function saveData(data) {
  const toJson = (obj) => JSON.stringify(
    obj,
    (key, value) => (value instanceof Date ? value.toISOString() : value)
  );
  const tx = db.transaction(() => {
    db.exec('DELETE FROM tasks');
    for (const task of data.tasks || []) {
      db.prepare('INSERT INTO tasks (id, data) VALUES (?, ?)')
        .run(task.id, toJson(task));
    }
    db.exec('DELETE FROM categories');
    for (const cat of data.categories || []) {
      db.prepare('INSERT INTO categories (id, data) VALUES (?, ?)')
        .run(cat.id, toJson(cat));
    }
    db.exec('DELETE FROM notes');
    for (const note of data.notes || []) {
      db.prepare('INSERT INTO notes (id, data) VALUES (?, ?)')
        .run(note.id, toJson(note));
    }
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
  const toJson = (obj) => JSON.stringify(
    obj,
    (key, value) => (value instanceof Date ? value.toISOString() : value)
  );
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
  const toJson = (obj) => JSON.stringify(
    obj,
    (key, value) => (value instanceof Date ? value.toISOString() : value)
  );
  const tx = db.transaction(() => {
    db.exec('DELETE FROM decks');
    for (const deck of decks || []) {
      db.prepare('INSERT INTO decks (id, data) VALUES (?, ?)')
        .run(deck.id, toJson(deck));
    }
  });
  tx();
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
