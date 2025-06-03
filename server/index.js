import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const DIST_DIR = path.join(__dirname, '..', 'dist');

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { tasks: [], categories: [] };
  }
}

function saveData(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
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
