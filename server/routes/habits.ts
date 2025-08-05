import { Router } from "express";
import type { Habit } from "../../src/types/index.js";

export default function createHabitsRouter({
  loadHabits,
  saveHabits,
  notifyClients,
}: {
  loadHabits: () => Habit[];
  saveHabits: (list: Habit[]) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadHabits());
  });

  router.put("/", (req, res) => {
    try {
      saveHabits(req.body || ([] as Habit[]));
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
