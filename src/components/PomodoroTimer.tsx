import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactDOM from "react-dom/client";
import { Button } from "@/components/ui/button";
import { usePomodoroStore } from "@/stores/pomodoro";
import { useSettings, SettingsProvider } from "@/hooks/useSettings";
import { hslToHex, hexToHsl, complementaryColor } from "@/utils/color";
import { playSound } from "@/utils/sounds";
import {
  usePomodoroHistory,
  PomodoroHistoryProvider,
} from "@/hooks/usePomodoroHistory.tsx";

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
    remainingTime: storeRemainingTime, // Rename to distinguish from local smooth state
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
    startTime: storeStartTime,
    endTime, // Use endTime for smooth calcs
  } = usePomodoroStore();
  const { pomodoro, updatePomodoro, theme } = useSettings();
  const { addSession } = usePomodoroHistory();
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

  // Local state for smooth updates
  const [smoothRemaining, setSmoothRemaining] = useState(storeRemainingTime);
  const [smoothProgress, setSmoothProgress] = useState(0);

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

  // High frequency update loop for smooth visuals
  useEffect(() => {
    if (!isRunning || isPaused || !endTime) {
      // Fallback to store values when not running smoothly
      setSmoothRemaining(storeRemainingTime);
      const duration = mode === "work" ? workDuration : breakDuration;
      setSmoothProgress(storeRemainingTime / duration);
      return;
    }

    let animationFrameId: number;

    const animate = () => {
      const now = Date.now();
      const msRemaining = Math.max(0, endTime - now);
      const secondsRemaining = Math.ceil(msRemaining / 1000);
      
      const duration = mode === "work" ? workDuration : breakDuration;
      // Calculate precise progress (0.0 to 1.0)
      // We use ms for the ring to be buttery smooth
      // Total duration in ms
      const durationMs = duration * 1000;
      // Progress acts inverted in the original code (remaining / total)
      const exactProgress = Math.min(1, Math.max(0, msRemaining / durationMs));
      
      setSmoothRemaining(secondsRemaining);
      setSmoothProgress(exactProgress);

      if (msRemaining > 0) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, isPaused, endTime, mode, workDuration, breakDuration, storeRemainingTime]);


  // Keep 'now' updated for pause duration display (low freq is fine for this)
  useEffect(() => {
    if (!isPaused) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [isPaused]);

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
  // We rely on store.startTime for both work and break now.

  const handlePause = () => {
    if (storeStartTime) {
      addSession(storeStartTime, Date.now(), mode);
      setStartTime(undefined);
    }
    pause();
  };

  const handleReset = () => {
    if (storeStartTime) {
      addSession(storeStartTime, Date.now(), mode);
    }
    setStartTime(undefined);
    reset();
  };

  const handleResume = () => {
    if (pauseStart) {
      addSession(pauseStart, Date.now(), "break");
    }
    resume();
    // Resume function in store now handles startTime/endTime logic
  };

  const handleStartBreak = () => {
    // If we are currently working, save the work done so far
    if (mode === "work" && storeStartTime) {
      addSession(storeStartTime, Date.now(), "work");
    } else if (pauseStart) {
      // If we were paused, the gap was a break
      addSession(pauseStart, Date.now(), "break");
    }
    startBreak();
    // Store sets startTime in startBreak()
  };

  const handleSkipBreak = () => {
    // If we are currently in a break, save the break time taken so far
    if (mode === "break" && storeStartTime) {
      addSession(storeStartTime, Date.now(), "break");
    } else if (pauseStart) {
      addSession(pauseStart, Date.now(), "break");
    }
    skipBreak();
    // Store sets startTime in skipBreak()
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

    // Helper to update a document's styles
    const updateStyles = (doc: Document) => {
      if (mode === "break") {
        const comp = hexToHsl(complementaryColor(hslToHex(breakColor)));
        doc.documentElement.style.setProperty("--background", breakColor);
        doc.documentElement.style.setProperty("--pomodoro-break-ring", comp);
      } else {
        doc.documentElement.style.setProperty("--background", theme.background);
        doc.documentElement.style.setProperty(
          "--pomodoro-break-ring",
          breakColor,
        );
      }
    };

    updateStyles(document);
    if (pipWindowRef.current) {
      updateStyles(pipWindowRef.current.document);
    }

    return () => {
      // limiting cleanup to main doc for safety, PIP cleanup handled on close
      document.documentElement.style.setProperty(
        "--background",
        theme.background,
      );
      document.documentElement.style.setProperty(
        "--pomodoro-break-ring",
        breakColor,
      );
      if (pipWindowRef.current && pipWindowRef.current.document) {
        pipWindowRef.current.document.documentElement.style.setProperty(
          "--background",
          theme.background,
        );
        pipWindowRef.current.document.documentElement.style.setProperty(
          "--pomodoro-break-ring",
          breakColor,
        );
      }
    };
  }, [mode, pomodoro.workSound, pomodoro.breakSound, theme, pipWindowRef]);

  if (compact && !isRunning) return null;

  const radius = size;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  // Use smoothProgress for ring, smoothRemaining for text
  // smoothProgress is 0..1 (remaining/total), but we want inverse for strokeDashoffset calc if we want it to shrink
  // The original code was: progress = remainingTime / duration
  // strokeDashoffset = circumference - progress * circumference
  
  // So if progress is 1 (full), offset is 0 (full ring).
  // If progress is 0 (empty), offset is circumference (empty ring).
  const strokeDashoffset = circumference - smoothProgress * circumference;

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
              transition: "stroke-dashoffset 0s linear", // Disable CSS transition for smooth JS animation
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
              : formatTime(smoothRemaining)}
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
        {isRunning && !isPaused && mode === "work" && !compact && (
          <Button onClick={handleStartBreak} variant="outline">
            {t("pomodoroTimer.break")}
          </Button>
        )}
        {isRunning && !isPaused && mode === "break" && !compact && (
          <Button onClick={handleSkipBreak} variant="outline">
            {t("pomodoroTimer.skipBreak")}
          </Button>
        )}
        {isRunning && isPaused && (
          <Button onClick={handleResume} variant="outline">
            {t("pomodoroTimer.resume")}
          </Button>
        )}
        {isRunning && !compact && (
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
