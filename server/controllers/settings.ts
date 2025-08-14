import { Router } from "express";
import { loadSettings, saveSettings } from "../services/dataService.js";
import {
  setSyncRole,
  setSyncServerUrl,
  setSyncInterval,
  setSyncEnabled,
  setLlmUrl,
  setLlmToken,
  setLlmModel,
} from "../services/syncService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(loadSettings());
});

router.put("/", (req, res) => {
  try {
    const settings = req.body || {};
    saveSettings(settings);
    if (settings.syncRole !== undefined) setSyncRole(settings.syncRole);
    if (settings.syncServerUrl !== undefined) setSyncServerUrl(settings.syncServerUrl);
    if (settings.syncInterval !== undefined) setSyncInterval(settings.syncInterval);
    if (settings.syncEnabled !== undefined) setSyncEnabled(settings.syncEnabled);
    if (settings.llmUrl !== undefined) setLlmUrl(settings.llmUrl);
    if (settings.llmToken !== undefined) setLlmToken(settings.llmToken);
    if (settings.llmModel !== undefined) setLlmModel(settings.llmModel);
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
