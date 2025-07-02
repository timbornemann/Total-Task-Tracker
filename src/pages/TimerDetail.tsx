import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import TimerCircle from '@/components/TimerCircle';
import { Button } from '@/components/ui/button';
import { useTimers } from '@/hooks/useTimers';
import { Play, Pause, RotateCcw, Plus } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const TimerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const timer = useTimers(state => state.timers.find(t => t.id === id));
  const { startTimer, pauseTimer, resumeTimer, stopTimer, extendTimer } =
    useTimers();
  const { timerExtendSeconds } = useSettings();
  if (!timer) return null;
  const { title, color, duration, remaining, isRunning, isPaused } = timer;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar title={t('timers.detailTitle')} onHomeClick={() => navigate(-1)} />
      <div className="flex-grow flex flex-col items-center justify-center space-y-4 p-4">
        <TimerCircle
          remaining={remaining}
          duration={duration}
          color={color}
          size={150}
          paused={isPaused}
        />
        <div className="text-xl font-semibold">{title}</div>
        <div className="flex space-x-2">
          {!isRunning && (
            <Button onClick={() => startTimer(id!)}>
              <Play className="h-4 w-4 mr-2" /> {t('timers.start')}
            </Button>
          )}
          {isRunning && !isPaused && (
            <Button variant="outline" onClick={() => pauseTimer(id!)}>
              <Pause className="h-4 w-4 mr-2" /> {t('timers.pause')}
            </Button>
          )}
          {isRunning && isPaused && (
            <Button variant="outline" onClick={() => resumeTimer(id!)}>
              <Play className="h-4 w-4 mr-2" /> {t('timers.resume')}
            </Button>
          )}
          {isRunning && (
            <Button variant="outline" onClick={() => extendTimer(id!, timerExtendSeconds)}>
              <Plus className="h-4 w-4 mr-2" /> {t('timers.extend')}
            </Button>
          )}
          {isRunning && (
            <Button variant="outline" onClick={() => stopTimer(id!)}>
              <RotateCcw className="h-4 w-4 mr-2" /> {t('timers.stop')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimerDetail;
