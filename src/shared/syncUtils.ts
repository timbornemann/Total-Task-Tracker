import type {
  Task,
  Category,
  Note,
  Flashcard,
  Habit,
  PomodoroSession,
  Timer,
  Trip,
  WorkDay,
  Commute,
  InventoryItem,
  ItemCategory,
  ItemTag,
  Deck,
  Deletion,
} from "../types/index.js";

interface Identified {
  id?: string;
}

export interface SyncData {
  tasks?: Task[];
  categories?: Category[];
  notes?: Note[];
  recurring?: Task[];
  habits?: Habit[];
  flashcards?: Flashcard[];
  decks?: Deck[];
  pomodoroSessions?: PomodoroSession[];
  timers?: Timer[];
  trips?: Trip[];
  workDays?: WorkDay[];
  commutes?: Commute[];
  items?: InventoryItem[];
  itemCategories?: ItemCategory[];
  itemTags?: ItemTag[];
  deletions?: Deletion[];
  [key: string]: unknown;
}

export function mergeLists<T>(
  curr: T[] = [],
  inc: T[] = [],
  compare: string | null = "updatedAt",
): T[] {
  const map = new Map<string | undefined, T>();
  for (const c of curr) map.set((c as Identified).id, c);
  for (const i of inc) {
    const id = (i as Identified).id;
    if (id !== undefined && map.has(id)) {
      const ex = map.get(id)!;
      const exVal = compare
        ? (ex as Record<string, unknown>)[compare]
        : undefined;
      const incVal = compare
        ? (i as Record<string, unknown>)[compare]
        : undefined;
      if (
        compare &&
        exVal !== undefined &&
        incVal !== undefined &&
        new Date(incVal as string | number | Date) >
          new Date(exVal as string | number | Date)
      ) {
        map.set(id, i);
      }
    } else {
      map.set(id, i);
    }
  }
  return Array.from(map.values());
}

export function mergeData(curr: SyncData, inc: SyncData): SyncData {
  return {
    tasks: mergeLists(curr.tasks, inc.tasks),
    categories: mergeLists(curr.categories, inc.categories),
    notes: mergeLists(curr.notes, inc.notes),
    recurring: mergeLists(curr.recurring, inc.recurring),
    habits: mergeLists(curr.habits, inc.habits),
    flashcards: mergeLists(curr.flashcards, inc.flashcards, null),
    decks: mergeLists(curr.decks, inc.decks, null),
    pomodoroSessions: mergeLists(
      curr.pomodoroSessions,
      inc.pomodoroSessions,
      null,
    ),
    timers: mergeLists(curr.timers, inc.timers, null),
    trips: mergeLists(curr.trips, inc.trips, "updatedAt"),
    workDays: mergeLists(curr.workDays, inc.workDays, "updatedAt"),
    commutes: mergeLists(curr.commutes, inc.commutes, "updatedAt"),
    items: mergeLists(curr.items, inc.items, null),
    itemCategories: mergeLists(curr.itemCategories, inc.itemCategories, null),
    itemTags: mergeLists(curr.itemTags, inc.itemTags, null),
    deletions: mergeLists(curr.deletions, inc.deletions, "deletedAt"),
  };
}

export function applyDeletions(data: SyncData): SyncData {
  const maps: Record<string, Map<string, Date>> = {};
  for (const d of data.deletions || []) {
    maps[d.type] = maps[d.type] || new Map();
    const curr = maps[d.type].get(d.id);
    const time = new Date(d.deletedAt);
    if (!curr || time > curr) maps[d.type].set(d.id, time);
  }
  const shouldKeep = <T>(type: string, item: T) => {
    const m = maps[type];
    if (!m) return true;
    const id = (item as Record<string, unknown>).id as string | undefined;
    if (!id) return true;
    const deletedAt = m.get(id);
    if (!deletedAt) return true;
    const updatedAt = (item as Record<string, unknown>).updatedAt as
      | string
      | Date
      | undefined;
    if (!updatedAt) return false;
    return new Date(updatedAt) > deletedAt;
  };
  data.tasks = (data.tasks || []).filter((t) => shouldKeep("task", t));
  data.categories = (data.categories || []).filter((c) =>
    shouldKeep("category", c),
  );
  data.notes = (data.notes || []).filter((n) => shouldKeep("note", n));
  data.recurring = (data.recurring || []).filter((r) =>
    shouldKeep("recurring", r),
  );
  data.habits = (data.habits || []).filter((h) => shouldKeep("habit", h));
  data.flashcards = (data.flashcards || []).filter((f) =>
    shouldKeep("flashcard", f),
  );
  data.decks = (data.decks || []).filter((d) => shouldKeep("deck", d));
  data.trips = (data.trips || []).filter((t) => shouldKeep("trip", t));
  data.workDays = (data.workDays || []).filter((d) => shouldKeep("workday", d));
  data.commutes = (data.commutes || []).filter((c) => shouldKeep("commute", c));
  data.items = (data.items || []).filter((i) => shouldKeep("inventoryItem", i));
  data.itemCategories = (data.itemCategories || []).filter((c) =>
    shouldKeep("inventoryCategory", c),
  );
  data.itemTags = (data.itemTags || []).filter((t) =>
    shouldKeep("inventoryTag", t),
  );
  data.pomodoroSessions = (data.pomodoroSessions || []).filter((s) =>
    shouldKeep("pomodoro", s),
  );
  data.timers = (data.timers || []).filter((t) => shouldKeep("timer", t));
  return data;
}
