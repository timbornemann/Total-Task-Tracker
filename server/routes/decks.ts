import { Router } from "express";
import type { Deck } from "../../src/types/index.js";

export default function createDecksRouter({
  loadDecks,
  saveDecks,
  notifyClients,
}: {
  loadDecks: () => Deck[];
  saveDecks: (decks: Deck[]) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadDecks());
  });

  router.put("/", (req, res) => {
    try {
      saveDecks(req.body || ([] as Deck[]));
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
