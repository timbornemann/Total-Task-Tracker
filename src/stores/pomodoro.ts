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
  endTime?: number; // Target timestamp when timer ends
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
      endTime: undefined, // New: track expected end time

      start: (taskId?: string) =>
        set((state) => {
          const now = Date.now();
          const duration = state.workDuration;
          return {
            isRunning: true,
            isPaused: false,
            pauseStart: undefined,
            remainingTime: duration,
            mode: "work",
            currentTaskId: taskId,
            startTime: now,
            endTime: now + duration * 1000,
            lastTick: now,
          };
        }),

      pause: () =>
        set((state) => {
          // When pausing, we clear endTime because "real time" flow stops for the timer.
          // remainingTime is preserved.
          return {
            isPaused: true,
            pauseStart: Date.now(),
            endTime: undefined,
          };
        }),

      resume: () =>
        set((state) => {
          const now = Date.now();
          // Calculate new endTime based on preserved remainingTime
          const newEndTime = now + state.remainingTime * 1000;
          return {
            isPaused: false,
            pauseStart: undefined,
            lastTick: now,
            endTime: newEndTime,
          };
        }),

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
          endTime: undefined,
        })),

      startBreak: () =>
        set((state) => {
          const now = Date.now();
          const duration = state.breakDuration;
          return {
            isRunning: true,
            isPaused: false,
            pauseStart: undefined,
            mode: "break",
            remainingTime: duration,
            lastTick: now,
            startTime: now,
            endTime: now + duration * 1000,
          };
        }),

      skipBreak: () =>
        set((state) => {
          const now = Date.now();
          const duration = state.workDuration;
          return {
            isRunning: true,
            isPaused: false,
            pauseStart: undefined,
            mode: "work",
            remainingTime: duration,
            lastTick: now,
            startTime: now,
            endTime: now + duration * 1000,
          };
        }),

      tick: () =>
        set((state) => {
          if (!state.isRunning || state.isPaused) return state;

          const now = Date.now();
          // If we somehow don't have an endTime (legacy state or bug), set it now
          if (!state.endTime) {
            return {
              ...state,
              endTime: now + state.remainingTime * 1000,
              lastTick: now,
            };
          }

          const msRemaining = state.endTime - now;
          // Ceiling to keep 0.9s as "1s" remaining on UI until it truly hits 0
          const remainingSeconds = Math.max(0, Math.ceil(msRemaining / 1000));

          if (remainingSeconds > 0) {
            // Only update if changed to avoid unnecessary re-renders if called rapidly
            if (remainingSeconds !== state.remainingTime) {
              return {
                remainingTime: remainingSeconds,
                lastTick: now,
              };
            }
            return state;
          }

          // Timer finished
          const finishedMode = state.mode;
          // Accurate start/end for history
          const durationSec =
            finishedMode === "work" ? state.workDuration : state.breakDuration;

          // Use stored endTime for exact record, or now if significantly off
          const exactEnd = state.endTime;
          const calculatedStart = exactEnd - durationSec * 1000;

          const finishedSession = {
            start: calculatedStart,
            end: exactEnd,
            type: finishedMode,
          };

          const nextMode = state.mode === "work" ? "break" : "work";
          const nextDuration =
            nextMode === "work" ? state.workDuration : state.breakDuration;

          // Start next session immediately from 'now'.
          // (Optionally could be 'exactEnd' if we want zero gap, but 'now' is safer for user perception)

          return {
            mode: nextMode,
            remainingTime: nextDuration,
            lastTick: now,
            startTime: now,
            endTime: now + nextDuration * 1000,
            finishedSession,
          };
        }),

      setStartTime: (time) => set({ startTime: time }),
      setLastTick: (time) => set({ lastTick: time }),
      setDurations: (work, brk) =>
        set((state) => ({
          workDuration: work,
          breakDuration: brk,
          // If not running, update display immediately.
          // If running, don't change current session but next one will use new durations.
          remainingTime: !state.isRunning ? work : state.remainingTime,
        })),
      consumeFinishedSession: () => set({ finishedSession: undefined }),
    }),
    { name: "pomodoro" },
  ),
);
