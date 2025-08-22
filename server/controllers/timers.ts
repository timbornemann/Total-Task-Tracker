import { Router } from "express";
import type { Timer } from "../../src/types/index.js";
import { loadTimers, saveTimers } from "../services/dataService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(loadTimers());
});

router.put("/", (req, res) => {
  try {
    // Only log if there's an issue or significant change
    const timerCount = req.body?.length || 0;
    if (timerCount === 0 || timerCount > 5) {
      console.log("PUT /api/timers - Received timers:", timerCount);
    }
    saveTimers(req.body || ([] as Timer[]));
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error in PUT /api/timers:", error);
    console.error("Request body sample:", req.body?.slice(0, 2));
    res.status(400).json({
      error: "Save timers failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
