import db from "./db.js";

function jsonReplacer(key, value) {
  return value instanceof Date ? value.toISOString() : value;
}

export function loadTable(name, reviver = null) {
  try {
    return db
      .prepare(`SELECT data FROM ${name}`)
      .all()
      .map((row) => JSON.parse(row.data, reviver));
  } catch {
    return [];
  }
}

export function saveTable(name, items, replacer = jsonReplacer) {
  const tx = db.transaction(() => {
    db.exec(`DELETE FROM ${name}`);
    const insert = db.prepare(`INSERT INTO ${name} (id, data) VALUES (?, ?)`);
    for (const item of items || []) {
      insert.run(item.id, JSON.stringify(item, replacer));
    }
  });
  tx();
}

