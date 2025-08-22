import React, { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  loadOfflineData,
  updateOfflineData,
  syncWithServer,
} from "@/utils/offline";

const generateId = () =>
  (crypto as { randomUUID?: () => string }).randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export interface Timer {
  id: string;
  title: string;
  color: number;
  baseDuration: number;
  duration: number;
  remaining: number;
  isRunning: boolean;
  isPaused: boolean;
  startTime?: number;
  lastTick?: number;
  pauseStart?: number;
}

interface TimersState {
  timers: Timer[];
  setTimers: (list: Timer[]) => void;
  addTimer: (
    data: Omit<
      Timer,
      | "id"
      | "remaining"
      | "isRunning"
      | "isPaused"
      | "startTime"
      | "lastTick"
      | "pauseStart"
      | "baseDuration"
    >,
  ) => string;
  removeTimer: (id: string) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resumeTimer: (id: string) => void;
  stopTimer: (id: string) => void;
  extendTimer: (id: string, seconds: number) => void;
  updateTimer: (
    id: string,
    data: Pick<Timer, "title" | "color" | "duration">,
  ) => void;
  reorderTimers: (startIndex: number, endIndex: number) => void;
  tick: () => void;
}

export const useTimers = create<TimersState>()(
  persist(
    (set, get) => ({
      timers: [],
      setTimers: (list) => set({ timers: list }),
      addTimer: (data) => {
        const id = generateId();
        set((state) => ({
          timers: [
            ...state.timers,
            {
              id,
              title: data.title,
              color: data.color,
              baseDuration: data.duration,
              duration: data.duration,
              remaining: data.duration,
              isRunning: false,
              isPaused: false,
            },
          ],
        }));
        return id;
      },
      removeTimer: (id) =>
        set((state) => ({ timers: state.timers.filter((t) => t.id !== id) })),
      startTimer: (id) =>
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id
              ? {
                  ...t,
                  isRunning: true,
                  isPaused: false,
                  duration: t.baseDuration,
                  remaining: t.baseDuration,
                  startTime: Date.now(),
                  lastTick: Date.now(),
                }
              : t,
          ),
        })),
      pauseTimer: (id) =>
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id ? { ...t, isPaused: true, pauseStart: Date.now() } : t,
          ),
        })),
      resumeTimer: (id) =>
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id
              ? {
                  ...t,
                  isPaused: false,
                  pauseStart: undefined,
                  lastTick: Date.now(),
                }
              : t,
          ),
        })),
      stopTimer: (id) =>
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id
              ? {
                  ...t,
                  isRunning: false,
                  isPaused: false,
                  duration: t.baseDuration,
                  remaining: t.baseDuration,
                  startTime: undefined,
                  lastTick: undefined,
                  pauseStart: undefined,
                }
              : t,
          ),
        })),
      extendTimer: (id, seconds) =>
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id
              ? {
                  ...t,
                  duration: t.duration + seconds,
                  remaining: t.remaining + seconds,
                }
              : t,
          ),
        })),
      updateTimer: (id, data) =>
        set((state) => ({
          timers: state.timers.map((t) =>
            t.id === id
              ? {
                  ...t,
                  title: data.title,
                  color: data.color,
                  baseDuration: data.duration,
                  duration: data.duration,
                  remaining: t.isRunning
                    ? Math.min(t.remaining, data.duration)
                    : data.duration,
                }
              : t,
          ),
        })),
      reorderTimers: (startIndex, endIndex) =>
        set((state) => {
          const updated = Array.from(state.timers);
          const [removed] = updated.splice(startIndex, 1);
          updated.splice(endIndex, 0, removed);
          return { timers: updated };
        }),
      tick: () => {
        const now = Date.now();
        set((state) => ({
          timers: state.timers.map((t) => {
            if (!t.isRunning || t.isPaused) return t;
            const last = t.lastTick ?? now;
            const elapsed = (now - last) / 1000;
            const remaining = t.remaining - elapsed;
            if (remaining <= 0) {
              return {
                ...t,
                isRunning: false,
                isPaused: false,
                duration: t.baseDuration,
                remaining: t.baseDuration,
                startTime: undefined,
                lastTick: undefined,
                pauseStart: undefined,
              };
            }
            return {
              ...t,
              remaining,
              lastTick: now,
              isRunning: true,
            };
          }),
        }));
      },
    }),
    { name: "timers" },
  ),
);

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
