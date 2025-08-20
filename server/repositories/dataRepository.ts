import { format } from "date-fns";
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
} from "../../src/types/index.js";
import db from "../lib/db.js";
import {
  applyDeletions,
  setSyncRole,
  setSyncServerUrl,
  setSyncInterval,
  setSyncEnabled,
  setLlmUrl,
  setLlmToken,
  setLlmModel,
} from "../lib/sync.js";

export interface Settings {
  syncRole?: string;
  syncServerUrl?: string;
  syncInterval?: number;
  syncEnabled?: boolean;
  llmUrl?: string;
  llmToken?: string;
  llmModel?: string;
  [key: string]: unknown;
}

export interface Data {
  tasks: Task[];
  categories: Category[];
  notes: Note[];
  recurring: Task[];
  habits: Habit[];
  pomodoroSessions: PomodoroSession[];
  timers: Timer[];
  trips: Trip[];
  workDays: WorkDay[];
  commutes: Commute[];
  items: InventoryItem[];
  itemCategories: ItemCategory[];
  itemTags: ItemTag[];
  deletions: Deletion[];
}

export interface AllData extends Data {
  flashcards: Flashcard[];
  decks: Deck[];
  settings: Settings;
}



export function dateReviver(key: string, value: unknown): unknown {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return value;
}

function normalizeDateField(value: unknown): string {
  if (value instanceof Date) {
    return format(value, "yyyy-MM-dd HH:mm");
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      return value.slice(0, 16).replace("T", " ");
    }
    return value;
  }
  return String(value || "");
}

function normalizeWorkDay(d: WorkDay): WorkDay {
  return {
    ...d,
    start: normalizeDateField(d.start),
    end: normalizeDateField(d.end),
    category: d.category || "work",
  };
}

export function loadTasks(): Task[] {
  try {
    const rows = db.prepare("SELECT * FROM tasks").all();
    const byId: Record<string, Task & { subtasks: Task[] }> = {};
    for (const r of rows) {
      byId[r.id] = {
        id: r.id,
        title: r.title || "",
        description: r.description || "",
        priority: r.priority || "low",
        color: typeof r.color === "number" ? r.color : 0,
        completed: !!r.completed,
        status: r.status || "todo",
        categoryId: r.categoryId || "default",
        parentId: r.parentId || undefined,
        subtasks: [],
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        dueDate: r.dueDate ? new Date(r.dueDate) : undefined,
        isRecurring: !!r.isRecurring,
        recurrencePattern: r.recurrencePattern || undefined,
        lastCompleted: r.lastCompleted ? new Date(r.lastCompleted) : undefined,
        nextDue: r.nextDue ? new Date(r.nextDue) : undefined,
        dueOption: r.dueOption || undefined,
        dueAfterDays: r.dueAfterDays ?? undefined,
        startOption: r.startOption || undefined,
        startWeekday: r.startWeekday ?? undefined,
        startDate: r.startDate ? new Date(r.startDate) : undefined,
        startTime: r.startTime || undefined,
        endTime: r.endTime || undefined,
        order: r.orderIndex ?? 0,
        pinned: !!r.pinned,
        recurringId: r.recurringId || undefined,
        template: !!r.template,
        titleTemplate: r.titleTemplate || undefined,
        customIntervalDays: r.customIntervalDays ?? undefined,
        visible: r.visible === 0 ? false : true,
      };
    }
    const roots: Task[] = [];
    for (const r of Object.values(byId)) {
      if (r.parentId && byId[r.parentId]) {
        byId[r.parentId].subtasks.push(r);
      } else {
        roots.push(r);
      }
    }
    const sortTasks = (list: Task[]) => {
      list.sort((a: Task, b: Task) => (a.order || 0) - (b.order || 0));
      for (const t of list) sortTasks(t.subtasks);
    };
    sortTasks(roots);
    return roots;
  } catch {
    return [];
  }
}

export function loadCategories(): Category[] {
  try {
    const rows = db.prepare("SELECT * FROM categories").all();
    return rows.map((r) => ({
      id: r.id,
      name: r.name || "",
      description: r.description || "",
      color: typeof r.color === "number" ? r.color : 0,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
      order: r.orderIndex ?? 0,
      pinned: !!r.pinned,
    }));
  } catch {
    return [];
  }
}

