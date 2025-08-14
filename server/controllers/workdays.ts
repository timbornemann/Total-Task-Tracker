import { Router } from "express";
import type { WorkDay } from "../../src/types/index.js";
import { loadWorkDays, saveWorkDays } from "../services/dataService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(loadWorkDays());
});

router.put("/", (req, res) => {
  try {
    saveWorkDays(req.body || ([] as WorkDay[]));
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
