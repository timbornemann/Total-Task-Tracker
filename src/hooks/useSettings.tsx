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

interface SettingsContextValue {
  shortcuts: ShortcutKeys
  updateShortcut: (key: keyof ShortcutKeys, value: string) => void
  pomodoro: { workMinutes: number; breakMinutes: number }
  updatePomodoro: (key: 'workMinutes' | 'breakMinutes', value: number) => void
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<ShortcutKeys>(() => {
    const stored = localStorage.getItem('shortcuts')
    return stored ? { ...defaultShortcuts, ...JSON.parse(stored) } : defaultShortcuts
  })
  const [pomodoro, setPomodoro] = useState(() => {
    const stored = localStorage.getItem('pomodoro')
    return stored ? { ...defaultPomodoro, ...JSON.parse(stored) } : defaultPomodoro
  })

  useEffect(() => {
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts))
  }, [shortcuts])

  useEffect(() => {
    localStorage.setItem('pomodoro', JSON.stringify(pomodoro))
  }, [pomodoro])

  const updateShortcut = (key: keyof ShortcutKeys, value: string) => {
    setShortcuts(prev => ({ ...prev, [key]: value.toLowerCase() }))
  }

  const updatePomodoro = (key: 'workMinutes' | 'breakMinutes', value: number) => {
    setPomodoro(prev => ({ ...prev, [key]: value }))
  }

  return (
    <SettingsContext.Provider
      value={{ shortcuts, updateShortcut, pomodoro, updatePomodoro }}
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