export function loadNotes(): Note[] {
  try {
    const rows = db.prepare("SELECT * FROM notes").all();
    return rows.map((r) => ({
      id: r.id,
      title: r.title || "",
      text: r.text || "",
      color: typeof r.color === "number" ? r.color : 0,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
      order: r.orderIndex ?? 0,
      pinned: !!r.pinned,
    }));
  } catch {
    return [];
  }
}

export function loadRecurring(): Task[] {
  try {
    const rows = db.prepare("SELECT * FROM recurring").all();
    const byId: Record<string, Task & { subtasks: Task[] }> = {};
    for (const r of rows) {
      byId[r.id] = {
        id: r.id,
        title: r.title || "",
        description: r.description || "",
        priority: r.priority || "low",
        color: typeof r.color === "number" ? r.color : 0,
        completed: !!r.completed,
        status: r.status || "todo",
        categoryId: r.categoryId || "default",
        parentId: r.parentId || undefined,
        subtasks: [],
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        dueDate: r.dueDate ? new Date(r.dueDate) : undefined,
        isRecurring: !!r.isRecurring,
        recurrencePattern: r.recurrencePattern || undefined,
        lastCompleted: r.lastCompleted ? new Date(r.lastCompleted) : undefined,
        nextDue: r.nextDue ? new Date(r.nextDue) : undefined,
        dueOption: r.dueOption || undefined,
        dueAfterDays: r.dueAfterDays ?? undefined,
        startOption: r.startOption || undefined,
        startWeekday: r.startWeekday ?? undefined,
        startDate: r.startDate ? new Date(r.startDate) : undefined,
        startTime: r.startTime || undefined,
        endTime: r.endTime || undefined,
        order: r.orderIndex ?? 0,
        pinned: !!r.pinned,
        recurringId: r.recurringId || undefined,
        template: !!r.template,
        titleTemplate: r.titleTemplate || undefined,
        customIntervalDays: r.customIntervalDays ?? undefined,
        visible: r.visible === 0 ? false : true,
      };
    }
    const roots: Task[] = [];
    for (const r of Object.values(byId)) {
      if (r.parentId && byId[r.parentId]) {
        byId[r.parentId].subtasks.push(r);
      } else {
        roots.push(r);
      }
    }
    const sortTasks = (list: Task[]) => {
      list.sort((a: Task, b: Task) => (a.order || 0) - (b.order || 0));
      for (const t of list) sortTasks(t.subtasks);
    };
    sortTasks(roots);
    return roots;
  } catch {
    return [];
  }
}

export function loadHabits(): Habit[] {
  try {
    const habits = db.prepare("SELECT * FROM habits").all();
    const completions = db
      .prepare("SELECT habitId, date FROM habit_completions")
      .all();
    const map: Record<string, string[]> = {};
    for (const c of completions) {
      if (!map[c.habitId]) map[c.habitId] = [];
      map[c.habitId].push(c.date);
    }
    return habits.map((h) => ({
      id: h.id,
      title: h.title || "",
      color: typeof h.color === "number" ? h.color : 0,
      recurrencePattern: h.recurrencePattern || undefined,
      customIntervalDays: h.customIntervalDays ?? undefined,
      startWeekday: h.startWeekday ?? undefined,
      startDate: h.startDate ? new Date(h.startDate) : undefined,
      createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
      updatedAt: h.updatedAt ? new Date(h.updatedAt) : new Date(),
      order: h.orderIndex ?? 0,
      pinned: !!h.pinned,
      completions: map[h.id] || [],
    }));
  } catch {
    return [];
  }
}

export function loadDeletions(): Deletion[] {
  try {
    return db
      .prepare("SELECT type, id, deletedAt FROM deletions")
      .all()
      .map((row) => ({
        type: row.type,
        id: row.id,
        deletedAt: new Date(row.deletedAt),
      }));
  } catch {
    return [];
  }
}

export function loadData(): Data {
  const data: Data = {
    tasks: loadTasks(),
    categories: loadCategories(),
    notes: loadNotes(),
    recurring: loadRecurring(),
    habits: loadHabits(),
    pomodoroSessions: loadPomodoroSessions(),
    timers: loadTimers(),
    trips: loadTrips(),
    workDays: loadWorkDays(),
    commutes: loadCommutes(),
    items: loadItems(),
    itemCategories: loadItemCategories(),
    itemTags: loadItemTags(),
    deletions: loadDeletions(),
  };
  return applyDeletions(data as unknown) as Data;
}

