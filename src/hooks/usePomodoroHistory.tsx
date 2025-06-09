import React, { createContext, useContext, useEffect, useState } from 'react'
import { PomodoroSession } from '@/types'

const API_URL = '/api/pomodoro-sessions'

const usePomodoroHistoryImpl = () => {
  const [sessions, setSessions] = useState<PomodoroSession[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API_URL)
        if (res.ok) {
          const data = await res.json()
          setSessions(data || [])
        }
      } catch (err) {
        console.error('Fehler beim Laden der Pomodoro-Sessions', err)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const save = async () => {
      try {
        await fetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessions)
        })
      } catch (err) {
        console.error('Fehler beim Speichern der Pomodoro-Sessions', err)
      }
    }
    save()
  }, [sessions])

  const addSession = (start: number, end: number) => {
    setSessions(prev => [...prev, { start, end }])
  }

  const endBreak = (time: number) => {
    setSessions(prev => {
      if (!prev.length) return prev
      const last = { ...prev[prev.length - 1] }
      if (!last.breakEnd) last.breakEnd = time
      return [...prev.slice(0, -1), last]
    })
  }

  return { sessions, addSession, endBreak }
}

type Store = ReturnType<typeof usePomodoroHistoryImpl>

const PomodoroHistoryContext = createContext<Store | null>(null)

export const PomodoroHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = usePomodoroHistoryImpl()
  return (
    <PomodoroHistoryContext.Provider value={store}>
      {children}
    </PomodoroHistoryContext.Provider>
  )
}

export const usePomodoroHistory = () => {
  const ctx = useContext(PomodoroHistoryContext)
  if (!ctx) throw new Error('usePomodoroHistory must be used within PomodoroHistoryProvider')
  return ctx
}
