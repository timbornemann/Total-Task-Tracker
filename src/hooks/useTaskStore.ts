import { useState, useEffect } from 'react';
import { Task, Category } from '@/types';

const LOCAL_KEY = 'task-data';

function dateReviver(key: string, value: any) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return value;
}

function serialize(data: any) {
  return JSON.stringify(data, (k, v) =>
    v instanceof Date ? v.toISOString() : v
  );
}

const API_URL = '/api/data';

export const useTaskStore = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pendingSync, setPendingSync] = useState(false);

  // Load data from localStorage and server on mount
  useEffect(() => {
    const loadData = async () => {
      // first load from localStorage if available
      const local = localStorage.getItem(LOCAL_KEY);
      if (local) {
        try {
          const { tasks: savedTasks, categories: savedCategories } = JSON.parse(local, dateReviver);
          if (savedTasks) setTasks(savedTasks);
          if (savedCategories) setCategories(savedCategories);
        } catch (e) {
          console.error('Fehler beim Laden lokaler Daten:', e);
        }
      }

      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Serverfehler');
        const { tasks: savedTasks, categories: savedCategories } = await res.json();

        let loadedTasks: Task[] = [];
        if (savedTasks) {
          loadedTasks = savedTasks.map((task: any, idx: number) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            lastCompleted: task.lastCompleted ? new Date(task.lastCompleted) : undefined,
            nextDue: task.nextDue ? new Date(task.nextDue) : undefined,
            order: typeof task.order === 'number' ? task.order : idx,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined
          }));
          setTasks(loadedTasks);
        }

        let loadedCategories: Category[] = [];
        if (savedCategories && savedCategories.length) {
          loadedCategories = savedCategories.map((category: any, idx: number) => ({
            ...category,
            createdAt: new Date(category.createdAt),
            updatedAt: new Date(category.updatedAt),
            order: typeof category.order === 'number' ? category.order : idx
          }));
          setCategories(loadedCategories);
        } else {
          const defaultCategory: Category = {
            id: 'default',
            name: 'Allgemein',
            description: 'Standard Kategorie für alle Tasks',
            color: '#3B82F6',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          loadedCategories = [defaultCategory];
          setCategories(loadedCategories);
        }
        localStorage.setItem(LOCAL_KEY, serialize({ tasks: loadedTasks, categories: loadedCategories }));
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        if (categories.length === 0) {
          const defaultCategory: Category = {
            id: 'default',
            name: 'Allgemein',
            description: 'Standard Kategorie für alle Tasks',
            color: '#3B82F6',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          setCategories([defaultCategory]);
          localStorage.setItem(LOCAL_KEY, serialize({ tasks: [], categories: [defaultCategory] }));
        }
      }
    };

    loadData();
  }, []);

  // Save to localStorage and server whenever data changes
  useEffect(() => {
    const data = { tasks, categories };
    localStorage.setItem(LOCAL_KEY, serialize(data));

    const save = async () => {
      try {
        await fetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        setPendingSync(false);
      } catch (error) {
        console.error('Fehler beim Speichern der Daten:', error);
        setPendingSync(true);
      }
    };

    if (navigator.onLine) {
      save();
    } else {
      setPendingSync(true);
    }
  }, [tasks, categories]);

  // Sync pending changes when connection is restored
  useEffect(() => {
    const sync = async () => {
      if (pendingSync && navigator.onLine) {
        const local = localStorage.getItem(LOCAL_KEY);
        if (local) {
          try {
            await fetch(API_URL, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: local
            });
            setPendingSync(false);
          } catch (e) {
            console.error('Fehler beim Synchronisieren:', e);
          }
        }
      }
    };
    window.addEventListener('online', sync);
    sync();
    return () => window.removeEventListener('online', sync);
  }, [pendingSync]);

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
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      order: 0
    };
    
    if (taskData.parentId) {
      // Add as subtask
      const updateTaskRecursively = (tasks: Task[]): Task[] => {
        return tasks.map(task => {
          if (task.id === taskData.parentId) {
            return {
              ...task,
              subtasks: [...task.subtasks, { ...newTask, order: task.subtasks.length }],
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
      setTasks(prev => {
        const tasksInCategory = prev.filter(t => t.categoryId === taskData.categoryId && !t.parentId);
        return [...prev, { ...newTask, order: tasksInCategory.length }];
      });
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
              dueDate: task.dueDate,
            };
          }
          return {
            ...task,
            ...updates,
            updatedAt: new Date(),
            dueDate: updates.dueDate ? new Date(updates.dueDate) : task.dueDate
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
    setTasks(prev => {
      const without = deleteTaskRecursively(prev);
      const main = without.filter(t => !t.parentId);
      const subs = without.filter(t => t.parentId);
      const grouped: { [key: string]: Task[] } = {};
      main.forEach(t => {
        grouped[t.categoryId] = grouped[t.categoryId] || [];
        grouped[t.categoryId].push(t);
      });
      const reorderedMain = Object.values(grouped).flatMap(list =>
        list.map((t, idx) => ({ ...t, order: idx }))
      );
      return [...reorderedMain, ...subs];
    });
  };

  const addCategory = (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 0
    };
    setCategories(prev => [...prev, { ...newCategory, order: prev.length }]);
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
    setCategories(prev =>
      prev
        .filter(category => category.id !== categoryId)
        .map((c, idx) => ({ ...c, order: idx }))
    );
  };

  const reorderCategories = (startIndex: number, endIndex: number) => {
    setCategories(prev => {
      const updated = Array.from(prev);
      const [removed] = updated.splice(startIndex, 1);
      updated.splice(endIndex, 0, removed);
      return updated.map((c, idx) => ({ ...c, order: idx }));
    });
  };

  const reorderTasks = (categoryId: string, startIndex: number, endIndex: number) => {
    setTasks(prev => {
      const tasksInCategory = prev.filter(t => t.categoryId === categoryId && !t.parentId);
      const others = prev.filter(t => !(t.categoryId === categoryId && !t.parentId));
      const ordered = Array.from(tasksInCategory);
      const [removed] = ordered.splice(startIndex, 1);
      ordered.splice(endIndex, 0, removed);
      const orderedWithIndex = ordered.map((t, idx) => ({ ...t, order: idx }));
      return [...others, ...orderedWithIndex];
    });
  };

  const getTasksByCategory = (categoryId: string): Task[] => {
    return tasks
      .filter(task => task.categoryId === categoryId && !task.parentId)
      .sort((a, b) => a.order - b.order);
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
    findTaskById,
    reorderCategories,
    reorderTasks
  };
};
