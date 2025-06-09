
import React, { useState, useMemo, useEffect } from 'react';
import { Task, Category, TaskFormData, CategoryFormData } from '@/types';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useCurrentCategory } from '@/hooks/useCurrentCategory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  LayoutGrid,
  List
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
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
} from 'react-beautiful-dnd';
import Navbar from './Navbar';

const Dashboard: React.FC = () => {
  const {
    tasks,
    categories,
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
    undoDeleteCategory
  } = useTaskStore();

  const { toast } = useToast();
  const { setCurrentCategoryId } = useCurrentCategory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'tasks'>('categories');
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortCriteria, setSortCriteria] = useState<string>(
    searchParams.get('sort') || 'order'
  );

  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');


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

  const colorOptions = useMemo(() => {
    const tasksForColors = selectedCategory
      ? getTasksByCategory(selectedCategory.id)
      : tasks;
    const colors = new Set<string>();
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
          filterColor === 'all' || task.color === filterColor;
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

  const handleCreateCategory = (categoryData: CategoryFormData) => {
    addCategory(categoryData);
    toast({
      title: 'Kategorie erstellt',
      description: `"${categoryData.name}" wurde erfolgreich erstellt.`
    });
  };

  const handleUpdateCategory = (categoryData: CategoryFormData) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
      toast({
        title: 'Kategorie aktualisiert',
        description: `"${categoryData.name}" wurde erfolgreich aktualisiert.`
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
        ? `Sie sind dabei, die letzte verbleibende Kategorie zu löschen. "${category.name}" wirklich löschen?`
        : `Sind Sie sicher, dass Sie "${category.name}" löschen möchten?`;

    if (window.confirm(confirmText)) {
      deleteCategory(categoryId);
      toast({
        title: 'Kategorie gelöscht',
        description: 'Die Kategorie wurde erfolgreich gelöscht.',
        action: (
          <ToastAction altText="Undo" onClick={() => undoDeleteCategory(categoryId)}>
            Rückgängig
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
    if (!result.destination || !selectedCategory) return;
    reorderTasks(selectedCategory.id, result.source.index, result.destination.index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <CardTitle className="text-sm font-medium text-gray-600">Gesamt Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Abgeschlossen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{completedTasks}</div>
              <div className="text-xs sm:text-sm text-gray-500">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% erledigt
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Offen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Kategorien</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalCategories}</div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {viewMode === 'categories' ? (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Kategorien</h2>
              <Badge variant="secondary">{filteredCategories.length} Kategorien</Badge>
            </div>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Kategorien suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-sm">Sortierung:</Label>
                <Select value={sortCriteria} onValueChange={setSortCriteria}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sortierung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Manuell</SelectItem>
                    <SelectItem value="created-desc">Neueste zuerst</SelectItem>
                    <SelectItem value="created-asc">Älteste zuerst</SelectItem>
                    <SelectItem value="title-asc">Titel A-Z</SelectItem>
                    <SelectItem value="title-desc">Titel Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setIsCategoryModalOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Kategorie
              </Button>
            </div>
            
            {filteredCategories.length === 0 ? (
              <Card className="text-center py-8 sm:py-12">
                <CardContent>
                  <LayoutGrid className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'Keine Kategorien gefunden' : 'Keine Kategorien vorhanden'}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    {searchTerm 
                      ? 'Versuchen Sie einen anderen Suchbegriff.'
                      : 'Erstellen Sie Ihre erste Kategorie, um mit der Organisation Ihrer Tasks zu beginnen.'
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsCategoryModalOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Erste Kategorie erstellen
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
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Tasks</h2>
              <Badge variant="secondary">{filteredTasks.length} Tasks</Badge>
            </div>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tasks suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-sm">Sortierung:</Label>
                <Select value={sortCriteria} onValueChange={setSortCriteria}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Sortierung" />
                  </SelectTrigger>
                <SelectContent>
                    <SelectItem value="order">Manuell</SelectItem>
                    <SelectItem value="created-desc">Neueste zuerst</SelectItem>
                    <SelectItem value="created-asc">Älteste zuerst</SelectItem>
                    <SelectItem value="title-asc">Titel A-Z</SelectItem>
                    <SelectItem value="title-desc">Titel Z-A</SelectItem>
                    <SelectItem value="priority-asc">Priorität ↑</SelectItem>
                    <SelectItem value="priority-desc">Priorität ↓</SelectItem>
                    <SelectItem value="due-asc">Fälligkeitsdatum ↑</SelectItem>
                    <SelectItem value="due-desc">Fälligkeitsdatum ↓</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-sm">Priorität:</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priorität" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="low">Niedrig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-sm">Farbe:</Label>
                <Select value={filterColor} onValueChange={setFilterColor}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Farbe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {colorOptions.map(color => (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span>{color}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setIsTaskModalOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Task
              </Button>
            </div>
            
            {filteredTasks.length === 0 ? (
              <Card className="text-center py-8 sm:py-12">
                <CardContent>
                  <List className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'Keine Tasks gefunden' : 'Keine Tasks vorhanden'}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    {searchTerm 
                      ? 'Versuchen Sie einen anderen Suchbegriff.'
                      : `Erstellen Sie Ihre erste Task in der Kategorie "${selectedCategory?.name}".`
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsTaskModalOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Erste Task erstellen
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <DragDropContext onDragEnd={handleTaskDragEnd}>
                <Droppable droppableId="tasks">
                  {provided => (
                    <div
                      className="space-y-3 sm:space-y-4"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {sortedTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {prov => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                              <TaskCard
                                task={task}
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
        canGoBack={taskDetailStack.length > 0}
        onBack={handleTaskDetailBack}
      />
    </div>
  );
};

export default Dashboard;
