import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import TimerCard from '@/components/TimerCard';
import TimerModal from '@/components/TimerModal';
import { Button } from '@/components/ui/button';
import { useTimers } from '@/hooks/useTimers';
import { useTranslation } from 'react-i18next';

const TimersPage: React.FC = () => {
  const { t } = useTranslation();
  const timers = useTimers(state => state.timers);
  const addTimer = useTimers(state => state.addTimer);
  const [open, setOpen] = useState(false);

  const handleSave = (data: {
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
    color: number;
  }) => {
    const duration = data.hours * 3600 + data.minutes * 60 + data.seconds;
    addTimer({ title: data.title, color: data.color, duration });
  };

  const sorted = [...timers].sort((a, b) => {
    if (a.isRunning === b.isRunning) return 0;
    return a.isRunning ? -1 : 1;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar title={t('navbar.timers')} />
      <div className="p-4 flex-1">
        <div className="mb-4">
          <Button onClick={() => setOpen(true)}>{t('timers.new')}</Button>
        </div>
        {sorted.length === 0 && (
          <p className="text-center text-muted-foreground">{t('timers.none')}</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sorted.map(t => (
            <TimerCard key={t.id} id={t.id} />
          ))}
        </div>
      </div>
      <TimerModal isOpen={open} onClose={() => setOpen(false)} onSave={handleSave} />
    </div>
  );
};

export default TimersPage;
