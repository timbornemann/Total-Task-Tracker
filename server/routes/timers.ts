import { Router } from "express";
import type { Timer } from "../../src/types/index.js";

export default function createTimersRouter({
  loadTimers,
  saveTimers,
  notifyClients,
}: {
  loadTimers: () => Timer[];
  saveTimers: (timers: Timer[]) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadTimers());
  });

  router.put("/", (req, res) => {
    try {
      saveTimers(req.body || ([] as Timer[]));
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
