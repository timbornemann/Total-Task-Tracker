import { useState, useEffect } from 'react';
import { Task, Category } from '@/types';

const API_URL = '/api/data';

export const useTaskStore = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load data from the server on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Serverfehler');
        const { tasks: savedTasks, categories: savedCategories } = await res.json();

        if (savedTasks) {
          setTasks(savedTasks.map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            lastCompleted: task.lastCompleted ? new Date(task.lastCompleted) : undefined,
            nextDue: task.nextDue ? new Date(task.nextDue) : undefined,
          })));
        }

        if (savedCategories && savedCategories.length) {
          setCategories(savedCategories.map((category: any) => ({
            ...category,
            createdAt: new Date(category.createdAt),
            updatedAt: new Date(category.updatedAt)
          })));
        } else {
          // Create default category if none exist
          const defaultCategory: Category = {
            id: 'default',
            name: 'Allgemein',
            description: 'Standard Kategorie für alle Tasks',
            color: '#3B82F6',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          setCategories([defaultCategory]);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
      }
    };

    loadData();
  }, []);

  // Save to server whenever data changes
  useEffect(() => {
    const save = async () => {
      try {
        await fetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks, categories })
        });
      } catch (error) {
        console.error('Fehler beim Speichern der Daten:', error);
      }
    };

    save();
  }, [tasks, categories]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      subtasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: taskData.dueDate,
      nextDue: taskData.isRecurring ? calculateNextDue(taskData.recurrencePattern) : undefined,
      lastCompleted: undefined,
    };
    
    if (taskData.parentId) {
      // Add as subtask
      const updateTaskRecursively = (tasks: Task[]): Task[] => {
        return tasks.map(task => {
          if (task.id === taskData.parentId) {
            return {
              ...task,
              subtasks: [...task.subtasks, newTask],
              updatedAt: new Date()
            };
          }
          if (task.subtasks.length > 0) {
            return {
              ...task,
              subtasks: updateTaskRecursively(task.subtasks)
            };
          }
          return task;
        });
      };
      setTasks(prev => updateTaskRecursively(prev));
    } else {
      // Add as main task
      setTasks(prev => [...prev, newTask]);
    }
  };

  const calculateNextDue = (pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date | undefined => {
    if (!pattern) return undefined;
    
    const now = new Date();
    const nextDue = new Date(now);
    
    switch (pattern) {
      case 'daily':
        nextDue.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        nextDue.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        nextDue.setMonth(now.getMonth() + 1);
        break;
      case 'yearly':
        nextDue.setFullYear(now.getFullYear() + 1);
        break;
    }
    
    return nextDue;
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updateTaskRecursively = (tasks: Task[]): Task[] => {
      return tasks.map(task => {
        if (task.id === taskId) {
          // If task is being marked as complete and is recurring, update lastCompleted and nextDue
          if (updates.completed && task.isRecurring) {
            return {
              ...task,
              ...updates,
              updatedAt: new Date(),
              lastCompleted: new Date(),
              nextDue: calculateNextDue(task.recurrencePattern),
            };
          }
          return {
            ...task,
            ...updates,
            updatedAt: new Date()
          };
        }
        if (task.subtasks.length > 0) {
          return {
            ...task,
            subtasks: updateTaskRecursively(task.subtasks)
          };
        }
        return task;
      });
    };
    setTasks(prev => updateTaskRecursively(prev));
  };

  const deleteTask = (taskId: string) => {
    const deleteTaskRecursively = (tasks: Task[]): Task[] => {
      return tasks.filter(task => {
        if (task.id === taskId) {
          return false;
        }
        if (task.subtasks.length > 0) {
          task.subtasks = deleteTaskRecursively(task.subtasks);
        }
        return true;
      });
    };
    setTasks(prev => deleteTaskRecursively(prev));
  };

  const addCategory = (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (categoryId: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(category => 
      category.id === categoryId 
        ? { ...category, ...updates, updatedAt: new Date() }
        : category
    ));
  };

  const deleteCategory = (categoryId: string) => {
    if (categoryId === 'default') return; // Prevent deleting default category
    
    // Move tasks to default category
    const updateTasksCategory = (tasks: Task[]): Task[] => {
      return tasks.map(task => ({
        ...task,
        categoryId: task.categoryId === categoryId ? 'default' : task.categoryId,
        subtasks: updateTasksCategory(task.subtasks)
      }));
    };
    
    setTasks(prev => updateTasksCategory(prev));
    setCategories(prev => prev.filter(category => category.id !== categoryId));
  };

  const getTasksByCategory = (categoryId: string): Task[] => {
    return tasks.filter(task => task.categoryId === categoryId && !task.parentId);
  };

  const findTaskById = (taskId: string, tasksArray: Task[] = tasks): Task | null => {
    for (const task of tasksArray) {
      if (task.id === taskId) {
        return task;
      }
      const found = findTaskById(taskId, task.subtasks);
      if (found) {
        return found;
      }
    }
    return null;
  };

  return {
    tasks,
    categories,
    addTask,
    updateTask,
    deleteTask,
    addCategory,
    updateCategory,
    deleteCategory,
    getTasksByCategory,
    findTaskById
  };
};
