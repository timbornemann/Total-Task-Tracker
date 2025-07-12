import { Router } from "express";

export default function createAllRouter({ loadAllData, saveAllData }) {
  const router = Router();

  router.get("/", (req, res) => {
    const all = loadAllData();
    if (all.settings) {
      delete all.settings.syncServerUrl;
      delete all.settings.syncRole;
      delete all.settings.llmToken;
    }
    res.json(all);
  });

  router.put("/", (req, res) => {
    try {
      saveAllData(req.body || {});
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
