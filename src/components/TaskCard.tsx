
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Task } from '@/types';
import { calculateTaskCompletion, getTaskProgress, getPriorityColor, getPriorityIcon } from '@/utils/taskUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Edit,
  Trash2,
  Plus,
  FolderOpen,
  MoreVertical,
  Star,
  StarOff
} from 'lucide-react';
import { useTaskStore } from '@/hooks/useTaskStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask: (parentTask: Task) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onViewDetails: (task: Task) => void;
  depth?: number;
  /** Titles of all parent tasks from root to immediate parent */
  parentPathTitles?: string[];
  /** Whether to render subtasks recursively */
  showSubtasks?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleComplete,
  onViewDetails,
  depth = 0,
  parentPathTitles = [],
  showSubtasks = true
}) => {
  const isCompleted = calculateTaskCompletion(task);
  const progress = getTaskProgress(task);
  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const priorityClasses = getPriorityColor(task.priority);
  const priorityIcon = getPriorityIcon(task.priority);
  const { updateTask } = useTaskStore();
  const { t, i18n } = useTranslation();

  const handleTogglePinned = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask(task.id, { pinned: !task.pinned });
  };

  const handleToggleComplete = () => {
    if (task.subtasks.length === 0) {
      onToggleComplete(task.id, !task.completed);
    }
  };

  return (
    <Card 
      className={`mb-3 sm:mb-4 transition-all duration-200 hover:shadow-md ${
        depth > 0 ? 'ml-3 sm:ml-6 border-l-4' : ''
      } ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}
      style={{ borderLeftColor: depth > 0 ? task.color : undefined }}
    >
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
            {task.subtasks.length === 0 && (
              <input
                type="checkbox"
                checked={task.completed}
                onChange={handleToggleComplete}
                className="mt-1 h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle
                className={`text-base sm:text-lg font-semibold cursor-pointer hover:text-primary transition-colors ${
                  isCompleted ? 'line-through text-gray-500' : ''
                } break-words`}
                onClick={() => onViewDetails(task)}
              >
                {task.title}
              </CardTitle>
              {parentPathTitles.length > 0 && (
                <div className="text-xs text-gray-500 italic mt-1 break-words">
                  {parentPathTitles.join(' > ')}
                </div>
              )}
              <div className="flex items-center space-x-2 mt-2 flex-wrap gap-1">
                <Badge className={`text-xs px-2 py-1 border ${priorityClasses} flex-shrink-0`}>
                  <span className="hidden sm:inline">{priorityIcon} </span>
                  {task.priority.toUpperCase()}
                </Badge>
                <div
                  className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: task.color }}
                />
                {task.isRecurring && (
                  <Badge
                    variant="outline"
                    className="text-xs flex-shrink-0 text-center leading-snug"
                  >
                    <span className="hidden sm:block">
                      {t('taskCard.recurring')}
                      <br />
                      {task.recurrencePattern}
                    </span>
                    <span className="sm:hidden">{task.recurrencePattern}</span>
                  </Badge>
                )}
                {task.dueDate && (
                  <span
                    className={`text-xs flex-shrink-0 ${
                      new Date(task.dueDate) < new Date() && !task.completed
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {t('taskCard.due', { date: new Date(task.dueDate).toLocaleDateString(i18n.language) })}
                    {task.startTime && (
                      <> {task.startTime}-{task.endTime || ''}</>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex space-x-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTogglePinned}
              className="h-8 w-8 p-0"
            >
              {task.pinned ? (
                <Star className="h-4 w-4 fill-current" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetails(task)}
              className="h-8 w-8 p-0"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddSubtask(task)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Actions Dropdown */}
          <div className="sm:hidden flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background z-50">
            <DropdownMenuItem onClick={handleTogglePinned}>
              {task.pinned ? (
                <Star className="h-4 w-4 mr-2" />
              ) : (
                <StarOff className="h-4 w-4 mr-2" />
              )}
              {task.pinned ? t('taskDetail.unpin') : t('taskDetail.pin')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewDetails(task)}>
              <FolderOpen className="h-4 w-4 mr-2" />
              {t('taskCard.viewDetails')}
            </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddSubtask(task)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('taskCard.addSubtask')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      {(task.description || (showSubtasks && task.subtasks.length > 0)) && (
        <CardContent className="pt-0">
          {task.description && (
            <p className="text-sm text-gray-600 mb-3 break-words">{task.description}</p>
          )}

          {showSubtasks && task.subtasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {t('taskCard.progress', { completed: progress.completed, total: progress.total })}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              
              <div className="mt-4">
                {task.subtasks.map(subtask => (
                  <TaskCard
                    key={subtask.id}
                    task={subtask}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddSubtask={onAddSubtask}
                    onToggleComplete={onToggleComplete}
                    onViewDetails={onViewDetails}
                    depth={depth + 1}
                    showSubtasks={showSubtasks}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default TaskCard;
