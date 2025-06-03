
import { useState, useEffect } from 'react';
import { Task, Category } from '@/types';

const STORAGE_KEYS = {
  TASKS: 'tasktracker_tasks',
  CATEGORIES: 'tasktracker_categories'
};

export const useTaskStore = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt)
        })));
      }
      
      if (savedCategories) {
        const parsedCategories = JSON.parse(savedCategories);
        setCategories(parsedCategories.map((category: any) => ({
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
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Fehler beim Speichern der Tasks:', error);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error('Fehler beim Speichern der Kategorien:', error);
    }
  }, [categories]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      subtasks: [],
      createdAt: new Date(),
      updatedAt: new Date()
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

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updateTaskRecursively = (tasks: Task[]): Task[] => {
      return tasks.map(task => {
        if (task.id === taskId) {
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
