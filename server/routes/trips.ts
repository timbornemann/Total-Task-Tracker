import { Router } from "express";
import type { Trip } from "../../src/types/index.js";

export default function createTripsRouter({
  loadTrips,
  saveTrips,
  notifyClients,
}: {
  loadTrips: () => Trip[];
  saveTrips: (trips: Trip[]) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(loadTrips());
  });

  router.put("/", (req, res) => {
    try {
      saveTrips(req.body || ([] as Trip[]));
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
