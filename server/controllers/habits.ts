import { Router } from "express";
import type { Habit } from "../../src/types/index.js";
import { loadHabits, saveHabits } from "../services/dataService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(loadHabits());
});

router.put("/", (req, res) => {
  try {
    saveHabits(req.body || ([] as Habit[]));
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
