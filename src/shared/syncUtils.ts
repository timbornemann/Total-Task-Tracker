export interface AllData {
  tasks: { id: string; updatedAt?: Date }[];
  categories: { id: string; updatedAt?: Date }[];
  notes: { id: string; updatedAt?: Date }[];
  recurring: { id: string; updatedAt?: Date }[];
  habits: { id: string; updatedAt?: Date }[];
  flashcards: { id: string; updatedAt?: Date }[];
  decks: { id: string; updatedAt?: Date }[];
  pomodoroSessions: { id: string; updatedAt?: Date }[];
  timers: { id: string; updatedAt?: Date }[];
  trips: { id: string; updatedAt?: Date }[];
  workDays: { id: string; updatedAt?: Date }[];
  items: { id: string; updatedAt?: Date }[];
  itemCategories: { id: string; updatedAt?: Date }[];
  itemTags: { id: string; updatedAt?: Date }[];
  deletions: { id: string; type: string; deletedAt: Date }[];
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
        if (new Date(i[compare] as string) > new Date(ex[compare] as string)) {
          map.set(i.id, i);
        }
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
    pomodoroSessions: mergeLists(curr.pomodoroSessions, inc.pomodoroSessions, null),
    timers: mergeLists(curr.timers, inc.timers, null),
    trips: mergeLists(curr.trips, inc.trips, "updatedAt"),
    workDays: mergeLists(curr.workDays, inc.workDays, "updatedAt"),
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
    const deletedAt = m.get(item.id);
    if (!deletedAt) return true;
    if (!item.updatedAt) return false;
    return new Date(item.updatedAt) > deletedAt;
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
    shouldKeep("pomodoro", s),
  );
  data.timers = (data.timers || []).filter((t) => shouldKeep("timer", t));
  return data;
}
