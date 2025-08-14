import { Router } from "express";
import type { Trip } from "../../src/types/index.js";
import { loadTrips, saveTrips } from "../services/dataService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(loadTrips());
});

router.put("/", (req, res) => {
  try {
    saveTrips(req.body || ([] as Trip[]));
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
