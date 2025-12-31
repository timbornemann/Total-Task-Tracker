import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PomodoroSession } from "@/types";

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
  // Transient state to notify UI to record a session
  finishedSession?: PomodoroSession & { type: "work" | "break" }; 
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
  consumeFinishedSession: () => void;
}

const WORK_DURATION = 25 * 60; // 25 Minuten
const BREAK_DURATION = 5 * 60; // 5 Minuten

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
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
      finishedSession: undefined,
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
          finishedSession: undefined,
        })),
      startBreak: () =>
        set((state) => ({
          isRunning: true,
          isPaused: false,
          pauseStart: undefined,
          mode: "break",
          remainingTime: state.breakDuration,
          lastTick: Date.now(),
          startTime: Date.now(), // Explicitly track break start
        })),
      skipBreak: () =>
        set((state) => ({
          isRunning: true,
          isPaused: false,
          pauseStart: undefined,
          mode: "work",
          remainingTime: state.workDuration,
          lastTick: Date.now(),
          startTime: Date.now(),
        })),
      tick: () =>
        set((state) => {
          if (!state.isRunning || state.isPaused) return state;
          const now = Date.now();
          const lastTick = state.lastTick || now;
          const elapsed = Math.max(0, Math.floor((now - lastTick) / 1000));
          
          if (elapsed === 0) return state;

          if (state.remainingTime > elapsed) {
            return {
              remainingTime: state.remainingTime - elapsed,
              lastTick: now,
            };
          }
          
          // Timer finished
          const finishedMode = state.mode;
          // Calculate when it roughly finished (startTime + duration) or just now
          // If huge drift, we prefer 'expected' end time to avoid 2-hour sessions
          const durationSec = finishedMode === "work" ? state.workDuration : state.breakDuration;
          const expectedEnd = (state.startTime || now) + (durationSec * 1000);
          
          const finishedSession = {
              start: state.startTime || (now - durationSec * 1000),
              end: expectedEnd,
              type: finishedMode
          };

          const nextMode = state.mode === "work" ? "break" : "work";
          return {
            mode: nextMode,
            remainingTime:
              nextMode === "work" ? state.workDuration : state.breakDuration,
            lastTick: now,
            startTime: now, // Start the next session NOW (resetting the gap)
            finishedSession,
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
      consumeFinishedSession: () => set({ finishedSession: undefined }),
    }),
    { name: "pomodoro" },
  ),
);
