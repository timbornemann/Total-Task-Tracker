import type { Commute } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadCommutes(): Commute[] {
  try {
    const rows = db.prepare("SELECT * FROM commutes").all();
    return rows.map((r) => ({
      id: r.id,
      name: r.name || "",
      kilometers: typeof r.kilometers === "number" ? r.kilometers : 0,
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
    }));
  } catch {
    return [];
  }
}


export function saveCommutes(list: Commute[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM commutes");
    const insert = db.prepare(
      `INSERT INTO commutes (id, name, kilometers, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
    );
    for (const c of list || []) {
      insert.run(
        c.id,
        c.name,
        c.kilometers,
        c.createdAt ? new Date(c.createdAt).toISOString() : null,
        c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
      );
    }
  });
  tx();
}

