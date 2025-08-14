import { Router } from "express";
import type { Deck } from "../../src/types/index.js";
import { loadDecks, saveDecks } from "../services/dataService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(loadDecks());
});

router.put("/", (req, res) => {
  try {
    saveDecks(req.body || ([] as Deck[]));
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
