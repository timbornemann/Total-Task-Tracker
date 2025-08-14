import {
  loadTasks,
  saveTasks as repoSaveTasks,
  loadCategories,
  saveCategories as repoSaveCategories,
  loadNotes,
  saveNotes as repoSaveNotes,
  loadRecurring,
  saveRecurring as repoSaveRecurring,
  loadHabits,
  saveHabits as repoSaveHabits,
  loadDeletions,
  loadData,
  saveData as repoSaveData,
  loadFlashcards,
  saveFlashcards as repoSaveFlashcards,
  loadDecks,
  saveDecks as repoSaveDecks,
  loadSettings,
  saveSettings as repoSaveSettings,
  loadPomodoroSessions,
  savePomodoroSessions as repoSavePomodoroSessions,
  loadTimers,
  saveTimers as repoSaveTimers,
  loadTrips,
  saveTrips as repoSaveTrips,
  loadWorkDays,
  saveWorkDays as repoSaveWorkDays,
  loadItems,
  saveItems as repoSaveItems,
  loadItemCategories,
  saveItemCategories as repoSaveItemCategories,
  loadItemTags,
  saveItemTags as repoSaveItemTags,
  loadAllData,
  saveAllData as repoSaveAllData,
  dateReviver,
} from "../repositories/dataRepository.js";
import { notifyClients } from "../lib/sse.js";

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
  loadItems,
  loadItemCategories,
  loadItemTags,
  loadAllData,
  dateReviver,
};

export function saveTasks(tasks) {
  repoSaveTasks(tasks);
  notifyClients();
}
export function saveCategories(categories) {
  repoSaveCategories(categories);
  notifyClients();
}
export function saveNotes(notes) {
  repoSaveNotes(notes);
  notifyClients();
}
export function saveRecurring(list) {
  repoSaveRecurring(list);
  notifyClients();
}
export function saveHabits(list) {
  repoSaveHabits(list);
  notifyClients();
}
export function saveData(data) {
  repoSaveData(data);
  notifyClients();
}
export function saveFlashcards(cards) {
  repoSaveFlashcards(cards);
  notifyClients();
}
export function saveDecks(decks) {
  repoSaveDecks(decks);
  notifyClients();
}
export function saveSettings(settings) {
  repoSaveSettings(settings);
  notifyClients();
}
export function savePomodoroSessions(list) {
  repoSavePomodoroSessions(list);
  notifyClients();
}
export function saveTimers(list) {
  repoSaveTimers(list);
  notifyClients();
}
export function saveTrips(list) {
  repoSaveTrips(list);
  notifyClients();
}
export function saveWorkDays(list) {
  repoSaveWorkDays(list);
  notifyClients();
}
export function saveItems(list) {
  repoSaveItems(list);
  notifyClients();
}
export function saveItemCategories(list) {
  repoSaveItemCategories(list);
  notifyClients();
}
export function saveItemTags(list) {
  repoSaveItemTags(list);
  notifyClients();
}
export function saveAllData(data) {
  repoSaveAllData(data);
  notifyClients();
}