export function saveTasks(tasks: Task[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM tasks");
    const insert = db.prepare(
      `INSERT INTO tasks (
        id, title, description, priority, color, completed, status, categoryId, parentId,
        createdAt, updatedAt, dueDate, isRecurring, recurrencePattern, lastCompleted, nextDue,
        dueOption, dueAfterDays, startOption, startWeekday, startDate, startTime, endTime,
        orderIndex, pinned, recurringId, template, titleTemplate, customIntervalDays, visible
      ) VALUES (
        @id, @title, @description, @priority, @color, @completed, @status, @categoryId, @parentId,
        @createdAt, @updatedAt, @dueDate, @isRecurring, @recurrencePattern, @lastCompleted, @nextDue,
        @dueOption, @dueAfterDays, @startOption, @startWeekday, @startDate, @startTime, @endTime,
        @orderIndex, @pinned, @recurringId, @template, @titleTemplate, @customIntervalDays, @visible
      )`,
    );
    interface TaskRow {
      id: string;
      title: string;
      description: string;
      priority: string;
      color: number;
      completed: number;
      status: string;
      categoryId: string;
      parentId: string | null;
      createdAt: string | null;
      updatedAt: string | null;
      dueDate: string | null;
      isRecurring: number;
      recurrencePattern: string | null;
      lastCompleted: string | null;
      nextDue: string | null;
      dueOption: string | null;
      dueAfterDays: number | null;
      startOption: string | null;
      startWeekday: number | null;
      startDate: string | null;
      startTime: string | null;
      endTime: string | null;
      orderIndex: number;
      pinned: number;
      recurringId: string | null;
      template: number;
      titleTemplate: string | null;
      customIntervalDays: number | null;
      visible: number;
    }
    const toRow = (t: Task, parentId: string | null, orderIndex: number): TaskRow => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      color: t.color,
      completed: t.completed ? 1 : 0,
      status: t.status,
      categoryId: t.categoryId,
      parentId,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
      updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      isRecurring: t.isRecurring ? 1 : 0,
      recurrencePattern: t.recurrencePattern ?? null,
      lastCompleted: t.lastCompleted ? new Date(t.lastCompleted).toISOString() : null,
      nextDue: t.nextDue ? new Date(t.nextDue).toISOString() : null,
      dueOption: t.dueOption ?? null,
      dueAfterDays: t.dueAfterDays ?? null,
      startOption: t.startOption ?? null,
      startWeekday: t.startWeekday ?? null,
      startDate: t.startDate ? new Date(t.startDate).toISOString() : null,
      startTime: t.startTime ?? null,
      endTime: t.endTime ?? null,
      orderIndex: typeof t.order === "number" ? t.order : orderIndex,
      pinned: t.pinned ? 1 : 0,
      recurringId: t.recurringId ?? null,
      template: t.template ? 1 : 0,
      titleTemplate: t.titleTemplate ?? null,
      customIntervalDays: t.customIntervalDays ?? null,
      visible: t.visible === false ? 0 : 1,
    });
    const walk = (list: Task[], parent: string | null) => {
      list.forEach((t, idx) => {
        insert.run(toRow(t, parent, idx));
        if (t.subtasks && t.subtasks.length) walk(t.subtasks, t.id);
      });
    };
    walk(tasks || [], null);
  });
  tx();
}

export function saveCategories(categories: Category[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM categories");
    const insert = db.prepare(
      `INSERT INTO categories (id, name, description, color, createdAt, updatedAt, orderIndex, pinned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const c of categories || []) {
      insert.run(
        c.id,
        c.name,
        c.description,
        c.color,
        c.createdAt ? new Date(c.createdAt).toISOString() : null,
        c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
        typeof c.order === "number" ? c.order : 0,
        c.pinned ? 1 : 0,
      );
    }
  });
  tx();
}

export function saveNotes(notes: Note[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM notes");
    const insert = db.prepare(
      `INSERT INTO notes (id, title, text, color, createdAt, updatedAt, orderIndex, pinned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const n of notes || []) {
      insert.run(
        n.id,
        n.title,
        n.text,
        n.color,
        n.createdAt ? new Date(n.createdAt).toISOString() : null,
        n.updatedAt ? new Date(n.updatedAt).toISOString() : null,
        typeof n.order === "number" ? n.order : 0,
        n.pinned ? 1 : 0,
      );
    }
  });
  tx();
}

