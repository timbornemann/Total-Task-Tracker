import React from 'react'
import { usePomodoroHistory } from '@/hooks/usePomodoroHistory.tsx'
import Navbar from '@/components/Navbar'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const PomodoroHistoryPage: React.FC = () => {
  const { sessions, updateSession, deleteSession } = usePomodoroHistory()
  const { t } = useTranslation()

  const handleChange = (
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const time = new Date(value).getTime()
    if (!isNaN(time)) {
      updateSession(index, { [field]: time } as any)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar title={t('pomodoroSessions.title')} />
      <div className="flex-grow p-4 flex flex-col items-center">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('pomodoroSessions.none')}
          </p>
        ) : (
          <table className="w-full max-w-xl text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2">{t('pomodoroSessions.start')}</th>
                <th className="text-left p-2">{t('pomodoroSessions.end')}</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">
                    <Input
                      type="datetime-local"
                      value={new Date(s.start).toISOString().slice(0, 16)}
                      onChange={e => handleChange(i, 'start', e.target.value)}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="datetime-local"
                      value={new Date(s.end).toISOString().slice(0, 16)}
                      onChange={e => handleChange(i, 'end', e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteSession(i)}
                    >
                      {t('pomodoroSessions.delete')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default PomodoroHistoryPage
