import type { Trip } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadTrips(): Trip[] {
  try {
    const rows = db.prepare("SELECT * FROM trips").all();
    return rows.map((r) => ({
      id: r.id,
      name: r.name || "",
      location: r.location || undefined,
      color: typeof r.color === "number" ? r.color : undefined,
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
    }));
  } catch {
    return [];
  }
}

export function saveTrips(list: Trip[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM trips");
    const insert = db.prepare(
      `INSERT INTO trips (id, name, location, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
    );
    for (const t of list || []) {
      insert.run(
        t.id,
        t.name,
        t.location ?? null,
        t.color ?? null,
        t.createdAt ? new Date(t.createdAt).toISOString() : null,
        t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
      );
    }
  });
  tx();
}
