import React, { useEffect, useState } from "react";
import { useTimers } from "@/stores/timers";
import {
  loadOfflineData,
  updateOfflineData,
  syncWithServer,
} from "@/utils/offline";

export const TimersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setTimers = useTimers((s) => s.setTimers);
  const timers = useTimers((s) => s.timers);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const offline = loadOfflineData();
      if (offline) setTimers(offline.timers || []);
      const synced = await syncWithServer();
      setTimers(synced.timers || []);
      setLoaded(true);
    };
    load();
  }, [setTimers]);

  useEffect(() => {
    if (!loaded) return;

    // Only sync for non-tick updates (debounced approach)
    const hasRunningTimers = timers.some((t) => t.isRunning && !t.isPaused);

    const save = async () => {
      try {
        updateOfflineData({ timers });
        if (navigator.onLine) {
          await fetch("/api/timers", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(timers),
          });

          // Only sync with server for significant changes, not tick updates
          if (!hasRunningTimers) {
            await syncWithServer();
          }
        }
      } catch (err) {
        console.error("Error saving timers", err);
      }
    };

    // Debounce: Don't sync immediately if timers are running (frequent ticks)
    if (hasRunningTimers) {
      const timeoutId = setTimeout(save, 5000); // Sync every 5 seconds max when running
      return () => clearTimeout(timeoutId);
    } else {
      save(); // Immediate sync for non-running states (start/stop/pause actions)
    }
  }, [timers, loaded]);

  return <>{children}</>;
};

export { useTimers } from "@/stores/timers";
