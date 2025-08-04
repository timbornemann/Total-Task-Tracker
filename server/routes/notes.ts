import { Router } from "express";

export default function createNotesRouter({ loadNotes, saveNotes, notifyClients }) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadNotes());
  });

  router.put("/", (req, res) => {
    try {
      saveNotes(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