export function saveRecurring(list: Task[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM recurring");
    const insert = db.prepare(
      `INSERT INTO recurring (
        id, title, description, priority, color, completed, status, categoryId, parentId,
        createdAt, updatedAt, dueDate, isRecurring, recurrencePattern, lastCompleted, nextDue,
        dueOption, dueAfterDays, startOption, startWeekday, startDate, startTime, endTime,
        orderIndex, pinned, recurringId, template, titleTemplate, customIntervalDays, visible
      ) VALUES (
        @id, @title, @description, @priority, @color, @completed, @status, @categoryId, @parentId,
        @createdAt, @updatedAt, @dueDate, @isRecurring, @recurrencePattern, @lastCompleted, @nextDue,
        @dueOption, @dueAfterDays, @startOption, @startWeekday, @startDate, @startTime, @endTime,
        @orderIndex, @pinned, @recurringId, @template, @titleTemplate, @customIntervalDays, @visible
      )`,
    );
    interface RecurringRow {
      id: string;
      title: string;
      description: string;
      priority: string;
      color: number;
      completed: number;
      status: string;
      categoryId: string;
      parentId: string | null;
      createdAt: string | null;
      updatedAt: string | null;
      dueDate: string | null;
      isRecurring: number;
      recurrencePattern: string | null;
      lastCompleted: string | null;
      nextDue: string | null;
      dueOption: string | null;
      dueAfterDays: number | null;
      startOption: string | null;
      startWeekday: number | null;
      startDate: string | null;
      startTime: string | null;
      endTime: string | null;
      orderIndex: number;
      pinned: number;
      recurringId: string | null;
      template: number;
      titleTemplate: string | null;
      customIntervalDays: number | null;
      visible: number;
    }
    const toRow = (t: Task, parentId: string | null, orderIndex: number): RecurringRow => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      color: t.color,
      completed: t.completed ? 1 : 0,
      status: t.status,
      categoryId: t.categoryId,
      parentId,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
      updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      isRecurring: t.isRecurring ? 1 : 0,
      recurrencePattern: t.recurrencePattern ?? null,
      lastCompleted: t.lastCompleted ? new Date(t.lastCompleted).toISOString() : null,
      nextDue: t.nextDue ? new Date(t.nextDue).toISOString() : null,
      dueOption: t.dueOption ?? null,
      dueAfterDays: t.dueAfterDays ?? null,
      startOption: t.startOption ?? null,
      startWeekday: t.startWeekday ?? null,
      startDate: t.startDate ? new Date(t.startDate).toISOString() : null,
      startTime: t.startTime ?? null,
      endTime: t.endTime ?? null,
      orderIndex: typeof t.order === "number" ? t.order : orderIndex,
      pinned: t.pinned ? 1 : 0,
      recurringId: t.recurringId ?? null,
      template: t.template ? 1 : 0,
      titleTemplate: t.titleTemplate ?? null,
      customIntervalDays: t.customIntervalDays ?? null,
      visible: t.visible === false ? 0 : 1,
    });
    const walk = (list: Task[], parent: string | null) => {
      list.forEach((t, idx) => {
        insert.run(toRow(t, parent, idx));
        if (t.subtasks && t.subtasks.length) walk(t.subtasks, t.id);
      });
    };
    walk(list || [], null);
  });
  tx();
}

