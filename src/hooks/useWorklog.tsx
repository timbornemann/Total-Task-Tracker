import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { Trip, WorkDay, Deletion } from "@/types";
import {
  loadOfflineData,
  updateOfflineData,
  syncWithServer,
} from "@/utils/offline";
import { mergeLists } from "@/utils/sync";
import { normalizeDateTime } from "@/utils/time";

const API_TRIPS = "/api/trips";
const API_WORKDAYS = "/api/workdays";

const useWorklogImpl = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [deletions, setDeletions] = useState<Deletion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const lastDataRef = useRef("");
  const saveTimerRef = useRef<number | null>(null);

  const normalizeDay = (d: WorkDay): WorkDay => ({
    ...d,
    start: normalizeDateTime(d.start),
    end: normalizeDateTime(d.end),
  });

  useEffect(() => {
    const load = async () => {
      const offline = loadOfflineData();
      if (offline) {
        setTrips(offline.trips || []);
        setWorkDays((offline.workDays || []).map(normalizeDay));
        setDeletions(offline.deletions || []);
      }
      const synced = await syncWithServer();
      setTrips((prev) => mergeLists(prev, synced.trips || [], null));
      setWorkDays((prev) =>
        mergeLists(prev, (synced.workDays || []).map(normalizeDay), null),
      );
      setDeletions((prev) =>
        mergeLists(prev, synced.deletions || [], "deletedAt"),
      );
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
    const dataStr = JSON.stringify({
      trips,
      workDays: workDays.map(normalizeDay),
      deletions,
    });
    if (dataStr === lastDataRef.current) return;
    lastDataRef.current = dataStr;
    updateOfflineData({ trips, workDays: workDays.map(normalizeDay), deletions });
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        if (navigator.onLine) {
          await fetch(API_TRIPS, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(trips),
          });
          await fetch(API_WORKDAYS, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(workDays.map(normalizeDay)),
          });
          await syncWithServer();
        }
      } catch (err) {
        console.error("Error saving worklog", err);
      }
    }, 500);
  }, [trips, workDays, deletions, loaded]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const addTrip = (data: { name: string; location?: string; color: number }) => {
    const id = crypto.randomUUID();
    setTrips((prev) => [...prev, { id, ...data }]);
    return id;
  };

  const updateTrip = (id: string, data: Partial<Trip>) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };

  const deleteTrip = (id: string) => {
    const removedDays = workDays.filter((d) => d.tripId === id);
    const remainingTrips = trips.filter((t) => t.id !== id);
    const remainingDays = workDays.filter((d) => d.tripId !== id);
    setTrips(remainingTrips);
    setWorkDays(remainingDays);
    const newDeletions = [
      ...deletions,
      { id, type: "trip", deletedAt: new Date() },
      ...removedDays.map((d) => ({ id: d.id, type: "workday", deletedAt: new Date() })),
    ];
    setDeletions(newDeletions);
    updateOfflineData({
      trips: remainingTrips,
      workDays: remainingDays.map(normalizeDay),
      deletions: newDeletions,
    });
  };

  const addWorkDay = (data: {
    start: string;
    end: string;
    tripId?: string;
  }) => {
    const id = crypto.randomUUID();
    setWorkDays((prev) => [...prev, normalizeDay({ id, ...data })]);
  };

  const updateWorkDay = (id: string, data: Partial<WorkDay>) => {
    setWorkDays((prev) =>
      prev.map((d) =>
        d.id === id
          ? normalizeDay({ ...d, ...data })
          : d,
      ),
    );
  };

  const deleteWorkDay = (id: string) => {
    const updated = workDays.filter((d) => d.id !== id);
    setWorkDays(updated);
    const newDeletions = [
      ...deletions,
      { id, type: "workday", deletedAt: new Date() },
    ];
    setDeletions(newDeletions);
    updateOfflineData({ workDays: updated.map(normalizeDay), deletions: newDeletions });
    if (navigator.onLine) {
      fetch(API_WORKDAYS, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated.map(normalizeDay)),
      }).catch((err) => console.error("Error deleting workday", err));
    }
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
