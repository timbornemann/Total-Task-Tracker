import type { Habit } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadHabits(): Habit[] {
  try {
    const habits = db.prepare("SELECT * FROM habits").all();
    const completions = db
      .prepare("SELECT habitId, date FROM habit_completions")
      .all();
    const map: Record<string, string[]> = {};
    for (const c of completions) {
      if (!map[c.habitId]) map[c.habitId] = [];
      map[c.habitId].push(c.date);
    }
    return habits.map((h) => ({
      id: h.id,
      title: h.title || "",
      color: typeof h.color === "number" ? h.color : 0,
      recurrencePattern: h.recurrencePattern || undefined,
      customIntervalDays: h.customIntervalDays ?? undefined,
      startWeekday: h.startWeekday ?? undefined,
      startDate: h.startDate ? new Date(h.startDate) : undefined,
      createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
      updatedAt: h.updatedAt ? new Date(h.updatedAt) : new Date(),
      order: h.orderIndex ?? 0,
      pinned: !!h.pinned,
      completions: map[h.id] || [],
    }));
  } catch {
    return [];
  }
}


export function saveHabits(list: Habit[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM habits");
    db.exec("DELETE FROM habit_completions");
    const insertHabit = db.prepare(
      `INSERT INTO habits (id, title, color, recurrencePattern, customIntervalDays, startWeekday, startDate, createdAt, updatedAt, orderIndex, pinned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertCompletion = db.prepare(
      `INSERT OR IGNORE INTO habit_completions (habitId, date) VALUES (?, ?)`,
    );
    for (const h of list || []) {
      insertHabit.run(
        h.id,
        h.title,
        h.color,
        h.recurrencePattern ?? null,
        h.customIntervalDays ?? null,
        h.startWeekday ?? null,
        h.startDate ? new Date(h.startDate).toISOString() : null,
        h.createdAt ? new Date(h.createdAt).toISOString() : null,
        h.updatedAt ? new Date(h.updatedAt).toISOString() : null,
        typeof h.order === "number" ? h.order : 0,
        h.pinned ? 1 : 0,
      );
      for (const d of h.completions || []) insertCompletion.run(h.id, d);
    }
  });
  tx();
}

