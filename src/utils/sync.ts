import {
  Task,
  Category,
  Note,
  Flashcard,
  Deck,
  Habit,
  Deletion,
  PomodoroSession,
  Timer,
  Trip,
  WorkDay,
  InventoryItem,
  ItemCategory,
  ItemTag,
} from "@/types";

export interface AllData {
  tasks: Task[];
  categories: Category[];
  notes: Note[];
  recurring: Task[];
  habits: Habit[];
  flashcards: Flashcard[];
  decks: Deck[];
  pomodoroSessions: PomodoroSession[];
  timers: Timer[];
  trips: Trip[];
  workDays: WorkDay[];
  items: InventoryItem[];
  itemCategories: ItemCategory[];
  itemTags: ItemTag[];
  deletions: Deletion[];
}

export function mergeLists<T extends { id: string; [key: string]: unknown }>(
  curr: T[] = [],
  inc: T[] = [],
  compare: string | null = "updatedAt",
): T[] {
  const map = new Map<string, T>();
  for (const c of curr) map.set(c.id, c);
  for (const i of inc || []) {
    if (map.has(i.id)) {
      const ex = map.get(i.id)!;
      if (compare && ex[compare] && i[compare]) {
        if (new Date(i[compare]) > new Date(ex[compare])) map.set(i.id, i);
      }
    } else {
      map.set(i.id, i);
    }
  }
  return Array.from(map.values());
}

export function mergeData(curr: AllData, inc: AllData): AllData {
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
    trips: mergeLists(curr.trips, inc.trips, null),
    workDays: mergeLists(curr.workDays, inc.workDays, null),
    items: mergeLists(curr.items, inc.items, null),
    itemCategories: mergeLists(curr.itemCategories, inc.itemCategories, null),
    itemTags: mergeLists(curr.itemTags, inc.itemTags, null),
    deletions: mergeLists(curr.deletions, inc.deletions, "deletedAt"),
  };
}

export function applyDeletions(data: AllData): AllData {
  const maps: Record<string, Map<string, Date>> = {};
  for (const d of data.deletions || []) {
    maps[d.type] = maps[d.type] || new Map<string, Date>();
    const curr = maps[d.type].get(d.id);
    const time = new Date(d.deletedAt);
    if (!curr || time > curr) maps[d.type].set(d.id, time);
  }
  const shouldKeep = (type: string, item: { id: string; updatedAt?: Date }) => {
    const m = maps[type];
    if (!m) return true;
    const t = m.get(item.id);
    if (!t) return true;
    return !(item.updatedAt && new Date(item.updatedAt) <= t);
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
  data.items = (data.items || []).filter((i) => shouldKeep("inventoryItem", i));
  data.itemCategories = (data.itemCategories || []).filter((c) =>
    shouldKeep("inventoryCategory", c),
  );
  data.itemTags = (data.itemTags || []).filter((t) =>
    shouldKeep("inventoryTag", t),
  );
  data.pomodoroSessions = (data.pomodoroSessions || []).filter((s) =>
    shouldKeep("pomodoro", s as unknown as { id: string; updatedAt?: Date }),
  );
  data.timers = (data.timers || []).filter((t) =>
    shouldKeep("timer", t as unknown as { id: string; updatedAt?: Date }),
  );
  return data;
}
