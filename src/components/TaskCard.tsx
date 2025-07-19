import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Task } from "@/types";
import {
  calculateTaskCompletion,
  getTaskProgress,
  getPriorityColors,
} from "@/utils/taskUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSettings } from "@/hooks/useSettings";
import {
  isColorDark,
  adjustColor,
  complementaryColor,
  hslToHex,
} from "@/utils/color";
import {
  Edit,
  Trash2,
  Plus,
  FolderOpen,
  Settings,
  ChevronDown,
  ChevronRight,
  Star,
  StarOff,
  Calendar as CalendarIcon,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTaskStore } from "@/hooks/useTaskStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask: (parentTask: Task) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onViewDetails: (task: Task) => void;
  onReset: (taskId: string) => void;
  depth?: number;
  /** Titles of all parent tasks from root to immediate parent */
  parentPathTitles?: string[];
  /** Whether to render subtasks recursively */
  showSubtasks?: boolean;
  /** Display card optimized for grid layout */
  isGrid?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleComplete,
  onViewDetails,
  onReset,
  depth = 0,
  parentPathTitles = [],
  showSubtasks = true,
  isGrid = false,
}) => {
  const isCompleted = calculateTaskCompletion(task);
  const progress = getTaskProgress(task);
  const progressPercentage =
    progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const priorityColors = getPriorityColors(task.priority);
  const { updateTask } = useTaskStore();
  const { t, i18n } = useTranslation();
  const { colorPalette, theme, collapseSubtasksByDefault } = useSettings();

  const [collapsed, setCollapsed] = useState(collapseSubtasksByDefault);

  React.useEffect(() => {
    setCollapsed(collapseSubtasksByDefault);
  }, [collapseSubtasksByDefault]);

  const baseColor = colorPalette[task.color] ?? colorPalette[0];
  const depthOffset = depth * 8;
  const displayColor =
    depth > 0
      ? adjustColor(
          baseColor,
          isColorDark(baseColor) ? depthOffset : -depthOffset,
        )
      : baseColor;
  const headerTextColor = complementaryColor(displayColor);
  const cardHex = hslToHex(theme.card);
  const progressBg = isColorDark(cardHex)
    ? adjustColor(cardHex, 50)
    : adjustColor(cardHex, -20);
  const progressColor = complementaryColor(cardHex);

  const isOverdue = React.useMemo(() => {
    if (!task.dueDate || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.dueDate) < today;
  }, [task.dueDate, task.completed]);

  const handleTogglePinned = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask(task.id, { pinned: !task.pinned });
  };

  const handleToggleComplete = () => {
    if (task.subtasks.length === 0) {
      onToggleComplete(task.id, !task.completed);
    }
  };

  const [subtaskCollapse, setSubtaskCollapse] = useState<
    Record<string, boolean>
  >({});

  const toggleSubtaskCollapse = (id: string) =>
    setSubtaskCollapse((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderSubtask = (st: Task, level: number) => {
    const done = calculateTaskCompletion(st);
    const progress = getTaskProgress(st);
    const percentage =
      progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    const base = colorPalette[st.color] ?? colorPalette[0];
    const offset = level * 8;
    const color =
      level > 0
        ? adjustColor(base, isColorDark(base) ? offset : -offset)
        : base;
    const progressBg = isColorDark(cardHex)
      ? adjustColor(cardHex, 50)
      : adjustColor(cardHex, -20);
    const progressColor = complementaryColor(cardHex);

    return (
      <div
        key={st.id}
        className="pl-4 border-l space-y-1"
        style={{ marginLeft: level * 16 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {st.subtasks.length === 0 ? (
              <input
                type="checkbox"
                checked={st.completed}
                onChange={() => onToggleComplete(st.id, !st.completed)}
                className="h-4 w-4 rounded-full border-gray-300 text-primary"
              />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0"
                onClick={() => toggleSubtaskCollapse(st.id)}
              >
                {subtaskCollapse[st.id] ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            <span
              className={`text-sm break-words ${
                done ? "line-through text-muted-foreground" : ""
              }`}
            >
              {st.title}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background z-50">
              <DropdownMenuItem onClick={() => onViewDetails(st)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                {t("taskCard.viewDetails")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSubtask(st)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("taskCard.addSubtask")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(st)}>
                <Edit className="h-4 w-4 mr-2" />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReset(st.id)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("taskCard.reset")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  updateTask(st.id, { visible: !(st.visible !== false) })
                }
              >
                {st.visible === false ? (
                  <Eye className="h-4 w-4 mr-2" />
                ) : (
                  <EyeOff className="h-4 w-4 mr-2" />
                )}
                {st.visible === false
                  ? t("taskCard.unhide")
                  : t("taskCard.hide")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(st.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {st.subtasks.length > 0 && (
          <div className="ml-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {t("taskCard.progress", {
                  completed: progress.completed,
                  total: progress.total,
                })}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {Math.round(percentage)}%
              </span>
            </div>
            <Progress
              value={percentage}
              className="h-1.5"
              backgroundColor={progressBg}
              indicatorColor={progressColor}
            />
            {!subtaskCollapse[st.id] && (
              <div className="space-y-1 mt-2">
                {st.subtasks.map((child) => renderSubtask(child, level + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      className={`${isGrid ? "h-full flex flex-col" : "mb-3 sm:mb-4"} rounded-xl ${
        depth > 0 ? "ml-3 sm:ml-6" : ""
      }`}
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
    >
      <div
        className="rounded-t-xl px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: displayColor, color: headerTextColor }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {task.subtasks.length === 0 && (
            <input
              type="checkbox"
              checked={task.completed}
              onChange={handleToggleComplete}
              className="h-4 w-4 rounded-full border-gray-300 text-primary"
            />
          )}
          <h3
            className={`font-semibold cursor-pointer text-sm sm:text-base break-words ${
              isCompleted ? "line-through opacity-70" : ""
            }`}
            onClick={() => onViewDetails(task)}
          >
            {task.title}
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background z-50">
            <DropdownMenuItem onClick={handleTogglePinned}>
              {task.pinned ? (
                <Star className="h-4 w-4 mr-2" />
              ) : (
                <StarOff className="h-4 w-4 mr-2" />
              )}
              {task.pinned ? t("taskDetail.unpin") : t("taskDetail.pin")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewDetails(task)}>
              <FolderOpen className="h-4 w-4 mr-2" />
              {t("taskCard.viewDetails")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddSubtask(task)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("taskCard.addSubtask")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="h-4 w-4 mr-2" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReset(task.id)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("taskCard.reset")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                updateTask(task.id, { visible: !(task.visible !== false) })
              }
            >
              {task.visible === false ? (
                <Eye className="h-4 w-4 mr-2" />
              ) : (
                <EyeOff className="h-4 w-4 mr-2" />
              )}
              {task.visible === false
                ? t("taskCard.unhide")
                : t("taskCard.hide")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(task.description || (showSubtasks && task.subtasks.length > 0)) && (
        <CardContent className={`pt-3 ${isGrid ? "flex-1" : ""}`}>
          {task.description && (
            <p
              className={`text-sm text-muted-foreground mb-3 break-words ${
                isGrid ? "line-clamp-3" : ""
              }`}
            >
              {task.description}
            </p>
          )}

          {showSubtasks && task.subtasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  {t("taskCard.progress", {
                    completed: progress.completed,
                    total: progress.total,
                  })}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {Math.round(progressPercentage)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-6 w-6 p-0"
                  >
                    {collapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Progress
                value={progressPercentage}
                className="h-2"
                backgroundColor={progressBg}
                indicatorColor={progressColor}
              />
              {!collapsed && (
                <div className="space-y-2 mt-2">
                  {task.subtasks.map((st) => renderSubtask(st, 1))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}

      {!task.description &&
        (!showSubtasks || task.subtasks.length === 0) &&
        isGrid && <div className="flex-1" />}

      <div className="border-t px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          {task.dueDate && (
            <>
              <CalendarIcon className="h-4 w-4" />
              <span
                style={{
                  color: isOverdue ? "hsl(var(--task-overdue))" : undefined,
                }}
              >
                {new Date(task.dueDate).toLocaleDateString(i18n.language, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </>
          )}
        </div>
        <Badge variant="outline" className="px-2 py-0.5">
          {t(`kanban.${task.status}`)}
        </Badge>
        <Badge
          className="px-2 py-0.5"
          style={{
            backgroundColor: priorityColors.bg,
            color: priorityColors.fg,
            borderColor: priorityColors.bg,
          }}
        >
          {t(`taskModal.${task.priority}`)}
        </Badge>
      </div>
    </Card>
  );
};

export default TaskCard;
