import { Router, type Request, type Response } from "express";

export default function createFlashcardsRouter({
  loadFlashcards,
  saveFlashcards,
  notifyClients,
}: {
  loadFlashcards: () => any;
  saveFlashcards: (data: any[]) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    res.json(loadFlashcards());
  });

  router.put("/", (req: Request, res: Response) => {
    try {
      saveFlashcards(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
