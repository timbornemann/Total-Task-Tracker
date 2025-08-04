import { Router } from "express";

export default function createTimersRouter({ loadTimers, saveTimers, notifyClients }) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadTimers());
  });

  router.put("/", (req, res) => {
    try {
      saveTimers(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
