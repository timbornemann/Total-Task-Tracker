import { Router, type Request, type Response } from "express";

export default function createDataRouter({
  loadData,
  saveData,
  notifyClients,
}: {
  loadData: () => any;
  saveData: (data: any) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    res.json(loadData());
  });

  router.put("/", (req: Request, res: Response) => {
    try {
      saveData(req.body || {});
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
