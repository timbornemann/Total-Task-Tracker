import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, "..", "..", "dist");

router.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

export default router;
