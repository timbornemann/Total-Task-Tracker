import updates from "./updates.js";
import data from "./data.js";
import flashcards from "./flashcards.js";
import decks from "./decks.js";
import recurring from "./recurring.js";
import habits from "./habits.js";
import notes from "./notes.js";
import inventory from "./inventory.js";
import all from "./all.js";
import settings from "./settings.js";
import pomodoro from "./pomodoro.js";
import timers from "./timers.js";
import trips from "./trips.js";
import workdays from "./workdays.js";
import commutes from "./commutes.js";
import sync from "./sync.js";
import syncLog from "./syncLog.js";
import serverInfo from "./serverInfo.js";
import syncStatus from "./syncStatus.js";
import llm from "./llm.js";
import health from "./health.js";
import frontend from "./frontend.js";

export default {
  "/api/updates": updates,
  "/api/data": data,
  "/api/flashcards": flashcards,
  "/api/decks": decks,
  "/api/recurring": recurring,
  "/api/habits": habits,
  "/api/notes": notes,
  "/api/inventory": inventory,
  "/api/all": all,
  "/api/settings": settings,
  "/api/pomodoro-sessions": pomodoro,
  "/api/timers": timers,
  "/api/trips": trips,
  "/api/workdays": workdays,
  "/api/commutes": commutes,
  "/api/sync": sync,
  "/api/sync-log": syncLog,
  "/api/serverInfo": serverInfo,
  "/api/sync-status": syncStatus,
  "/api/llm": llm,
  "": health,
  frontend,
};
