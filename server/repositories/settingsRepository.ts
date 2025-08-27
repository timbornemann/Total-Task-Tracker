import db from "../lib/db.js";
import { dateReviver } from "./dataRepository.js";

export interface Settings {
  syncRole?: string;
  syncServerUrl?: string;
  syncInterval?: number;
  syncEnabled?: boolean;
  llmUrl?: string;
  llmToken?: string;
  llmModel?: string;
  [key: string]: unknown;
}

export function loadSettings(): Settings {
  try {
    const row = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("default");
    return row ? JSON.parse(row.value, dateReviver) : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings: Settings): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM settings");
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      "default",
      JSON.stringify(settings),
    );
  });
  tx();
}
