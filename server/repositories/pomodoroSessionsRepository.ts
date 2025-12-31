import type { PomodoroSession } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadPomodoroSessions(): PomodoroSession[] {
  try {
    const rows = db
      .prepare("SELECT start, end, breakEnd, type FROM pomodoro_sessions")
      .all() as {
      start: number;
      end: number;
      breakEnd?: number;
      type?: string;
    }[];

    const normalized: PomodoroSession[] = [];
    for (const r of rows) {
      // If it has a breakEnd (legacy), split it
      if (r.breakEnd) {
        // Work session
        normalized.push({
          start: r.start,
          end: r.end,
          type: "work",
        });
        // Break session
        normalized.push({
          start: r.end,
          end: r.breakEnd,
          type: "break",
        });
      } else {
        // Already normalized or just a work session without break or just manual
        normalized.push({
          start: r.start,
          end: r.end,
          type: (r.type as "work" | "break") || "work",
        });
      }
    }
    return normalized.sort((a, b) => a.start - b.start);
  } catch {
    return [];
  }
}

export function savePomodoroSessions(sessions: PomodoroSession[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM pomodoro_sessions");
    const stmt = db.prepare(
      "INSERT INTO pomodoro_sessions (start, end, type) VALUES (?, ?, ?)",
    );
    for (const s of sessions || []) {
      // Ensure we only save 'work' or 'break' types
      const type = s.type === "break" ? "break" : "work";
      stmt.run(s.start, s.end, type);
    }
  });
  tx();
}
