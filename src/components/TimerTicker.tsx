import { useEffect } from "react";
import { useTimers } from "@/hooks/useTimers";

const TimerTicker = () => {
  const tick = useTimers((state) => state.tick);
  useEffect(() => {
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [tick]);
  return null;
};

export default TimerTicker;
