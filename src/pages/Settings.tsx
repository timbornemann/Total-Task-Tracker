import React from 'react'
import Navbar from '@/components/Navbar'
import { useSettings } from '@/hooks/useSettings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SettingsPage: React.FC = () => {
  const { shortcuts, updateShortcut, pomodoro, updatePomodoro } = useSettings()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Einstellungen" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div>
          <Label htmlFor="open">Command Palette</Label>
          <Input
            id="open"
            value={shortcuts.openCommand}
            onChange={e => updateShortcut('openCommand', e.target.value)}
            placeholder="z.B. ctrl+k"
          />
        </div>
        <div>
          <Label htmlFor="task">Neue Task</Label>
          <Input
            id="task"
            value={shortcuts.newTask}
            onChange={e => updateShortcut('newTask', e.target.value)}
            placeholder="z.B. ctrl+t"
          />
        </div>
        <div>
          <Label htmlFor="note">Neue Notiz</Label>
          <Input
            id="note"
            value={shortcuts.newNote}
            onChange={e => updateShortcut('newNote', e.target.value)}
            placeholder="z.B. ctrl+n"
          />
        </div>
        <div>
          <Label htmlFor="work">Lernzeit (Minuten)</Label>
          <Input
            id="work"
            type="number"
            value={pomodoro.workMinutes}
            onChange={e => updatePomodoro('workMinutes', Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="break">Pause (Minuten)</Label>
          <Input
            id="break"
            type="number"
            value={pomodoro.breakMinutes}
            onChange={e => updatePomodoro('breakMinutes', Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
