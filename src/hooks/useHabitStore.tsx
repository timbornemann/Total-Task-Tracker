import React, { useState, useEffect, createContext, useContext } from "react";
import { Habit, HabitFormData } from "@/types";
import {
  loadOfflineData,
  updateOfflineData,
  syncWithServer,
} from "@/utils/offline";

const API_URL = "/api/habits";

const generateId = () =>
  (crypto as { randomUUID?: () => string }).randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const useHabitStoreImpl = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const offline = loadOfflineData();
      if (offline) {
        setHabits(
          (offline.habits || []).map((h) => ({
            ...h,
            createdAt: new Date(h.createdAt),
            updatedAt: new Date(h.updatedAt),
          })),
        );
      }
      const synced = await syncWithServer();
      setHabits(
        (synced.habits || []).map((h) => ({
          ...h,
          createdAt: new Date(h.createdAt),
          updatedAt: new Date(h.updatedAt),
        })),
      );
      setLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const save = async () => {
      try {
        updateOfflineData({ habits });
        if (navigator.onLine) {
          await fetch(API_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(habits),
          });
        }
      } catch (err) {
        console.error("Error saving habits", err);
      }
      if (navigator.onLine) await syncWithServer();
    };
    save();
  }, [habits, loaded]);

  const addHabit = (data: HabitFormData) => {
    const newHabit: Habit = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      completions: [],
      order: habits.length,
      pinned: false,
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, ...updates, updatedAt: new Date() } : h,
      ),
    );
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const toggleHabitCompletion = (id: string, date: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const set = new Set(h.completions);
        if (set.has(date)) set.delete(date);
        else set.add(date);
        return { ...h, completions: Array.from(set), updatedAt: new Date() };
      }),
    );
  };

  const reorderHabits = (from: number, to: number) => {
    setHabits((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const [item] = sorted.splice(from, 1);
      sorted.splice(to, 0, item);
      return sorted.map((h, idx) => ({ ...h, order: idx }));
    });
  };

  return {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    reorderHabits,
  };
};

type HabitStore = ReturnType<typeof useHabitStoreImpl>;

const HabitStoreContext = createContext<HabitStore | null>(null);

export const HabitStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const store = useHabitStoreImpl();
  return (
    <HabitStoreContext.Provider value={store}>
      {children}
    </HabitStoreContext.Provider>
  );
};

export const useHabitStore = () => {
  const ctx = useContext(HabitStoreContext);
  if (!ctx)
    throw new Error("useHabitStore must be used within HabitStoreProvider");
  return ctx;
};
