import db from "./db.js";

function jsonReplacer(key: string, value: unknown): unknown {
  return value instanceof Date ? value.toISOString() : value;
}

export function loadTable<T>(
  name: string,
  reviver: ((key: string, value: unknown) => unknown) | null = null,
): T[] {
  try {
    return db
      .prepare(`SELECT data FROM ${name}`)
      .all()
      .map((row) => JSON.parse(row.data, reviver));
  } catch {
    return [];
  }
}

export function saveTable<T extends { id: string }>(
  name: string,
  items: T[],
  replacer: (key: string, value: unknown) => unknown = jsonReplacer,
): void {
  const tx = db.transaction(() => {
    db.exec(`DELETE FROM ${name}`);
    const insert = db.prepare(`INSERT INTO ${name} (id, data) VALUES (?, ?)`);
    for (const item of items || []) {
      insert.run(item.id, JSON.stringify(item, replacer));
    }
  });
  tx();
}
