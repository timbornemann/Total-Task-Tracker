import { Router } from "express";
import type { InventoryItem, ItemCategory, ItemTag } from "../../src/types/index.js";

export default function createInventoryRouter({
  loadItems,
  saveItems,
  loadItemCategories,
  saveItemCategories,
  loadItemTags,
  saveItemTags,
  notifyClients,
}: {
  loadItems: () => InventoryItem[];
  saveItems: (items: InventoryItem[]) => void;
  loadItemCategories: () => ItemCategory[];
  saveItemCategories: (cats: ItemCategory[]) => void;
  loadItemTags: () => ItemTag[];
  saveItemTags: (tags: ItemTag[]) => void;
  notifyClients: () => void;
}) {
  const router = Router();

  router.get("/items", (req, res) => {
    res.json(loadItems());
  });

  router.put("/items", (req, res) => {
    try {
      saveItems(req.body || ([] as InventoryItem[]));
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
      saveItemCategories(req.body || ([] as ItemCategory[]));
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
      saveItemTags(req.body || ([] as ItemTag[]));
      notifyClients();
      res.json({ status: "ok" });
    } catch {
      res.sendStatus(400);
    }
  });

  return router;
}
