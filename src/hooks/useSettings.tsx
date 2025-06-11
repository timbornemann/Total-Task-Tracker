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

interface SettingsContextValue {
  shortcuts: ShortcutKeys
  updateShortcut: (key: keyof ShortcutKeys, value: string) => void
  pomodoro: { workMinutes: number; breakMinutes: number }
  updatePomodoro: (key: 'workMinutes' | 'breakMinutes', value: number) => void
  defaultTaskPriority: 'low' | 'medium' | 'high'
  updateDefaultTaskPriority: (value: 'low' | 'medium' | 'high') => void
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<ShortcutKeys>(defaultShortcuts)
  const [pomodoro, setPomodoro] = useState(defaultPomodoro)
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
    defaultTaskPriority
  )

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
            defaultTaskPriority: priority
          })
        })
      } catch (err) {
        console.error('Fehler beim Speichern der Einstellungen', err)
      }
    }

    save()
  }, [shortcuts, pomodoro, priority])

  const updateShortcut = (key: keyof ShortcutKeys, value: string) => {
    setShortcuts(prev => ({ ...prev, [key]: value.toLowerCase() }))
  }

  const updatePomodoro = (key: 'workMinutes' | 'breakMinutes', value: number) => {
    setPomodoro(prev => ({ ...prev, [key]: value }))
  }

  const updateDefaultTaskPriority = (value: 'low' | 'medium' | 'high') => {
    setPriority(value)
  }

  return (
    <SettingsContext.Provider
      value={{
        shortcuts,
        updateShortcut,
        pomodoro,
        updatePomodoro,
        defaultTaskPriority: priority,
        updateDefaultTaskPriority
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
