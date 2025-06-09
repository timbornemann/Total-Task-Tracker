import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { create } from 'zustand';

interface PomodoroState {
  isRunning: boolean;
  isPaused: boolean;
  remainingTime: number;
  mode: 'work' | 'break';
  currentTaskId?: string;
  start: (taskId?: string) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
}

const WORK_DURATION = 25 * 60; // 25 Minuten
const BREAK_DURATION = 5 * 60; // 5 Minuten

export const usePomodoroStore = create<PomodoroState>(set => ({
  isRunning: false,
  isPaused: false,
  remainingTime: WORK_DURATION,
  mode: 'work',
  currentTaskId: undefined,
  start: (taskId?: string) =>
    set(() => ({
      isRunning: true,
      isPaused: false,
      remainingTime: WORK_DURATION,
      mode: 'work',
      currentTaskId: taskId
    })),
  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),
  reset: () =>
    set(() => ({
      isRunning: false,
      isPaused: false,
      remainingTime: WORK_DURATION,
      mode: 'work',
      currentTaskId: undefined
    })),
  tick: () =>
    set(state => {
      if (!state.isRunning || state.isPaused) return state;
      if (state.remainingTime > 0) {
        return { remainingTime: state.remainingTime - 1 };
      }
      const nextMode = state.mode === 'work' ? 'break' : 'work';
      return {
        mode: nextMode,
        remainingTime: nextMode === 'work' ? WORK_DURATION : BREAK_DURATION
      };
    })
}));

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

interface PomodoroTimerProps {
  compact?: boolean;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ compact }) => {
  const { isRunning, isPaused, remainingTime, start, pause, resume, reset, tick } =
    usePomodoroStore();

  useEffect(() => {
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [tick]);

  if (compact && !isRunning) return null;

  const duration = mode === 'work' ? WORK_DURATION : BREAK_DURATION;
  const progress = remainingTime / duration;

  const radius = 80;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      className={
        compact
          ? 'fixed bottom-4 right-4 bg-white shadow-lg rounded p-3 z-50'
          : 'flex flex-col items-center space-y-4'
      }
    >
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg
          width={radius * 2}
          height={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={mode === 'work' ? '#4f46e5' : '#16a34a'}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl font-bold">{formatTime(remainingTime)}</div>
        </div>
      </div>
      <div className="flex space-x-2 mt-4">
        {!isRunning && <Button onClick={() => start()}>Start</Button>}
        {isRunning && !isPaused && (
          <Button onClick={pause} variant="outline">
            Pause
          </Button>
        )}
        {isRunning && isPaused && (
          <Button onClick={resume} variant="outline">
            Weiter
          </Button>
        )}
        {isRunning && (
          <Button onClick={reset} variant="outline">
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer;

