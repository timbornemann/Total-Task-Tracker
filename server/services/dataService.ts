import {
  loadTasks,
  saveTasks as repoSaveTasks,
} from "../repositories/tasksRepository.js";
import {
  loadCategories,
  saveCategories as repoSaveCategories,
} from "../repositories/categoriesRepository.js";
import {
  loadNotes,
  saveNotes as repoSaveNotes,
} from "../repositories/notesRepository.js";
import {
  loadRecurring,
  saveRecurring as repoSaveRecurring,
} from "../repositories/recurringRepository.js";
import {
  loadHabits,
  saveHabits as repoSaveHabits,
} from "../repositories/habitsRepository.js";
import { loadDeletions } from "../repositories/deletionsRepository.js";
import {
  loadFlashcards,
  saveFlashcards as repoSaveFlashcards,
} from "../repositories/flashcardsRepository.js";
import {
  loadDecks,
  saveDecks as repoSaveDecks,
} from "../repositories/decksRepository.js";
import {
  loadSettings,
  saveSettings as repoSaveSettings,
} from "../repositories/settingsRepository.js";
import {
  loadPomodoroSessions,
  savePomodoroSessions as repoSavePomodoroSessions,
} from "../repositories/pomodoroSessionsRepository.js";
import {
  loadTimers,
  saveTimers as repoSaveTimers,
} from "../repositories/timersRepository.js";
import {
  loadTrips,
  saveTrips as repoSaveTrips,
} from "../repositories/tripsRepository.js";
import {
  loadWorkDays,
  saveWorkDays as repoSaveWorkDays,
} from "../repositories/workDaysRepository.js";
import {
  loadCommutes,
  saveCommutes as repoSaveCommutes,
} from "../repositories/commutesRepository.js";
import {
  loadItems,
  saveItems as repoSaveItems,
} from "../repositories/itemsRepository.js";
import {
  loadItemCategories,
  saveItemCategories as repoSaveItemCategories,
} from "../repositories/itemCategoriesRepository.js";
import {
  loadItemTags,
  saveItemTags as repoSaveItemTags,
} from "../repositories/itemTagsRepository.js";
import {
  loadData,
  saveData as repoSaveData,
  loadAllData,
  saveAllData as repoSaveAllData,
  dateReviver,
} from "../repositories/dataRepository.js";
import events from "../lib/events.js";

export {
  loadTasks,
  loadCategories,
  loadNotes,
  loadRecurring,
  loadHabits,
  loadDeletions,
  loadData,
  loadFlashcards,
  loadDecks,
  loadSettings,
  loadPomodoroSessions,
  loadTimers,
  loadTrips,
  loadWorkDays,
  loadCommutes,
  loadItems,
  loadItemCategories,
  loadItemTags,
  loadAllData,
  dateReviver,
};

function emitUpdate(): void {
  events.emit("data:updated");
}

export function saveTasks(tasks) {
  repoSaveTasks(tasks);
  emitUpdate();
}
export function saveCategories(categories) {
  repoSaveCategories(categories);
  emitUpdate();
}
export function saveNotes(notes) {
  repoSaveNotes(notes);
  emitUpdate();
}
export function saveRecurring(list) {
  repoSaveRecurring(list);
  emitUpdate();
}
export function saveHabits(list) {
  repoSaveHabits(list);
  emitUpdate();
}
export function saveData(data) {
  repoSaveData(data);
  emitUpdate();
}
export function saveFlashcards(cards) {
  repoSaveFlashcards(cards);
  emitUpdate();
}
export function saveDecks(decks) {
  repoSaveDecks(decks);
  emitUpdate();
}
export function saveSettings(settings) {
  repoSaveSettings(settings);
  emitUpdate();
}
export function savePomodoroSessions(list) {
  repoSavePomodoroSessions(list);
  emitUpdate();
}
export function saveTimers(list) {
  repoSaveTimers(list);
  emitUpdate();
}
export function saveTrips(list) {
  repoSaveTrips(list);
  emitUpdate();
}
export function saveWorkDays(list) {
  repoSaveWorkDays(list);
  emitUpdate();
}
export function saveCommutes(list) {
  repoSaveCommutes(list);
  emitUpdate();
}
export function saveItems(list) {
  repoSaveItems(list);
  emitUpdate();
}
export function saveItemCategories(list) {
  repoSaveItemCategories(list);
  emitUpdate();
}
export function saveItemTags(list) {
  repoSaveItemTags(list);
  emitUpdate();
}
export function saveAllData(data) {
  repoSaveAllData(data);
  emitUpdate();
}
