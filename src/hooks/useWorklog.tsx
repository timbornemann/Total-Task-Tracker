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
  const userActionInProgressRef = useRef(false);
  const lastUserActionRef = useRef(0);

  const normalizeDay = (d: WorkDay): WorkDay => ({
    ...d,
    start: normalizeDateTime(d.start),
    end: normalizeDateTime(d.end),
    updatedAt: d.updatedAt || new Date(),
  });

  const preventSyncOverride = () => {
    userActionInProgressRef.current = true;
    lastUserActionRef.current = Date.now();
    // Clear the flag after a delay to allow syncing again
    setTimeout(() => {
      userActionInProgressRef.current = false;
    }, 2000);
  };

  useEffect(() => {
    const load = async () => {
      const offline = loadOfflineData();
      if (offline) {
        setTrips(offline.trips || []);
        setWorkDays((offline.workDays || []).map(normalizeDay));
        setDeletions(offline.deletions || []);
      }
      
      // Always sync on initial load unless very recent user action
      if (Date.now() - lastUserActionRef.current > 500) {
        const synced = await syncWithServer();
        setTrips(synced.trips || []);
        setWorkDays((synced.workDays || []).map(normalizeDay));
        setDeletions(synced.deletions || []);
      }
      
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
    
    // Always update offline data immediately (never block this)
    updateOfflineData({ trips, workDays: workDays.map(normalizeDay), deletions });
    
    // Always save to server, but be smart about re-syncing
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      
      try {
        if (navigator.onLine) {
          await Promise.all([
            fetch(API_TRIPS, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(trips),
            }),
            fetch(API_WORKDAYS, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(workDays.map(normalizeDay)),
            })
          ]);
          
          // Only re-sync if no recent user actions to prevent flickering
          if (Date.now() - lastUserActionRef.current > 1000) {
            const synced = await syncWithServer();
            // Only update state if data actually changed and no very recent user actions
            const syncedStr = JSON.stringify({
              trips: synced.trips || [],
              workDays: (synced.workDays || []).map(normalizeDay),
              deletions: synced.deletions || []
            });
            // Allow sync updates but avoid them during active user interactions
            if (syncedStr !== dataStr && Date.now() - lastUserActionRef.current > 500) {
              setTrips(synced.trips || []);
              setWorkDays((synced.workDays || []).map(normalizeDay));
              setDeletions(synced.deletions || []);
            }
          }
        }
      } catch (err) {
        console.error("Error saving worklog", err);
      }
    }, 1000); // Increased timeout to give user actions time to complete
  }, [trips, workDays, deletions, loaded, initialized]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const addTrip = (data: { name: string; location?: string; color: number }) => {
    preventSyncOverride();
    const id = crypto.randomUUID();
    const now = new Date();
    setTrips((prev) => [...prev, { id, ...data, createdAt: now, updatedAt: now }]);
    return id;
  };

  const updateTrip = (id: string, data: Partial<Trip>) => {
    preventSyncOverride();
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...data, updatedAt: new Date() } : t)));
  };

  const deleteTrip = (id: string) => {
    preventSyncOverride();
    const removedDays = workDays.filter((d) => d.tripId === id);
    const remainingTrips = trips.filter((t) => t.id !== id);
    const remainingDays = workDays.filter((d) => d.tripId !== id);
    
    setTrips(remainingTrips);
    setWorkDays(remainingDays);
    
    const newDeletions = [
      ...deletions,
      { id, type: "trip" as const, deletedAt: new Date() },
      ...removedDays.map((d) => ({ 
        id: d.id, 
        type: "workday" as const, 
        deletedAt: new Date() 
      })),
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
    preventSyncOverride();
    const id = crypto.randomUUID();
    const now = new Date();
    setWorkDays((prev) => [...prev, normalizeDay({ 
      id, 
      ...data, 
      createdAt: now, 
      updatedAt: now 
    })]);
  };

  const updateWorkDay = (id: string, data: Partial<WorkDay>) => {
    preventSyncOverride();
    setWorkDays((prev) =>
      prev.map((d) =>
        d.id === id
          ? normalizeDay({ ...d, ...data, updatedAt: new Date() })
          : d,
      ),
    );
  };

  const deleteWorkDay = async (id: string) => {
    preventSyncOverride();
    
    // Clear any pending save timer to prevent race conditions
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    // Create deletion record immediately
    const deletionRecord = { 
      id, 
      type: "workday" as const, 
      deletedAt: new Date() 
    };
    
    // Update local state immediately
    const updatedWorkDays = workDays.filter((d) => d.id !== id);
    const newDeletions = [...deletions, deletionRecord];
    
    setWorkDays(updatedWorkDays);
    setDeletions(newDeletions);
    
    // Update offline data immediately
    updateOfflineData({ 
      trips,
      workDays: updatedWorkDays.map(normalizeDay), 
      deletions: newDeletions 
    });
    
    // Try to sync with server immediately if online
    if (navigator.onLine) {
      try {
        // Send workdays update first
        await fetch(API_WORKDAYS, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedWorkDays.map(normalizeDay)),
        });
        
        // Force immediate sync with server after a short delay
        setTimeout(async () => {
          try {
            const synced = await syncWithServer();
            // Only update if the deleted item is still not present
            const stillDeleted = !(synced.workDays || []).some(d => d.id === id);
            if (stillDeleted) {
              setTrips(synced.trips || []);
              setWorkDays((synced.workDays || []).map(normalizeDay));
              setDeletions(synced.deletions || []);
            }
          } catch (err) {
            console.error("Error syncing after deletion", err);
          }
        }, 500);
        
      } catch (err) {
        console.error("Error deleting workday", err);
        // If server sync fails, the deletion record will ensure 
        // the item stays deleted during next sync
      }
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
