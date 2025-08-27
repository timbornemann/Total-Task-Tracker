import type { PomodoroSession } from "../../src/types/index.js";
import db from "../lib/db.js";

export function loadPomodoroSessions(): PomodoroSession[] {
  try {
    return db
      .prepare("SELECT start, end, breakEnd FROM pomodoro_sessions")
      .all();
  } catch {
    return [];
  }
}


export function savePomodoroSessions(sessions: PomodoroSession[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM pomodoro_sessions");
    for (const s of sessions || []) {
      db.prepare(
        "INSERT INTO pomodoro_sessions (start, end, breakEnd) VALUES (?, ?, ?)",
      ).run(s.start, s.end, s.breakEnd ?? null);
    }
  });
  tx();
}