export function saveHabits(list: Habit[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM habits");
    db.exec("DELETE FROM habit_completions");
    const insertHabit = db.prepare(
      `INSERT INTO habits (id, title, color, recurrencePattern, customIntervalDays, startWeekday, startDate, createdAt, updatedAt, orderIndex, pinned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertCompletion = db.prepare(
      `INSERT OR IGNORE INTO habit_completions (habitId, date) VALUES (?, ?)`,
    );
    for (const h of list || []) {
      insertHabit.run(
        h.id,
        h.title,
        h.color,
        h.recurrencePattern ?? null,
        h.customIntervalDays ?? null,
        h.startWeekday ?? null,
        h.startDate ? new Date(h.startDate).toISOString() : null,
        h.createdAt ? new Date(h.createdAt).toISOString() : null,
        h.updatedAt ? new Date(h.updatedAt).toISOString() : null,
        typeof h.order === "number" ? h.order : 0,
        h.pinned ? 1 : 0,
      );
      for (const d of h.completions || []) insertCompletion.run(h.id, d);
    }
  });
  tx();
}

export function saveData(data: {
  tasks?: Task[];
  categories?: Category[];
  notes?: Note[];
  recurring?: Task[];
  habits?: Habit[];
  items?: InventoryItem[];
  itemCategories?: ItemCategory[];
  itemTags?: ItemTag[];
  pomodoroSessions?: PomodoroSession[];
  timers?: Timer[];
  deletions?: Deletion[];
}): void {
  // Remove the outer transaction to avoid nested transactions
  // Each individual save function already has its own transaction
  saveTasks(data.tasks || []);
  saveCategories(data.categories || []);
  saveNotes(data.notes || []);
  saveRecurring(data.recurring || []);
  saveHabits(data.habits || []);
  saveItems(data.items || []);
  saveItemCategories(data.itemCategories || []);
  saveItemTags(data.itemTags || []);
  savePomodoroSessions(data.pomodoroSessions || []);
  saveTimers(data.timers || []);
  saveDeletions(data.deletions || []);
}

export function loadFlashcards(): Flashcard[] {
  try {
    const rows = db.prepare("SELECT * FROM flashcards").all();
    return rows.map((r) => ({
      id: r.id,
      front: r.front || "",
      back: r.back || "",
      deckId: r.deckId || "",
      interval: r.interval ?? 0,
      dueDate: r.dueDate ? new Date(r.dueDate) : new Date(),
      easyCount: r.easyCount ?? 0,
      mediumCount: r.mediumCount ?? 0,
      hardCount: r.hardCount ?? 0,
      typedCorrect: r.typedCorrect ?? undefined,
      typedTotal: r.typedTotal ?? undefined,
    }));
  } catch {
    return [];
  }
}

export function loadDecks(): Deck[] {
  try {
    const rows = db.prepare("SELECT * FROM decks").all();
    return rows.map((r) => ({ id: r.id, name: r.name || "" }));
  } catch {
    return [];
  }
}

export function loadSettings(): Settings {
  try {
    const row = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("default");
    return row ? JSON.parse(row.value, dateReviver) : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings: Settings): void {
  const value = JSON.stringify(settings, (key, value) =>
    value instanceof Date ? value.toISOString() : value,
  );
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(
    "default",
    value,
  );
}

export function loadPomodoroSessions(): PomodoroSession[] {
  try {
    return db
      .prepare("SELECT start, end, breakEnd FROM pomodoro_sessions")
      .all();
  } catch {
    return [];
  }
}

export function loadTimers(): Timer[] {
  try {
    const rows = db.prepare("SELECT * FROM timers").all();
    return rows.map((r) => ({
      id: r.id,
      title: r.title || "",
      color: typeof r.color === "number" ? r.color : 0,
      baseDuration: r.baseDuration ?? 0,
      duration: r.duration ?? 0,
      remaining: r.remaining ?? 0,
      isRunning: !!r.isRunning,
      isPaused: !!r.isPaused,
      startTime: r.startTime ?? undefined,
      lastTick: r.lastTick ?? undefined,
      pauseStart: r.pauseStart ?? undefined,
    }));
  } catch {
    return [];
  }
}

export function loadTrips(): Trip[] {
  try {
    const rows = db.prepare("SELECT * FROM trips").all();
    return rows.map((r) => ({
      id: r.id,
      name: r.name || "",
      location: r.location || undefined,
      color: typeof r.color === "number" ? r.color : undefined,
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
    }));
  } catch {
    return [];
  }
}

export function loadCommutes(): Commute[] {
  try {
    const rows = db.prepare("SELECT * FROM commutes").all();
    return rows.map((r) => ({
      id: r.id,
      name: r.name || "",
      kilometers: typeof r.kilometers === "number" ? r.kilometers : 0,
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
    }));
  } catch {
    return [];
  }
}

export function loadWorkDays(): WorkDay[] {
  try {
    const rows = db.prepare("SELECT * FROM workdays").all();
    return rows.map((r) =>
      normalizeWorkDay({
        id: r.id,
        start: r.start,
        end: r.end,
        category: r.category || "work",
        tripId: r.tripId || undefined,
        commuteId: r.commuteId || undefined,
        commuteKm: r.commuteKm ?? undefined,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      }),
    );
  } catch {
    return [];
  }
}

export function savePomodoroSessions(sessions: PomodoroSession[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM pomodoro_sessions");
    for (const s of sessions || []) {
      db.prepare(
        "INSERT INTO pomodoro_sessions (start, end, breakEnd) VALUES (?, ?, ?)",
      ).run(s.start, s.end, s.breakEnd ?? null);
    }
  });
  tx();
}

export function saveTimers(list: Timer[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM timers");
    const insert = db.prepare(
      `INSERT INTO timers (id, title, color, baseDuration, duration, remaining, isRunning, isPaused, startTime, lastTick, pauseStart)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const t of list || []) {
      insert.run(
        t.id,
        t.title,
        t.color,
        t.baseDuration,
        t.duration,
        t.remaining,
        t.isRunning ? 1 : 0,
        t.isPaused ? 1 : 0,
        t.startTime ?? null,
        t.lastTick ?? null,
        t.pauseStart ?? null,
      );
    }
  });
  tx();
}

