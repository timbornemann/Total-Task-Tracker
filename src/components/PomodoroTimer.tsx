import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactDOM from "react-dom/client";
import { Button } from "@/components/ui/button";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSettings, SettingsProvider } from "@/hooks/useSettings";
import { hslToHex, hexToHsl, complementaryColor } from "@/utils/color";
import {
  usePomodoroHistory,
  PomodoroHistoryProvider,
} from "@/hooks/usePomodoroHistory.tsx";

const playSound = (url?: string) => {
  if (url) {
    try {
      const audio = new Audio(url);
      audio.play().catch(() => {});
      return;
    } catch {
      // ignore errors
    }
  }
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // ignore
  }
};

interface PomodoroState {
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

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

interface PomodoroTimerProps {
  compact?: boolean;
  /** Radius of the timer circle */
  size?: number;
  /** Hide floating button when displayed inside floating window */
  floating?: boolean;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  compact,
  size = 80,
  floating,
}) => {
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
    skipBreak,
    pauseStart,
    workDuration,
    breakDuration,
    setDurations,
    setStartTime,
    startTime,
  } = usePomodoroStore();
  const { pomodoro, updatePomodoro, theme } = useSettings();
  const { addSession, endBreak } = usePomodoroHistory();
  const { t } = useTranslation();
  const pipWindowRef = useRef<Window | null>(null);
  const [now, setNow] = useState(Date.now());
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    try {
      const stored = localStorage.getItem("pomodoroFloatPos");
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore storage errors
    }
    const sizePx = size * 2 + 24;
    return {
      x: window.innerWidth - sizePx - 16,
      y: window.innerHeight - sizePx - 16,
    };
  });
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    try {
      localStorage.setItem("pomodoroFloatPos", JSON.stringify(position));
    } catch {
      // ignore storage errors
    }
  }, [position]);

  const handlePointerMove = (e: PointerEvent) => {
    const sizePx = size * 2 + 24;
    setPosition({
      x: Math.min(
        Math.max(0, e.clientX - offsetRef.current.x),
        window.innerWidth - sizePx,
      ),
      y: Math.min(
        Math.max(0, e.clientY - offsetRef.current.y),
        window.innerHeight - sizePx,
      ),
    });
  };

  const stopDrag = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopDrag);
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDrag);
  };

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
      const w = window as unknown as {
        documentPictureInPicture?: {
          requestWindow: (opts: {
            width: number;
            height: number;
          }) => Promise<Window | null>;
        };
      };
      if (w.documentPictureInPicture) {
        pip = await w.documentPictureInPicture.requestWindow({
          width: 200,
          height: 200,
        });
      } else {
        pip = window.open("", "", "width=200,height=200");
      }
      if (!pip) return;
      pipWindowRef.current = pip;
      if (!pip.document.body) {
        pip.document.write(
          "<!DOCTYPE html><html><head></head><body></body></html>",
        );
        pip.document.close();
      }
      pip.document.title = t("navbar.pomodoro");
      pip.document.documentElement.className =
        document.documentElement.className;
      document
        .querySelectorAll('style, link[rel="stylesheet"]')
        .forEach((el) => {
          const clone = el.cloneNode(true) as HTMLElement;
          pip.document.head.appendChild(clone);
        });
      pip.document.body.style.margin = "0";
      const container = pip.document.createElement("div");
      pip.document.body.appendChild(container);
      const root = ReactDOM.createRoot(container);
      const renderTimer = () => {
        const size = Math.max(
          40,
          Math.floor((Math.min(pip!.innerWidth, pip!.innerHeight) - 40) / 2),
        );
        root.render(
          <SettingsProvider>
            <PomodoroHistoryProvider>
              <PomodoroTimer size={size} floating />
            </PomodoroHistoryProvider>
          </SettingsProvider>,
        );
      };
      renderTimer();
      pip.addEventListener("resize", renderTimer);
      const cleanup = () => {
        pip.removeEventListener("resize", renderTimer);
        pipWindowRef.current = null;
      };
      pip.addEventListener("pagehide", cleanup);
      pip.addEventListener("beforeunload", cleanup);
    } catch (err) {
      console.error("Failed to open floating window", err);
    }
  };
  const handlePause = () => {
    if (mode === "work" && startTime) {
      const now = Date.now();
      addSession(startTime, now);
      endBreak(now);
      setStartTime(undefined);
    }
    if (mode === "break") {
      endBreak(Date.now());
    }
    pause();
  };

  const handleReset = () => {
    if (mode === "work" && startTime) {
      addSession(startTime, Date.now());
    }
    if (mode === "break") {
      endBreak(Date.now());
    }
    reset();
  };

  const handleResume = () => {
    resume();
    endBreak(Date.now());
    if (mode === "work") {
      setStartTime(Date.now());
    }
  };

  const handleStartBreak = () => {
    startBreak();
  };

  const handleSkipBreak = () => {
    endBreak(Date.now());
    skipBreak();
    setStartTime(Date.now());
  };

  useEffect(() => {
    setDurations(pomodoro.workMinutes * 60, pomodoro.breakMinutes * 60);
  }, [pomodoro, setDurations]);

  const prevMode = useRef(mode);
  useEffect(() => {
    if (prevMode.current !== mode) {
      if (mode === "break") {
        playSound(pomodoro.workSound);
      } else {
        playSound(pomodoro.breakSound);
      }
      prevMode.current = mode;
    }
    const breakColor = theme["pomodoro-break-ring"];
    if (mode === "break") {
      const comp = hexToHsl(
        complementaryColor(hslToHex(breakColor)),
      );
      document.documentElement.style.setProperty("--background", breakColor);
      document.documentElement.style.setProperty("--pomodoro-break-ring", comp);
    } else {
      document.documentElement.style.setProperty("--background", theme.background);
      document.documentElement.style.setProperty(
        "--pomodoro-break-ring",
        breakColor,
      );
    }
    return () => {
      document.documentElement.style.setProperty("--background", theme.background);
      document.documentElement.style.setProperty(
        "--pomodoro-break-ring",
        breakColor,
      );
    };
  }, [mode, pomodoro.workSound, pomodoro.breakSound, theme]);

  if (compact && !isRunning) return null;

  const duration = mode === "work" ? workDuration : breakDuration;
  const progress = remainingTime / duration;

  const radius = size;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      onPointerDown={compact ? startDrag : undefined}
      className={
        compact
          ? "fixed bg-background shadow-lg rounded p-3 z-50 cursor-move"
          : "flex flex-col items-center space-y-4"
      }
      style={compact ? { left: position.x, top: position.y } : undefined}
    >
      <div
        className="relative"
        style={{ width: radius * 2, height: radius * 2 }}
      >
        <svg
          width={radius * 2}
          height={radius * 2}
          className="transform -rotate-90"
        >
          <circle
            stroke="hsl(var(--muted))"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={
              mode === "work"
                ? "hsl(var(--pomodoro-work-ring))"
                : "hsl(var(--pomodoro-break-ring))"
            }
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{
              strokeDashoffset,
              transition: "stroke-dashoffset 1s linear",
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={size > 100 ? "text-4xl font-bold" : "text-2xl font-bold"}
          >
            {isPaused
              ? `${t("pomodoroTimer.pauseLabel")} ${formatTime(pauseDuration)}`
              : formatTime(remainingTime)}
          </div>
        </div>
      </div>
      <div className="flex space-x-2 mt-4">
        {!isRunning && (
          <Button onClick={() => start()}>{t("pomodoroTimer.start")}</Button>
        )}
        {isRunning && !isPaused && (
          <Button onClick={handlePause} variant="outline">
            {t("pomodoroTimer.pause")}
          </Button>
        )}
        {isRunning && !isPaused && mode === "work" && !floating && !compact && (
          <Button onClick={handleStartBreak} variant="outline">
            {t("pomodoroTimer.break")}
          </Button>
        )}
        {isRunning &&
          !isPaused &&
          mode === "break" &&
          !floating &&
          !compact && (
            <Button onClick={handleSkipBreak} variant="outline">
              {t("pomodoroTimer.skipBreak")}
            </Button>
          )}
        {isRunning && isPaused && (
          <Button onClick={handleResume} variant="outline">
            {t("pomodoroTimer.resume")}
          </Button>
        )}
        {isRunning && !floating && !compact && (
          <Button onClick={handleReset} variant="outline">
            {t("pomodoroTimer.reset")}
          </Button>
        )}
        {!floating && (
          <Button onClick={openFloatingWindow} variant="outline">
            {t("pomodoroTimer.float")}
          </Button>
        )}
      </div>
      {!floating && !compact && (
        <div className="flex space-x-2 mt-2 text-xs">
          <div className="flex items-center space-x-1">
            <span>{t("pomodoroTimer.workLabel")}</span>
            <input
              type="number"
              className="w-12 border rounded px-1"
              value={pomodoro.workMinutes}
              onChange={(e) =>
                updatePomodoro("workMinutes", Number(e.target.value))
              }
            />
          </div>
          <div className="flex items-center space-x-1">
            <span>{t("pomodoroTimer.breakLabel")}</span>
            <input
              type="number"
              className="w-12 border rounded px-1"
              value={pomodoro.breakMinutes}
              onChange={(e) =>
                updatePomodoro("breakMinutes", Number(e.target.value))
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
