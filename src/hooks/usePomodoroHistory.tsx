import React, { createContext, useContext, useEffect, useState } from 'react'
import { PomodoroSession } from '@/types'

const API_URL = '/api/pomodoro-sessions'

const usePomodoroHistoryImpl = () => {
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API_URL)
        if (res.ok) {
          const data = await res.json()
          setSessions(data || [])
        }
      } catch (err) {
        console.error('Error loading Pomodoro sessions', err)
      } finally {
        setLoaded(true)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!loaded) return
    const save = async () => {
      try {
        await fetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessions)
        })
      } catch (err) {
        console.error('Error saving Pomodoro sessions', err)
      }
    }
    save()
  }, [sessions, loaded])

  const addSession = (start: number, end: number) => {
    setSessions(prev => [...prev, { start, end }])
  }

  const endBreak = (time: number) => {
    setSessions(prev => {
      if (!prev.length) return prev
      const last = { ...prev[prev.length - 1] }
      last.breakEnd = time
      return [...prev.slice(0, -1), last]
    })
  }

  const updateSession = (
    index: number,
    data: Partial<PomodoroSession>
  ) => {
    setSessions(prev =>
      prev.map((s, i) => (i === index ? { ...s, ...data } : s))
    )
  }

  const deleteSession = (index: number) => {
    setSessions(prev => prev.filter((_, i) => i !== index))
  }

  return { sessions, addSession, endBreak, updateSession, deleteSession }
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
