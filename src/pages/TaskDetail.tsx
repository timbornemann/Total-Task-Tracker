import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import SubtaskFilterSheet from '@/components/SubtaskFilterSheet';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useSettings } from '@/hooks/useSettings';
import { Task } from '@/types';
import {
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  Star,
  StarOff,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import {
  calculateTaskCompletion,
  getTaskProgress,
  getPriorityColors,
  flattenTasks
} from '@/utils/taskUtils';
import { complementaryColor, adjustColor, isColorDark, hslToHex } from '@/utils/color';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip
} from 'recharts';

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const {
    tasks,
    categories,
    updateTask,
    deleteTask,
    addTask,
    findTaskById
  } = useTaskStore();
  const { colorPalette, theme } = useSettings();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState('order');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterColor, setFilterColor] = useState('all');
  const [subtaskLayout, setSubtaskLayout] = useState<'list' | 'grid'>('list');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const task = findTaskById(taskId || '') || null;
  const category = task ? categories.find(c => c.id === task.categoryId) || null : null;

  if (!task) return <div className="p-4">{t('taskDetail.notFound')}</div>;

  const isCompleted = calculateTaskCompletion(task);
  const progress = getTaskProgress(task);
  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const priorityColors = getPriorityColors(task.priority);
  let priorityIconEl: React.ReactNode;
  if (task.priority === 'high') priorityIconEl = <ArrowUp className="h-4 w-4 mr-1" />;
  else if (task.priority === 'medium') priorityIconEl = <ArrowRight className="h-4 w-4 mr-1" />;
  else priorityIconEl = <ArrowDown className="h-4 w-4 mr-1" />;
  const colorOptions = Array.from(new Set(task.subtasks.map(st => st.color)));
  const cardHex = hslToHex(theme.card);
  const progressBg = isColorDark(cardHex) ? adjustColor(cardHex, 50) : adjustColor(cardHex, -20);
  const progressColor = complementaryColor(cardHex);

  const flattened = useMemo(() => flattenTasks(tasks), [tasks]);
  const pathInfo = useMemo(() => flattened.find(f => f.task.id === task.id), [flattened, task.id]);
  const parentPath = pathInfo ? pathInfo.path : [];

  const breadcrumbs = [
    {
      label: category?.name || t('taskDetail.unknownCategory'),
      onClick: () => navigate(`/tasks?categoryId=${task.categoryId}`)
    },
    ...parentPath.map(p => ({
      label: p.title,
      onClick: () => navigate(`/tasks/${p.id}?categoryId=${p.categoryId}`)
    }))
  ];

  const textColor = complementaryColor(colorPalette[task.color]);

  const flattenedSubtasks = useMemo(
    () => flattenTasks(task.subtasks).map(f => f.task),
    [task.subtasks]
  );

  const statusData = useMemo(() => {
    const counts = { todo: 0, inprogress: 0, done: 0 };
    flattenedSubtasks.forEach(st => {
      counts[st.status]++;
    });
    return [
      { name: t('kanban.todo'), value: counts.todo, color: 'hsl(var(--kanban-todo))' },
      { name: t('kanban.inprogress'), value: counts.inprogress, color: 'hsl(var(--kanban-inprogress))' },
      { name: t('kanban.done'), value: counts.done, color: 'hsl(var(--kanban-done))' }
    ];
  }, [flattenedSubtasks, t]);

  const priorityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    flattenedSubtasks.forEach(st => {
      counts[st.priority]++;
    });
    return [
      { name: t('statistics.priority.high'), value: counts.high, color: 'hsl(var(--destructive))' },
      { name: t('statistics.priority.medium'), value: counts.medium, color: 'hsl(var(--primary))' },
      { name: t('statistics.priority.low'), value: counts.low, color: 'hsl(var(--accent))' }
    ];
  }, [flattenedSubtasks, t]);

  const trendData = useMemo(() => {
    const result: { date: string; created: number; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const created = flattenedSubtasks.filter(st => new Date(st.createdAt).toISOString().split('T')[0] === dateStr).length;
      const completed = flattenedSubtasks.filter(st => st.completed && new Date(st.updatedAt).toISOString().split('T')[0] === dateStr).length;
      result.push({
        date: date.toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric' }),
        created,
        completed
      });
    }
    return result;
  }, [flattenedSubtasks, i18n.language]);

  const handleTogglePinned = () => {
    updateTask(task.id, { pinned: !task.pinned });
  };

  const handleToggleComplete = () => {
    if (task.subtasks.length === 0) {
      updateTask(task.id, { completed: !task.completed });
    }
  };

  const handleDelete = () => {
    if (window.confirm(t('task.deleteConfirm', { title: task.title }))) {
      deleteTask(task.id);
      if (task.parentId) {
        navigate(`/tasks/${task.parentId}`);
      } else {
        navigate(`/tasks?categoryId=${task.categoryId}`);
      }
    }
  };

  const handleAddSubtask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEdit = () => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };


  const handleBack = () => {
    if (task.parentId) {
      navigate(`/tasks/${task.parentId}`);
    } else {
      navigate(`/tasks?categoryId=${task.categoryId}`);
    }
  };

  const filteredSubtasks = task.subtasks.filter(st => {
    const matchesSearch =
      st.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      filterPriority === 'all' || st.priority === filterPriority;
    const matchesColor = filterColor === 'all' || st.color === Number(filterColor);
    return matchesSearch && matchesPriority && matchesColor;
  });

  const priorityValue = (p: string) =>
    p === 'high' ? 3 : p === 'medium' ? 2 : 1;

  const sortedSubtasks = filteredSubtasks.slice().sort((a, b) => {
    switch (sortCriteria) {
      case 'order':
        return a.order - b.order;
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      case 'created-asc':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'created-desc':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'priority-asc':
        return priorityValue(a.priority) - priorityValue(b.priority);
      case 'priority-desc':
        return priorityValue(b.priority) - priorityValue(a.priority);
      case 'due-asc':
        return (
          (a.nextDue ? a.nextDue.getTime() : Infinity) -
          (b.nextDue ? b.nextDue.getTime() : Infinity)
        );
      case 'due-desc':
        return (
          (b.nextDue ? b.nextDue.getTime() : -Infinity) -
          (a.nextDue ? a.nextDue.getTime() : -Infinity)
        );
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        title={task.title}
        onHomeClick={() => navigate(`/tasks?categoryId=${task.categoryId}`)}
      />
      <div
        className="py-6"
        style={{ backgroundColor: colorPalette[task.color], color: textColor }}
      >
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <Button variant="ghost" size="sm" onClick={handleBack} className="text-current">
            <ArrowLeft className="h-4 w-4 mr-2" /> {t('common.back')}
          </Button>
          <h1 className={`text-2xl font-bold ${isCompleted ? 'line-through opacity-70' : ''}`}>{task.title}</h1>
          <div className="flex items-center text-sm flex-wrap">
            <span className="mr-2 font-medium">{t('taskDetail.path')}</span>
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="mx-1 h-3 w-3" />}
                <button onClick={b.onClick} className="underline">
                  {b.label}
                </button>
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <Badge
              className="text-sm px-3 py-1 flex items-center border"
              style={{
                backgroundColor: priorityColors.bg,
                color: priorityColors.fg,
                borderColor: priorityColors.bg
              }}
            >
              {priorityIconEl}
              {t(`taskModal.${task.priority}`)}
            </Badge>
            {task.dueDate && (
              <div className="flex items-center text-sm">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {new Date(task.dueDate).toLocaleDateString(i18n.language)}
              </div>
            )}
          </div>
          <div className="flex space-x-2 pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleTogglePinned} className="border text-current">
                    {task.pinned ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{task.pinned ? t('taskDetail.unpin') : t('taskDetail.pin')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleAddSubtask} className="border text-current">
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('taskDetail.addSubtask')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleEdit} className="border text-current">
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.edit')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="border text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.delete')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto py-8 px-4">

          <ScrollArea className="pr-4">
            <div className="space-y-6">
              {task.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{t('taskDetail.description')}</h3>
                  <p className="text-gray-700 leading-relaxed">{task.description}</p>
                </div>
              )}

              {task.subtasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      {t('taskDetail.subtasks', { count: task.subtasks.length })}
                    </h3>
                    <div className="text-sm text-gray-600">
                      {t('taskDetail.progressInfo', { completed: progress.completed, total: progress.total })}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{t('taskDetail.totalProgress')}</span>
                      <span className="text-sm text-gray-500">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" backgroundColor={progressBg} indicatorColor={progressColor} />
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base sm:text-lg">
                            {t('taskDetail.statsStatus')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={5} dataKey="value">
                                  {statusData.map((entry, index) => (
                                    <Cell key={`status-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartTooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex justify-center space-x-4 mt-4">
                            {statusData.map((item, index) => (
                              <div key={index} className="flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                                <span className="text-xs">{item.name}: {item.value}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base sm:text-lg">
                            {t('taskDetail.statsPriority')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={5} dataKey="value">
                                  {priorityData.map((entry, index) => (
                                    <Cell key={`priority-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartTooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex justify-center space-x-4 mt-4">
                            {priorityData.map((item, index) => (
                              <div key={index} className="flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                                <span className="text-xs">{item.name}: {item.value}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg">
                          {t('taskDetail.statsTrend')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" fontSize={12} />
                              <YAxis fontSize={12} />
                              <RechartTooltip />
                              <Line type="monotone" dataKey="created" stroke="hsl(var(--primary))" strokeWidth={2} name={t('statistics.created')} />
                              <Line type="monotone" dataKey="completed" stroke="hsl(var(--accent))" strokeWidth={2} name={t('statistics.completed')} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={t('dashboard.searchTasks')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-8 w-full"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsFilterSheetOpen(true)}>
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      {t('dashboard.openFilters')}
                    </Button>
                  </div>

                  <div
                    className={
                      subtaskLayout === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                        : 'space-y-3'
                    }
                  >
                    {sortedSubtasks.map(subtask => (
                      <TaskCard
                        key={subtask.id}
                        task={subtask}
                        onEdit={() =>
                          navigate(`/tasks/${subtask.id}?categoryId=${task.categoryId}`)
                        }
                        onDelete={deleteTask}
                        onAddSubtask={() => {
                          setEditingTask(null);
                          setIsTaskModalOpen(true);
                        }}
                        onToggleComplete={(id, completed) => updateTask(id, { completed })}
                        onViewDetails={st =>
                          navigate(`/tasks/${st.id}?categoryId=${task.categoryId}`)
                        }
                        depth={0}
                        isGrid={subtaskLayout === 'grid'}
                      />
                    ))}
                  </div>
                </div>
              )}

              {task.subtasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('taskDetail.noSubtasks')}</p>
                  <Button variant="outline" size="sm" onClick={handleAddSubtask} className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('taskDetail.addFirst')}
                  </Button>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">{t('taskDetail.created')}</span>{' '}
                    {new Date(task.createdAt).toLocaleDateString(i18n.language)}
                  </div>
                  <div>
                    <span className="font-medium">{t('taskDetail.updated')}</span>{' '}
                    {new Date(task.updatedAt).toLocaleDateString(i18n.language)}
                  </div>
                  {task.dueDate && (
                    <div>
                      <span className="font-medium">{t('taskDetail.due')}</span>{' '}
                      {new Date(task.dueDate).toLocaleDateString(i18n.language)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={data => {
          if (editingTask) {
            updateTask(editingTask.id, data);
          } else {
            addTask({ ...data, parentId: task.id });
          }
        }}
        task={editingTask || undefined}
        categories={categories}
        parentTask={editingTask ? undefined : task}
        defaultDueDate={undefined}
        allowRecurring={false}
      />
      <SubtaskFilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        sort={sortCriteria}
        onSortChange={setSortCriteria}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        filterColor={filterColor}
        onFilterColorChange={setFilterColor}
        colorOptions={colorOptions}
        colorPalette={colorPalette}
        layout={subtaskLayout}
        onLayoutChange={setSubtaskLayout}
      />
    </div>
  );
};

export default TaskDetailPage;
