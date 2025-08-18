import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// In compiled output, this file lives under dist/server/controllers
// The frontend build root is dist (two levels up from dist/server)
const DIST_DIR = path.join(__dirname, "..", "..");

router.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

export default router;
