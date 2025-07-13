import React, { createContext, useContext, useEffect, useState } from "react";
import { Trip, WorkDay } from "@/types";
import {
  loadOfflineData,
  updateOfflineData,
  syncWithServer,
} from "@/utils/offline";
import { mergeLists } from "@/utils/sync";

const API_TRIPS = "/api/trips";
const API_WORKDAYS = "/api/workdays";

const useWorklogImpl = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const load = async () => {
      const offline = loadOfflineData();
      if (offline) {
        setTrips(offline.trips || []);
        setWorkDays(offline.workDays || []);
      }
      const synced = await syncWithServer();
      setTrips((prev) => mergeLists(prev, synced.trips || [], null));
      setWorkDays((prev) => mergeLists(prev, synced.workDays || [], null));
      setLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!initialized) {
      setInitialized(true);
      return;
    }
    const save = async () => {
      try {
        updateOfflineData({ trips, workDays });
        if (navigator.onLine) {
          await fetch(API_TRIPS, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(trips),
          });
          await fetch(API_WORKDAYS, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(workDays),
          });
        }
      } catch (err) {
        console.error("Error saving worklog", err);
      }
      if (navigator.onLine) await syncWithServer();
    };
    save();
  }, [trips, workDays, loaded]);

  const addTrip = (data: { name: string; location?: string; color: number }) => {
    const id = crypto.randomUUID();
    setTrips((prev) => [...prev, { id, ...data }]);
    return id;
  };

  const updateTrip = (id: string, data: Partial<Trip>) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };

  const deleteTrip = (id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setWorkDays((prev) => prev.filter((d) => d.tripId !== id));
  };

  const addWorkDay = (data: {
    start: string;
    end: string;
    tripId?: string;
  }) => {
    const id = crypto.randomUUID();
    setWorkDays((prev) => [...prev, { id, ...data }]);
  };

  const updateWorkDay = (id: string, data: Partial<WorkDay>) => {
    setWorkDays((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...data } : d)),
    );
  };

  const deleteWorkDay = (id: string) => {
    setWorkDays((prev) => prev.filter((d) => d.id !== id));
  };

  return {
    trips,
    workDays,
    addTrip,
    updateTrip,
    deleteTrip,
    addWorkDay,
    updateWorkDay,
    deleteWorkDay,
  };
};

type Store = ReturnType<typeof useWorklogImpl>;

const WorklogContext = createContext<Store | null>(null);

export const WorklogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const store = useWorklogImpl();
  return (
    <WorklogContext.Provider value={store}>{children}</WorklogContext.Provider>
  );
};

export const useWorklog = () => {
  const ctx = useContext(WorklogContext);
  if (!ctx) throw new Error("useWorklog must be used within WorklogProvider");
  return ctx;
};
