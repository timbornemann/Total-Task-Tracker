import React, { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronLeft, ChevronRight, Move, GripVertical } from 'lucide-react';
import TaskModal from '@/components/TaskModal';
import { TaskFormData, Task } from '@/types';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useSettings } from '@/hooks/useSettings';

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

const formatTime = (m: number) => {
  const h = Math.floor(m / 60)
  const mm = Math.floor(m % 60)
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

const snap = (m: number) => {
  return Math.min(1440, Math.max(0, Math.round(m / 30) * 30))
}

const TimeBlockingPage = () => {
  const { tasks, categories, addTask, updateTask } = useTaskStore()
  const { t } = useTranslation()
  const { colorPalette } = useSettings()
  const locale = i18n.language === 'de' ? 'de-DE' : 'en-US'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDefaults, setModalDefaults] = useState<{
    start?: string
    end?: string
    due?: Date
  }>({})
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach(t => {
      if (!t.dueDate || t.visible === false) return;
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

  const handleUpdateTimes = (id: string, start: number, end: number) => {
    updateTask(id, {
      startTime: formatTime(start),
      endTime: formatTime(end)
    })
  }

  const handleCreateFromSchedule = (start: number, end: number, day: Date) => {
    setModalDefaults({
      start: formatTime(start),
      end: formatTime(end),
      due: day
    })
    setIsModalOpen(true)
  }

  interface LayoutItem {
    task: Task
    start: number
    end: number
    column: number
    columns: number
  }

  const layoutTasks = (list: Task[]) => {

    const events = list
      .map(t => {
        const start = parseMinutes(t.startTime) ?? 0;
        const end = parseMinutes(t.endTime) ?? start + 30;
        return { task: t, start, end };
      })
      .sort((a, b) => a.start - b.start);

    const result: LayoutItem[] = [];
    let group: typeof events = [];
    let groupEnd = 0;

    const flushGroup = () => {
      if (group.length === 0) return;
      const colsEnd: number[] = [];
      const groupItems: LayoutItem[] = [];
      group.forEach(ev => {
        let col = colsEnd.findIndex(e => e <= ev.start);
        if (col === -1) {
          col = colsEnd.length;
          colsEnd.push(ev.end);
        } else {
          colsEnd[col] = ev.end;
        }
        groupItems.push({ ...ev, column: col, columns: 0 });
      });
      const total = colsEnd.length;
      groupItems.forEach(i => (i.columns = total));
      result.push(...groupItems);
    };

    for (const ev of events) {
      if (group.length === 0) {
        group.push(ev);
        groupEnd = ev.end;
      } else if (ev.start < groupEnd) {
        group.push(ev);
        groupEnd = Math.max(groupEnd, ev.end);
      } else {
        flushGroup();
        group = [ev];
        groupEnd = ev.end;
      }
    }
    flushGroup();
    return result;
  };

  const DaySchedule = ({
    tasks,
    showTimes = true,
    date
  }: {
    tasks: Task[]
    showTimes?: boolean
    date: Date
  }) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [drag, setDrag] = useState<{
      id: string
      type: 'move' | 'resize'
      start: number
      end: number
      initialY: number
      duration: number
      column: number
      columns: number
    } | null>(null)
    const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)

    const displayTasks = useMemo(() => {
      if (!drag) return tasks
      return tasks.map(t =>
        t.id === drag.id
          ? { ...t, startTime: formatTime(drag.start), endTime: formatTime(drag.end) }
          : t
      )
    }, [tasks, drag])

    const layout = useMemo(() => {
      const items = layoutTasks(displayTasks)
      if (drag) {
        const current = items.find(i => i.task.id === drag.id)
        if (current) {
          current.column = drag.column
          current.columns = drag.columns
        }
      }
      return items
    }, [displayTasks, drag?.id, drag?.column, drag?.columns])

    const getMinutes = (clientY: number) => {
      const rect = containerRef.current!.getBoundingClientRect()
      const y = clientY - rect.top
      return snap((y / rect.height) * 1440)
    }

    const handleTaskPointerDown = (
      item: LayoutItem,
      e: React.PointerEvent<HTMLDivElement>,
      action: 'move' | 'resize' | null = null
    ) => {
      e.stopPropagation()
      const type: 'move' | 'resize' = action ?? 'move'
      containerRef.current?.setPointerCapture(e.pointerId)
      setDrag({
        id: item.task.id,
        type,
        start: item.start,
        end: item.end,
        initialY: e.clientY,
        duration: item.end - item.start,
        column: item.column,
        columns: item.columns
      })
    }

    const handleContainerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target !== containerRef.current) return
      const m = getMinutes(e.clientY)
      setSelection({ start: m, end: m })
      containerRef.current?.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (drag) {
        const rect = containerRef.current!.getBoundingClientRect()
        const pixelDiff = e.clientY - drag.initialY
        const minuteDiff = (pixelDiff / rect.height) * 1440
        
        if (drag.type === 'move') {
          let start = snap(drag.start + minuteDiff)
          let end = snap(start + drag.duration)
          
          if (start < 0) {
            start = 0
            end = drag.duration
          }
          if (end > 1440) {
            end = 1440
            start = end - drag.duration
          }
          
          setDrag({ ...drag, start, end, initialY: e.clientY })
        } else {
          let end = snap(drag.end + minuteDiff)
          
          if (end < drag.start + 30) end = drag.start + 30
          if (end > 1440) end = 1440
          
          setDrag({ ...drag, end, initialY: e.clientY })
        }
      } else if (selection) {
        setSelection(prev => (prev ? { ...prev, end: getMinutes(e.clientY) } : null))
      }
    }

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (drag) {
        handleUpdateTimes(drag.id, drag.start, drag.end)
        setDrag(null)
      }
      if (selection) {
        let { start, end } = selection
        if (end < start) [start, end] = [end, start]
        if (end === start) end = start + 30
        handleCreateFromSchedule(start, end, date)
        setSelection(null)
      }
      containerRef.current?.releasePointerCapture(e.pointerId)
    }

    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== containerRef.current) return
      const start = getMinutes(e.clientY)
      handleCreateFromSchedule(start, start + 30, date)
    }

    return (
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
        <div
          ref={containerRef}
          className="absolute inset-0 ml-14 mr-2"
          onPointerDown={handleContainerPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
        >
          {layout.map(item => {
            const { task, start, end, column, columns } = item
            const top = (start / 1440) * 100
            const height = Math.max(((end - start) / 1440) * 100, 2)
            const width = 100 / columns
            const left = column * width
            return (
              <div
                key={task.id}
                onPointerDown={e => handleTaskPointerDown(item, e)}
                className="absolute rounded text-sm overflow-hidden cursor-pointer pl-4 pr-2 py-1"
                style={{
                  top: `${top}%`,
                  height: `${height}%`,
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: colorPalette[task.color]
                }}
              >
                <div
                  className="absolute top-0 left-0 p-0.5 cursor-move"
                  onPointerDown={e => handleTaskPointerDown(item, e, 'move')}
                >
                  <Move className="h-3 w-3" />
                </div>
                <div
                  className="absolute bottom-0 right-0 p-0.5 cursor-ns-resize"
                  onPointerDown={e => handleTaskPointerDown(item, e, 'resize')}
                >
                  <GripVertical className="h-3 w-3" />
                </div>
                <div className="font-medium truncate">{task.title}</div>
                <div className="text-xs">
                  {task.startTime} - {task.endTime}
                </div>
              </div>
            )
          })}
          {selection && (
            <div
              className="absolute bg-primary opacity-30 rounded"
              style={{
                top: `${(Math.min(selection.start, selection.end) / 1440) * 100}%`,
                height: `${(Math.abs(selection.end - selection.start) / 1440) * 100}%`,
                left: 0,
                right: 0
              }}
            />
          )}
        </div>
      </div>
    )
  }

  const renderDay = () => (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-1/3">
        <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} />
      </div>
      <div className="flex-1 space-y-4">
        {dayWithoutTimes.length > 0 && (
          <div>
            <h3 className="font-medium mb-1">{t('timeBlocking.withoutTime')}</h3>
            <ul className="space-y-2">
              {dayWithoutTimes.map(task => (
                <li
                  key={task.id}
                  className="flex items-center space-x-2 border rounded p-2"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colorPalette[task.color] }}
                  />
                  <span className="truncate">{task.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <DaySchedule tasks={dayWithTimes} date={date} showTimes />
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
          {weekDays[0].toLocaleDateString(locale)} - {weekDays[6].toLocaleDateString(locale)}
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
                {d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' })}
              </div>
              {withoutTimes.length > 0 && (
                <ul className="space-y-1 text-sm mb-1">
                  {withoutTimes.map(task => (
                    <li
                      key={task.id}
                      className="flex items-center space-x-1 border rounded p-1"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colorPalette[task.color] }}
                      />
                      <span className="truncate">{task.title}</span>
                    </li>
                  ))}
                </ul>
              )}
              <DaySchedule
                tasks={withTimes}
                showTimes={idx === 0}
                date={d}
              />
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
            {date.toLocaleDateString(locale, {
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
                            style={{ backgroundColor: colorPalette[task.color] }}
                          />
                          <span className="truncate">{task.title}</span>
                        </div>
                      ))}
                      {getTasksFor(d).length > 3 && (
                        <div className="text-muted-foreground">
                          {t('timeBlocking.more', {
                            count: getTasksFor(d).length - 3
                          })}
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
      <Navbar title={t('timeBlocking.title')} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={v => v && setView(v as 'day' | 'week' | 'month')}
        >
          <ToggleGroupItem value="day">{t('timeBlocking.day')}</ToggleGroupItem>
          <ToggleGroupItem value="week">{t('timeBlocking.week')}</ToggleGroupItem>
          <ToggleGroupItem value="month">{t('timeBlocking.month')}</ToggleGroupItem>
        </ToggleGroup>
      <div className="mt-4">
        {view === 'day' && renderDay()}
        {view === 'week' && renderWeek()}
        {view === 'month' && renderMonth()}
      </div>
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setModalDefaults({})
        }}
        onSave={(data: TaskFormData) => {
          addTask({ 
            ...data, 
            completed: false,
            status: 'todo',
            order: 0
          })
        }}
        categories={categories}
        defaultCategoryId={categories[0]?.id}
        defaultDueDate={modalDefaults.due}
        defaultStartTime={modalDefaults.start}
        defaultEndTime={modalDefaults.end}
        allowRecurring={false}
      />
    </div>
  </div>
);
};

export default TimeBlockingPage;
