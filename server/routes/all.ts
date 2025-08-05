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
  InventoryItem,
  ItemCategory,
  ItemTag,
  Deletion,
} from "../../src/types/index.js";

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
  items: InventoryItem[];
  itemCategories: ItemCategory[];
  itemTags: ItemTag[];
  settings?: Record<string, any>;
  deletions: Deletion[];
}

export default function createAllRouter({
  loadAllData,
  saveAllData,
}: {
  loadAllData: () => AllData;
  saveAllData: (data: AllData) => void;
}) {
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
      saveAllData(req.body || ({} as AllData));
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
