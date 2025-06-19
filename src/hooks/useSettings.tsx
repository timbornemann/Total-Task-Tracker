import React, { createContext, useContext, useEffect, useState } from 'react'
import { allHomeSections } from '@/utils/homeSections'
import i18n from '@/lib/i18n'


export type ShortcutKeys = {
  openCommand: string
  newTask: string
  newNote: string
  newFlashcard: string
}

const defaultShortcuts: ShortcutKeys = {
  openCommand: 'ctrl+k',
  newTask: 'ctrl+alt+t',
  newNote: 'ctrl+alt+n',
  newFlashcard: 'ctrl+alt+f'
}

const defaultPomodoro = { workMinutes: 25, breakMinutes: 5 }
const defaultFlashcardSettings = {
  timerSeconds: 10,
  sessionSize: 5,
  defaultMode: 'spaced' as
    | 'spaced'
    | 'training'
    | 'random'
    | 'typing'
    | 'timed'
}
const defaultSyncInterval = 5
const defaultSyncEnabled = true
const defaultTaskPriority: 'low' | 'medium' | 'high' = 'medium'
const defaultLanguage = 'de'
const defaultTheme = {
  background: '0 0% 100%',
  foreground: '222.2 84% 4.9%',
  accent: '212 100% 47%',
  card: '0 0% 98%',
  popover: '0 0% 98%',
  'card-foreground': '222.2 84% 4.9%',
  'stat-bar-primary': '212 100% 47%',
  'stat-bar-secondary': '215 28% 80%',
  'kanban-todo': '210 40% 96.1%',
  'kanban-inprogress': '215 28% 80%',
  'kanban-done': '158 55% 52%',
  'pomodoro-work-ring': '222.2 47.4% 11.2%',
  'pomodoro-break-ring': '212 100% 47%'
}

const defaultColorPalette = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#F97316',
  '#06B6D4',
  '#84CC16'
]

export const themePresets: Record<string, typeof defaultTheme> = {
  light: { ...defaultTheme },
  dark: {
    background: '222 47% 11%',
    foreground: '210 40% 98%',
    accent: '217 91% 60%',
    card: '218 28% 17%',
    popover: '218 28% 17%',
    'card-foreground': '210 40% 98%',
    'stat-bar-primary': '217 91% 60%',
    'stat-bar-secondary': '218 14% 30%',
    'kanban-todo': '218 14% 30%',
    'kanban-inprogress': '217 91% 60%',
    'kanban-done': '158 64% 52%',
    'pomodoro-work-ring': '210 40% 98%',
    'pomodoro-break-ring': '217 91% 60%'
  },
  ocean: {
    background: '210 60% 98%',
    foreground: '222.2 47.4% 11.2%',
    accent: '199 94% 48%',
    card: '210 60% 96%',
    popover: '210 60% 96%',
    'card-foreground': '222.2 47.4% 11.2%',
    'stat-bar-primary': '199 94% 48%',
    'stat-bar-secondary': '214.3 31.8% 91.4%',
    'kanban-todo': '210 40% 96.1%',
    'kanban-inprogress': '210 80% 85%',
    'kanban-done': '199 94% 48%',
    'pomodoro-work-ring': '199 94% 48%',
    'pomodoro-break-ring': '210 40% 96.1%'
  },
  'dark-red': {
    background: '0 0% 9%',
    foreground: '0 0% 98%',
    accent: '0 72% 51%',
    card: '0 0% 15%',
    popover: '0 0% 15%',
    'card-foreground': '0 0% 98%',
    'stat-bar-primary': '0 72% 51%',
    'stat-bar-secondary': '0 0% 25%',
    'kanban-todo': '0 0% 25%',
    'kanban-inprogress': '0 72% 51%',
    'kanban-done': '0 72% 51%',
    'pomodoro-work-ring': '0 0% 98%',
    'pomodoro-break-ring': '0 72% 51%'
  },
  hacker: {
    background: '120 12% 8%',
    foreground: '120 100% 80%',
    accent: '120 70% 40%',
    card: '120 10% 12%',
    popover: '120 10% 12%',
    'card-foreground': '120 100% 80%',
    'stat-bar-primary': '120 70% 40%',
    'stat-bar-secondary': '120 10% 20%',
    'kanban-todo': '120 20% 20%',
    'kanban-inprogress': '120 40% 30%',
    'kanban-done': '120 70% 40%',
    'pomodoro-work-ring': '120 100% 80%',
    'pomodoro-break-ring': '120 70% 40%'
  },
  motivation: {
    background: '40 100% 98%',
    foreground: '20 90% 10%',
    accent: '30 100% 50%',
    card: '0 0% 100%',
    popover: '0 0% 100%',
    'card-foreground': '20 90% 10%',
    'stat-bar-primary': '30 100% 50%',
    'stat-bar-secondary': '38 88% 80%',
    'kanban-todo': '38 88% 80%',
    'kanban-inprogress': '30 100% 50%',
    'kanban-done': '88 50% 50%',
    'pomodoro-work-ring': '20 90% 10%',
    'pomodoro-break-ring': '30 100% 50%'
  }
}

