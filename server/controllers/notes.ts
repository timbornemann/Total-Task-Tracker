import { Router } from "express";
import type { Note } from "../../src/types/index.js";
import { loadNotes, saveNotes } from "../services/dataService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(loadNotes());
});

router.put("/", (req, res) => {
  try {
    saveNotes(req.body || ([] as Note[]));
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
