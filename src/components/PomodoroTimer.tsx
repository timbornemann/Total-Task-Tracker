import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettings, SettingsProvider } from '@/hooks/useSettings';
import {
  usePomodoroHistory,
  PomodoroHistoryProvider
} from '@/hooks/usePomodoroHistory.tsx';

interface PomodoroState {
  isRunning: boolean;
  isPaused: boolean;
  remainingTime: number;
  mode: 'work' | 'break';
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
  tick: () => void;
  setStartTime: (time?: number) => void;
  setLastTick: (time: number) => void;
  setDurations: (work: number, brk: number) => void;
}

const WORK_DURATION = 25 * 60; // 25 Minuten
const BREAK_DURATION = 5 * 60; // 5 Minuten

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    set => ({
      isRunning: false,
      isPaused: false,
      pauseStart: undefined,
      remainingTime: WORK_DURATION,
      mode: 'work',
      currentTaskId: undefined,
      workDuration: WORK_DURATION,
      breakDuration: BREAK_DURATION,
      startTime: undefined,
      lastTick: undefined,
      start: (taskId?: string) =>
        set(state => ({
          isRunning: true,
          isPaused: false,
          pauseStart: undefined,
          remainingTime: state.workDuration,
          mode: 'work',
          currentTaskId: taskId,
          startTime: Date.now(),
          lastTick: Date.now()
        })),
      pause: () => set({ isPaused: true, pauseStart: Date.now() }),
      resume: () => set({ isPaused: false, lastTick: Date.now(), pauseStart: undefined }),
      reset: () =>
        set(state => ({
          isRunning: false,
          isPaused: false,
          remainingTime: state.workDuration,
          mode: 'work',
          currentTaskId: undefined,
          startTime: undefined,
          lastTick: undefined,
          pauseStart: undefined
        })),
      startBreak: () =>
        set(state => ({
          isRunning: true,
          isPaused: false,
          pauseStart: undefined,
          mode: 'break',
          remainingTime: state.breakDuration,
          lastTick: Date.now()
        })),
      tick: () =>
        set(state => {
          if (!state.isRunning || state.isPaused) return state;
          if (state.remainingTime > 0) {
            return { remainingTime: state.remainingTime - 1, lastTick: Date.now() };
          }
          const nextMode = state.mode === 'work' ? 'break' : 'work';
          return {
            mode: nextMode,
            remainingTime:
              nextMode === 'work' ? state.workDuration : state.breakDuration,
            lastTick: Date.now()
          } as PomodoroState;
        }),
      setStartTime: time => set({ startTime: time }),
      setLastTick: time => set({ lastTick: time }),
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
  /** Hide floating button when displayed inside floating window */
  floating?: boolean;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ compact, size = 80, floating }) => {
  const {
    isRunning,
    isPaused,
    remainingTime,
    mode,
    start,
    pause,
    resume,
    reset,
    startBreak,
    pauseStart,
    workDuration,
    breakDuration,
    setDurations,
    setStartTime,
    startTime
  } = usePomodoroStore();
  const { pomodoro, updatePomodoro } = useSettings();
  const { addSession, endBreak } = usePomodoroHistory();
  const pipWindowRef = useRef<Window | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isPaused) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [isPaused]);

  useEffect(() => {
    if (!isPaused) return;
    const id = setInterval(() => {
      endBreak(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [isPaused, endBreak]);

  const pauseDuration = pauseStart ? Math.floor((now - pauseStart) / 1000) : 0;

  const openFloatingWindow = async () => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.focus();
      return;
    }
    try {
      let pip: Window | null = null;
      if ((window as any).documentPictureInPicture) {
        pip = await (window as any).documentPictureInPicture.requestWindow({
          width: 200,
          height: 200
        });
      } else {
        pip = window.open('', '', 'width=200,height=200');
      }
      if (!pip) return;
      pipWindowRef.current = pip;
      if (!pip.document.body) {
        pip.document.write('<!DOCTYPE html><html><head></head><body></body></html>');
        pip.document.close();
      }
      pip.document.title = 'Pomodoro';
      pip.document.documentElement.className = document.documentElement.className;
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
        const clone = el.cloneNode(true) as HTMLElement;
        pip.document.head.appendChild(clone);
      });
      pip.document.body.style.margin = '0';
      const container = pip.document.createElement('div');
      pip.document.body.appendChild(container);
      const root = ReactDOM.createRoot(container);
      const renderTimer = () => {
        const size = Math.max(40, Math.floor((Math.min(pip!.innerWidth, pip!.innerHeight) - 40) / 2));
        root.render(
          <SettingsProvider>
            <PomodoroHistoryProvider>
              <PomodoroTimer size={size} floating />
            </PomodoroHistoryProvider>
          </SettingsProvider>
        );
      };
      renderTimer();
      pip.addEventListener('resize', renderTimer);
      const cleanup = () => {
        pip.removeEventListener('resize', renderTimer);
        pipWindowRef.current = null;
      };
      pip.addEventListener('pagehide', cleanup);
      pip.addEventListener('beforeunload', cleanup);
    } catch (err) {
      console.error('Failed to open floating window', err);
    }
  };
  const handlePause = () => {
    if (mode === 'work' && startTime) {
      const now = Date.now();
      addSession(startTime, now);
      endBreak(now);
      setStartTime(undefined);
    }
    if (mode === 'break') {
      endBreak(Date.now());
    }
    pause();
  };

  const handleReset = () => {
    if (mode === 'work' && startTime) {
      addSession(startTime, Date.now());
    }
    if (mode === 'break') {
      endBreak(Date.now());
    }
    reset();
  };

  const handleResume = () => {
    resume();
    endBreak(Date.now());
    if (mode === 'work') {
      setStartTime(Date.now());
    }
  };

  const handleStartBreak = () => {
    startBreak();
  };

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
            {isPaused ? `Pause: ${formatTime(pauseDuration)}` : formatTime(remainingTime)}
          </div>
        </div>
      </div>
      <div className="flex space-x-2 mt-4">
        {!isRunning && <Button onClick={() => start()}>Start</Button>}
        {isRunning && !isPaused && (
          <Button onClick={handlePause} variant="outline">
            Pause
          </Button>
        )}
        {isRunning && !isPaused && mode === 'work' && !floating && !compact && (
          <Button onClick={handleStartBreak} variant="outline">
            Break
          </Button>
        )}
        {isRunning && isPaused && (
          <Button onClick={handleResume} variant="outline">
            Weiter
          </Button>
        )}
        {isRunning && !floating && !compact && (
          <Button onClick={handleReset} variant="outline">
            Reset
          </Button>
        )}
        {!floating && (
          <Button onClick={openFloatingWindow} variant="outline">
            Float
          </Button>
        )}
      </div>
      {!floating && !compact && (
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
      )}
    </div>
  );
};

export default PomodoroTimer;

