import type { ItemCategory } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadItemCategories(): ItemCategory[] {
  try {
    const rows = db.prepare("SELECT * FROM inventory_categories").all();
    return rows.map((r) => ({ id: r.id, name: r.name || "" }));
  } catch {
    return [];
  }
}

export function saveItemCategories(list: ItemCategory[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM inventory_categories");
    const insert = db.prepare(
      `INSERT INTO inventory_categories (id, name) VALUES (?, ?)`,
    );
    for (const c of list || []) insert.run(c.id, c.name);
  });
  tx();
}
