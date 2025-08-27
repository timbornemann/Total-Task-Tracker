import type { Timer } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadTimers(): Timer[] {
  try {
    const rows = db.prepare("SELECT * FROM timers").all();
    return rows.map((r) => ({
      id: r.id,
      title: r.title || "",
      color: typeof r.color === "number" ? r.color : 0,
      baseDuration: r.baseDuration ?? 0,
      duration: r.duration ?? 0,
      remaining: r.remaining ?? 0,
      isRunning: !!r.isRunning,
      isPaused: !!r.isPaused,
      startTime: r.startTime ?? undefined,
      lastTick: r.lastTick ?? undefined,
      pauseStart: r.pauseStart ?? undefined,
    }));
  } catch {
    return [];
  }
}


export function saveTimers(list: Timer[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM timers");
    const insert = db.prepare(
      `INSERT INTO timers (id, title, color, baseDuration, duration, remaining, isRunning, isPaused, startTime, lastTick, pauseStart)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const t of list || []) {
      insert.run(
        t.id,
        t.title,
        t.color,
        t.baseDuration,
        t.duration,
        t.remaining,
        t.isRunning ? 1 : 0,
        t.isPaused ? 1 : 0,
        t.startTime ?? null,
        t.lastTick ?? null,
        t.pauseStart ?? null,
      );
    }
  });
  tx();
}

