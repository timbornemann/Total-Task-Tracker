import { Router } from "express";
import type {
  Task,
  Category,
  Note,
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

interface Data {
  tasks: Task[];
  categories: Category[];
  notes: Note[];
  recurring: Task[];
  habits: Habit[];
  pomodoroSessions: PomodoroSession[];
  timers: Timer[];
  trips: Trip[];
  workDays: WorkDay[];
  items: InventoryItem[];
  itemCategories: ItemCategory[];
  itemTags: ItemTag[];
  deletions: Deletion[];
}

export default function createDataRouter({
  loadData,
  saveData,
  notifyClients,
}: {
  loadData: () => Data;
  saveData: (data: Data) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadData());
  });

  router.put("/", (req, res) => {
    try {
      saveData(req.body || ({} as Data));
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
