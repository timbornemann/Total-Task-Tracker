import { Router } from "express";
import { syncLogs, getSyncRole } from "../services/syncService.js";

const router = Router();

router.get("/", (req, res) => {
  if (getSyncRole() !== "server") {
    res.sendStatus(403);
    return;
  }
  res.json(syncLogs);
});

export default router;
