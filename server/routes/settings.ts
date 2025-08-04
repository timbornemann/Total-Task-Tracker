import { Router, type Request, type Response } from "express";

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
}: {
  loadSettings: () => any;
  saveSettings: (s: any) => void;
  setSyncRole: (role: string) => void;
  setSyncServerUrl: (url: string) => void;
  setSyncInterval: (min: number) => void;
  setSyncEnabled: (val: boolean) => void;
  setLlmUrl: (url: string) => void;
  setLlmToken: (token: string) => void;
  setLlmModel: (model: string) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
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
