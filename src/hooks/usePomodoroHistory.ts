import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PomodoroSession } from '@/types';

interface PomodoroHistoryState {
  sessions: PomodoroSession[];
  addSession: (start: number, end: number) => void;
}

export const usePomodoroHistory = create<PomodoroHistoryState>()(
  persist(
    set => ({
      sessions: [],
      addSession: (start, end) =>
        set(state => ({ sessions: [...state.sessions, { start, end }] }))
    }),
    { name: 'pomodoro-history' }
  )
);
