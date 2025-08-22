import { Router } from "express";
import type { PomodoroSession } from "../../src/types/index.js";
import {
  loadPomodoroSessions,
  savePomodoroSessions,
} from "../services/dataService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(loadPomodoroSessions());
});

router.put("/", (req, res) => {
  try {
    savePomodoroSessions(req.body || ([] as PomodoroSession[]));
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
