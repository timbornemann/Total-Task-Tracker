
import React from 'react';
import { Task, Category } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Plus, Trash2, ArrowLeft, Timer } from 'lucide-react';
import { calculateTaskCompletion, getTaskProgress, getPriorityColor, getPriorityIcon } from '@/utils/taskUtils';
import TaskCard from './TaskCard';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  category: Category | null;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask: (parentTask: Task) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onViewDetails: (task: Task) => void;
  onStartPomodoro: (task: Task) => void;
  /** Display back button when true and trigger onBack on click */
  canGoBack?: boolean;
  onBack?: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  category,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleComplete,
  onViewDetails,
  onStartPomodoro,
  canGoBack,
  onBack
}) => {
  if (!task) return null;

  const isCompleted = calculateTaskCompletion(task);
  const progress = getTaskProgress(task);
  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const priorityClasses = getPriorityColor(task.priority);
  const priorityIcon = getPriorityIcon(task.priority);

  const handleToggleComplete = () => {
    if (task.subtasks.length === 0) {
      onToggleComplete(task.id, !task.completed);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {canGoBack && (
                <Button variant="ghost" size="icon" onClick={onBack} className="mt-1">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {task.subtasks.length === 0 && (
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={handleToggleComplete}
                  className="mt-1 h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
                />
              )}
              <div className="flex-1">
                <DialogTitle className={`text-xl font-bold ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                  {task.title}
                </DialogTitle>
                <div className="flex items-center space-x-3 mt-2">
                  <Badge className={`text-sm px-3 py-1 border ${priorityClasses}`}>
                    {priorityIcon} {task.priority.toUpperCase()}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: task.color }}
                    />
                    <span className="text-sm text-gray-600">
                      {category?.name || 'Unbekannte Kategorie'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddSubtask(task)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Unteraufgabe
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(task)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartPomodoro(task)}
              >
                <Timer className="h-4 w-4 mr-2" />
                Pomodoro
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDelete(task.id);
                  onClose();
                }}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {task.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Beschreibung</h3>
                <p className="text-gray-700 leading-relaxed">{task.description}</p>
              </div>
            )}

            {task.subtasks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Unteraufgaben ({task.subtasks.length})
                  </h3>
                  <div className="text-sm text-gray-600">
                    {progress.completed} von {progress.total} abgeschlossen
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Gesamtfortschritt</span>
                    <span className="text-sm text-gray-500">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>

                <div className="space-y-3">
                  {task.subtasks.map(subtask => (
                    <TaskCard
                      key={subtask.id}
                      task={subtask}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAddSubtask={onAddSubtask}
                      onToggleComplete={onToggleComplete}
                      onViewDetails={onViewDetails}
                      depth={0}
                    />
                  ))}
                </div>
              </div>
            )}

            {task.subtasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Keine Unteraufgaben vorhanden.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddSubtask(task)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Erste Unteraufgabe hinzufügen
                </Button>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Erstellt:</span>{' '}
                  {new Date(task.createdAt).toLocaleDateString('de-DE')}
                </div>
                <div>
                  <span className="font-medium">Zuletzt geändert:</span>{' '}
                  {new Date(task.updatedAt).toLocaleDateString('de-DE')}
                </div>
                {task.dueDate && (
                  <div>
                    <span className="font-medium">Fällig am:</span>{' '}
                    {new Date(task.dueDate).toLocaleDateString('de-DE')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
