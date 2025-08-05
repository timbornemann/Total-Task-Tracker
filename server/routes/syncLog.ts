import { Router } from "express";

export default function createSyncLogRouter({ syncLogs, syncRole }) {
  const router = Router();

  router.get("/", (req, res) => {
    if (syncRole() !== "server") {
      res.sendStatus(403);
      return;
    }
    res.json(syncLogs);
  });

  return router;
}
