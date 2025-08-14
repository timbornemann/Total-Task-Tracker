import { Router } from "express";
import { registerClient } from "../lib/sse.js";

const router = Router();

router.get("/", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write("\n");
  registerClient(req, res);
});

export default router;
