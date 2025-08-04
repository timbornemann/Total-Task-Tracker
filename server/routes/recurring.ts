import { Router } from "express";

export default function createRecurringRouter({ loadRecurring, saveRecurring, notifyClients }) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadRecurring());
  });

  router.put("/", (req, res) => {
    try {
      saveRecurring(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
