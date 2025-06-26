import { Task, Category, Note, Flashcard, Deck, Deletion } from '@/types'
import { applyDeletions, mergeData } from './sync'

export interface OfflineData {
  tasks: Task[]
  categories: Category[]
  notes: Note[]
  recurring: Task[]
  flashcards: Flashcard[]
  decks: Deck[]
  deletions: Deletion[]
}

const KEY = 'offlineData'

const replacer = (_: string, value: unknown): unknown =>
  value instanceof Date ? value.toISOString() : value

const reviver = (_: string, value: unknown): unknown => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value)
  }
  return value
}

export const loadOfflineData = (): OfflineData | null => {
  const raw = localStorage.getItem(KEY)
  return raw ? (JSON.parse(raw, reviver) as OfflineData) : null
}

export const saveOfflineData = (data: OfflineData) => {
  localStorage.setItem(KEY, JSON.stringify(data, replacer))
}

export const updateOfflineData = (partial: Partial<OfflineData>) => {
  const current = loadOfflineData() || {
    tasks: [],
    categories: [],
    notes: [],
    recurring: [],
    flashcards: [],
    decks: [],
    deletions: []
  }
  saveOfflineData({ ...current, ...partial })
}

export const syncWithServer = async (): Promise<OfflineData> => {
  const local = loadOfflineData() || {
    tasks: [],
    categories: [],
    notes: [],
    recurring: [],
    flashcards: [],
    decks: [],
    deletions: []
  }
  if (!navigator.onLine) return local
  try {
    const res = await fetch('/api/all')
    if (!res.ok) throw new Error('fetch failed')
    const serverData = (await res.json()) as OfflineData
    const merged = applyDeletions(mergeData(serverData, local))
    await fetch('/api/all', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged, replacer)
    })
    saveOfflineData(merged)
    return merged
  } catch (err) {
    console.error('Sync failed', err)
    return local
  }
}
