
import { Task } from '@/types';

export const calculateTaskCompletion = (task: Task): boolean => {
  if (task.subtasks.length === 0) {
    return task.completed;
  }

  if (task.completed) {
    return true;
  }

  return task.subtasks.every(subtask => calculateTaskCompletion(subtask));
};

export const getTaskProgress = (task: Task): { completed: number; total: number } => {
  if (task.subtasks.length === 0) {
    return { completed: task.completed ? 1 : 0, total: 1 };
  }
  
  let completed = 0;
  let total = 0;
  
  task.subtasks.forEach(subtask => {
    const progress = getTaskProgress(subtask);
    completed += progress.completed;
    total += progress.total;
  });
  
  return { completed, total };
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high':
      return 'text-destructive bg-destructive/10 border-destructive/30';
    case 'medium':
      return 'text-primary bg-primary/10 border-primary/30';
    case 'low':
      return 'text-accent bg-accent/10 border-accent/30';
    default:
      return 'text-muted-foreground bg-background border-border';
  }
};

export const getPriorityIcon = (priority: string): string => {
  switch (priority) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
};

export interface FlattenedTask {
  task: Task;
  /** Array of parent tasks from root to immediate parent */
  path: Task[];
}

export const flattenTasks = (
  tasks: Task[],
  parentPath: Task[] = []
): FlattenedTask[] => {
  const result: FlattenedTask[] = [];
  tasks.forEach(t => {
    result.push({ task: t, path: parentPath });
    if (t.subtasks.length > 0) {
      result.push(...flattenTasks(t.subtasks, [...parentPath, t]));
    }
  });
  return result;
};
