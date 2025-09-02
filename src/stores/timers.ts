import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Timer } from "@/types";

const generateId = () =>
  (crypto as { randomUUID?: () => string }).randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

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
