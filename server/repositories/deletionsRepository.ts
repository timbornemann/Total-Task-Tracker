import type { Deletion } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadDeletions(): Deletion[] {
  try {
    return db
      .prepare("SELECT type, id, deletedAt FROM deletions")
      .all()
      .map((row) => ({
        type: row.type,
        id: row.id,
        deletedAt: new Date(row.deletedAt),
      }));
  } catch {
    return [];
  }
}

export function saveDeletions(list: Deletion[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM deletions");
    for (const d of list || []) {
      db.prepare(
        "INSERT INTO deletions (type, id, deletedAt) VALUES (?, ?, ?)",
      ).run(d.type, d.id, new Date(d.deletedAt).toISOString());
    }
  });
  tx();
}
