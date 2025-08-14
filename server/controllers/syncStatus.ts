import { Router } from "express";
import { getSyncStatus } from "../services/syncService.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(getSyncStatus());
});

export default router;
