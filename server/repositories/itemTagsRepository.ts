import type { ItemTag } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadItemTags(): ItemTag[] {
  try {
    const rows = db.prepare("SELECT * FROM inventory_tags").all();
    return rows.map((r) => ({ id: r.id, name: r.name || "" }));
  } catch {
    return [];
  }
}

export function saveItemTags(list: ItemTag[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM inventory_tags");
    const insert = db.prepare(
      `INSERT INTO inventory_tags (id, name) VALUES (?, ?)`,
    );
    for (const t of list || []) insert.run(t.id, t.name);
  });
  tx();
}
