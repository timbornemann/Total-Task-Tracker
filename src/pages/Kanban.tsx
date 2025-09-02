import React, { useState, useMemo } from "react";
import { useTaskStore } from "@/hooks/useTaskStore";
import TaskCard from "@/components/TaskCard";
import Navbar from "@/components/Navbar";
import TaskModal from "@/components/TaskModal";
import { useNavigate } from "react-router-dom";
import { usePomodoroStore } from "@/stores/pomodoro";
import { useToast } from "@/hooks/use-toast";
import { Task, TaskFormData } from "@/types";
import { flattenTasks, FlattenedTask } from "@/utils/taskUtils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import KanbanFilterSheet from "@/components/KanbanFilterSheet";
import { SlidersHorizontal, Search } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

interface SortableKanbanTaskProps {
  item: FlattenedTask;
  children: React.ReactNode;
}

const SortableKanbanTask: React.FC<SortableKanbanTaskProps> = ({
  item,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.task.id,
      data: { status: item.task.status },
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

interface KanbanColumnProps {
  id: "todo" | "inprogress" | "done";
  children: React.ReactNode;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, children }) => {
  const { setNodeRef } = useDroppable({ id, data: { status: id } });
  return (
    <div
      ref={setNodeRef}
      className="rounded-md p-2 space-y-2 min-h-[200px]"
      style={{ backgroundColor: `hsl(var(--kanban-${id}))` }}
    >
      {children}
    </div>
  );
};

const Kanban: React.FC = () => {
  const {
    tasks,
    categories,
    addTask,
    updateTask,
    deleteTask,
    findTaskById,
    resetTask,
  } = useTaskStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [parentTask, setParentTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { start: startPomodoro } = usePomodoroStore();
  const { colorPalette } = useSettings();

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterColor, setFilterColor] = useState<string>("all");
  const [filterPinned, setFilterPinned] = useState<string>("all");
  const [sortCriteria, setSortCriteria] = useState<string>("order");
  const [searchTerm, setSearchTerm] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const newStatus = over.data.current?.status as
      | "todo"
      | "inprogress"
      | "done";
    const oldStatus = active.data.current?.status as
      | "todo"
      | "inprogress"
      | "done";
    if (newStatus && newStatus !== oldStatus) {
      updateTask(active.id, {
        status: newStatus,
        completed: newStatus === "done",
      });
    }
  };

  const handleCreateTask = (taskData: TaskFormData) => {
    addTask({
      ...taskData,
      completed: false,
    });
    toast({
      title: t("kanban.created"),
      description: `"${taskData.title}" ${t("kanban.created")}`,
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
        title: t("kanban.updated"),
        description: `"${taskData.title}" ${t("kanban.updated")}`,
      });
      setEditingTask(null);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setDeleteTaskId(taskId);
  };

  const handleToggleTaskComplete = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed, status: completed ? "done" : "todo" });
    const task = findTaskById(taskId);
    toast({
      title: completed ? t("kanban.completed") : t("kanban.reactivated"),
      description: `"${task?.title}" ${completed ? t("kanban.completed") : t("kanban.reactivated")}`,
    });
  };

  const handleResetTask = (taskId: string) => {
    resetTask(taskId);
    const task = findTaskById(taskId);
    toast({
      title: t("kanban.reset"),
      description: `"${task?.title}" ${t("kanban.reset")}`,
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
    navigate(`/tasks/${task.id}?categoryId=${task.categoryId}`);
  };

  const flattened = flattenTasks(
    tasks.filter((t) => t.visible !== false || t.status === "done"),
  );
  const colorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          tasks
            .filter((t) => t.visible !== false || t.status === "done")
            .map((t) => t.color),
        ),
      ),
    [tasks],
  );

  const filtered = flattened.filter((item) => {
    const matchesCategory =
      filterCategory === "all" || item.task.categoryId === filterCategory;
    const matchesPriority =
      filterPriority === "all" || item.task.priority === filterPriority;
    const matchesColor =
      filterColor === "all" || item.task.color === Number(filterColor);
    const matchesPinned =
      filterPinned === "all" ||
      (filterPinned === "pinned" ? item.task.pinned : !item.task.pinned);
    return matchesCategory && matchesPriority && matchesColor && matchesPinned;
  });

  const priorityValue = (p: string) =>
    p === "high" ? 3 : p === "medium" ? 2 : 1;

  const sorted = useMemo(() => {
    const tasksToSort = [...filtered];
    tasksToSort.sort((a, b) => {
      const at = a.task;
      const bt = b.task;
      switch (sortCriteria) {
        case "order":
          return at.order - bt.order;
        case "title-asc":
          return at.title.localeCompare(bt.title);
        case "title-desc":
          return bt.title.localeCompare(at.title);
        case "created-asc":
          return at.createdAt.getTime() - bt.createdAt.getTime();
        case "created-desc":
          return bt.createdAt.getTime() - at.createdAt.getTime();
        case "priority-asc":
          return priorityValue(at.priority) - priorityValue(bt.priority);
        case "priority-desc":
          return priorityValue(bt.priority) - priorityValue(at.priority);
        case "due-asc":
          return (
            (at.nextDue ? at.nextDue.getTime() : Infinity) -
            (bt.nextDue ? bt.nextDue.getTime() : Infinity)
          );
        case "due-desc":
          return (
            (bt.nextDue ? bt.nextDue.getTime() : -Infinity) -
            (at.nextDue ? at.nextDue.getTime() : -Infinity)
          );
        default:
          return 0;
      }
    });
    return tasksToSort;
  }, [filtered, sortCriteria]);

  const tasksByStatus: Record<"todo" | "inprogress" | "done", FlattenedTask[]> =
    {
      todo: [],
      inprogress: [],
      done: [],
    };

  sorted.forEach((item) => {
    const status = item.task.status as "todo" | "inprogress" | "done";
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      item.task.title.toLowerCase().includes(search) ||
      item.task.description.toLowerCase().includes(search);
    if (matchesSearch) {
      tasksByStatus[status].push(item);
    }
  });

  const statuses: Array<"todo" | "inprogress" | "done"> = [
    "todo",
    "inprogress",
    "done",
  ];

  const labels: Record<"todo" | "inprogress" | "done", string> = {
    todo: t("kanban.todo"),
    inprogress: t("kanban.inprogress"),
    done: t("kanban.done"),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("navbar.kanban")} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("kanban.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <SelectValue placeholder={t("kanban.categoryLabel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("kanban.filter.all")}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterSheetOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {t("kanban.moreFilters")}
          </Button>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statuses.map((status) => (
              <SortableContext
                key={status}
                items={tasksByStatus[status].map((item) => item.task.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn id={status}>
                  <h2 className="text-base font-semibold mb-2">
                    {labels[status]}
                  </h2>
                  {tasksByStatus[status].map((item) => (
                    <SortableKanbanTask key={item.task.id} item={item}>
                      <TaskCard
                        task={item.task}
                        parentPathTitles={item.path.map((p) => p.title)}
                        showSubtasks={false}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onAddSubtask={handleAddSubtask}
                        onToggleComplete={handleToggleTaskComplete}
                        onViewDetails={handleViewTaskDetails}
                        onReset={handleResetTask}
                      />
                    </SortableKanbanTask>
                  ))}
                </KanbanColumn>
              </SortableContext>
            ))}
          </div>
        </DndContext>
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

      <KanbanFilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        sort={sortCriteria}
        onSortChange={setSortCriteria}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        filterColor={filterColor}
        onFilterColorChange={setFilterColor}
        filterPinned={filterPinned}
        onFilterPinnedChange={setFilterPinned}
        colorOptions={colorOptions}
        colorPalette={colorPalette}
      />
      <ConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={(o) => !o && setDeleteTaskId(null)}
        title={
          deleteTaskId
            ? t("kanban.deleteConfirm", {
                title: findTaskById(deleteTaskId)?.title,
              })
            : ""
        }
        onConfirm={() => {
          if (deleteTaskId) {
            deleteTask(deleteTaskId);
            toast({
              title: t("kanban.deleted"),
              description: t("kanban.deleted"),
            });
            setDeleteTaskId(null);
          }
        }}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
      />
    </div>
  );
};

export default Kanban;
