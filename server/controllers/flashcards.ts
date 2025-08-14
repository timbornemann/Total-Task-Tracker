import { Router } from "express";
import type { Flashcard } from "../../src/types/index.js";
import { loadFlashcards, saveFlashcards } from "../services/dataService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(loadFlashcards());
});

router.put("/", (req, res) => {
  try {
    saveFlashcards(req.body || ([] as Flashcard[]));
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
