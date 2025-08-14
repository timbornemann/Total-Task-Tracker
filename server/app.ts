import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  initSync,
  startSyncTimer,
  setSyncRole,
  setSyncServerUrl,
  setSyncInterval,
  setSyncEnabled,
  setLlmUrl,
  setLlmToken,
  setLlmModel,
  getSyncRole,
} from "./services/syncService.js";
import {
  loadAllData,
  saveAllData,
  loadSettings,
  saveWorkDays,
  loadWorkDays,
} from "./services/dataService.js";
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
import syncController from "./controllers/sync.js";
import syncLogController from "./controllers/syncLog.js";
import serverInfoController from "./controllers/serverInfo.js";
import syncStatusController from "./controllers/syncStatus.js";
import llmController from "./controllers/llm.js";
import frontendController from "./controllers/frontend.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, "..", "dist");

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

initSync({ loadAllData, saveAllData });
const initialSettings = loadSettings();
if (typeof initialSettings.syncInterval === "number") {
  setSyncInterval(initialSettings.syncInterval);
}
if (initialSettings.syncRole) {
  setSyncRole(initialSettings.syncRole);
}
if (initialSettings.syncServerUrl) {
  setSyncServerUrl(initialSettings.syncServerUrl);
}
if (typeof initialSettings.syncEnabled === "boolean") {
  setSyncEnabled(initialSettings.syncEnabled);
}
if (initialSettings.llmUrl) {
  setLlmUrl(initialSettings.llmUrl);
}
if (initialSettings.llmToken) {
  setLlmToken(initialSettings.llmToken);
}
if (initialSettings.llmModel) {
  setLlmModel(initialSettings.llmModel);
}
log("Initial sync settings", {
  role: getSyncRole(),
  url: initialSettings.syncServerUrl || "",
  interval: initialSettings.syncInterval || 0,
  enabled: initialSettings.syncEnabled !== false,
  llmConfigured: !!initialSettings.llmUrl,
});
startSyncTimer();
try {
  saveWorkDays(loadWorkDays());
} catch (err) {
  log("Failed to normalize workdays", err);
}

export const app = express();
app.use(express.json());

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
app.use("/api/sync", syncController);
app.use("/api/sync-log", syncLogController);
app.use("/api/server-info", serverInfoController);
app.use("/api/sync-status", syncStatusController);
app.use("/api/llm", llmController);

app.use(express.static(DIST_DIR));
app.use(frontendController);
