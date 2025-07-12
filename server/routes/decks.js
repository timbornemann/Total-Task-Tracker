import { Router } from "express";

export default function createDecksRouter({ loadDecks, saveDecks, notifyClients }) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadDecks());
  });

  router.put("/", (req, res) => {
    try {
      saveDecks(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
