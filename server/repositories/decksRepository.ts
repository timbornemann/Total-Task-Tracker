import type { Deck } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadDecks(): Deck[] {
  try {
    const rows = db.prepare("SELECT * FROM decks").all();
    return rows.map((r) => ({ id: r.id, name: r.name || "" }));
  } catch {
    return [];
  }
}


export function saveDecks(decks: Deck[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM decks");
    const insert = db.prepare(`INSERT INTO decks (id, name) VALUES (?, ?)`);
    for (const d of decks || []) insert.run(d.id, d.name);
  });
  tx();
}

