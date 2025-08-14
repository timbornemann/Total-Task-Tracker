import { Router } from "express";
import type { InventoryItem, ItemCategory, ItemTag } from "../../src/types/index.js";
import {
  loadItems,
  saveItems,
  loadItemCategories,
  saveItemCategories,
  loadItemTags,
  saveItemTags,
} from "../services/dataService.js";

const router = Router();

router.get("/items", (req, res) => {
  res.json(loadItems());
});

router.put("/items", (req, res) => {
  try {
    saveItems(req.body || ([] as InventoryItem[]));
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
    res.json({ status: "ok" });
  } catch {
    res.sendStatus(400);
  }
});

export default router;
