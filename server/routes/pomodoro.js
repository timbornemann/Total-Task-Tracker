import { Router } from "express";

export default function createPomodoroRouter({ loadPomodoroSessions, savePomodoroSessions, notifyClients }) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadPomodoroSessions());
  });

  router.put("/", (req, res) => {
    try {
      savePomodoroSessions(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
