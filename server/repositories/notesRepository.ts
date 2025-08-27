import type { Note } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadNotes(): Note[] {
  try {
    const rows = db.prepare("SELECT * FROM notes").all();
    return rows.map((r) => ({
      id: r.id,
      title: r.title || "",
      text: r.text || "",
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


export function saveNotes(notes: Note[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM notes");
    const insert = db.prepare(
      `INSERT INTO notes (id, title, text, color, createdAt, updatedAt, orderIndex, pinned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const n of notes || []) {
      insert.run(
        n.id,
        n.title,
        n.text,
        n.color,
        n.createdAt ? new Date(n.createdAt).toISOString() : null,
        n.updatedAt ? new Date(n.updatedAt).toISOString() : null,
        typeof n.order === "number" ? n.order : 0,
        n.pinned ? 1 : 0,
      );
    }
  });
  tx();
}

