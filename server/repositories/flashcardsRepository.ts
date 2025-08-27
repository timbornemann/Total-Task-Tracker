import type { Flashcard } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadFlashcards(): Flashcard[] {
  try {
    const rows = db.prepare("SELECT * FROM flashcards").all();
    return rows.map((r) => ({
      id: r.id,
      front: r.front || "",
      back: r.back || "",
      deckId: r.deckId || "",
      interval: r.interval ?? 0,
      dueDate: r.dueDate ? new Date(r.dueDate) : new Date(),
      easyCount: r.easyCount ?? 0,
      mediumCount: r.mediumCount ?? 0,
      hardCount: r.hardCount ?? 0,
      typedCorrect: r.typedCorrect ?? undefined,
      typedTotal: r.typedTotal ?? undefined,
    }));
  } catch {
    return [];
  }
}

export function saveFlashcards(cards: Flashcard[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM flashcards");
    const insert = db.prepare(
      `INSERT INTO flashcards (id, front, back, deckId, interval, dueDate, easyCount, mediumCount, hardCount, typedCorrect, typedTotal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const c of cards || []) {
      insert.run(
        c.id,
        c.front,
        c.back,
        c.deckId,
        c.interval ?? 0,
        c.dueDate ? new Date(c.dueDate).toISOString() : null,
        c.easyCount ?? 0,
        c.mediumCount ?? 0,
        c.hardCount ?? 0,
        c.typedCorrect ?? null,
        c.typedTotal ?? null,
      );
    }
  });
  tx();
}
