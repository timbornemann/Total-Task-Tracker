import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Task, Category, TaskFormData, CategoryFormData, Note } from "@/types";
import { useTaskStore } from "@/hooks/useTaskStore";
import { useCurrentCategory } from "@/hooks/useCurrentCategory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSettings } from "@/hooks/useSettings";
import { calculateTaskCompletion } from "@/utils/taskUtils";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import CategoryCard from "./CategoryCard";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import CategoryModal from "./CategoryModal";
import TaskFilterSheet from "./TaskFilterSheet";
import CategoryFilterSheet from "./CategoryFilterSheet";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import ConfirmDialog from "./ConfirmDialog";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Navbar from "./Navbar";
import { usePomodoroStore } from "./PomodoroTimer";

interface SortableCategoryProps {
  category: Category;
  children: React.ReactNode;
}

const SortableCategory: React.FC<SortableCategoryProps> = ({
  category,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: category.id,
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

interface SortableTaskProps {
  task: Task;
  children: React.ReactNode;
}

const SortableTask: React.FC<SortableTaskProps> = ({ task, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: task.id,
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

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
    undoDeleteCategory,
    resetTask,
    resetCategoryTasks,
  } = useTaskStore();

  const { toast } = useToast();
  const { setCurrentCategoryId } = useCurrentCategory();
  const {
    colorPalette,
    defaultTaskLayout,
    showCompletedByDefault,
    enableBatchTasks,
  } = useSettings();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"categories" | "tasks">(
    "categories",
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortCriteria, setSortCriteria] = useState<string>(
    searchParams.get("sort") || "order",
  );

  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterColor, setFilterColor] = useState<string>("all");
  const [categoryFilterColor, setCategoryFilterColor] = useState<string>("all");
  const [taskLayout, setTaskLayout] = useState<"list" | "grid">(
    defaultTaskLayout,
  );
  const [showCompleted, setShowCompleted] = useState<boolean>(
    showCompletedByDefault,
  );
  const [showHidden, setShowHidden] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (params.get("sort") !== sortCriteria) {
      params.set("sort", sortCriteria);
      setSearchParams(params, { replace: true });
    }
  }, [sortCriteria]);

  useEffect(() => {
    setTaskLayout(defaultTaskLayout);
  }, [defaultTaskLayout]);

  useEffect(() => {
    setShowCompleted(showCompletedByDefault);
  }, [showCompletedByDefault]);

  useEffect(() => {
    const catId = searchParams.get("categoryId");
    if (catId && catId !== selectedCategory?.id) {
      const cat = categories.find((c) => c.id === catId);
      if (cat) {
        setSelectedCategory(cat);
        setCurrentCategoryId(cat.id);
        setViewMode("tasks");
      }
    } else if (!catId && selectedCategory) {
      setSelectedCategory(null);
      setCurrentCategoryId(null);
      setViewMode("categories");
    }
  }, [searchParams, categories]);

  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isCategoryFilterSheetOpen, setIsCategoryFilterSheetOpen] =
    useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [batchDeleteIds, setBatchDeleteIds] = useState<string[] | null>(null);
  const { start: startPomodoro } = usePomodoroStore();

  const colorOptions = useMemo(() => {
    const tasksForColors = selectedCategory
      ? showHidden
        ? tasks.filter(
            (t) => t.categoryId === selectedCategory.id && !t.parentId,
          )
        : getTasksByCategory(selectedCategory.id)
      : tasks.filter((t) => t.visible !== false);
    const colors = new Set<number>();
    tasksForColors.forEach((task) => colors.add(task.color));
    return Array.from(colors);
  }, [selectedCategory, tasks]);

  const categoryColorOptions = useMemo(() => {
    const colors = new Set<number>();
    categories.forEach((cat) => colors.add(cat.color));
    return Array.from(colors);
  }, [categories]);

  // Filter categories and tasks based on search
  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColor =
      categoryFilterColor === "all" ||
      category.color === Number(categoryFilterColor);
    return matchesSearch && matchesColor;
  });

  const sortedCategories = useMemo(() => {
    const cats = [...filteredCategories];
    cats.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      switch (sortCriteria) {
        case "order":
          return a.order - b.order;
        case "title-asc":
          return a.name.localeCompare(b.name);
        case "title-desc":
          return b.name.localeCompare(a.name);
        case "created-asc":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "created-desc":
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });
    return cats;
  }, [filteredCategories, sortCriteria]);

  const filteredTasks = selectedCategory
    ? (showHidden
        ? tasks.filter(
            (t) => t.categoryId === selectedCategory.id && !t.parentId,
          )
        : getTasksByCategory(selectedCategory.id)
      ).filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPriority =
          filterPriority === "all" || task.priority === filterPriority;
        const matchesColor =
          filterColor === "all" || task.color === Number(filterColor);
        const matchesCompleted =
          showCompleted || !calculateTaskCompletion(task);
        return (
          matchesSearch && matchesPriority && matchesColor && matchesCompleted
        );
      })
    : [];

  const priorityValue = (p: string) =>
    p === "high" ? 3 : p === "medium" ? 2 : 1;

  const sortedTasks = useMemo(() => {
    const tasksToSort = [...filteredTasks];
    tasksToSort.sort((a, b) => {
      switch (sortCriteria) {
        case "order":
          return a.order - b.order;
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "created-asc":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "created-desc":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "priority-asc":
          return priorityValue(a.priority) - priorityValue(b.priority);
        case "priority-desc":
          return priorityValue(b.priority) - priorityValue(a.priority);
        case "due-asc":
          return (
            (a.nextDue ? a.nextDue.getTime() : Infinity) -
            (b.nextDue ? b.nextDue.getTime() : Infinity)
          );
        case "due-desc":
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
    : tasks.filter((t) => t.visible !== false).length;

  const totalCategories = selectedCategory ? 1 : categories.length;

  const completedTasks = (
    selectedCategory
      ? getTasksByCategory(selectedCategory.id)
      : tasks.filter((t) => t.visible !== false)
  ).filter((task) => {
    const hasSubtasks = task.subtasks.length > 0;
    if (hasSubtasks) {
      return task.subtasks.every((subtask) => subtask.completed);
    }
    return task.completed;
  }).length;

  const pendingTasks = totalTasks - completedTasks;

  // Handlers
  const handleCreateTask = (taskData: TaskFormData) => {
    addTask({
      ...taskData,
      completed: false,
    });
    toast({
      title: t("task.created"),
      description: t("dashboard.taskCreatedDesc", { title: taskData.title }),
    });
    setParentTask(null);
  };

  const handleUpdateTask = (taskData: TaskFormData) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        ...taskData,
        completed: editingTask.completed,
      });
      toast({
        title: t("task.updated"),
        description: t("dashboard.taskUpdatedDesc", { title: taskData.title }),
      });
      setEditingTask(null);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setDeleteTaskId(taskId);
  };

  const handleToggleTaskComplete = (taskId: string, completed: boolean) => {
    updateTask(taskId, {
      completed,
      status: completed ? "done" : "todo",
      visible: !completed,
    });
    const task = findTaskById(taskId);
    toast({
      title: completed ? t("task.completed") : t("task.reactivated"),
      description: completed
        ? t("dashboard.taskCompletedDesc", { title: task?.title })
        : t("dashboard.taskReactivatedDesc", { title: task?.title }),
    });
    if (completed && task) {
      setTimeout(() => {
        const tasksInCategory = getTasksByCategory(task.categoryId);
        const index = tasksInCategory.findIndex((t) => t.id === taskId);
        const lastIndex = tasksInCategory.length - 1;
        if (index !== -1 && index !== lastIndex) {
          reorderTasks(task.categoryId, index, lastIndex);
        }
      }, 1000);
    }
  };

  const handleResetTask = (taskId: string) => {
    resetTask(taskId);
    const task = findTaskById(taskId);
    toast({
      title: t("dashboard.taskReset"),
      description: t("dashboard.taskResetDesc", { title: task?.title }),
    });
  };

  const handleCreateCategory = (categoryData: CategoryFormData) => {
    addCategory(categoryData);
    toast({
      title: t("category.created"),
      description: t("dashboard.categoryCreatedDesc", {
        name: categoryData.name,
      }),
    });
  };

  const handleUpdateCategory = (categoryData: CategoryFormData) => {
    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
      toast({
        title: t("category.updated"),
        description: t("dashboard.categoryUpdatedDesc", {
          name: categoryData.name,
        }),
      });
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    setDeleteCategoryId(categoryId);
  };

  const handleToggleCategoryPinned = (id: string, pinned: boolean) => {
    updateCategory(id, { pinned });
  };

  const handleResetCategory = (id: string) => {
    resetCategoryTasks(id);
    const cat = categories.find((c) => c.id === id);
    toast({
      title: t("dashboard.categoryTasksReset"),
      description: t("dashboard.categoryTasksResetDesc", { name: cat?.name }),
    });
  };

  const handleViewCategoryTasks = (category: Category) => {
    setSelectedCategory(category);
    setCurrentCategoryId(category.id);
    setViewMode("tasks");
    const params = new URLSearchParams(searchParams);
    params.set("categoryId", category.id);
    setSearchParams(params, { replace: true });
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

  const navigate = useNavigate();

  const handleViewTaskDetails = (task: Task) => {
    const catId = selectedCategory?.id || task.categoryId;
    navigate(`/tasks/${task.id}?categoryId=${catId}`);
  };

  const handleSelectTask = (id: string, checked: boolean) => {
    setSelectedTaskIds((prev) =>
      checked ? [...prev, id] : prev.filter((t) => t !== id),
    );
  };

  const handleBatchDelete = () => {
    setBatchDeleteIds(selectedTaskIds);
  };

  const handleBatchReset = () => {
    selectedTaskIds.forEach((id) => resetTask(id));
    toast({
      title: t("dashboard.taskReset"),
      description: t("dashboard.selectedCount", {
        count: selectedTaskIds.length,
      }),
    });
    setSelectedTaskIds([]);
    setSelectionMode(false);
  };

  const handleBatchHide = () => {
    selectedTaskIds.forEach((id) => {
      const task = findTaskById(id);
      if (task) updateTask(id, { visible: !(task.visible !== false) });
    });
    setSelectedTaskIds([]);
    setSelectionMode(false);
  };

  const handleBatchPin = () => {
    selectedTaskIds.forEach((id) => {
      const task = findTaskById(id);
      if (task) updateTask(id, { pinned: !task.pinned });
    });
    setSelectedTaskIds([]);
    setSelectionMode(false);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCurrentCategoryId(null);
    setViewMode("categories");
    setSearchTerm("");
    const params = new URLSearchParams(searchParams);
    params.delete("categoryId");
    setSearchParams(params, { replace: true });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleCategoryDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderCategories(oldIndex, newIndex);
    }
  };

  const handleTaskDragEnd = ({ active, over }: DragEndEvent) => {
    if (!selectedCategory || !over || active.id === over.id) return;
    const tasksInCat = getTasksByCategory(selectedCategory.id);
    const oldIndex = tasksInCat.findIndex((t) => t.id === active.id);
    const newIndex = tasksInCat.findIndex((t) => t.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderTasks(selectedCategory.id, oldIndex, newIndex);
    }
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
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.totalTasks")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {totalTasks}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.completed")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-accent">
                {completedTasks}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {totalTasks > 0
                  ? Math.round((completedTasks / totalTasks) * 100)
                  : 0}
                % {t("statistics.ofTasks")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.pending")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {pendingTasks}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.categories")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {totalCategories}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {viewMode === "categories" ? (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                {t("dashboard.categories")}
              </h2>
              <Badge variant="secondary">
                {t("dashboard.categoriesBadge", {
                  count: filteredCategories.length,
                })}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("dashboard.searchCategories")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryFilterSheetOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {t("dashboard.openFilters")}
              </Button>
              <Button onClick={() => setIsCategoryModalOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t("taskModal.category")}
              </Button>
            </div>

            {filteredCategories.length === 0 ? (
              <Card className="text-center py-8 sm:py-12">
                <CardContent>
                  <LayoutGrid className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {searchTerm
                      ? t("dashboard.noCategoriesFound")
                      : t("dashboard.noCategories")}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    {searchTerm
                      ? t("dashboard.trySearch")
                      : t("dashboard.createFirstCategory")}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => setIsCategoryModalOpen(true)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("dashboard.firstCategoryButton")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCategoryDragEnd}
              >
                <SortableContext
                  items={sortedCategories.map((c) => c.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {sortedCategories.map((category) => (
                      <SortableCategory key={category.id} category={category}>
                        <CategoryCard
                          category={category}
                          tasks={getTasksByCategory(category.id)}
                          onEdit={(category) => {
                            setEditingCategory(category);
                            setIsCategoryModalOpen(true);
                          }}
                          onDelete={handleDeleteCategory}
                          onViewTasks={handleViewCategoryTasks}
                          onTogglePinned={handleToggleCategoryPinned}
                          onReset={handleResetCategory}
                        />
                      </SortableCategory>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  {t("dashboard.tasksTitle")}
                </h2>
              </div>
              <Badge variant="secondary">
                {t("dashboard.tasksBadge", { count: filteredTasks.length })}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("dashboard.searchTasks")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterSheetOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {t("dashboard.openFilters")}
              </Button>
              <Button onClick={() => setIsTaskModalOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t("taskModal.newTitle")}
              </Button>
              {enableBatchTasks && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectionMode((p) => !p);
                    setSelectedTaskIds([]);
                  }}
                >
                  {selectionMode
                    ? t("common.cancel")
                    : t("dashboard.selectMultiple")}
                </Button>
              )}
            </div>

            {selectionMode && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm flex-1">
                  {t("dashboard.selectedCount", {
                    count: selectedTaskIds.length,
                  })}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBatchDelete}
                  disabled={selectedTaskIds.length === 0}
                >
                  {t("dashboard.batchDelete")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchReset}
                  disabled={selectedTaskIds.length === 0}
                >
                  {t("dashboard.batchReset")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchHide}
                  disabled={selectedTaskIds.length === 0}
                >
                  {t("dashboard.batchHide")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchPin}
                  disabled={selectedTaskIds.length === 0}
                >
                  {t("dashboard.batchPin")}
                </Button>
              </div>
            )}

            {filteredTasks.length === 0 ? (
              <Card className="text-center py-8 sm:py-12">
                <CardContent>
                  <List className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {searchTerm
                      ? t("dashboard.noTasksFound")
                      : t("dashboard.noTasks")}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    {searchTerm
                      ? t("dashboard.trySearch")
                      : t("dashboard.createFirstTask", {
                          category: selectedCategory?.name,
                        })}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsTaskModalOpen(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("dashboard.firstTaskButton")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleTaskDragEnd}
              >
                <SortableContext
                  items={sortedTasks.map((t) => t.id)}
                  strategy={
                    taskLayout === "grid"
                      ? rectSortingStrategy
                      : verticalListSortingStrategy
                  }
                >
                  <div
                    className={
                      taskLayout === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        : "space-y-3 sm:space-y-4"
                    }
                  >
                    {sortedTasks.map((task) => (
                      <SortableTask key={task.id} task={task}>
                        <TaskCard
                          task={task}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                          onAddSubtask={handleAddSubtask}
                          onToggleComplete={handleToggleTaskComplete}
                          onViewDetails={handleViewTaskDetails}
                          onReset={handleResetTask}
                          isGrid={taskLayout === "grid"}
                          selectMode={selectionMode}
                          selected={selectedTaskIds.includes(task.id)}
                          onSelectChange={(checked) =>
                            handleSelectTask(task.id, checked)
                          }
                        />
                      </SortableTask>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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

      <TaskFilterSheet
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
        showCompleted={showCompleted}
        onShowCompletedChange={setShowCompleted}
        showHidden={showHidden}
        onShowHiddenChange={setShowHidden}
        layout={taskLayout}
        onLayoutChange={setTaskLayout}
      />
      <CategoryFilterSheet
        open={isCategoryFilterSheetOpen}
        onOpenChange={setIsCategoryFilterSheetOpen}
        sort={sortCriteria}
        onSortChange={setSortCriteria}
        filterColor={categoryFilterColor}
        onFilterColorChange={setCategoryFilterColor}
        colorOptions={categoryColorOptions}
        colorPalette={colorPalette}
      />
      <ConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={(o) => !o && setDeleteTaskId(null)}
        title={
          deleteTaskId
            ? t("task.deleteConfirm", {
                title: findTaskById(deleteTaskId)?.title,
              })
            : ""
        }
        onConfirm={() => {
          if (deleteTaskId) {
            deleteTask(deleteTaskId);
            toast({
              title: t("task.deleted"),
              description: t("dashboard.taskDeletedDesc"),
            });
            setDeleteTaskId(null);
          }
        }}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
      />
      <ConfirmDialog
        open={!!batchDeleteIds}
        onOpenChange={(o) => !o && setBatchDeleteIds(null)}
        title={
          batchDeleteIds
            ? t("task.deleteConfirm", {
                title: t("dashboard.selectedCount", {
                  count: batchDeleteIds.length,
                }),
              })
            : ""
        }
        onConfirm={() => {
          if (batchDeleteIds) {
            batchDeleteIds.forEach((id) => deleteTask(id));
            toast({
              title: t("task.deleted"),
              description: t("dashboard.taskDeletedDesc"),
            });
            setBatchDeleteIds(null);
            setSelectedTaskIds([]);
            setSelectionMode(false);
          }
        }}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
      />
      <ConfirmDialog
        open={!!deleteCategoryId}
        onOpenChange={(o) => !o && setDeleteCategoryId(null)}
        title={(() => {
          if (!deleteCategoryId) return "";
          const category = categories.find((c) => c.id === deleteCategoryId);
          if (!category) return "";
          const nonDefaultCount = categories.filter(
            (c) => c.id !== "default",
          ).length;
          return nonDefaultCount === 1 && category.id !== "default"
            ? t("category.deleteLastConfirm", { name: category.name })
            : t("category.deleteConfirm", { name: category.name });
        })()}
        onConfirm={() => {
          if (deleteCategoryId) {
            deleteCategory(deleteCategoryId);
            toast({
              title: t("category.deleted"),
              description: t("dashboard.categoryDeletedDesc"),
              action: (
                <ToastAction
                  altText={t("dashboard.undo")}
                  onClick={() => undoDeleteCategory(deleteCategoryId)}
                >
                  {t("dashboard.undo")}
                </ToastAction>
              ),
            });
            setDeleteCategoryId(null);
          }
        }}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
      />
    </div>
  );
};

export default Dashboard;
