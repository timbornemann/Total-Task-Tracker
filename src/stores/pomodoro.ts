import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PomodoroState {
  isRunning: boolean;
  isPaused: boolean;
  remainingTime: number;
  mode: "work" | "break";
  currentTaskId?: string;
  workDuration: number;
  breakDuration: number;
  startTime?: number;
  lastTick?: number;
  pauseStart?: number;
  start: (taskId?: string) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  startBreak: () => void;
  skipBreak: () => void;
  tick: () => void;
  setStartTime: (time?: number) => void;
  setLastTick: (time: number) => void;
  setDurations: (work: number, brk: number) => void;
}

const WORK_DURATION = 25 * 60; // 25 Minuten
const BREAK_DURATION = 5 * 60; // 5 Minuten

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set) => ({
      isRunning: false,
      isPaused: false,
      pauseStart: undefined,
      remainingTime: WORK_DURATION,
      mode: "work",
      currentTaskId: undefined,
      workDuration: WORK_DURATION,
      breakDuration: BREAK_DURATION,
      startTime: undefined,
      lastTick: undefined,
      start: (taskId?: string) =>
        set((state) => ({
          isRunning: true,
          isPaused: false,
          pauseStart: undefined,
          remainingTime: state.workDuration,
          mode: "work",
          currentTaskId: taskId,
          startTime: Date.now(),
          lastTick: Date.now(),
        })),
      pause: () => set({ isPaused: true, pauseStart: Date.now() }),
      resume: () =>
        set({ isPaused: false, lastTick: Date.now(), pauseStart: undefined }),
      reset: () =>
        set((state) => ({
          isRunning: false,
          isPaused: false,
          remainingTime: state.workDuration,
          mode: "work",
          currentTaskId: undefined,
          startTime: undefined,
          lastTick: undefined,
          pauseStart: undefined,
        })),
      startBreak: () =>
        set((state) => ({
          isRunning: true,
          isPaused: false,
          pauseStart: undefined,
          mode: "break",
          remainingTime: state.breakDuration,
          lastTick: Date.now(),
        })),
      skipBreak: () =>
        set((state) => ({
          isRunning: true,
          isPaused: false,
          pauseStart: undefined,
          mode: "work",
          remainingTime: state.workDuration,
          lastTick: Date.now(),
        })),
      tick: () =>
        set((state) => {
          if (!state.isRunning || state.isPaused) return state;
          if (state.remainingTime > 0) {
            return {
              remainingTime: state.remainingTime - 1,
              lastTick: Date.now(),
            };
          }
          const nextMode = state.mode === "work" ? "break" : "work";
          return {
            mode: nextMode,
            remainingTime:
              nextMode === "work" ? state.workDuration : state.breakDuration,
            lastTick: Date.now(),
          } as PomodoroState;
        }),
      setStartTime: (time) => set({ startTime: time }),
      setLastTick: (time) => set({ lastTick: time }),
      setDurations: (work, brk) =>
        set((state) => ({
          workDuration: work,
          breakDuration: brk,
          remainingTime: !state.isRunning ? work : state.remainingTime,
        })),
    }),
    { name: "pomodoro" },
  ),
);
