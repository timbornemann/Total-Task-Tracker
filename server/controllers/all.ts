import { Router } from "express";
import type {
  Task,
  Category,
  Note,
  Flashcard,
  Deck,
  Habit,
  PomodoroSession,
  Timer,
  Trip,
  WorkDay,
  Commute,
  InventoryItem,
  ItemCategory,
  ItemTag,
  Deletion,
} from "../../src/types/index.js";
import { loadAllData, saveAllData } from "../services/dataService.js";

interface AllData {
  tasks: Task[];
  categories: Category[];
  notes: Note[];
  recurring: Task[];
  habits: Habit[];
  flashcards: Flashcard[];
  decks: Deck[];
  pomodoroSessions: PomodoroSession[];
  timers: Timer[];
  trips: Trip[];
  workDays: WorkDay[];
  commutes: Commute[];
  items: InventoryItem[];
  itemCategories: ItemCategory[];
  itemTags: ItemTag[];
  settings?: Record<string, unknown>;
  deletions: Deletion[];
}

const router = Router();

router.get("/", (req, res) => {
  const all = loadAllData();
  if (all.settings) {
    delete all.settings.syncServerUrl;
    delete all.settings.syncRole;
    delete all.settings.llmToken;
  }
  res.json(all);
});

router.put("/", (req, res) => {
  try {
    // Reduced logging for timer updates
    if (!req.body?.timers || req.body.timers.length === 0) {
      console.log(
        "PUT /api/all - Received data with keys:",
        Object.keys(req.body || {}),
      );
    }
    saveAllData(req.body || ({} as AllData));
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error in PUT /api/all:", error);
    console.error("Request body keys:", Object.keys(req.body || {}));
    if (req.body?.timers) {
      console.error("Sample timer data:", req.body.timers.slice(0, 2));
    }
    res.status(400).json({
      error: "Save failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
