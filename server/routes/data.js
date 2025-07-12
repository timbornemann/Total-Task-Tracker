import { Router } from "express";

export default function createDataRouter({ loadData, saveData, notifyClients }) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadData());
  });

  router.put("/", (req, res) => {
    try {
      saveData(req.body || {});
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
