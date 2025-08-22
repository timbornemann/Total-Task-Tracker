/**
 * Recurring Tasks Store - Handles recurring task management
 * Extracted from useTaskStore to reduce complexity and improve maintainability
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Task } from "@/types";
import { format } from "date-fns";

export interface RecurrencePattern {
  type: "daily" | "weekly" | "monthly" | "yearly";
  interval: number; // e.g., every 2 days, every 3 weeks
  daysOfWeek?: number[]; // for weekly: 0=Sunday, 1=Monday, etc.
  dayOfMonth?: number; // for monthly: 1-31
  weekOfMonth?: number; // for monthly: 1=first week, 2=second week, etc.
  monthOfYear?: number; // for yearly: 1=January, 12=December
}

export interface RecurringTask
  extends Omit<Task, "id" | "createdAt" | "updatedAt"> {
  id: string;
  recurrence: RecurrencePattern;
  isActive: boolean;
  lastGenerated?: Date;
  nextGeneration: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UseRecurringTasksStoreOptions {
  initialRecurringTasks?: RecurringTask[];
  autoProcessInterval?: number; // milliseconds, default: 60000 (1 minute)
}

export function useRecurringTasksStore(
  options: UseRecurringTasksStoreOptions = {},
) {
  const {
    initialRecurringTasks = [],
    autoProcessInterval = 60000, // 1 minute
  } = options;

  // State
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>(
    initialRecurringTasks,
  );
  const [generatedTasks, setGeneratedTasks] = useState<Task[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Utility functions
  const generateId = useCallback(() => {
    return (
      (crypto as { randomUUID?: () => string }).randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
  }, []);

  // Date calculation functions
  const calculateNextGeneration = useCallback(
    (recurrence: RecurrencePattern, fromDate: Date = new Date()): Date => {
      const next = new Date(fromDate);

      switch (recurrence.type) {
        case "daily":
          next.setDate(next.getDate() + recurrence.interval);
          break;

        case "weekly":
          if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
            // Find next day of week
            const currentDay = next.getDay();
            const sortedDays = [...recurrence.daysOfWeek].sort((a, b) => a - b);

            let nextDay = sortedDays.find((day) => day > currentDay);
            if (!nextDay) {
              // Next week
              nextDay = sortedDays[0];
              next.setDate(next.getDate() + (7 - currentDay + nextDay));
            } else {
              next.setDate(next.getDate() + (nextDay - currentDay));
            }
          } else {
            next.setDate(next.getDate() + 7 * recurrence.interval);
          }
          break;

        case "monthly":
          if (recurrence.dayOfMonth) {
            next.setMonth(next.getMonth() + recurrence.interval);
            next.setDate(recurrence.dayOfMonth);
          } else {
            next.setMonth(next.getMonth() + recurrence.interval);
          }
          break;

        case "yearly":
          next.setFullYear(next.getFullYear() + recurrence.interval);
          if (recurrence.monthOfYear && recurrence.dayOfMonth) {
            next.setMonth(recurrence.monthOfYear - 1); // 0-based months
            next.setDate(recurrence.dayOfMonth);
          }
          break;
      }

      return next;
    },
    [],
  );

  const shouldGenerateTask = useCallback(
    (recurringTask: RecurringTask): boolean => {
      if (!recurringTask.isActive) return false;

      const now = new Date();
      return now >= recurringTask.nextGeneration;
    },
    [],
  );

  // CRUD operations for recurring tasks
  const addRecurringTask = useCallback(
    (
      taskData: Omit<
        RecurringTask,
        "id" | "createdAt" | "updatedAt" | "nextGeneration"
      >,
    ) => {
      const now = new Date();
      const nextGeneration = calculateNextGeneration(taskData.recurrence, now);

      const newRecurringTask: RecurringTask = {
        ...taskData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        nextGeneration,
        isActive: taskData.isActive ?? true,
      };

      setRecurringTasks((prev) => [...prev, newRecurringTask]);
      return newRecurringTask.id;
    },
    [generateId, calculateNextGeneration],
  );

  const updateRecurringTask = useCallback(
    (taskId: string, updates: Partial<RecurringTask>) => {
      setRecurringTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;

          const updated = { ...task, ...updates, updatedAt: new Date() };

          // Recalculate next generation if recurrence pattern changed
          if (updates.recurrence) {
            updated.nextGeneration = calculateNextGeneration(
              updated.recurrence,
              updated.lastGenerated || updated.createdAt,
            );
          }

          return updated;
        }),
      );
    },
    [calculateNextGeneration],
  );

  const deleteRecurringTask = useCallback((taskId: string) => {
    setRecurringTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  const toggleRecurringTaskActive = useCallback((taskId: string) => {
    setRecurringTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, isActive: !task.isActive, updatedAt: new Date() }
          : task,
      ),
    );
  }, []);

  // Task generation
  const generateTaskFromRecurring = useCallback(
    (recurringTask: RecurringTask): Task => {
      const now = new Date();

      const generatedTask: Task = {
        id: generateId(),
        title: recurringTask.title,
        description: recurringTask.description,
        categoryId: recurringTask.categoryId,
        priority: recurringTask.priority,
        status: "todo",
        completed: false,
        dueDate: recurringTask.dueDate
          ? new Date(recurringTask.dueDate)
          : undefined,
        createdAt: now,
        updatedAt: now,
        subtasks: [],
        pinned: false,
        visible: true,
        order: 0,
        recurringTaskId: recurringTask.id, // Link back to recurring task
      };

      return generatedTask;
    },
    [generateId],
  );

  const processRecurringTasks = useCallback(() => {
    const now = new Date();
    const newTasks: Task[] = [];
    const updates: RecurringTask[] = [];

    recurringTasks.forEach((recurringTask) => {
      if (shouldGenerateTask(recurringTask)) {
        // Generate new task
        const newTask = generateTaskFromRecurring(recurringTask);
        newTasks.push(newTask);

        // Update recurring task with new generation info
        const nextGeneration = calculateNextGeneration(
          recurringTask.recurrence,
          now,
        );

        updates.push({
          ...recurringTask,
          lastGenerated: now,
          nextGeneration,
          updatedAt: now,
        });
      }
    });

    if (updates.length > 0) {
      setRecurringTasks((prev) =>
        prev.map((task) => {
          const update = updates.find((u) => u.id === task.id);
          return update || task;
        }),
      );
    }

    if (newTasks.length > 0) {
      setGeneratedTasks((prev) => [...prev, ...newTasks]);
    }

    return newTasks;
  }, [
    recurringTasks,
    shouldGenerateTask,
    generateTaskFromRecurring,
    calculateNextGeneration,
  ]);

  // Manual task generation
  const generateTaskNow = useCallback(
    (recurringTaskId: string) => {
      const recurringTask = recurringTasks.find(
        (task) => task.id === recurringTaskId,
      );
      if (!recurringTask) return null;

      const newTask = generateTaskFromRecurring(recurringTask);
      setGeneratedTasks((prev) => [...prev, newTask]);

      // Update last generated time
      updateRecurringTask(recurringTaskId, { lastGenerated: new Date() });

      return newTask;
    },
    [recurringTasks, generateTaskFromRecurring, updateRecurringTask],
  );

  // Query functions
  const getRecurringTaskById = useCallback(
    (taskId: string): RecurringTask | undefined => {
      return recurringTasks.find((task) => task.id === taskId);
    },
    [recurringTasks],
  );

  const getActiveRecurringTasks = useCallback((): RecurringTask[] => {
    return recurringTasks.filter((task) => task.isActive);
  }, [recurringTasks]);

  const getOverdueRecurringTasks = useCallback((): RecurringTask[] => {
    const now = new Date();
    return recurringTasks.filter(
      (task) => task.isActive && task.nextGeneration < now,
    );
  }, [recurringTasks]);

  const getRecurringTasksByCategory = useCallback(
    (categoryId: string): RecurringTask[] => {
      return recurringTasks.filter((task) => task.categoryId === categoryId);
    },
    [recurringTasks],
  );

  const getGeneratedTasksForRecurring = useCallback(
    (recurringTaskId: string): Task[] => {
      return generatedTasks.filter(
        (task) => task.recurringTaskId === recurringTaskId,
      );
    },
    [generatedTasks],
  );

  // Preview functionality
  const previewNextGenerations = useCallback(
    (recurringTaskId: string, count: number = 5): Date[] => {
      const recurringTask = getRecurringTaskById(recurringTaskId);
      if (!recurringTask) return [];

      const generations: Date[] = [];
      let currentDate = recurringTask.nextGeneration;

      for (let i = 0; i < count; i++) {
        generations.push(new Date(currentDate));
        currentDate = calculateNextGeneration(
          recurringTask.recurrence,
          currentDate,
        );
      }

      return generations;
    },
    [getRecurringTaskById, calculateNextGeneration],
  );

  // Validation
  const validateRecurrencePattern = useCallback(
    (pattern: RecurrencePattern): string | null => {
      if (pattern.interval <= 0) {
        return "Interval must be greater than 0";
      }

      switch (pattern.type) {
        case "weekly":
          if (
            pattern.daysOfWeek &&
            pattern.daysOfWeek.some((day) => day < 0 || day > 6)
          ) {
            return "Days of week must be between 0 and 6";
          }
          break;
        case "monthly":
          if (
            pattern.dayOfMonth &&
            (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)
          ) {
            return "Day of month must be between 1 and 31";
          }
          break;
        case "yearly":
          if (
            pattern.monthOfYear &&
            (pattern.monthOfYear < 1 || pattern.monthOfYear > 12)
          ) {
            return "Month of year must be between 1 and 12";
          }
          break;
      }

      return null;
    },
    [],
  );

  // Computed values
  const recurringTasksStats = useMemo(() => {
    const active = recurringTasks.filter((task) => task.isActive);
    const overdue = getOverdueRecurringTasks();

    return {
      total: recurringTasks.length,
      active: active.length,
      inactive: recurringTasks.length - active.length,
      overdue: overdue.length,
      generatedToday: generatedTasks.filter((task) => {
        const today = new Date();
        return task.createdAt.toDateString() === today.toDateString();
      }).length,
    };
  }, [recurringTasks, generatedTasks, getOverdueRecurringTasks]);

  // Auto-processing effect
  useEffect(() => {
    if (autoProcessInterval > 0) {
      intervalRef.current = setInterval(() => {
        processRecurringTasks();
      }, autoProcessInterval);

      // Initial processing
      processRecurringTasks();

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [processRecurringTasks, autoProcessInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    recurringTasks,
    generatedTasks,
    stats: recurringTasksStats,

    // Actions
    addRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
    toggleRecurringTaskActive,
    processRecurringTasks,
    generateTaskNow,

    // Queries
    getRecurringTaskById,
    getActiveRecurringTasks,
    getOverdueRecurringTasks,
    getRecurringTasksByCategory,
    getGeneratedTasksForRecurring,

    // Utilities
    previewNextGenerations,
    validateRecurrencePattern,
    calculateNextGeneration,

    // Manual control
    startAutoProcessing: () => {
      if (!intervalRef.current && autoProcessInterval > 0) {
        intervalRef.current = setInterval(
          processRecurringTasks,
          autoProcessInterval,
        );
      }
    },
    stopAutoProcessing: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    },

    // Raw setters for external sync
    setRecurringTasks,
    setGeneratedTasks,
  };
}
