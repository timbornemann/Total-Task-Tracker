import {
  mergeLists,
  mergeData,
  applyDeletions as applyDel,
} from "../../src/shared/syncUtils.js";
import type { AllData, Settings } from "../repositories/index.js";

interface SyncLogEntry {
  time: number;
  ip: string | undefined;
  method: string;
}

let syncRole = "client";
let syncServerUrl = "";
let syncInterval = 5;
let syncEnabled = true;
let llmUrl = "";
let llmToken = "";
let llmModel = "gpt-3.5-turbo";
let syncTimer: NodeJS.Timeout | null = null;
let lastSyncTime = 0;
let lastSyncError: string | null = null;
export const syncLogs: SyncLogEntry[] = [];

let loadAllData: () => AllData = () => ({}) as AllData;
let saveAllData: (
  data: Partial<AllData> & { settings?: Settings },
) => void = () => {};

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

export function initSync({
  loadAllData: l,
  saveAllData: s,
}: {
  loadAllData: () => AllData;
  saveAllData: (data: Partial<AllData> & { settings?: Settings }) => void;
}) {
  loadAllData = l;
  saveAllData = s;
}

export function getSyncRole() {
  return syncRole;
}

export function getSyncStatus() {
  return { last: lastSyncTime, error: lastSyncError, enabled: syncEnabled };
}

export function getLlmConfig() {
  return { llmUrl, llmToken, llmModel };
}

async function performSync() {
  if (syncRole !== "client" || !syncServerUrl) return;
  const url = `${syncServerUrl.replace(/\/$/, "")}/api/sync`;
  try {
    log("Starting sync with", url);
    const data = loadAllData();
    if (data.settings) {
      delete data.settings.syncServerUrl;
      delete data.settings.syncRole;
      delete data.settings.syncEnabled;
      delete data.settings.llmToken;
    }
    const post = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data, (k, v) =>
        v instanceof Date ? v.toISOString() : v,
      ),
    });
    if (!post.ok) throw new Error(`HTTP ${post.status}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const incoming = await res.json();
    saveAllData(incoming);
    lastSyncTime = Date.now();
    lastSyncError = null;
    log("Sync successful");
  } catch (err) {
    console.error("Sync error", err);
    lastSyncTime = Date.now();
    lastSyncError = err.message || String(err);
  }
}

export function startSyncTimer() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = null;
  if (
    syncEnabled &&
    syncRole === "client" &&
    syncServerUrl &&
    syncInterval > 0
  ) {
    log("Sync timer started with interval", syncInterval, "minutes");
    performSync();
    syncTimer = setInterval(performSync, syncInterval * 60 * 1000);
  }
}

export function setSyncRole(role) {
  const newRole = role === "server" ? "server" : "client";
  if (newRole === syncRole) return;
  syncRole = newRole;
  log("Sync role set to", syncRole);
  startSyncTimer();
}

export function setSyncServerUrl(url) {
  if (url && !/^https?:\/\//i.test(url)) {
    url = "http://" + url;
  }
  const normalized = url ? url.replace(/\/$/, "") : "";
  if (normalized === syncServerUrl) return;
  syncServerUrl = normalized;
  log("Sync server URL set to", syncServerUrl || "(none)");
  startSyncTimer();
}

export function setSyncInterval(minutes) {
  const val = Number(minutes) || 0;
  if (val === syncInterval) return;
  syncInterval = val;
  log("Sync interval set to", syncInterval);
  startSyncTimer();
}

export function setSyncEnabled(val) {
  const enabled = Boolean(val);
  if (enabled === syncEnabled) return;
  syncEnabled = enabled;
  log("Sync enabled set to", syncEnabled);
  startSyncTimer();
}

export function setLlmUrl(url) {
  llmUrl = url || "";
  log("LLM URL set to", llmUrl || "(none)");
}

export function setLlmToken(token) {
  llmToken = token || "";
}

export function setLlmModel(model) {
  llmModel = model || "gpt-3.5-turbo";
}
export { mergeLists, mergeData };

export function applyDeletions<T>(data: T): T {
  return (applyDel as (d: unknown) => unknown)(data) as T;
}
