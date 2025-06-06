import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Task } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CalendarPage = () => {
  const { tasks } = useTaskStore();
  const [selected, setSelected] = useState<Date | undefined>();

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    const add = (date: Date | undefined, task: Task) => {
      if (!date) return;
      const key = date.toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(task);
    };
    tasks.forEach(task => {
      add(task.dueDate, task);
      if (task.isRecurring && task.nextDue) add(task.nextDue, task);
    });
    return map;
  }, [tasks]);

  const eventDays = useMemo(() => Object.keys(tasksByDate).map(d => new Date(d)), [tasksByDate]);
  const dayTasks = selected ? tasksByDate[selected.toDateString()] || [] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Zurück</span>
                </Button>
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Kalender</h1>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          modifiers={{ event: eventDays }}
          modifiersClassNames={{ event: 'bg-blue-200 text-blue-900' }}
        />
        {selected && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                Aufgaben am {selected.toLocaleDateString('de-DE')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Aufgaben.</p>
              ) : (
                <ul className="space-y-2">
                  {dayTasks.map(task => (
                    <li key={task.id} className="text-sm">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: task.color }}
                      />
                      {task.title}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
