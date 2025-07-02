import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Timer {
  id: string;
  title: string;
  color: number;
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
  addTimer: (data: Omit<Timer, 'id' | 'remaining' | 'isRunning' | 'isPaused' | 'startTime' | 'lastTick' | 'pauseStart'>) => string;
  removeTimer: (id: string) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resumeTimer: (id: string) => void;
  stopTimer: (id: string) => void;
  extendTimer: (id: string, seconds: number) => void;
  tick: () => void;
}

export const useTimers = create<TimersState>()(
  persist(
    (set, get) => ({
      timers: [],
      addTimer: data => {
        const id = crypto.randomUUID();
        set(state => ({
          timers: [
            ...state.timers,
            {
              id,
              title: data.title,
              color: data.color,
              duration: data.duration,
              remaining: data.duration,
              isRunning: false,
              isPaused: false
            }
          ]
        }));
        return id;
      },
      removeTimer: id =>
        set(state => ({ timers: state.timers.filter(t => t.id !== id) })),
      startTimer: id =>
        set(state => ({
          timers: state.timers.map(t =>
            t.id === id
              ? {
                  ...t,
                  isRunning: true,
                  isPaused: false,
                  remaining: t.duration,
                  startTime: Date.now(),
                  lastTick: Date.now()
                }
              : t
          )
        })),
      pauseTimer: id =>
        set(state => ({
          timers: state.timers.map(t =>
            t.id === id ? { ...t, isPaused: true, pauseStart: Date.now() } : t
          )
        })),
      resumeTimer: id =>
        set(state => ({
          timers: state.timers.map(t =>
            t.id === id
              ? {
                  ...t,
                  isPaused: false,
                  pauseStart: undefined,
                  lastTick: Date.now()
                }
              : t
          )
        })),
      stopTimer: id =>
        set(state => ({
          timers: state.timers.map(t =>
            t.id === id
              ? {
                  ...t,
                  isRunning: false,
                  isPaused: false,
                  remaining: 0,
                  startTime: undefined,
                  lastTick: undefined,
                  pauseStart: undefined
                }
              : t
          )
        })),
      extendTimer: (id, seconds) =>
        set(state => ({
          timers: state.timers.map(t =>
            t.id === id
              ? {
                  ...t,
                  duration: t.duration + seconds,
                  remaining: t.remaining + seconds
                }
              : t
          )
        })),
      tick: () => {
        const now = Date.now();
        set(state => ({
          timers: state.timers.map(t => {
            if (!t.isRunning || t.isPaused) return t;
            const last = t.lastTick ?? now;
            const elapsed = Math.floor((now - last) / 1000);
            const remaining = Math.max(0, t.remaining - elapsed);
            return {
              ...t,
              remaining,
              lastTick: now,
              isRunning: remaining > 0
            };
          })
        }));
      }
    }),
    { name: 'timers' }
  )
);
