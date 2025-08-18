/**
 * Tasks Store - Handles task CRUD operations, filtering, and sorting
 * Extracted from useTaskStore to reduce complexity and improve maintainability
 */

import { useState, useCallback, useMemo } from 'react';
import { Task } from '@/types';

export interface TaskFilters {
  categoryId?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  search?: string;
  showCompleted?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TaskSort {
  field: 'title' | 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'order';
  direction: 'asc' | 'desc';
}

export interface UseTasksStoreOptions {
  initialTasks?: Task[];
  defaultSort?: TaskSort;
  defaultFilters?: TaskFilters;
}

export function useTasksStore(options: UseTasksStoreOptions = {}) {
  const {
    initialTasks = [],
    defaultSort = { field: 'order', direction: 'asc' },
    defaultFilters = { showCompleted: false },
  } = options;

  // State
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);
  const [sort, setSort] = useState<TaskSort>(defaultSort);

  // Utility functions
  const generateId = useCallback(() => {
    return (crypto as { randomUUID?: () => string }).randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, []);

  // Task CRUD operations
  const addTask = useCallback((
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'pinned'> & {
      parentId?: string;
      visible?: boolean;
    }
  ) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      subtasks: [],
      pinned: false,
      visible: taskData.visible !== false,
      order: tasks.filter(t => 
        t.categoryId === taskData.categoryId && !t.parentId
      ).length,
    };

    setTasks(prev => {
      if (taskData.parentId) {
        // Add as subtask
        return updateTaskRecursive(prev, taskData.parentId, (parent) => ({
          ...parent,
          subtasks: [...parent.subtasks, { ...newTask, parentId: taskData.parentId }],
        }));
      } else {
        // Add as root task
        return [...prev, newTask];
      }
    });

    return newTask.id;
  }, [tasks, generateId]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => updateTaskRecursive(prev, taskId, (task) => ({
      ...task,
      ...updates,
      updatedAt: new Date(),
    })));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const removeTask = (tasks: Task[]): Task[] => {
        return tasks
          .filter(task => task.id !== taskId)
          .map(task => ({
            ...task,
            subtasks: removeTask(task.subtasks),
          }));
      };
      return removeTask(prev);
    });
  }, []);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    setTasks(prev => updateTaskRecursive(prev, taskId, (task) => {
      const newCompleted = !task.completed;
      const newStatus = newCompleted ? 'completed' : 'todo';
      
      // Also update all subtasks
      const updateSubtasks = (subtasks: Task[]): Task[] => {
        return subtasks.map(subtask => ({
          ...subtask,
          completed: newCompleted,
          status: newStatus,
          subtasks: updateSubtasks(subtask.subtasks),
        }));
      };

      return {
        ...task,
        completed: newCompleted,
        status: newStatus,
        subtasks: updateSubtasks(task.subtasks),
      };
    }));
  }, []);

  const moveTaskToSubtask = useCallback((taskId: string, newParentId: string) => {
    setTasks(prev => {
      // Find and remove the task
      let taskToMove: Task | null = null;
      let updatedTasks = prev;

      const extractTask = (tasks: Task[]): Task[] => {
        return tasks.reduce((acc, task) => {
          if (task.id === taskId) {
            taskToMove = { ...task, parentId: newParentId };
            return acc;
          }
          return [...acc, {
            ...task,
            subtasks: extractTask(task.subtasks),
          }];
        }, [] as Task[]);
      };

      updatedTasks = extractTask(updatedTasks);

      if (!taskToMove) return prev;

      // Add to new parent
      return updateTaskRecursive(updatedTasks, newParentId, (parent) => ({
        ...parent,
        subtasks: [...parent.subtasks, taskToMove!],
      }));
    });
  }, []);

  const reorderTasks = useCallback((
    categoryId: string,
    startIndex: number,
    endIndex: number
  ) => {
    setTasks(prev => {
      const categoryTasks = prev
        .filter(task => task.categoryId === categoryId && !task.parentId)
        .sort((a, b) => a.order - b.order);

      if (startIndex === endIndex) return prev;

      const [movedTask] = categoryTasks.splice(startIndex, 1);
      categoryTasks.splice(endIndex, 0, movedTask);

      // Update order for all tasks in this category
      const reorderedTasks = categoryTasks.map((task, index) => ({
        ...task,
        order: index,
      }));

      // Merge back with other tasks
      return prev.map(task => {
        if (task.categoryId === categoryId && !task.parentId) {
          const reordered = reorderedTasks.find(rt => rt.id === task.id);
          return reordered || task;
        }
        return task;
      });
    });
  }, []);

  const resetTask = useCallback((taskId: string) => {
    setTasks(prev => updateTaskRecursive(prev, taskId, (task) => 
      resetTaskRecursive(task)
    ));
  }, []);

  const resetCategoryTasks = useCallback((categoryId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.categoryId === categoryId) {
        return resetTaskRecursive(task);
      }
      return {
        ...task,
        subtasks: task.subtasks.map(subtask => 
          subtask.categoryId === categoryId ? resetTaskRecursive(subtask) : subtask
        ),
      };
    }));
  }, []);

  // Task query functions
  const getTasksByCategory = useCallback((categoryId: string): Task[] => {
    return tasks
      .filter(task => 
        task.categoryId === categoryId && 
        !task.parentId && 
        task.visible !== false
      )
      .sort((a, b) => 
        a.pinned === b.pinned ? a.order - b.order : a.pinned ? -1 : 1
      );
  }, [tasks]);

  const findTaskById = useCallback((taskId: string): Task | null => {
    const findInTasks = (tasksArray: Task[]): Task | null => {
      for (const task of tasksArray) {
        if (task.id === taskId) return task;
        const found = findInTasks(task.subtasks);
        if (found) return found;
      }
      return null;
    };
    return findInTasks(tasks);
  }, [tasks]);

  const getTasksByFilters = useCallback((customFilters?: TaskFilters): Task[] => {
    const activeFilters = { ...filters, ...customFilters };
    
    return tasks.filter(task => {
      // Category filter
      if (activeFilters.categoryId && task.categoryId !== activeFilters.categoryId) {
        return false;
      }

      // Status filter
      if (activeFilters.status && task.status !== activeFilters.status) {
        return false;
      }

      // Priority filter
      if (activeFilters.priority && task.priority !== activeFilters.priority) {
        return false;
      }

      // Completed filter
      if (!activeFilters.showCompleted && task.completed) {
        return false;
      }

      // Search filter
      if (activeFilters.search) {
        const searchLower = activeFilters.search.toLowerCase();
        const matches = 
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      // Date range filter
      if (activeFilters.dateRange) {
        const taskDate = task.dueDate || task.createdAt;
        if (taskDate < activeFilters.dateRange.start || 
            taskDate > activeFilters.dateRange.end) {
          return false;
        }
      }

      return task.visible !== false;
    });
  }, [tasks, filters]);

  const getSortedTasks = useCallback((tasksToSort: Task[] = tasks): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'dueDate':
          aValue = a.dueDate?.getTime() || 0;
          bValue = b.dueDate?.getTime() || 0;
          break;
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'order':
        default:
          aValue = a.order;
          bValue = b.order;
          break;
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, sort]);

  // Computed values
  const filteredTasks = useMemo(() => 
    getSortedTasks(getTasksByFilters()), 
    [getSortedTasks, getTasksByFilters]
  );

  const taskStats = useMemo(() => {
    const allTasks = tasks.filter(t => t.visible !== false);
    return {
      total: allTasks.length,
      completed: allTasks.filter(t => t.completed).length,
      pending: allTasks.filter(t => !t.completed).length,
      overdue: allTasks.filter(t => 
        t.dueDate && t.dueDate < new Date() && !t.completed
      ).length,
    };
  }, [tasks]);

  return {
    // State
    tasks: filteredTasks,
    allTasks: tasks,
    filters,
    sort,
    stats: taskStats,

    // Actions
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    moveTaskToSubtask,
    reorderTasks,
    resetTask,
    resetCategoryTasks,

    // Queries
    getTasksByCategory,
    findTaskById,
    getTasksByFilters,
    getSortedTasks,

    // Filter & Sort
    setFilters,
    setSort,
    updateFilters: (updates: Partial<TaskFilters>) => 
      setFilters(prev => ({ ...prev, ...updates })),
    
    // Bulk operations
    bulkUpdateTasks: (taskIds: string[], updates: Partial<Task>) => {
      taskIds.forEach(id => updateTask(id, updates));
    },
    bulkDeleteTasks: (taskIds: string[]) => {
      taskIds.forEach(deleteTask);
    },

    // Raw setters for external sync
    setTasks,
  };
}

// Helper functions
function updateTaskRecursive(
  tasks: Task[], 
  taskId: string, 
  updateFn: (task: Task) => Task
): Task[] {
  return tasks.map(task => {
    if (task.id === taskId) {
      return updateFn(task);
    }
    if (task.subtasks.length > 0) {
      const updatedSubtasks = updateTaskRecursive(task.subtasks, taskId, updateFn);
      if (updatedSubtasks !== task.subtasks) {
        return { ...task, subtasks: updatedSubtasks };
      }
    }
    return task;
  });
}

function resetTaskRecursive(task: Task): Task {
  return {
    ...task,
    completed: false,
    status: 'todo',
    visible: true,
    subtasks: task.subtasks.map(resetTaskRecursive),
  };
}
