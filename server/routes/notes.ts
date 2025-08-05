import { Router } from "express";
import type { Note } from "../../src/types/index.js";

export default function createNotesRouter({
  loadNotes,
  saveNotes,
  notifyClients,
}: {
  loadNotes: () => Note[];
  saveNotes: (notes: Note[]) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadNotes());
  });

  router.put("/", (req, res) => {
    try {
      saveNotes(req.body || ([] as Note[]));
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
