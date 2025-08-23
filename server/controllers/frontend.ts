import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// In compiled output, this file lives under dist/server/controllers
// The frontend build root is dist (two levels up from dist/server)
const DIST_DIR = path.join(__dirname, "..", "..");

// Only serve index.html for routes that don't match static files
router.get("*", (req, res) => {
  // Skip API routes, docs, and static files like .js, .css, .webmanifest, etc.
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/docs') ||
      req.path.includes('.')) {
    return res.status(404).send('Not Found');
  }
  
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

export default router;
