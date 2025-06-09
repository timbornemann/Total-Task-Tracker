import React from 'react'
import Navbar from '@/components/Navbar'
import { useSettings } from '@/hooks/useSettings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const SettingsPage: React.FC = () => {
  const { shortcuts, updateShortcut, pomodoro, updatePomodoro } = useSettings()

  const download = (data: any, name: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportTasks = async () => {
    const res = await fetch('/api/data')
    if (res.ok) {
      const data = await res.json()
      download({ tasks: data.tasks, categories: data.categories }, 'tasks.json')
    }
  }

  const exportNotes = async () => {
    const res = await fetch('/api/notes')
    if (res.ok) {
      const data = await res.json()
      download(data, 'notes.json')
    }
  }

  const exportDecks = async () => {
    const [cardsRes, decksRes] = await Promise.all([
      fetch('/api/flashcards'),
      fetch('/api/decks')
    ])
    if (cardsRes.ok && decksRes.ok) {
      const cards = await cardsRes.json()
      const decks = await decksRes.json()
      download({ flashcards: cards, decks }, 'decks.json')
    }
  }

  const exportAll = async () => {
    const res = await fetch('/api/all')
    if (res.ok) {
      const data = await res.json()
      download(data, 'all-data.json')
    }
  }

  const importTasks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const incoming = JSON.parse(text)
    const res = await fetch('/api/data')
    const current = res.ok ? await res.json() : { notes: [] }
    await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: incoming.tasks || [],
        categories: incoming.categories || [],
        notes: current.notes || []
      })
    })
    window.location.reload()
  }

  const importNotes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const notes = JSON.parse(text)
    await fetch('/api/notes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes)
    })
    window.location.reload()
  }

  const importDecks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text)
    await fetch('/api/flashcards', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.flashcards || [])
    })
    await fetch('/api/decks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.decks || [])
    })
    window.location.reload()
  }

  const importAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text)
    await fetch('/api/all', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    window.location.reload()
  }

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
        <div className="pt-4 border-t space-y-4">
          <h2 className="font-semibold">Datenexport / -import</h2>
          <div className="space-y-2">
            <p className="font-medium">Tasks & Kategorien</p>
            <div className="flex items-center gap-2">
              <Button onClick={exportTasks}>Export</Button>
              <Input type="file" accept="application/json" onChange={importTasks} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Notizen</p>
            <div className="flex items-center gap-2">
              <Button onClick={exportNotes}>Export</Button>
              <Input type="file" accept="application/json" onChange={importNotes} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Decks & Karten</p>
            <div className="flex items-center gap-2">
              <Button onClick={exportDecks}>Export</Button>
              <Input type="file" accept="application/json" onChange={importDecks} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Alles</p>
            <div className="flex items-center gap-2">
              <Button onClick={exportAll}>Export</Button>
              <Input type="file" accept="application/json" onChange={importAll} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
