import React from 'react'
import Navbar from '@/components/Navbar'
import { useTaskStore } from '@/hooks/useTaskStore'
import { useSettings } from '@/hooks/useSettings'
import { useTranslation } from 'react-i18next'
import {
  startOfDay,
  subWeeks,
  addWeeks,
  startOfWeek,
  addDays,
  getISOWeek,
  format
} from 'date-fns'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  complementaryColor,
  adjustColor,
  isColorDark,
  hslToHex
} from '@/utils/color'
import { Task } from '@/types'

const HabitTrackerPage: React.FC = () => {
  const { recurring, toggleHabitCompletion } = useTaskStore()
  const { colorPalette, theme } = useSettings()
  const { t } = useTranslation()

  const today = startOfDay(new Date())
  const start = startOfWeek(subWeeks(today, 51), { weekStartsOn: 1 })
  const weeks: Date[] = []
  for (let i = 0; i < 52; i++) {
    weeks.push(addWeeks(start, i))
  }

  const getFrequencyDays = (habit: Task): number[] => {
    if (
      habit.recurrencePattern === 'weekly' &&
      typeof habit.startWeekday === 'number'
    ) {
      return [habit.startWeekday]
    }
    return [0, 1, 2, 3, 4, 5, 6]
  }

  const calculateStreak = (habit: Task, freqDays: number[]): number => {
    const history = new Set(habit.habitHistory || [])
    let streak = 0
    let day = today
    while (day >= start) {
      if (freqDays.includes(day.getDay())) {
        const key = format(day, 'yyyy-MM-dd')
        if (history.has(key)) streak++
        else break
      }
      day = addDays(day, -1)
    }
    return streak
  }

  const countTotals = (
    habit: Task,
    freqDays: number[]
  ): { total: number; completed: number } => {
    const history = new Set(habit.habitHistory || [])
    let total = 0
    let completed = 0
    weeks.forEach(w => {
      freqDays.forEach(d => {
        const date = addDays(w, d)
        if (date > today || date < start) return
        total++
        if (history.has(format(date, 'yyyy-MM-dd'))) completed++
      })
    })
    return { total, completed }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t('habits.title')} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {recurring.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('habits.none')}</p>
        ) : (
          <div className="space-y-6 overflow-x-auto">
            {recurring.map(habit => {
              const freqDays = getFrequencyDays(habit)
              const { total, completed } = countTotals(habit, freqDays)
              const streak = calculateStreak(habit, freqDays)
              const baseColor = colorPalette[habit.color] ?? colorPalette[0]
              const textColor = complementaryColor(baseColor)
              const doneColor = adjustColor(
                baseColor,
                isColorDark(baseColor) ? 20 : -20
              )
              const emptyColor = hslToHex(theme.muted)
              const rows = [...freqDays].sort((a, b) => a - b)
              return (
                <Card
                  key={habit.id}
                  style={{ backgroundColor: baseColor, color: textColor }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{habit.title}</CardTitle>
                    <p className="text-xs">
                      {t('habits.streak', { count: streak })} •{' '}
                      {t('habits.progress', { completed, total })}
                    </p>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="table-fixed border-collapse">
                      <thead>
                        <tr>
                          <th className="w-8 text-xs" />
                          {weeks.map(w => (
                            <th
                              key={w.toISOString()}
                              className="w-8 text-center text-[10px]"
                            >
                              {getISOWeek(w)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r} className="h-6">
                            <td className="text-xs pr-1">
                              {format(addDays(start, r), 'EEE')}
                            </td>
                            {weeks.map(w => {
                              const date = addDays(w, r)
                              if (date > today) return <td key={date.toISOString()} />
                              const dateStr = format(date, 'yyyy-MM-dd')
                              const done = habit.habitHistory?.includes(dateStr)
                              return (
                                <td key={dateStr} className="p-0.5">
                                  <div
                                    className="w-6 h-6 rounded cursor-pointer hover:opacity-80"
                                    style={{
                                      backgroundColor: done ? doneColor : emptyColor
                                    }}
                                    onClick={() =>
                                      toggleHabitCompletion(habit.id, dateStr)
                                    }
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default HabitTrackerPage
