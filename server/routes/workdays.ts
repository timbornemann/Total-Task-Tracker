import { Router } from "express";

export default function createWorkdaysRouter({ loadWorkDays, saveWorkDays, notifyClients }) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadWorkDays());
  });

  router.put("/", (req, res) => {
    try {
      saveWorkDays(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
