import { Router } from "express";

export default function createSettingsRouter({
  loadSettings,
  saveSettings,
  setSyncRole,
  setSyncServerUrl,
  setSyncInterval,
  setSyncEnabled,
  setLlmUrl,
  setLlmToken,
  setLlmModel,
  notifyClients,
}) {
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
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