export function saveTrips(list: Trip[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM trips");
    const insert = db.prepare(
      `INSERT INTO trips (id, name, location, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
    );
    for (const t of list || []) {
      insert.run(
        t.id,
        t.name,
        t.location ?? null,
        t.color ?? null,
        t.createdAt ? new Date(t.createdAt).toISOString() : null,
        t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
      );
    }
  });
  tx();
}

export function saveCommutes(list: Commute[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM commutes");
    const insert = db.prepare(
      `INSERT INTO commutes (id, name, kilometers, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
    );
    for (const c of list || []) {
      insert.run(
        c.id,
        c.name,
        c.kilometers,
        c.createdAt ? new Date(c.createdAt).toISOString() : null,
        c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
      );
    }
  });
  tx();
}

export function loadItems(): InventoryItem[] {
  try {
    const items = db.prepare("SELECT * FROM inventory_items").all();
    const tagRows = db
      .prepare("SELECT itemId, tagId FROM inventory_item_tags")
      .all();
    const tagsByItem: Record<string, string[]> = {};
    for (const t of tagRows) {
      if (!tagsByItem[t.itemId]) tagsByItem[t.itemId] = [];
      tagsByItem[t.itemId].push(t.tagId);
    }
    return items.map((i) => ({
      id: i.id,
      name: i.name || "",
      description: i.description || "",
      quantity: i.quantity ?? 0,
      categoryId: i.categoryId || undefined,
      tagIds: tagsByItem[i.id] || [],
      buyAgain: !!i.buyAgain,
      createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
      updatedAt: i.updatedAt ? new Date(i.updatedAt) : new Date(),
    }));
  } catch {
    return [];
  }
}

export function saveItems(list: InventoryItem[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM inventory_items");
    db.exec("DELETE FROM inventory_item_tags");
    const insertItem = db.prepare(
      `INSERT INTO inventory_items (id, name, description, quantity, categoryId, buyAgain, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertTag = db.prepare(
      `INSERT OR IGNORE INTO inventory_item_tags (itemId, tagId) VALUES (?, ?)`,
    );
    for (const i of list || []) {
      insertItem.run(
        i.id,
        i.name,
        i.description,
        i.quantity,
        i.categoryId ?? null,
        i.buyAgain ? 1 : 0,
        i.createdAt ? new Date(i.createdAt).toISOString() : null,
        i.updatedAt ? new Date(i.updatedAt).toISOString() : null,
      );
      for (const tagId of i.tagIds || []) insertTag.run(i.id, tagId);
    }
  });
  tx();
}

export function saveWorkDays(list: WorkDay[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM workdays");
    const insert = db.prepare(
      `INSERT INTO workdays (id, start, end, category, tripId, commuteId, commuteKm, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const d of list || []) {
      const n = normalizeWorkDay(d);
      insert.run(
        n.id,
        n.start,
        n.end,
        n.category,
        n.tripId ?? null,
        n.commuteId ?? null,
        n.commuteKm ?? null,
        n.createdAt ? new Date(n.createdAt).toISOString() : null,
        n.updatedAt ? new Date(n.updatedAt).toISOString() : null,
      );
    }
  });
  tx();
}
export function loadItemCategories(): ItemCategory[] {
  try {
    const rows = db.prepare("SELECT * FROM inventory_categories").all();
    return rows.map((r) => ({ id: r.id, name: r.name || "" }));
  } catch {
    return [];
  }
}

