import { Router } from "express";
import type { WorkDay } from "../../src/types/index.js";

export default function createWorkdaysRouter({
  loadWorkDays,
  saveWorkDays,
  notifyClients,
}: {
  loadWorkDays: () => WorkDay[];
  saveWorkDays: (days: WorkDay[]) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadWorkDays());
  });

  router.put("/", (req, res) => {
    try {
      saveWorkDays(req.body || ([] as WorkDay[]));
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
