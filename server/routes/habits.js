import { Router } from "express";

export default function createHabitsRouter({ loadHabits, saveHabits, notifyClients }) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadHabits());
  });

  router.put("/", (req, res) => {
    try {
      saveHabits(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
