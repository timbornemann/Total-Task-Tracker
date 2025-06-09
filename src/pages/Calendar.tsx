import React, { useMemo, useState } from 'react';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Task, TaskFormData } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import TaskModal from '@/components/TaskModal';
import TaskCard from '@/components/TaskCard';
import TaskDetailModal from '@/components/TaskDetailModal';
import { useToast } from '@/hooks/use-toast';
import { usePomodoroStore } from '@/components/PomodoroTimer';

const CalendarPage = () => {
  const {
    tasks,
    categories,
    addTask,
    updateTask,
    deleteTask,
    findTaskById
  } = useTaskStore();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Date | undefined>();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [taskDetailStack, setTaskDetailStack] = useState<Task[]>([]);
  const { start: startPomodoro } = usePomodoroStore();

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
    setParentTask(null);
  };

  const handleUpdateTask = (taskData: TaskFormData) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        ...taskData,
        completed: editingTask.completed
      });
      toast({
        title: 'Task aktualisiert',
        description: `"${taskData.title}" wurde erfolgreich aktualisiert.`
      });
      setEditingTask(null);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = findTaskById(taskId);
    if (task && window.confirm(`Sind Sie sicher, dass Sie "${task.title}" löschen möchten?`)) {
      deleteTask(taskId);
      toast({
        title: 'Task gelöscht',
        description: 'Die Task wurde erfolgreich gelöscht.'
      });
    }
  };

  const handleToggleTaskComplete = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed });
    const task = findTaskById(taskId);
    toast({
      title: completed ? 'Task abgeschlossen' : 'Task reaktiviert',
      description: `"${task?.title}" wurde ${completed ? 'als erledigt markiert' : 'reaktiviert'}.`
    });
  };

  const handleAddSubtask = (parent: Task) => {
    setParentTask(parent);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setParentTask(null);
    setIsTaskModalOpen(true);
  };

  const handleViewTaskDetails = (task: Task) => {
    setTaskDetailStack(prev => (selectedTask ? [...prev, selectedTask] : prev));
    setSelectedTask(task);
    setIsTaskDetailModalOpen(true);
  };

  const handleTaskDetailBack = () => {
    setTaskDetailStack(prev => {
      const stack = [...prev];
      const parent = stack.pop();
      if (parent) {
        setSelectedTask(parent);
      } else {
        setIsTaskDetailModalOpen(false);
        setSelectedTask(null);
      }
      return stack;
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
                  <div className="space-y-3">
                    {dayTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        showSubtasks={false}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onAddSubtask={handleAddSubtask}
                        onToggleComplete={handleToggleTaskComplete}
                        onViewDetails={handleViewTaskDetails}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setParentTask(null);
        }}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask || undefined}
        categories={categories}
        parentTask={parentTask || undefined}
        defaultCategoryId={categories[0]?.id}
        defaultDueDate={selected}
      />

      <TaskDetailModal
        isOpen={isTaskDetailModalOpen}
        onClose={() => {
          setIsTaskDetailModalOpen(false);
          setSelectedTask(null);
          setTaskDetailStack([]);
        }}
        task={selectedTask}
        category={selectedTask ? categories.find(c => c.id === selectedTask.categoryId) || null : null}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onAddSubtask={handleAddSubtask}
        onToggleComplete={handleToggleTaskComplete}
        onViewDetails={handleViewTaskDetails}
        onStartPomodoro={task => startPomodoro(task.id)}
        canGoBack={taskDetailStack.length > 0}
        onBack={handleTaskDetailBack}
      />
    </div>
  );
};

export default CalendarPage;
