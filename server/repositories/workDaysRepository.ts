import { format } from "date-fns";
import type { WorkDay } from "../../src/types/index.js";
import db from "../lib/db.js";

function normalizeDateField(value: unknown): string {
  if (value instanceof Date) {
    return format(value, "yyyy-MM-dd HH:mm");
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      return value.slice(0, 16).replace("T", " ");
    }
    return value;
  }
  return String(value || "");
}

function normalizeWorkDay(d: WorkDay): WorkDay {
  return {
    ...d,
    start: normalizeDateField(d.start),
    end: normalizeDateField(d.end),
    category: d.category || "work",
  };
}

export function loadWorkDays(): WorkDay[] {
  try {
    const rows = db.prepare("SELECT * FROM workdays").all();
    return rows.map((r) =>
      normalizeWorkDay({
        id: r.id,
        start: r.start,
        end: r.end,
        category: r.category || "work",
        tripId: r.tripId || undefined,
        commuteId: r.commuteId || undefined,
        commuteKm: r.commuteKm ?? undefined,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      }),
    );
  } catch {
    return [];
  }
}

export function saveWorkDays(list: WorkDay[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM workdays");
    const insert = db.prepare(
      `INSERT INTO workdays (id, start, end, category, tripId, commuteId, commuteKm, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const d of list || []) {
      const n = normalizeWorkDay(d);
      insert.run(
        n.id,
        n.start,
        n.end,
        n.category,
        n.tripId ?? null,
        n.commuteId ?? null,
        n.commuteKm ?? null,
        n.createdAt ? new Date(n.createdAt).toISOString() : null,
        n.updatedAt ? new Date(n.updatedAt).toISOString() : null,
      );
    }
  });
  tx();
}
