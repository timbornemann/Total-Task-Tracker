import { Router } from "express";
import type { Task } from "../../src/types/index.js";
import { loadRecurring, saveRecurring } from "../services/dataService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(loadRecurring());
});

router.put("/", (req, res) => {
  try {
    saveRecurring(req.body || ([] as Task[]));
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
