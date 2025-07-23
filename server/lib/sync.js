let loadAllData = () => ({})
let saveAllData = () => {}

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

let syncRole = "client";
let syncServerUrl = "";
let syncInterval = 5;
let syncEnabled = true;
let llmUrl = "";
let llmToken = "";
let llmModel = "gpt-3.5-turbo";
let syncTimer = null;
let lastSyncTime = 0;
let lastSyncError = null;
export const syncLogs = [];

export function initSync({ loadAll, saveAll }) {
  if (loadAll) loadAllData = loadAll;
  if (saveAll) saveAllData = saveAll;
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
    const merged = applyDeletions(mergeData(loadAllData(), incoming));
    saveAllData(merged);
    lastSyncTime = Date.now();
    lastSyncError = null;
    log("Sync successful");
  } catch (err) {
    console.error("Sync error", err);
    lastSyncTime = Date.now();
    lastSyncError = err.message || String(err);
  }
}

function startSyncTimer() {
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

function setSyncRole(role) {
  const newRole = role === "server" ? "server" : "client";
  if (newRole === syncRole) return;
  syncRole = newRole;
  log("Sync role set to", syncRole);
  startSyncTimer();
}

function setSyncServerUrl(url) {
  if (url && !/^https?:\/\//i.test(url)) {
    url = "http://" + url;
  }
  const normalized = url ? url.replace(/\/$/, "") : "";
  if (normalized === syncServerUrl) return;
  syncServerUrl = normalized;
  log("Sync server URL set to", syncServerUrl || "(none)");
  startSyncTimer();
}

function setSyncInterval(minutes) {
  const val = Number(minutes) || 0;
  if (val === syncInterval) return;
  syncInterval = val;
  log("Sync interval set to", syncInterval);
  startSyncTimer();
}

function setSyncEnabled(val) {
  const enabled = Boolean(val);
  if (enabled === syncEnabled) return;
  syncEnabled = enabled;
  log("Sync enabled set to", syncEnabled);
  startSyncTimer();
}

function setLlmUrl(url) {
  llmUrl = url || "";
  log("LLM URL set to", llmUrl || "(none)");
}

function setLlmToken(token) {
  llmToken = token || "";
}

function setLlmModel(model) {
  llmModel = model || "gpt-3.5-turbo";
}

function getSyncRole() {
  return syncRole;
}

function getStatus() {
  return {
    last: lastSyncTime,
    error: lastSyncError,
    enabled: syncEnabled,
  };
}

function getLlmConfig() {
  return { llmUrl, llmToken, llmModel };
}

export {
  log,
  performSync,
  startSyncTimer,
  setSyncRole,
  setSyncServerUrl,
  setSyncInterval,
  setSyncEnabled,
  setLlmUrl,
  setLlmToken,
  setLlmModel,
  getSyncRole,
  getStatus,
  getLlmConfig,
};

function mergeLists(curr = [], inc = [], compare = "updatedAt") {
  const map = new Map();
  for (const c of curr) map.set(c.id, c);
  for (const i of inc || []) {
    if (map.has(i.id)) {
      const ex = map.get(i.id);
      if (compare && ex[compare] && i[compare]) {
        if (new Date(i[compare]) > new Date(ex[compare])) map.set(i.id, i);
      }
    } else {
      map.set(i.id, i);
    }
  }
  return Array.from(map.values());
}

function mergeData(curr, inc) {
  return {
    tasks: mergeLists(curr.tasks, inc.tasks),
    categories: mergeLists(curr.categories, inc.categories),
    notes: mergeLists(curr.notes, inc.notes),
    recurring: mergeLists(curr.recurring, inc.recurring),
    habits: mergeLists(curr.habits, inc.habits),
    flashcards: mergeLists(curr.flashcards, inc.flashcards, null),
    decks: mergeLists(curr.decks, inc.decks, null),
    pomodoroSessions: mergeLists(
      curr.pomodoroSessions,
      inc.pomodoroSessions,
      null,
    ),
    timers: mergeLists(curr.timers, inc.timers, null),
    trips: mergeLists(curr.trips, inc.trips, null),
    workDays: mergeLists(curr.workDays, inc.workDays, null),
    items: mergeLists(curr.items, inc.items, null),
    itemCategories: mergeLists(curr.itemCategories, inc.itemCategories, null),
    itemTags: mergeLists(curr.itemTags, inc.itemTags, null),
    settings: { ...curr.settings, ...inc.settings },
    deletions: mergeLists(curr.deletions, inc.deletions, "deletedAt"),
  };
}

function applyDeletions(data) {
  const maps = {};
  for (const d of data.deletions || []) {
    maps[d.type] = maps[d.type] || new Map();
    const curr = maps[d.type].get(d.id);
    const time = new Date(d.deletedAt);
    if (!curr || time > curr) maps[d.type].set(d.id, time);
  }
  const shouldKeep = (type, item) => {
    const m = maps[type];
    if (!m) return true;
    const t = m.get(item.id);
    if (!t) return true;
    return !(item.updatedAt && new Date(item.updatedAt) <= t);
  };
  data.tasks = (data.tasks || []).filter((t) => shouldKeep("task", t));
  data.categories = (data.categories || []).filter((c) =>
    shouldKeep("category", c),
  );
  data.notes = (data.notes || []).filter((n) => shouldKeep("note", n));
  data.recurring = (data.recurring || []).filter((r) =>
    shouldKeep("recurring", r),
  );
  data.habits = (data.habits || []).filter((h) => shouldKeep("habit", h));
  data.flashcards = (data.flashcards || []).filter((f) =>
    shouldKeep("flashcard", f),
  );
  data.decks = (data.decks || []).filter((d) => shouldKeep("deck", d));
  data.trips = (data.trips || []).filter((t) => shouldKeep("trip", t));
  data.workDays = (data.workDays || []).filter((d) => shouldKeep("workday", d));
  data.items = (data.items || []).filter((i) => shouldKeep("inventoryItem", i));
  data.itemCategories = (data.itemCategories || []).filter((c) =>
    shouldKeep("inventoryCategory", c),
  );
  data.itemTags = (data.itemTags || []).filter((t) =>
    shouldKeep("inventoryTag", t),
  );
  data.pomodoroSessions = (data.pomodoroSessions || []).filter((s) =>
    shouldKeep("pomodoro", s),
  );
  data.timers = (data.timers || []).filter((t) => shouldKeep("timer", t));
  return data;
}