interface SettingsContextValue {
  shortcuts: ShortcutKeys
  updateShortcut: (key: keyof ShortcutKeys, value: string) => void
  pomodoro: { workMinutes: number; breakMinutes: number }
  updatePomodoro: (key: 'workMinutes' | 'breakMinutes', value: number) => void
  defaultTaskPriority: 'low' | 'medium' | 'high'
  updateDefaultTaskPriority: (value: 'low' | 'medium' | 'high') => void
  theme: typeof defaultTheme
  updateTheme: (key: keyof typeof defaultTheme, value: string) => void
  themeName: string
  updateThemeName: (name: string) => void
  colorPalette: string[]
  updatePaletteColor: (index: number, value: string) => void
  homeSections: string[]
  homeSectionOrder: string[]
  toggleHomeSection: (section: string) => void
  reorderHomeSections: (start: number, end: number) => void
  showPinnedTasks: boolean
  toggleShowPinnedTasks: () => void
  showPinnedNotes: boolean
  toggleShowPinnedNotes: () => void
  flashcardTimer: number
  updateFlashcardTimer: (value: number) => void
  flashcardSessionSize: number
  updateFlashcardSessionSize: (value: number) => void
  flashcardDefaultMode: 'spaced' | 'training' | 'random' | 'typing' | 'timed'
  updateFlashcardDefaultMode: (
    value: 'spaced' | 'training' | 'random' | 'typing' | 'timed'
  ) => void
  syncRole: 'server' | 'client'
  updateSyncRole: (role: 'server' | 'client') => void
  syncServerUrl: string
  updateSyncServerUrl: (url: string) => void
  syncInterval: number
  updateSyncInterval: (value: number) => void
  syncEnabled: boolean
  updateSyncEnabled: (value: boolean) => void
  language: string
  updateLanguage: (lang: string) => void
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<ShortcutKeys>(defaultShortcuts)
  const [pomodoro, setPomodoro] = useState(defaultPomodoro)
  const [flashcardTimer, setFlashcardTimer] = useState(
    defaultFlashcardSettings.timerSeconds
  )
  const [flashcardSessionSize, setFlashcardSessionSize] = useState(
    defaultFlashcardSettings.sessionSize
  )
  const [flashcardDefaultMode, setFlashcardDefaultMode] = useState(
    defaultFlashcardSettings.defaultMode
  )
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
    defaultTaskPriority
  )
  const [theme, setTheme] = useState(defaultTheme)
  const [themeName, setThemeName] = useState('light')
  const [colorPalette, setColorPalette] = useState<string[]>(defaultColorPalette)
  const [homeSectionOrder, setHomeSectionOrder] = useState<string[]>(
    allHomeSections.map(s => s.key)
  )
  const [homeSections, setHomeSections] = useState<string[]>([
    'tasks',
    'flashcards',
    'notes'
  ])
  const [showPinnedTasks, setShowPinnedTasks] = useState(true)
  const [showPinnedNotes, setShowPinnedNotes] = useState(true)
  const [syncRole, setSyncRole] = useState<'server' | 'client'>('client')
  const [syncServerUrl, setSyncServerUrl] = useState('')
  const [syncInterval, setSyncInterval] = useState(defaultSyncInterval)
  const [syncEnabled, setSyncEnabled] = useState(defaultSyncEnabled)
  const [language, setLanguage] = useState(defaultLanguage)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.shortcuts) {
            setShortcuts({ ...defaultShortcuts, ...data.shortcuts })
          }
          if (data.pomodoro) {
            setPomodoro({ ...defaultPomodoro, ...data.pomodoro })
          }
          if (data.defaultTaskPriority) {
            setPriority(data.defaultTaskPriority)
          }
          if (data.theme) {
            setTheme({ ...defaultTheme, ...data.theme })
          }
          if (data.themeName) {
            setThemeName(data.themeName)
            if (themePresets[data.themeName]) {
              setTheme(themePresets[data.themeName])
            }
          }
          if (Array.isArray(data.colorPalette)) {
            setColorPalette(data.colorPalette)
          }
          if (Array.isArray(data.homeSectionOrder)) {
            const order = data.homeSectionOrder as string[]
            setHomeSectionOrder(
              order.concat(
                allHomeSections
                  .filter(s => !order.includes(s.key))
                  .map(s => s.key)
              )
            )
          } else if (Array.isArray(data.homeSections)) {
            setHomeSectionOrder(
              data.homeSections.concat(
                allHomeSections
                  .filter(s => !data.homeSections.includes(s.key))
                  .map(s => s.key)
              )
            )
            setHomeSections(data.homeSections)
          }
          if (Array.isArray(data.homeSections)) {
            setHomeSections(data.homeSections)
          }
          if (typeof data.showPinnedTasks === 'boolean') {
            setShowPinnedTasks(data.showPinnedTasks)
          }
          if (typeof data.showPinnedNotes === 'boolean') {
            setShowPinnedNotes(data.showPinnedNotes)
          }
          if (typeof data.flashcardTimer === 'number') {
            setFlashcardTimer(data.flashcardTimer)
          }
          if (typeof data.flashcardSessionSize === 'number') {
            setFlashcardSessionSize(data.flashcardSessionSize)
          }
          if (typeof data.flashcardDefaultMode === 'string') {
            setFlashcardDefaultMode(data.flashcardDefaultMode)
          }
          if (typeof data.syncRole === 'string') {
            setSyncRole(data.syncRole)
          }
          if (typeof data.syncServerUrl === 'string') {
            setSyncServerUrl(data.syncServerUrl)
          }
          if (typeof data.syncInterval === 'number') {
            setSyncInterval(data.syncInterval)
          }
          if (typeof data.syncEnabled === 'boolean') {
            setSyncEnabled(data.syncEnabled)
          }
          if (typeof data.language === 'string') {
            setLanguage(data.language)
            i18n.changeLanguage(data.language)
          }
        }
      } catch (err) {
        console.error('Error loading settings', err)
      }
      setLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (!loaded) return
    const save = async () => {
      try {
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shortcuts,
            pomodoro,
            defaultTaskPriority: priority,
            theme,
            themeName,
            colorPalette,
            homeSections,
            homeSectionOrder,
            showPinnedTasks,
            showPinnedNotes,
            flashcardTimer,
            flashcardSessionSize,
            flashcardDefaultMode,
            syncRole,
            syncServerUrl,
            syncInterval,
            syncEnabled,
            language
          })
        })
      } catch (err) {
        console.error('Error saving settings', err)
      }
    }

    save()
  }, [
    loaded,
    shortcuts,
    pomodoro,
    priority,
    theme,
    themeName,
    colorPalette,
    homeSections,
    homeSectionOrder,
    showPinnedTasks,
    showPinnedNotes,
    flashcardTimer,
    flashcardSessionSize,
    flashcardDefaultMode,
    syncRole,
    syncServerUrl,
    syncInterval,
    syncEnabled,
    language
  ])

  useEffect(() => {
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value)
    })
    if (['dark', 'dark-red', 'hacker'].includes(themeName)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme, themeName])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const updateShortcut = (key: keyof ShortcutKeys, value: string) => {
    setShortcuts(prev => ({ ...prev, [key]: value.toLowerCase() }))
  }

  const updatePomodoro = (key: 'workMinutes' | 'breakMinutes', value: number) => {
    setPomodoro(prev => ({ ...prev, [key]: value }))
  }

  const updateDefaultTaskPriority = (value: 'low' | 'medium' | 'high') => {
    setPriority(value)
  }

  const updateTheme = (key: keyof typeof defaultTheme, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }))
    setThemeName('custom')
  }

  const updateThemeName = (name: string) => {
    setThemeName(name)
    if (themePresets[name]) {
      setTheme(themePresets[name])
    }
  }

  const updatePaletteColor = (index: number, value: string) => {
    setColorPalette(prev => {
      const arr = [...prev]
      arr[index] = value
      return arr
    })
  }

  const updateFlashcardTimer = (value: number) => {
    setFlashcardTimer(value)
  }

  const updateFlashcardSessionSize = (value: number) => {
    setFlashcardSessionSize(value)
  }

  const updateFlashcardDefaultMode = (
    value: 'spaced' | 'training' | 'random' | 'typing' | 'timed'
  ) => {
    setFlashcardDefaultMode(value)
  }

  const updateSyncRole = (role: 'server' | 'client') => {
    setSyncRole(role)
  }

  const updateSyncServerUrl = (url: string) => {
    setSyncServerUrl(url)
  }

  const updateSyncInterval = (value: number) => {
    setSyncInterval(value)
  }

  const updateSyncEnabled = (value: boolean) => {
    setSyncEnabled(value)
  }

  const updateLanguage = (lang: string) => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  const toggleHomeSection = (section: string) => {
    setHomeSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const reorderHomeSections = (start: number, end: number) => {
    setHomeSectionOrder(prev => {
      const updated = Array.from(prev)
      const [removed] = updated.splice(start, 1)
      updated.splice(end, 0, removed)
      return updated
    })
  }

  const toggleShowPinnedTasks = () => {
    setShowPinnedTasks(prev => !prev)
  }

  const toggleShowPinnedNotes = () => {
    setShowPinnedNotes(prev => !prev)
  }

  return (
    <SettingsContext.Provider
      value={{
        shortcuts,
        updateShortcut,
        pomodoro,
        updatePomodoro,
        defaultTaskPriority: priority,
        updateDefaultTaskPriority,
        theme,
        updateTheme,
        themeName,
        updateThemeName,
        colorPalette,
        updatePaletteColor,
        homeSections,
        homeSectionOrder,
        toggleHomeSection,
        reorderHomeSections,
        showPinnedTasks,
        toggleShowPinnedTasks,
        showPinnedNotes,
        toggleShowPinnedNotes,
        flashcardTimer,
        updateFlashcardTimer,
        flashcardSessionSize,
        updateFlashcardSessionSize,
        flashcardDefaultMode,
        updateFlashcardDefaultMode,
        syncRole,
        updateSyncRole,
        syncServerUrl,
        updateSyncServerUrl,
        syncInterval,
        updateSyncInterval,
        syncEnabled,
        updateSyncEnabled,
        language,
        updateLanguage
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
