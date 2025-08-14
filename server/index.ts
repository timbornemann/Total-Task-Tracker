import { app } from "./app.js";
import { setActivePort } from "./services/serverInfoService.js";
import {
  initSync,
  startSyncTimer,
  setSyncRole,
  setSyncServerUrl,
  setSyncInterval,
  setSyncEnabled,
  setLlmUrl,
  setLlmToken,
  setLlmModel,
  getSyncRole,
} from "./services/syncService.js";
import {
  loadAllData,
  saveAllData,
  loadSettings,
  saveWorkDays,
  loadWorkDays,
} from "./services/dataService.js";
import type { AddressInfo } from "net";

function log(...args: unknown[]) {
  console.log(new Date().toISOString(), ...args);
}

initSync({ loadAllData, saveAllData });
const initialSettings = loadSettings();
if (typeof initialSettings.syncInterval === "number") {
  setSyncInterval(initialSettings.syncInterval);
}
if (initialSettings.syncRole) {
  setSyncRole(initialSettings.syncRole);
}
if (initialSettings.syncServerUrl) {
  setSyncServerUrl(initialSettings.syncServerUrl);
}
if (typeof initialSettings.syncEnabled === "boolean") {
  setSyncEnabled(initialSettings.syncEnabled);
}
if (initialSettings.llmUrl) {
  setLlmUrl(initialSettings.llmUrl);
}
if (initialSettings.llmToken) {
  setLlmToken(initialSettings.llmToken);
}
if (initialSettings.llmModel) {
  setLlmModel(initialSettings.llmModel);
}
log("Initial sync settings", {
  role: getSyncRole(),
  url: initialSettings.syncServerUrl || "",
  interval: initialSettings.syncInterval || 0,
  enabled: initialSettings.syncEnabled !== false,
  llmConfigured: !!initialSettings.llmUrl,
});
startSyncTimer();
try {
  saveWorkDays(loadWorkDays());
} catch (err) {
  log("Failed to normalize workdays", err);
}

const port = Number(process.env.PORT) || 3002;
const server = app.listen(port, () => {
  const address = server.address() as AddressInfo;
  setActivePort(address.port);
  console.log("Server listening on port", address.port);
});
