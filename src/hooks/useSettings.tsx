import React, { createContext, useContext, useEffect, useState } from 'react'


export type ShortcutKeys = {
  openCommand: string
  newTask: string
  newNote: string
}

const defaultShortcuts: ShortcutKeys = {
  openCommand: 'ctrl+k',
  newTask: 'ctrl+t',
  newNote: 'ctrl+n'
}

const defaultPomodoro = { workMinutes: 25, breakMinutes: 5 }
const defaultTaskPriority: 'low' | 'medium' | 'high' = 'medium'
const defaultTheme = {
  background: '0 0% 100%',
  foreground: '222.2 84% 4.9%',
  accent: '210 40% 96.1%',
  card: '0 0% 100%',
  'card-foreground': '222.2 84% 4.9%',
  'stat-bar-primary': '210 40% 96.1%',
  'stat-bar-secondary': '214.3 31.8% 91.4%',
  'kanban-todo': '210 40% 96.1%',
  'kanban-inprogress': '214.3 31.8% 91.4%',
  'kanban-done': '140 40% 96.1%',
  'pomodoro-work-ring': '222.2 47.4% 11.2%',
  'pomodoro-break-ring': '210 40% 96.1%'
}

export const themePresets: Record<string, typeof defaultTheme> = {
  light: { ...defaultTheme },
  dark: {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    accent: '217.2 32.6% 17.5%',
    card: '222.2 84% 4.9%',
    'card-foreground': '210 40% 98%',
    'stat-bar-primary': '217.2 32.6% 17.5%',
    'stat-bar-secondary': '217.2 32.6% 17.5%',
    'kanban-todo': '217.2 32.6% 17.5%',
    'kanban-inprogress': '217.2 32.6% 17.5%',
    'kanban-done': '217.2 32.6% 17.5%',
    'pomodoro-work-ring': '210 40% 98%',
    'pomodoro-break-ring': '217.2 32.6% 17.5%'
  },
  ocean: {
    background: '210 60% 98%',
    foreground: '222.2 47.4% 11.2%',
    accent: '199 94% 48%',
    card: '210 60% 98%',
    'card-foreground': '222.2 47.4% 11.2%',
    'stat-bar-primary': '199 94% 48%',
    'stat-bar-secondary': '214.3 31.8% 91.4%',
    'kanban-todo': '210 40% 96.1%',
    'kanban-inprogress': '210 80% 85%',
    'kanban-done': '199 94% 48%',
    'pomodoro-work-ring': '199 94% 48%',
    'pomodoro-break-ring': '210 40% 96.1%'
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
    if (themeName === 'dark') {
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
