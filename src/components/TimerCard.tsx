import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Plus } from 'lucide-react';
import TimerCircle from './TimerCircle';
import { useTimers } from '@/hooks/useTimers';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';

interface Props {
  id: string;
}

const TimerCard: React.FC<Props> = ({ id }) => {
  const navigate = useNavigate();
  const timer = useTimers(state => state.timers.find(t => t.id === id));
  const { startTimer, pauseTimer, resumeTimer, extendTimer } = useTimers();
  const { timerExtendSeconds } = useSettings();
  if (!timer) return null;
  const { title, color, duration, remaining, isRunning, isPaused } = timer;
  const handleClick = () => navigate(`/timers/${id}`);
  return (
    <div className="p-4 border rounded shadow flex flex-col items-center">
      <div className="cursor-pointer" onClick={handleClick}>
        <TimerCircle
          remaining={remaining}
          duration={duration}
          color={color}
          size={60}
          paused={isPaused}
        />
      </div>
      <div className="mt-2 text-sm font-semibold text-center break-all w-full">
        {title}
      </div>
      <div className="flex space-x-1 mt-2">
        {!isRunning && (
          <Button size="icon" variant="outline" onClick={() => startTimer(id)}>
            <Play className="h-4 w-4" />
          </Button>
        )}
        {isRunning && !isPaused && (
          <Button size="icon" variant="outline" onClick={() => pauseTimer(id)}>
            <Pause className="h-4 w-4" />
          </Button>
        )}
        {isRunning && isPaused && (
          <Button size="icon" variant="outline" onClick={() => resumeTimer(id)}>
            <Play className="h-4 w-4" />
          </Button>
        )}
        {isRunning && (
          <Button
            size="icon"
            variant="outline"
            onClick={() => extendTimer(id, timerExtendSeconds)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        {!isRunning && remaining === 0 && (
          <Button size="icon" variant="outline" onClick={() => startTimer(id)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default TimerCard;
