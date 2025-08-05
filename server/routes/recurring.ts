import { Router } from "express";
import type { Task } from "../../src/types/index.js";

export default function createRecurringRouter({
  loadRecurring,
  saveRecurring,
  notifyClients,
}: {
  loadRecurring: () => Task[];
  saveRecurring: (list: Task[]) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadRecurring());
  });

  router.put("/", (req, res) => {
    try {
      saveRecurring(req.body || ([] as Task[]));
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
