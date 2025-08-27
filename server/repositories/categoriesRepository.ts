import type { Category } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadCategories(): Category[] {
  try {
    const rows = db.prepare("SELECT * FROM categories").all();
    return rows.map((r) => ({
      id: r.id,
      name: r.name || "",
      description: r.description || "",
      color: typeof r.color === "number" ? r.color : 0,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
      order: r.orderIndex ?? 0,
      pinned: !!r.pinned,
    }));
  } catch {
    return [];
  }
}


export function saveCategories(categories: Category[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM categories");
    const insert = db.prepare(
      `INSERT INTO categories (id, name, description, color, createdAt, updatedAt, orderIndex, pinned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const c of categories || []) {
      insert.run(
        c.id,
        c.name,
        c.description,
        c.color,
        c.createdAt ? new Date(c.createdAt).toISOString() : null,
        c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
        typeof c.order === "number" ? c.order : 0,
        c.pinned ? 1 : 0,
      );
    }
  });
  tx();
}

