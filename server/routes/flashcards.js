import { Router } from "express";

export default function createFlashcardsRouter({ loadFlashcards, saveFlashcards, notifyClients }) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadFlashcards());
  });

  router.put("/", (req, res) => {
    try {
      saveFlashcards(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
