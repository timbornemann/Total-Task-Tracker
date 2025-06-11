import React, { createContext, useContext, useEffect, useState } from 'react'


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
const defaultTaskPriority: 'low' | 'medium' | 'high' = 'medium'
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
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<ShortcutKeys>(defaultShortcuts)
  const [pomodoro, setPomodoro] = useState(defaultPomodoro)
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
    defaultTaskPriority
  )
  const [theme, setTheme] = useState(defaultTheme)
  const [themeName, setThemeName] = useState('light')

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
        }
      } catch (err) {
        console.error('Fehler beim Laden der Einstellungen', err)
      }
    }
    load()
  }, [])

  useEffect(() => {
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
            themeName
          })
        })
      } catch (err) {
        console.error('Fehler beim Speichern der Einstellungen', err)
      }
    }

    save()
  }, [shortcuts, pomodoro, priority, theme, themeName])

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
        updateThemeName
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
