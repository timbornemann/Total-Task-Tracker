import { useEffect, useRef } from 'react'
import { usePomodoroStore } from './PomodoroTimer'
import { usePomodoroHistory } from '@/hooks/usePomodoroHistory.tsx'

const PomodoroTicker = () => {
  const tick = usePomodoroStore(state => state.tick)
  const mode = usePomodoroStore(state => state.mode)
  const setStartTime = usePomodoroStore(state => state.setStartTime)
  const startTime = usePomodoroStore(state => state.startTime)
  const { addSession, endBreak } = usePomodoroHistory()
  const prevMode = useRef(mode)

  useEffect(() => {
    const interval = setInterval(() => tick(), 1000)
    return () => clearInterval(interval)
  }, [tick])

  useEffect(() => {
    if (prevMode.current === 'work' && mode === 'break' && startTime) {
      addSession(startTime, Date.now())
      setStartTime(undefined)
    }
    if (prevMode.current === 'break' && mode === 'work') {
      endBreak(Date.now())
      setStartTime(Date.now())
    }
    prevMode.current = mode
  }, [mode, startTime, addSession, endBreak, setStartTime])

  return null
}

export default PomodoroTicker
