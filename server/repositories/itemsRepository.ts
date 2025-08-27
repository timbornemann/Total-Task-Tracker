import type { InventoryItem } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadItems(): InventoryItem[] {
  try {
    const items = db.prepare("SELECT * FROM inventory_items").all();
    const tagRows = db
      .prepare("SELECT itemId, tagId FROM inventory_item_tags")
      .all();
    const tagsByItem: Record<string, string[]> = {};
    for (const t of tagRows) {
      if (!tagsByItem[t.itemId]) tagsByItem[t.itemId] = [];
      tagsByItem[t.itemId].push(t.tagId);
    }
    return items.map((i) => ({
      id: i.id,
      name: i.name || "",
      description: i.description || "",
      quantity: i.quantity ?? 0,
      categoryId: i.categoryId || undefined,
      tagIds: tagsByItem[i.id] || [],
      buyAgain: !!i.buyAgain,
      createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
      updatedAt: i.updatedAt ? new Date(i.updatedAt) : new Date(),
    }));
  } catch {
    return [];
  }
}


export function saveItems(list: InventoryItem[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM inventory_items");
    db.exec("DELETE FROM inventory_item_tags");
    const insertItem = db.prepare(
      `INSERT INTO inventory_items (id, name, description, quantity, categoryId, buyAgain, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertTag = db.prepare(
      `INSERT OR IGNORE INTO inventory_item_tags (itemId, tagId) VALUES (?, ?)`,
    );
    for (const i of list || []) {
      insertItem.run(
        i.id,
        i.name,
        i.description,
        i.quantity,
        i.categoryId ?? null,
        i.buyAgain ? 1 : 0,
        i.createdAt ? new Date(i.createdAt).toISOString() : null,
        i.updatedAt ? new Date(i.updatedAt).toISOString() : null,
      );
      for (const tagId of i.tagIds || []) insertTag.run(i.id, tagId);
    }
  });
  tx();
}

