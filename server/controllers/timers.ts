import { Router } from "express";
import type { Timer } from "../../src/types/index.js";
import { loadTimers, saveTimers } from "../services/dataService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(loadTimers());
});

router.put("/", (req, res) => {
  try {
    saveTimers(req.body || ([] as Timer[]));
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
