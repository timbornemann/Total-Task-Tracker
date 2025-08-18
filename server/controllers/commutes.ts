import { Router } from "express";
import type { Commute } from "../../src/types/index.js";
import { loadCommutes, saveCommutes } from "../services/dataService.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(loadCommutes());
});

router.put("/", (req, res) => {
  try {
    saveCommutes(req.body || ([] as Commute[]));
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