export function saveItemCategories(list: ItemCategory[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM inventory_categories");
    const insert = db.prepare(
      `INSERT INTO inventory_categories (id, name) VALUES (?, ?)`,
    );
    for (const c of list || []) insert.run(c.id, c.name);
  });
  tx();
}

export function loadItemTags(): ItemTag[] {
  try {
    const rows = db.prepare("SELECT * FROM inventory_tags").all();
    return rows.map((r) => ({ id: r.id, name: r.name || "" }));
  } catch {
    return [];
  }
}

export function saveItemTags(list: ItemTag[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM inventory_tags");
    const insert = db.prepare(`INSERT INTO inventory_tags (id, name) VALUES (?, ?)`);
    for (const t of list || []) insert.run(t.id, t.name);
  });
  tx();
}

export function saveFlashcards(cards: Flashcard[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM flashcards");
    const insert = db.prepare(
      `INSERT INTO flashcards (id, front, back, deckId, interval, dueDate, easyCount, mediumCount, hardCount, typedCorrect, typedTotal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const c of cards || []) {
      insert.run(
        c.id,
        c.front,
        c.back,
        c.deckId,
        c.interval ?? 0,
        c.dueDate ? new Date(c.dueDate).toISOString() : null,
        c.easyCount ?? 0,
        c.mediumCount ?? 0,
        c.hardCount ?? 0,
        c.typedCorrect ?? null,
        c.typedTotal ?? null,
      );
    }
  });
  tx();
}

export function saveDecks(decks: Deck[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM decks");
    const insert = db.prepare(`INSERT INTO decks (id, name) VALUES (?, ?)`);
    for (const d of decks || []) insert.run(d.id, d.name);
  });
  tx();
}

export function saveDeletions(list: Deletion[]): void {
  const tx = db.transaction(() => {
    db.exec("DELETE FROM deletions");
    for (const d of list || []) {
      db.prepare(
        "INSERT INTO deletions (type, id, deletedAt) VALUES (?, ?, ?)",
      ).run(d.type, d.id, new Date(d.deletedAt).toISOString());
    }
  });
  tx();
}

export function loadAllData(): AllData {
  const data: AllData = {
    tasks: loadTasks(),
    categories: loadCategories(),
    notes: loadNotes(),
    recurring: loadRecurring(),
    habits: loadHabits(),
    flashcards: loadFlashcards(),
    decks: loadDecks(),
    pomodoroSessions: loadPomodoroSessions(),
    timers: loadTimers(),
    trips: loadTrips(),
    workDays: loadWorkDays(),
    commutes: loadCommutes(),
    items: loadItems(),
    itemCategories: loadItemCategories(),
    itemTags: loadItemTags(),
    settings: loadSettings(),
    deletions: loadDeletions(),
  };
  return applyDeletions(data as unknown) as AllData;
}

export function saveAllData(
  data: Partial<AllData> & { settings?: Settings },
): void {
  saveData(data);
  saveFlashcards(data.flashcards || []);
  saveDecks(data.decks || []);
  // Note: pomodoroSessions, timers, items, itemCategories, itemTags are already saved in saveData()
  saveTrips(data.trips || []);
  saveWorkDays(data.workDays || []);
  saveCommutes(data.commutes || []);
  // Note: recurring, habits, deletions are already saved in saveData() if present
  if (data.settings) {
    saveSettings(data.settings);
    if (data.settings.syncRole !== undefined) {
      setSyncRole(data.settings.syncRole);
    }
    if (data.settings.syncServerUrl !== undefined) {
      setSyncServerUrl(data.settings.syncServerUrl);
    }
    if (data.settings.syncInterval !== undefined) {
      setSyncInterval(data.settings.syncInterval);
    }
    if (data.settings.syncEnabled !== undefined) {
      setSyncEnabled(data.settings.syncEnabled);
    }
    if (data.settings.llmUrl !== undefined) {
      setLlmUrl(data.settings.llmUrl);
    }
    if (data.settings.llmToken !== undefined) {
      setLlmToken(data.settings.llmToken);
    }
    if (data.settings.llmModel !== undefined) {
      setLlmModel(data.settings.llmModel);
    }
  }
}


