import React, { useMemo, useState } from 'react';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Task, TaskFormData } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import TaskModal from '@/components/TaskModal';
import { useToast } from '@/hooks/use-toast';

const CalendarPage = () => {
  const { tasks, categories, addTask } = useTaskStore();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Date | undefined>();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

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

  const handleCreateTask = (taskData: TaskFormData) => {
    addTask({
      ...taskData,
      completed: false
    });
    toast({
      title: 'Task erstellt',
      description: `"${taskData.title}" wurde erfolgreich erstellt.`
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Kalender" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            modifiers={{ event: eventDays }}
            modifiersClassNames={{ event: 'bg-blue-200 text-blue-900' }}
          />
          {selected && (
            <Card className="mt-6 lg:mt-0 lg:w-1/2">
              <CardHeader>
                <CardTitle>
                  Aufgaben am {selected.toLocaleDateString('de-DE')}
                </CardTitle>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => setIsTaskModalOpen(true)}
                >
                  Neue Task
                </Button>
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
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleCreateTask}
        categories={categories}
        defaultCategoryId={categories[0]?.id}
        defaultDueDate={selected}
      />
    </div>
  );
};

export default CalendarPage;
