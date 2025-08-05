import { Router } from "express";
import type { PomodoroSession } from "../../src/types/index.js";

export default function createPomodoroRouter({
  loadPomodoroSessions,
  savePomodoroSessions,
  notifyClients,
}: {
  loadPomodoroSessions: () => PomodoroSession[];
  savePomodoroSessions: (sessions: PomodoroSession[]) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadPomodoroSessions());
  });

  router.put("/", (req, res) => {
    try {
      savePomodoroSessions(req.body || ([] as PomodoroSession[]));
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
