import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import updatesController from "./controllers/updates.js";
import dataController from "./controllers/data.js";
import flashcardsController from "./controllers/flashcards.js";
import decksController from "./controllers/decks.js";
import recurringController from "./controllers/recurring.js";
import habitsController from "./controllers/habits.js";
import notesController from "./controllers/notes.js";
import inventoryController from "./controllers/inventory.js";
import allController from "./controllers/all.js";
import settingsController from "./controllers/settings.js";
import pomodoroController from "./controllers/pomodoro.js";
import timersController from "./controllers/timers.js";
import tripsController from "./controllers/trips.js";
import workdaysController from "./controllers/workdays.js";
import commutesController from "./controllers/commutes.js";
import syncController from "./controllers/sync.js";
import syncLogController from "./controllers/syncLog.js";
import serverInfoController from "./controllers/serverInfo.js";
import syncStatusController from "./controllers/syncStatus.js";
import llmController from "./controllers/llm.js";
import frontendController from "./controllers/frontend.js";
import healthController from "./controllers/health.js";
import { setupSwagger } from "./lib/swagger.js";
import {
	generalLimiter,
	corsOptions,
	helmetOptions,
	securityHeaders,
	REQUEST_LIMITS,
	inputSanitization,
} from "./middleware/security.js";
import { requestLoggingMiddleware } from "./lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// When running compiled JS, __dirname is .../dist/server. The frontend build lives in .../dist
// So we point one level up to the dist root (not dist/dist)
const DIST_DIR = path.join(__dirname, "..");

export const app = express();
// Parsing with explicit limits
app.use(express.json({ limit: REQUEST_LIMITS.json }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_LIMITS.urlencoded }));

// Security & logging middleware
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(generalLimiter);
app.use(securityHeaders);
app.use(inputSanitization);
app.use(requestLoggingMiddleware);

// API documentation
setupSwagger(app);

app.use("/api/updates", updatesController);
app.use("/api/data", dataController);
app.use("/api/flashcards", flashcardsController);
app.use("/api/decks", decksController);
app.use("/api/recurring", recurringController);
app.use("/api/habits", habitsController);
app.use("/api/notes", notesController);
app.use("/api/inventory", inventoryController);
app.use("/api/all", allController);
app.use("/api/settings", settingsController);
app.use("/api/pomodoro-sessions", pomodoroController);
app.use("/api/timers", timersController);
app.use("/api/trips", tripsController);
app.use("/api/workdays", workdaysController);
app.use("/api/commutes", commutesController);
app.use("/api/sync", syncController);
app.use("/api/sync-log", syncLogController);
app.use("/api/serverInfo", serverInfoController);
app.use("/api/sync-status", syncStatusController);
app.use("/api/llm", llmController);

// Health and monitoring endpoints
app.use("/api", healthController);

app.use(express.static(DIST_DIR));
app.use(frontendController);
