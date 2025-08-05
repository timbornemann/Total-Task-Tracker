import { Router } from "express";
import type { Flashcard } from "../../src/types/index.js";

export default function createFlashcardsRouter({
  loadFlashcards,
  saveFlashcards,
  notifyClients,
}: {
  loadFlashcards: () => Flashcard[];
  saveFlashcards: (cards: Flashcard[]) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadFlashcards());
  });

  router.put("/", (req, res) => {
    try {
      saveFlashcards(req.body || ([] as Flashcard[]));
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
