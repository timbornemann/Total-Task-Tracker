import React, { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Calendar } from '@/components/ui/calendar';

const parseMinutes = (time?: string) => {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

const TimeBlockingPage = () => {
  const { tasks } = useTaskStore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const dayTasks = useMemo(() => {
    if (!date) return [];
    return tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === date.toDateString());
  }, [tasks, date]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Zeitplan" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Calendar mode="single" selected={date} onSelect={setDate} />
        {date && (
          <div className="relative border mt-4 h-[600px]">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="absolute left-0 w-full border-t text-xs text-muted-foreground" style={{top: `${(i/24)*100}%`}}>
                <div className="-mt-2">{String(i).padStart(2,'0')}:00</div>
              </div>
            ))}
            {dayTasks.map(task => {
              const start = parseMinutes(task.startTime) ?? 0;
              const end = parseMinutes(task.endTime) ?? start + 30;
              const top = (start/1440)*100;
              const height = Math.max((end-start)/1440*100, 2);
              return (
                <div key={task.id} className="absolute left-16 right-2 bg-primary/20 rounded px-2 text-sm overflow-hidden" style={{top:`${top}%`,height:`${height}%`}}>
                  <div className="font-medium truncate">{task.title}</div>
                  <div className="text-xs">{task.startTime} - {task.endTime}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeBlockingPage;
