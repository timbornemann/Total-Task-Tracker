import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import controllers from "./controllers/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, "..", "dist");

export const app = express();
app.use(express.json());

const { frontend, ...routers } = controllers;

for (const [route, router] of Object.entries(routers)) {
  app.use(route, router);
}

// Serve static files first (with correct MIME types)
app.use(
  express.static(DIST_DIR, {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (path.endsWith(".webmanifest")) {
        res.setHeader("Content-Type", "application/manifest+json");
      }
    },
  }),
);

// Frontend controller as fallback (only for routes without file extensions)
app.use(frontend);
