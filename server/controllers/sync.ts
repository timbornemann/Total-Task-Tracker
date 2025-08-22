import { Router } from "express";
import {
  loadAllData,
  saveAllData,
  dateReviver,
} from "../services/dataService.js";
import { syncLogs, getSyncRole } from "../services/syncService.js";

const router = Router();

router.get("/", (req, res) => {
  if (getSyncRole() !== "server") {
    res.sendStatus(403);
    return;
  }
  const data = loadAllData();
  if (data.settings) {
    delete data.settings.syncServerUrl;
    delete data.settings.syncRole;
    delete data.settings.syncEnabled;
    delete data.settings.llmToken;
  }
  syncLogs.push({
    time: Date.now(),
    ip: req.socket.remoteAddress,
    method: "GET",
  });
  res.json(data);
});

router.post("/", (req, res) => {
  if (getSyncRole() !== "server") {
    res.sendStatus(403);
    return;
  }
  try {
    const incoming = JSON.parse(JSON.stringify(req.body || {}), dateReviver);
    if (incoming.settings) {
      delete incoming.settings.syncServerUrl;
      delete incoming.settings.syncRole;
      delete incoming.settings.syncEnabled;
      delete incoming.settings.llmToken;
    }
    saveAllData(incoming);
    syncLogs.push({
      time: Date.now(),
      ip: req.socket.remoteAddress,
      method: "POST",
    });
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
