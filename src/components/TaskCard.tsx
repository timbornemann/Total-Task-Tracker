
import React from 'react';
import { Task } from '@/types';
import { calculateTaskCompletion, getTaskProgress, getPriorityColor, getPriorityIcon } from '@/utils/taskUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Edit, Trash2, Plus, FolderOpen } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask: (parentTask: Task) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onViewDetails: (task: Task) => void;
  depth?: number;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onAddSubtask,
  onToggleComplete,
  onViewDetails,
  depth = 0
}) => {
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
    <Card 
      className={`mb-4 transition-all duration-200 hover:shadow-md ${
        depth > 0 ? 'ml-6 border-l-4' : ''
      } ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}
      style={{ borderLeftColor: depth > 0 ? task.color : undefined }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {task.subtasks.length === 0 && (
              <input
                type="checkbox"
                checked={task.completed}
                onChange={handleToggleComplete}
                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            )}
            <div className="flex-1">
              <CardTitle 
                className={`text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors ${
                  isCompleted ? 'line-through text-gray-500' : ''
                }`}
                onClick={() => onViewDetails(task)}
              >
                {task.title}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={`text-xs px-2 py-1 border ${priorityClasses}`}>
                  {priorityIcon} {task.priority.toUpperCase()}
                </Badge>
                <div 
                  className="w-4 h-4 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: task.color }}
                />
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
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
              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {(task.description || task.subtasks.length > 0) && (
        <CardContent>
          {task.description && (
            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
          )}
          
          {task.subtasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Fortschritt: {progress.completed}/{progress.total} Unteraufgaben
                </span>
                <span className="text-sm text-gray-500">
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
