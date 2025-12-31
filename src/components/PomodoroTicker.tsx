import { useEffect } from "react";
import { usePomodoroStore } from "@/stores/pomodoro";
import { usePomodoroHistory } from "@/hooks/usePomodoroHistory.tsx";

const PomodoroTicker = () => {
  const tick = usePomodoroStore((state) => state.tick);
  const lastTick = usePomodoroStore((state) => state.lastTick);
  const setLastTick = usePomodoroStore((state) => state.setLastTick);
  const mode = usePomodoroStore((state) => state.mode);
  const setStartTime = usePomodoroStore((state) => state.setStartTime);
  const startTime = usePomodoroStore((state) => state.startTime);
  const { addSession } = usePomodoroHistory();

  const finishedSession = usePomodoroStore((state) => state.finishedSession);
  const consumeFinishedSession = usePomodoroStore((state) => state.consumeFinishedSession);

  useEffect(() => {
    // Tick handles drift internally now, so we just trigger it. 
    // If we missed many ticks (bg tab), the next tick will catch up in one go.
    setLastTick(Date.now());
    const interval = setInterval(() => {
      tick();
      // We don't strictly need setLastTick here as tick() does it, 
      // but it doesn't hurt to keep local sync if needed for other things.
    }, 1000);
    return () => clearInterval(interval);
  }, [tick, setLastTick]);

  useEffect(() => {
    if (finishedSession) {
        addSession(finishedSession.start, finishedSession.end, finishedSession.type);
        consumeFinishedSession();
    }
  }, [finishedSession, addSession, consumeFinishedSession]);

  return null;
};

export default PomodoroTicker;
