import allController from "./all.js";
import commutesController from "./commutes.js";
import dataController from "./data.js";
import decksController from "./decks.js";
import flashcardsController from "./flashcards.js";
import frontendController from "./frontend.js";
import habitsController from "./habits.js";
import healthController from "./health.js";
import inventoryController from "./inventory.js";
import llmController from "./llm.js";
import notesController from "./notes.js";
import pomodoroController from "./pomodoro.js";
import recurringController from "./recurring.js";
import serverInfoController from "./serverInfo.js";
import settingsController from "./settings.js";
import syncController from "./sync.js";
import syncLogController from "./syncLog.js";
import syncStatusController from "./syncStatus.js";
import timersController from "./timers.js";
import tripsController from "./trips.js";
import updatesController from "./updates.js";
import workdaysController from "./workdays.js";

export const routers = {
  "/api/updates": updatesController,
  "/api/data": dataController,
  "/api/flashcards": flashcardsController,
  "/api/decks": decksController,
  "/api/recurring": recurringController,
  "/api/habits": habitsController,
  "/api/notes": notesController,
  "/api/inventory": inventoryController,
  "/api/all": allController,
  "/api/settings": settingsController,
  "/api/pomodoro-sessions": pomodoroController,
  "/api/timers": timersController,
  "/api/trips": tripsController,
  "/api/workdays": workdaysController,
  "/api/commutes": commutesController,
  "/api/sync": syncController,
  "/api/sync-log": syncLogController,
  "/api/serverInfo": serverInfoController,
  "/api/sync-status": syncStatusController,
  "/api/llm": llmController,
  "/": healthController,
};

export { frontendController };
export default routers;
