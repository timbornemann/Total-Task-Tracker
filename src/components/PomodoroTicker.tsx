import { useEffect, useRef } from "react";
import { usePomodoroStore } from "@/stores/pomodoro";
import { usePomodoroHistory } from "@/hooks/usePomodoroHistory.tsx";

const PomodoroTicker = () => {
  const tick = usePomodoroStore((state) => state.tick);
  const lastTick = usePomodoroStore((state) => state.lastTick);
  const setLastTick = usePomodoroStore((state) => state.setLastTick);
  const mode = usePomodoroStore((state) => state.mode);
  const setStartTime = usePomodoroStore((state) => state.setStartTime);
  const startTime = usePomodoroStore((state) => state.startTime);
  const { addSession, endBreak } = usePomodoroHistory();
  const prevMode = useRef(mode);

  useEffect(() => {
    if (lastTick) {
      const diff = Math.floor((Date.now() - lastTick) / 1000);
      if (diff > 1) {
        for (let i = 0; i < diff; i++) tick();
      }
    }
    setLastTick(Date.now());
    const interval = setInterval(() => {
      tick();
      setLastTick(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [tick, setLastTick]);

  useEffect(() => {
    if (prevMode.current === "work" && mode === "break" && startTime) {
      addSession(startTime, Date.now());
      setStartTime(undefined);
    }
    if (prevMode.current === "break" && mode === "work") {
      endBreak(Date.now());
      setStartTime(Date.now());
    }
    prevMode.current = mode;
  }, [mode, startTime, addSession, endBreak, setStartTime]);

  return null;
};

export default PomodoroTicker;
