import { Router } from "express";

export default function createInventoryRouter({ loadItems, saveItems, loadItemCategories, saveItemCategories, loadItemTags, saveItemTags, notifyClients }) {
  const router = Router();

  router.get("/items", (req, res) => {
    res.json(loadItems());
  });

  router.put("/items", (req, res) => {
    try {
      saveItems(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  router.get("/item-categories", (req, res) => {
    res.json(loadItemCategories());
  });
  router.put("/item-categories", (req, res) => {
    try {
      saveItemCategories(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  router.get("/item-tags", (req, res) => {
    res.json(loadItemTags());
  });
  router.put("/item-tags", (req, res) => {
    try {
      saveItemTags(req.body || []);
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
