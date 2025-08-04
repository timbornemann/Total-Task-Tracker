import { Router } from "express";

export default function createTripsRouter({ loadTrips, saveTrips, notifyClients }) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadTrips());
  });

  router.put("/", (req, res) => {
    try {
      saveTrips(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
