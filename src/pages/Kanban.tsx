import React, { useState, useMemo } from 'react';
import { useTaskStore } from '@/hooks/useTaskStore';
import TaskCard from '@/components/TaskCard';
import Navbar from '@/components/Navbar';
import TaskModal from '@/components/TaskModal';
import TaskDetailModal from '@/components/TaskDetailModal';
import { usePomodoroStore } from '@/components/PomodoroTimer';
import { useToast } from '@/hooks/use-toast';
import { Task, TaskFormData } from '@/types';
import { flattenTasks, FlattenedTask } from '@/utils/taskUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { useSettings } from '@/hooks/useSettings';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';
import { useTranslation } from 'react-i18next';

const Kanban: React.FC = () => {
  const {
    tasks,
    categories,
    addTask,
    updateTask,
    deleteTask,
    findTaskById
  } = useTaskStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [taskDetailStack, setTaskDetailStack] = useState<Task[]>([]);
  const { start: startPomodoro } = usePomodoroStore();
  const { colorPalette } = useSettings();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [filterPinned, setFilterPinned] = useState<string>('all');
  const [columnSearch, setColumnSearch] = useState({
    todo: '',
    inprogress: '',
    done: ''
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination, source } = result;
    const newStatus = destination.droppableId as 'todo' | 'inprogress' | 'done';
    if (destination.droppableId !== source.droppableId) {
      updateTask(draggableId, {
        status: newStatus,
        completed: newStatus === 'done'
      });
    }
  };

  const handleCreateTask = (taskData: TaskFormData) => {
    addTask({
      ...taskData,
      completed: false
    });
    toast({
      title: t('kanban.created'),
      description: `"${taskData.title}" ${t('kanban.created')}`
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
        title: t('kanban.updated'),
        description: `"${taskData.title}" ${t('kanban.updated')}`
      });
      setEditingTask(null);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = findTaskById(taskId);
    if (task && window.confirm(t('kanban.deleteConfirm', { title: task.title }))) {
      deleteTask(taskId);
      toast({
        title: t('kanban.deleted'),
        description: t('kanban.deleted')
      });
    }
  };

  const handleToggleTaskComplete = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed, status: completed ? 'done' : 'todo' });
    const task = findTaskById(taskId);
    toast({
      title: completed ? t('kanban.completed') : t('kanban.reactivated'),
      description: `"${task?.title}" ${completed ? t('kanban.completed') : t('kanban.reactivated')}`
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

  const flattened = flattenTasks(tasks);
  const colorOptions = useMemo(
    () => Array.from(new Set(tasks.map(t => t.color))),
    [tasks]
  );

  const filtered = flattened.filter(item => {
    const matchesCategory =
      filterCategory === 'all' || item.task.categoryId === filterCategory;
    const matchesPriority =
      filterPriority === 'all' || item.task.priority === filterPriority;
    const matchesColor =
      filterColor === 'all' || item.task.color === Number(filterColor);
    const matchesPinned =
      filterPinned === 'all' ||
      (filterPinned === 'pinned' ? item.task.pinned : !item.task.pinned);
    return matchesCategory && matchesPriority && matchesColor && matchesPinned;
  });

  const tasksByStatus: Record<'todo' | 'inprogress' | 'done', FlattenedTask[]> = {
    todo: [],
    inprogress: [],
    done: []
  };

  filtered.forEach(item => {
    const status = item.task.status as 'todo' | 'inprogress' | 'done';
    const search = columnSearch[status].toLowerCase();
    const matchesSearch =
      item.task.title.toLowerCase().includes(search) ||
      item.task.description.toLowerCase().includes(search);
    if (matchesSearch) {
      tasksByStatus[status].push(item);
    }
  });

  const statuses: Array<'todo' | 'inprogress' | 'done'> = [
    'todo',
    'inprogress',
    'done'
  ];

  const labels: Record<'todo' | 'inprogress' | 'done', string> = {
    todo: t('kanban.todo'),
    inprogress: t('kanban.inprogress'),
    done: t('kanban.done')
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t('navbar.kanban')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            <Label className="text-sm">{t('kanban.categoryLabel')}</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('kanban.categoryLabel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('kanban.filter.all')}</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-sm">{t('kanban.priorityLabel')}</Label>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('kanban.priorityLabel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('kanban.filter.all')}</SelectItem>
                <SelectItem value="high">{t('kanban.filter.high')}</SelectItem>
                <SelectItem value="medium">{t('kanban.filter.medium')}</SelectItem>
                <SelectItem value="low">{t('kanban.filter.low')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-sm">{t('kanban.colorLabel')}</Label>
            <Select value={filterColor} onValueChange={setFilterColor}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('kanban.colorLabel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('kanban.filter.all')}</SelectItem>
                {colorOptions.map(color => (
                  <SelectItem key={color} value={String(color)}>
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colorPalette[color] }}
                      />
                      <span>{colorPalette[color]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-sm">{t('kanban.pinnedLabel')}</Label>
            <Select value={filterPinned} onValueChange={setFilterPinned}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('kanban.pinnedLabel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('kanban.filter.all')}</SelectItem>
                <SelectItem value="pinned">{t('kanban.filter.pinned')}</SelectItem>
                <SelectItem value="unpinned">{t('kanban.filter.unpinned')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statuses.map(status => (
              <Droppable droppableId={status} key={status}>
                {provided => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="rounded-md p-2 space-y-2 min-h-[200px]"
                    style={{ backgroundColor: `hsl(var(--kanban-${status}))` }}
                  >
                    <h2 className="text-base font-semibold mb-2">
                      {labels[status]}
                    </h2>
                    <Input
                      value={columnSearch[status]}
                      onChange={e =>
                        setColumnSearch(prev => ({
                          ...prev,
                          [status]: e.target.value
                        }))
                      }
                      placeholder={t('kanban.search')}
                      className="mb-2 h-8"
                    />
                    {tasksByStatus[status].map((item, index) => (
                      <Draggable
                        key={item.task.id}
                        draggableId={item.task.id}
                        index={index}
                      >
                        {prov => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                          >
                            <TaskCard
                              task={item.task}
                              parentPathTitles={item.path.map(p => p.title)}
                              showSubtasks={false}
                              onEdit={handleEditTask}
                              onDelete={handleDeleteTask}
                              onAddSubtask={handleAddSubtask}
                              onToggleComplete={handleToggleTaskComplete}
                              onViewDetails={handleViewTaskDetails}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
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
        defaultDueDate={undefined}
        allowRecurring={false}
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

export default Kanban;

