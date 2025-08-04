import db from "./db.js";

function jsonReplacer(key, value) {
  return value instanceof Date ? value.toISOString() : value;
}

export function loadTable<T>(name: string, reviver: ((this: any, key: string, value: any) => any) | null = null): T[] {
  try {
    return db
      .prepare(`SELECT data FROM ${name}`)
      .all()
      .map((row) => JSON.parse(row.data, reviver) as T);
  } catch {
    return [] as T[];
  }
}

export function saveTable<T extends { id: string }>(name: string, items: T[], replacer: (this: any, key: string, value: any) => any = jsonReplacer): void {
  const tx = db.transaction(() => {
    db.exec(`DELETE FROM ${name}`);
    const insert = db.prepare(`INSERT INTO ${name} (id, data) VALUES (?, ?)`);
    for (const item of items || []) {
      insert.run(item.id, JSON.stringify(item, replacer));
    }
  });
  tx();
}

