import React, { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const parseMinutes = (time?: string) => {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

const startOfWeek = (d: Date) => {
  const date = new Date(d);
  const diff = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfMonth = (d: Date) => {
  const date = new Date(d.getFullYear(), d.getMonth(), 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const TimeBlockingPage = () => {
  const { tasks } = useTaskStore();
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const key = new Date(t.dueDate).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const getTasksFor = (d: Date) => tasksByDate[d.toDateString()] || [];

  const dayTasks = useMemo(() => getTasksFor(date), [tasksByDate, date]);
  const dayWithTimes = dayTasks.filter(t => t.startTime || t.endTime);
  const dayWithoutTimes = dayTasks.filter(t => !t.startTime && !t.endTime);

  const weekDays = useMemo(() => {
    const start = startOfWeek(date);
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [date]);

  const eventDays = useMemo(() => Object.keys(tasksByDate).map(d => new Date(d)), [tasksByDate]);

  const DaySchedule = ({ tasks, showTimes = true }: { tasks: typeof dayTasks; showTimes?: boolean }) => (
    <div className="relative border h-[600px]">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 w-full border-t text-xs text-muted-foreground"
          style={{ top: `${(i / 24) * 100}%` }}
        >
          {showTimes && <div className="-mt-2">{String(i).padStart(2, '0')}:00</div>}
        </div>
      ))}
      {tasks.map(task => {
        const start = parseMinutes(task.startTime) ?? 0;
        const end = parseMinutes(task.endTime) ?? start + 30;
        const top = (start / 1440) * 100;
        const height = Math.max(((end - start) / 1440) * 100, 2);
        return (
          <div
            key={task.id}
            className="absolute left-14 right-2 bg-primary/20 rounded px-2 text-sm overflow-hidden"
            style={{ top: `${top}%`, height: `${height}%` }}
          >
            <div className="font-medium truncate">{task.title}</div>
            <div className="text-xs">
              {task.startTime} - {task.endTime}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDay = () => (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-1/3">
        <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} />
      </div>
      <div className="flex-1 space-y-4">
        <DaySchedule tasks={dayWithTimes} />
        {dayWithoutTimes.length > 0 && (
          <div>
            <h3 className="font-medium text-sm mb-1">Ohne Uhrzeit</h3>
            <ul className="space-y-1 text-sm">
              {dayWithoutTimes.map(task => (
                <li key={task.id} className="flex items-center space-x-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: task.color }}
                  />
                  <span className="truncate">{task.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  const renderWeek = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          className="p-1 rounded hover:bg-muted"
          onClick={() => setDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="font-medium">
          {weekDays[0].toLocaleDateString('de-DE')} - {weekDays[6].toLocaleDateString('de-DE')}
        </div>
        <button
          className="p-1 rounded hover:bg-muted"
          onClick={() => setDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((d, idx) => {
          const dayList = getTasksFor(d);
          const withTimes = dayList.filter(t => t.startTime || t.endTime);
          const withoutTimes = dayList.filter(t => !t.startTime && !t.endTime);
          return (
            <div key={d.toDateString()} className="flex flex-col space-y-1">
              <div className="text-center text-sm font-medium">
                {d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' })}
              </div>
              <DaySchedule tasks={withTimes} showTimes={idx === 0} />
              {withoutTimes.length > 0 && (
                <ul className="mt-1 space-y-1 text-xs">
                  {withoutTimes.map(task => (
                    <li key={task.id} className="flex items-center space-x-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: task.color }}
                      />
                      <span className="truncate">{task.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMonth = () => {
    const start = startOfMonth(date);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days: (Date | null)[] = [];
    const prefix = (start.getDay() + 6) % 7;
    for (let i = 0; i < prefix; i++) days.push(null);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    while (days.length % 7 !== 0) days.push(null);
    const weeks = [] as (Date | null)[][];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const handlePrev = () =>
      setDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNext = () =>
      setDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button className="p-1 rounded hover:bg-muted" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="font-medium">
            {date.toLocaleDateString('de-DE', {
              month: 'long',
              year: 'numeric'
            })}
          </div>
          <button className="p-1 rounded hover:bg-muted" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weeks.map((week, wi) => (
            <React.Fragment key={wi}>
              {week.map((d, di) => (
                <div
                  key={di}
                  className="min-h-[100px] border rounded p-1 text-xs space-y-1"
                  onClick={() => d && setDate(d)}
                >
                  {d && (
                    <>
                      <div className="font-semibold text-sm">
                        {d.getDate()}
                      </div>
                      {getTasksFor(d).slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          className="flex items-center space-x-1 truncate"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.color }}
                          />
                          <span className="truncate">{task.title}</span>
                        </div>
                      ))}
                      {getTasksFor(d).length > 3 && (
                        <div className="text-muted-foreground">
                          +{getTasksFor(d).length - 3} mehr
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Zeitplan" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={v => v && setView(v as 'day' | 'week' | 'month')}
        >
          <ToggleGroupItem value="day">Tag</ToggleGroupItem>
          <ToggleGroupItem value="week">Woche</ToggleGroupItem>
          <ToggleGroupItem value="month">Monat</ToggleGroupItem>
        </ToggleGroup>
        <div className="mt-4">
          {view === 'day' && renderDay()}
          {view === 'week' && renderWeek()}
          {view === 'month' && renderMonth()}
        </div>
      </div>
    </div>
  );
};

export default TimeBlockingPage;
