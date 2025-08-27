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
import { loadTasks, saveTasks } from "./tasksRepository.js";
import { loadCategories, saveCategories } from "./categoriesRepository.js";
import { loadNotes, saveNotes } from "./notesRepository.js";
import { loadRecurring, saveRecurring } from "./recurringRepository.js";
import { loadHabits, saveHabits } from "./habitsRepository.js";
import { loadDeletions, saveDeletions } from "./deletionsRepository.js";
import { loadFlashcards, saveFlashcards } from "./flashcardsRepository.js";
import { loadDecks, saveDecks } from "./decksRepository.js";
import { loadSettings, saveSettings } from "./settingsRepository.js";
import {
  loadPomodoroSessions,
  savePomodoroSessions,
} from "./pomodoroSessionsRepository.js";
import { loadTimers, saveTimers } from "./timersRepository.js";
import { loadTrips, saveTrips } from "./tripsRepository.js";
import { loadWorkDays, saveWorkDays } from "./workDaysRepository.js";
import { loadCommutes, saveCommutes } from "./commutesRepository.js";
import { loadItems, saveItems } from "./itemsRepository.js";
import {
  loadItemCategories,
  saveItemCategories,
} from "./itemCategoriesRepository.js";
import { loadItemTags, saveItemTags } from "./itemTagsRepository.js";

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

