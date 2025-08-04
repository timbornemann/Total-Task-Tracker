import { Router } from "express";

export default function createSyncStatusRouter({ getStatus }) {
  const router = Router();
  router.get("/", (req, res) => {
    res.json(getStatus());
  });
  return router;
}
