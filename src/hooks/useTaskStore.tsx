import React, { useState, useEffect, createContext, useContext } from 'react';
import { Task, Category, Note } from '@/types';

const API_URL = '/api/data';

const useTaskStoreImpl = () => {
  const sortNotes = (list: Note[]): Note[] => {
    const pinned = list
      .filter(n => n.pinned)
      .sort((a, b) => a.order - b.order)
      .map((n, idx) => ({ ...n, order: idx }));
    const others = list
      .filter(n => !n.pinned)
      .sort((a, b) => a.order - b.order)
      .map((n, idx) => ({ ...n, order: idx }));
    return [...pinned, ...others];
  };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [recentlyDeletedCategories, setRecentlyDeletedCategories] =
    useState<{ category: Category; taskIds: string[] }[]>([]);

  // Load data from the server on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Serverfehler');
        const {
          tasks: savedTasks,
          categories: savedCategories,
          notes: savedNotes
        } = await res.json();

        if (savedTasks) {
          setTasks(
            savedTasks.map((task: any, idx: number) => ({
              ...task,
              createdAt: new Date(task.createdAt),
              updatedAt: new Date(task.updatedAt),
              dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
              lastCompleted: task.lastCompleted ? new Date(task.lastCompleted) : undefined,
              nextDue: task.nextDue ? new Date(task.nextDue) : undefined,
              order: typeof task.order === 'number' ? task.order : idx,
              completed: task.completed ?? false,
              status: task.status ?? (task.completed ? 'done' : 'todo'),
              pinned: task.pinned ?? false
            }))
          );
        }

        if (savedNotes) {
          setNotes(
            sortNotes(
              savedNotes.map((note: any, idx: number) => ({
                ...note,
                createdAt: new Date(note.createdAt),
                updatedAt: new Date(note.updatedAt),
                pinned: note.pinned ?? false,
                order: typeof note.order === 'number' ? note.order : idx
              }))
            )
          );
        }

        if (savedCategories && savedCategories.length) {
          setCategories(
            savedCategories.map((category: any, idx: number) => ({
              ...category,
              createdAt: new Date(category.createdAt),
              updatedAt: new Date(category.updatedAt),
              order: typeof category.order === 'number' ? category.order : idx
            }))
          );
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
          body: JSON.stringify({ tasks, categories, notes })
        });
      } catch (error) {
        console.error('Fehler beim Speichern der Daten:', error);
      }
    };

    save();
  }, [tasks, categories, notes]);

  const addTask = (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'pinned'>
  ) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      subtasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      nextDue: taskData.isRecurring
        ? calculateNextDue(taskData.recurrencePattern)
        : undefined,
      lastCompleted: undefined,
      status: 'todo',
      order: 0,
      pinned: false
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

    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (!categoryToDelete) return;

    const updateTasksCategory = (tasks: Task[]): Task[] => {
      return tasks.map(task => ({
        ...task,
        categoryId: task.categoryId === categoryId ? 'default' : task.categoryId,
        subtasks: updateTasksCategory(task.subtasks)
      }));
    };

    const affectedTaskIds = tasks
      .filter(t => t.categoryId === categoryId)
      .map(t => t.id);

    setTasks(prev => updateTasksCategory(prev));

    setCategories(prev => {
      const remaining = prev
        .filter(category => category.id !== categoryId)
        .map((c, idx) => ({ ...c, order: idx }));

      // If no categories remain after deletion, recreate a default category
      if (remaining.length === 0) {
        const defaultCategory: Category = {
          id: 'default',
          name: 'Allgemein',
          description: 'Standard Kategorie für alle Tasks',
          color: '#3B82F6',
          createdAt: new Date(),
          updatedAt: new Date(),
          order: 0
        };
        return [defaultCategory];
      }
      return remaining;
    });

    setRecentlyDeletedCategories(prev => [
      ...prev,
      { category: categoryToDelete, taskIds: affectedTaskIds }
    ]);
  };

  const undoDeleteCategory = (categoryId: string) => {
    const deleted = recentlyDeletedCategories.find(r => r.category.id === categoryId);
    if (!deleted) return;

    setCategories(prev => {
      const updated = [...prev];
      updated.splice(deleted.category.order, 0, deleted.category);
      return updated.map((c, idx) => ({ ...c, order: idx }));
    });

    setTasks(prev =>
      prev.map(t =>
        deleted.taskIds.includes(t.id)
          ? { ...t, categoryId: deleted.category.id }
          : t
      )
    );

    setRecentlyDeletedCategories(prev =>
      prev.filter(r => r.category.id !== categoryId)
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

  const addNote = (
    data: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'order'>
  ) => {
    const newNote: Note = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 0,
      pinned: data.pinned ?? false
    };
    setNotes(prev => sortNotes([...prev, newNote]));
  };

  const updateNote = (noteId: string, updates: Partial<Note>) => {
    setNotes(prev =>
      sortNotes(
        prev.map(n =>
          n.id === noteId ? { ...n, ...updates, updatedAt: new Date() } : n
        )
      )
    );
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => sortNotes(prev.filter(n => n.id !== noteId)));
  };

  const reorderNotes = (startIndex: number, endIndex: number) => {
    setNotes(prev => {
      const ordered = sortNotes(prev);
      const [removed] = ordered.splice(startIndex, 1);
      ordered.splice(endIndex, 0, removed);
      return sortNotes(ordered);
    });
  };

  const getTasksByCategory = (categoryId: string): Task[] => {
    return tasks
      .filter(task => task.categoryId === categoryId && !task.parentId)
      .sort((a, b) =>
        a.pinned === b.pinned ? a.order - b.order : a.pinned ? -1 : 1
      );
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
    notes,
    recentlyDeletedCategories,
    addTask,
    updateTask,
    deleteTask,
    addCategory,
    updateCategory,
    deleteCategory,
    undoDeleteCategory,
    getTasksByCategory,
    findTaskById,
    reorderCategories,
    reorderTasks,
    addNote,
    updateNote,
    deleteNote,
    reorderNotes
  };
};

type TaskStore = ReturnType<typeof useTaskStoreImpl>;

const TaskStoreContext = createContext<TaskStore | null>(null);

export const TaskStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useTaskStoreImpl();
  return (
    <TaskStoreContext.Provider value={store}>{children}</TaskStoreContext.Provider>
  );
};

export const useTaskStore = () => {
  const ctx = useContext(TaskStoreContext);
  if (!ctx) {
    throw new Error('useTaskStore must be used within TaskStoreProvider');
  }
  return ctx;
};
