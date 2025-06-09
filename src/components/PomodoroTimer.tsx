import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettings } from '@/hooks/useSettings';

interface PomodoroState {
  isRunning: boolean;
  isPaused: boolean;
  remainingTime: number;
  mode: 'work' | 'break';
  currentTaskId?: string;
  workDuration: number;
  breakDuration: number;
  startTime?: number;
  start: (taskId?: string) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
  setStartTime: (time?: number) => void;
  setDurations: (work: number, brk: number) => void;
}

const WORK_DURATION = 25 * 60; // 25 Minuten
const BREAK_DURATION = 5 * 60; // 5 Minuten

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    set => ({
      isRunning: false,
      isPaused: false,
      remainingTime: WORK_DURATION,
      mode: 'work',
      currentTaskId: undefined,
      workDuration: WORK_DURATION,
      breakDuration: BREAK_DURATION,
      startTime: undefined,
      start: (taskId?: string) =>
        set(state => ({
          isRunning: true,
          isPaused: false,
          remainingTime: state.workDuration,
          mode: 'work',
          currentTaskId: taskId,
          startTime: Date.now()
        })),
      pause: () => set({ isPaused: true }),
      resume: () => set({ isPaused: false }),
      reset: () =>
        set(state => ({
          isRunning: false,
          isPaused: false,
          remainingTime: state.workDuration,
          mode: 'work',
          currentTaskId: undefined,
          startTime: undefined
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
            remainingTime:
              nextMode === 'work' ? state.workDuration : state.breakDuration
          } as PomodoroState;
        }),
      setStartTime: time => set({ startTime: time }),
      setDurations: (work, brk) =>
        set(state => ({
          workDuration: work,
          breakDuration: brk,
          remainingTime: !state.isRunning ? work : state.remainingTime
        }))
    }),
    { name: 'pomodoro' }
  )
);

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
  /** Radius of the timer circle */
  size?: number;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ compact, size = 80 }) => {
  const {
    isRunning,
    isPaused,
    remainingTime,
    mode,
    start,
    pause,
    resume,
    reset,
    workDuration,
    breakDuration,
    setDurations
  } = usePomodoroStore();
  const { pomodoro, updatePomodoro } = useSettings();

  useEffect(() => {
    setDurations(pomodoro.workMinutes * 60, pomodoro.breakMinutes * 60);
  }, [pomodoro, setDurations]);


  if (compact && !isRunning) return null;

  const duration = mode === 'work' ? workDuration : breakDuration;
  const progress = remainingTime / duration;

  const radius = size;
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
          <div
            className={size > 100 ? 'text-4xl font-bold' : 'text-2xl font-bold'}
          >
            {formatTime(remainingTime)}
          </div>
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
      <div className="flex space-x-2 mt-2 text-xs">
        <div className="flex items-center space-x-1">
          <span>Arbeit</span>
          <input
            type="number"
            className="w-12 border rounded px-1"
            value={pomodoro.workMinutes}
            onChange={e =>
              updatePomodoro('workMinutes', Number(e.target.value))
            }
          />
        </div>
        <div className="flex items-center space-x-1">
          <span>Pause</span>
          <input
            type="number"
            className="w-12 border rounded px-1"
            value={pomodoro.breakMinutes}
            onChange={e =>
              updatePomodoro('breakMinutes', Number(e.target.value))
            }
          />
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;

