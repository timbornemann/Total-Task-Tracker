
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Task, Category, TaskFormData, CategoryFormData, Note } from '@/types';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useCurrentCategory } from '@/hooks/useCurrentCategory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/useSettings';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ArrowLeft
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import CategoryCard from './CategoryCard';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import CategoryModal from './CategoryModal';
import TaskDetailModal from './TaskDetailModal';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';
import Navbar from './Navbar';
import { usePomodoroStore } from './PomodoroTimer';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const {
    tasks,
    categories,
    notes,
    addTask,
    updateTask,
    deleteTask,
    addCategory,
    updateCategory,
    deleteCategory,
    getTasksByCategory,
    findTaskById,
    reorderCategories,
    reorderTasks,
    moveTaskToSubtask,
    undoDeleteCategory
  } = useTaskStore();

  const { toast } = useToast();
  const { setCurrentCategoryId } = useCurrentCategory();
  const { colorPalette } = useSettings();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'tasks'>('categories');
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortCriteria, setSortCriteria] = useState<string>(
    searchParams.get('sort') || 'order'
  );

  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [taskLayout, setTaskLayout] = useState<'list' | 'grid'>('list');


  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.get('sort') !== sortCriteria) {
      params.set('sort', sortCriteria);
      setSearchParams(params, { replace: true });
    }
  }, [sortCriteria]);

  useEffect(() => {
    const id = searchParams.get('taskId');
    if (id) {
      const task = findTaskById(id);
      if (task) {
        const category = categories.find(c => c.id === task.categoryId) || null;
        if (category) {
          setSelectedCategory(category);
          setCurrentCategoryId(category.id);
          setViewMode('tasks');
        }
        setSelectedTask(task);
        setIsTaskDetailModalOpen(true);
      }
    }
  }, [searchParams, categories, findTaskById]);
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [taskDetailStack, setTaskDetailStack] = useState<Task[]>([]);
  const { start: startPomodoro } = usePomodoroStore();

  const colorOptions = useMemo(() => {
    const tasksForColors = selectedCategory
      ? getTasksByCategory(selectedCategory.id)
      : tasks;
    const colors = new Set<number>();
    tasksForColors.forEach(task => colors.add(task.color));
    return Array.from(colors);
  }, [selectedCategory, tasks]);


  // Filter categories and tasks based on search
  const filteredCategories = categories
    .filter(
      category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.order - b.order);

  const filteredTasks = selectedCategory
    ? getTasksByCategory(selectedCategory.id).filter(task => {
        const matchesSearch =
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPriority =
          filterPriority === 'all' || task.priority === filterPriority;
        const matchesColor =
          filterColor === 'all' || task.color === Number(filterColor);
        return matchesSearch && matchesPriority && matchesColor;
      })
    : [];

  const priorityValue = (p: string) =>
    p === 'high' ? 3 : p === 'medium' ? 2 : 1;

  const sortedTasks = useMemo(() => {
    const tasksToSort = [...filteredTasks];
    tasksToSort.sort((a, b) => {
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
    return tasksToSort;
  }, [filteredTasks, sortCriteria]);

  // Statistics
  const totalTasks = selectedCategory
    ? getTasksByCategory(selectedCategory.id).length
    : tasks.length;

  const totalCategories = selectedCategory ? 1 : categories.length;

  const completedTasks = (selectedCategory
    ? getTasksByCategory(selectedCategory.id)
    : tasks
  ).filter(task => {
    const hasSubtasks = task.subtasks.length > 0;
    if (hasSubtasks) {
      return task.subtasks.every(subtask => subtask.completed);
    }
    return task.completed;
  }).length;

  const pendingTasks = totalTasks - completedTasks;

  // Handlers
  const handleCreateTask = (taskData: TaskFormData) => {
    addTask({
      ...taskData,
      completed: false
    });
    toast({
      title: t('task.created'),
      description: t('dashboard.taskCreatedDesc', { title: taskData.title })
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
        title: t('task.updated'),
        description: t('dashboard.taskUpdatedDesc', { title: taskData.title })
      });
      setEditingTask(null);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = findTaskById(taskId);
    if (task && window.confirm(t('task.deleteConfirm', { title: task.title }))) {
      deleteTask(taskId);
      toast({
        title: t('task.deleted'),
        description: t('dashboard.taskDeletedDesc')
      });
    }
  };

  const handleToggleTaskComplete = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed, status: completed ? 'done' : 'todo' });
    const task = findTaskById(taskId);
    toast({
      title: completed ? t('task.completed') : t('task.reactivated'),
      description: completed
        ? t('dashboard.taskCompletedDesc', { title: task?.title })
        : t('dashboard.taskReactivatedDesc', { title: task?.title })
    });
  };

  const handleCreateCategory = (categoryData: CategoryFormData) => {
    addCategory(categoryData);
    toast({
      title: t('category.created'),
      description: t('dashboard.categoryCreatedDesc', { name: categoryData.name })
    });
  };

  const handleUpdateCategory = (categoryData: CategoryFormData) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
      toast({
        title: t('category.updated'),
        description: t('dashboard.categoryUpdatedDesc', { name: categoryData.name })
      });
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const nonDefaultCount = categories.filter(c => c.id !== 'default').length;
    const confirmText =
      nonDefaultCount === 1 && category.id !== 'default'
        ? t('category.deleteLastConfirm', { name: category.name })
        : t('category.deleteConfirm', { name: category.name });

    if (window.confirm(confirmText)) {
      deleteCategory(categoryId);
      toast({
        title: t('category.deleted'),
        description: t('dashboard.categoryDeletedDesc'),
        action: (
          <ToastAction
            altText={t('dashboard.undo')}
            onClick={() => undoDeleteCategory(categoryId)}
          >
            {t('dashboard.undo')}
          </ToastAction>
        )
      });
    }
  };

  const handleViewCategoryTasks = (category: Category) => {
    setSelectedCategory(category);
    setCurrentCategoryId(category.id);
    setViewMode('tasks');
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

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCurrentCategoryId(null);
    setViewMode('categories');
    setSearchTerm('');
  };

  const handleCategoryDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderCategories(result.source.index, result.destination.index);
  };

  const handleTaskDragEnd = (result: DropResult) => {
    if (!selectedCategory) return;

    if (result.combine) {
      moveTaskToSubtask(result.draggableId, result.combine.draggableId);
      return;
    }

    if (!result.destination) return;
    reorderTasks(selectedCategory.id, result.source.index, result.destination.index);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        category={
          selectedCategory
            ? { name: selectedCategory.name, color: selectedCategory.color }
            : undefined
        }
        onHomeClick={handleBackToCategories}
      />

      {/* Statistics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.totalTasks')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">{totalTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.completed')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-accent">{completedTasks}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% {t('statistics.ofTasks')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.pending')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">{pendingTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.categories')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">{totalCategories}</div>
            </CardContent>
          </Card>
        </div>


        {/* Content */}
        {viewMode === 'categories' ? (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">{t('dashboard.categories')}</h2>
              <Badge variant="secondary">{t('dashboard.categoriesBadge', { count: filteredCategories.length })}</Badge>
            </div>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('dashboard.searchCategories')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-sm">{t('dashboard.sortLabel')}</Label>
                <Select value={sortCriteria} onValueChange={setSortCriteria}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={t('dashboard.sortLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">{t('dashboard.sort.manual')}</SelectItem>
                    <SelectItem value="created-desc">{t('dashboard.sort.createdDesc')}</SelectItem>
                    <SelectItem value="created-asc">{t('dashboard.sort.createdAsc')}</SelectItem>
                    <SelectItem value="title-asc">{t('dashboard.sort.titleAsc')}</SelectItem>
                    <SelectItem value="title-desc">{t('dashboard.sort.titleDesc')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setIsCategoryModalOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('taskModal.category')}
              </Button>
            </div>
            
            {filteredCategories.length === 0 ? (
              <Card className="text-center py-8 sm:py-12">
                <CardContent>
                  <LayoutGrid className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? t('dashboard.noCategoriesFound') : t('dashboard.noCategories')}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    {searchTerm
                      ? t('dashboard.trySearch')
                      : t('dashboard.createFirstCategory')}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsCategoryModalOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('dashboard.firstCategoryButton')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <DragDropContext onDragEnd={handleCategoryDragEnd}>
                <Droppable droppableId="categories">
                  {provided => (
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {filteredCategories.map((category, index) => (
                        <Draggable key={category.id} draggableId={category.id} index={index}>
                          {prov => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                              <CategoryCard
                                category={category}
                                tasks={getTasksByCategory(category.id)}
                                onEdit={category => {
                                  setEditingCategory(category);
                                  setIsCategoryModalOpen(true);
                                }}
                                onDelete={handleDeleteCategory}
                                onViewTasks={handleViewCategoryTasks}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToCategories}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">{t('dashboard.tasksTitle')}</h2>
              </div>
              <Badge variant="secondary">{t('dashboard.tasksBadge', { count: filteredTasks.length })}</Badge>
            </div>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('dashboard.searchTasks')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-sm">{t('dashboard.sortLabel')}</Label>
                <Select value={sortCriteria} onValueChange={setSortCriteria}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder={t('dashboard.sortLabel')} />
                  </SelectTrigger>
                <SelectContent>
                    <SelectItem value="order">{t('dashboard.sort.manual')}</SelectItem>
                    <SelectItem value="created-desc">{t('dashboard.sort.createdDesc')}</SelectItem>
                    <SelectItem value="created-asc">{t('dashboard.sort.createdAsc')}</SelectItem>
                    <SelectItem value="title-asc">{t('dashboard.sort.titleAsc')}</SelectItem>
                    <SelectItem value="title-desc">{t('dashboard.sort.titleDesc')}</SelectItem>
                    <SelectItem value="priority-asc">{t('dashboard.sort.priorityAsc')}</SelectItem>
                    <SelectItem value="priority-desc">{t('dashboard.sort.priorityDesc')}</SelectItem>
                    <SelectItem value="due-asc">{t('dashboard.sort.dueAsc')}</SelectItem>
                    <SelectItem value="due-desc">{t('dashboard.sort.dueDesc')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-sm">{t('dashboard.priorityLabel')}</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={t('dashboard.priorityLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboard.filter.all')}</SelectItem>
                    <SelectItem value="high">{t('dashboard.filter.high')}</SelectItem>
                    <SelectItem value="medium">{t('dashboard.filter.medium')}</SelectItem>
                    <SelectItem value="low">{t('dashboard.filter.low')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-sm">{t('dashboard.colorLabel')}</Label>
                <Select value={filterColor} onValueChange={setFilterColor}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={t('dashboard.colorLabel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('dashboard.filter.all')}</SelectItem>
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
                <Label className="text-sm">{t('dashboard.viewLabel')}</Label>
                <Button
                  variant={taskLayout === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setTaskLayout('list')}
                >
                  <List className="h-4 w-4" />
                  <span className="sr-only">{t('dashboard.listView')}</span>
                </Button>
                <Button
                  variant={taskLayout === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setTaskLayout('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only">{t('dashboard.gridView')}</span>
                </Button>
              </div>
              <Button onClick={() => setIsTaskModalOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('taskModal.newTitle')}
              </Button>
            </div>
            
            {filteredTasks.length === 0 ? (
              <Card className="text-center py-8 sm:py-12">
                <CardContent>
                  <List className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? t('dashboard.noTasksFound') : t('dashboard.noTasks')}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    {searchTerm
                      ? t('dashboard.trySearch')
                      : t('dashboard.createFirstTask', { category: selectedCategory?.name })}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsTaskModalOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('dashboard.firstTaskButton')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <DragDropContext onDragEnd={handleTaskDragEnd}>
                <Droppable droppableId="tasks" isCombineEnabled>
                  {provided => (
                    <div
                      className={
                        taskLayout === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                          : 'space-y-3 sm:space-y-4'
                      }
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {sortedTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {prov => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={taskLayout === 'grid' ? 'h-full' : ''}
                            >
                              <TaskCard
                                task={task}
                                onEdit={handleEditTask}
                                onDelete={handleDeleteTask}
                                onAddSubtask={handleAddSubtask}
                                onToggleComplete={handleToggleTaskComplete}
                                onViewDetails={handleViewTaskDetails}
                                isGrid={taskLayout === 'grid'}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
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
        defaultCategoryId={selectedCategory ? selectedCategory.id : undefined}
        defaultDueDate={undefined}
        allowRecurring={false}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
        category={editingCategory || undefined}
      />

      <TaskDetailModal
        isOpen={isTaskDetailModalOpen}
        onClose={() => {
          setIsTaskDetailModalOpen(false);
          setSelectedTask(null);
          setTaskDetailStack([]);
          const params = new URLSearchParams(searchParams)
          if (params.has('taskId')) {
            params.delete('taskId')
            setSearchParams(params, { replace: true })
          }
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

export default Dashboard;
