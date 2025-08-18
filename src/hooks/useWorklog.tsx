import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Trip, WorkDay, Deletion, Commute } from "@/types";
import {
  loadOfflineData,
  updateOfflineData,
} from "@/utils/offline";
import { normalizeDateTime } from "@/utils/time";

const API_TRIPS = "/api/trips";
const API_WORKDAYS = "/api/workdays";
const API_COMMUTES = "/api/commutes";
const API_ALL = "/api/all";

const generateId = () =>
  (crypto as { randomUUID?: () => string }).randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const useWorklogImpl = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [commutes, setCommutes] = useState<Commute[]>([]);
  const [deletions, setDeletions] = useState<Deletion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const normalizeDay = (d: WorkDay): WorkDay => ({
    ...d,
    start: normalizeDateTime(d.start),
    end: normalizeDateTime(d.end),
    updatedAt: d.updatedAt || new Date(),
  });

  // Initial data loading from local storage and server
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // First load from offline storage
        const offlineData = loadOfflineData();
        if (offlineData) {
          setTrips(offlineData.trips || []);
          setWorkDays((offlineData.workDays || []).map(normalizeDay));
          setCommutes(offlineData.commutes || []);
          setDeletions(offlineData.deletions || []);
        }

        // Then try to get from server if online
        if (navigator.onLine) {
          const response = await fetch(API_ALL);
          if (response.ok) {
            const serverData = await response.json();
            setTrips(serverData.trips || []);
            setWorkDays((serverData.workDays || []).map(normalizeDay));
            setCommutes(serverData.commutes || []);
            setDeletions(serverData.deletions || []);
          }
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadInitialData();
  }, []);

  // Helper function to save all data both offline and to server
  const saveAllData = async (
    newTrips: Trip[],
    newWorkDays: WorkDay[],
    newCommutes: Commute[],
    newDeletions: Deletion[],
  ) => {
    // Update local state
    setTrips(newTrips);
    setWorkDays(newWorkDays);
    setCommutes(newCommutes);
    setDeletions(newDeletions);

    // Save to offline storage immediately
    updateOfflineData({
      trips: newTrips,
      workDays: newWorkDays.map(normalizeDay),
      commutes: newCommutes,
      deletions: newDeletions,
    });

    // Save to server if online
    if (navigator.onLine) {
      try {
        // First save specialized data
        const saveTripPromise = fetch(API_TRIPS, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTrips),
        });

        const saveWorkDaysPromise = fetch(API_WORKDAYS, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newWorkDays.map(normalizeDay)),
        });

        const saveCommutesPromise = fetch(API_COMMUTES, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCommutes),
        });

        // Then also save to /api/all to ensure deletions are captured
        const saveAllPromise = fetch(API_ALL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trips: newTrips,
            workDays: newWorkDays.map(normalizeDay),
            commutes: newCommutes,
            deletions: newDeletions,
            // Keep other fields empty to avoid affecting other data
            tasks: [],
            categories: [],
            notes: [],
            recurring: [],
            habits: [],
            flashcards: [],
            decks: [],
            pomodoroSessions: [],
            timers: [],
            items: [],
            itemCategories: [],
            itemTags: [],
            settings: {}
          }),
        });

        await Promise.all([
          saveTripPromise,
          saveWorkDaysPromise,
          saveCommutesPromise,
          saveAllPromise,
        ]);
      } catch (error) {
        console.error("Failed to save to server:", error);
        // At least we have saved to offline storage
      }
    }
  };

  const addTrip = (data: { name: string; location?: string; color: number }) => {
    const id = generateId();
    const now = new Date();
    const newTrip = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    const newTrips = [...trips, newTrip];
    saveAllData(newTrips, workDays, commutes, deletions);
    return id;
  };

  const updateTrip = (id: string, data: Partial<Trip>) => {
    const newTrips = trips.map(trip =>
      trip.id === id
        ? { ...trip, ...data, updatedAt: new Date() }
        : trip
    );
    saveAllData(newTrips, workDays, commutes, deletions);
  };

  const deleteTrip = (id: string) => {
    const now = new Date();
    // Find work days associated with this trip
    const removedDays = workDays.filter(day => day.tripId === id);
    
    // Create deletion records
    const newDeletions = [
      ...deletions,
      { id, type: "trip" as const, deletedAt: now },
      ...removedDays.map(day => ({ 
        id: day.id, 
        type: "workday" as const, 
        deletedAt: now 
      }))
    ];
    
    // Remove the trip and associated work days
    const newTrips = trips.filter(trip => trip.id !== id);
    const newWorkDays = workDays.filter(day => day.tripId !== id);
    
    saveAllData(newTrips, newWorkDays, commutes, newDeletions);
  };

  const addWorkDay = (data: {
    start: string;
    end: string;
    tripId?: string;
    commuteId?: string;
    commuteKm?: number;
  }) => {
    const id = generateId();
    const now = new Date();
    const newWorkDay = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    const newWorkDays = [...workDays, normalizeDay(newWorkDay)];
    saveAllData(trips, newWorkDays, commutes, deletions);
  };

  const updateWorkDay = (id: string, data: Partial<WorkDay>) => {
    const newWorkDays = workDays.map(day =>
      day.id === id
        ? normalizeDay({ ...day, ...data, updatedAt: new Date() })
        : day
    );
    saveAllData(trips, newWorkDays, commutes, deletions);
  };

  const deleteWorkDay = async (id: string) => {
    // Create deletion record
    const now = new Date();
    const newDeletions = [
      ...deletions,
      { id, type: "workday" as const, deletedAt: now }
    ];
    
    // Remove the work day
    const newWorkDays = workDays.filter(day => day.id !== id);
    
    // Save changes with deletion record
    saveAllData(trips, newWorkDays, commutes, newDeletions);
  };

  const addCommute = (data: { name: string; kilometers: number }) => {
    const id = generateId();
    const now = new Date();
    const newCommute = { id, ...data, createdAt: now, updatedAt: now };
    const newCommutes = [...commutes, newCommute];
    saveAllData(trips, workDays, newCommutes, deletions);
    return id;
  };

  return {
    trips,
    workDays,
    commutes,
    addTrip,
    updateTrip,
    deleteTrip,
    addWorkDay,
    updateWorkDay,
    deleteWorkDay,
    addCommute,
    isLoaded
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
