import React, { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { useSettings, themePresets } from '@/hooks/useSettings'
import { Input } from '@/components/ui/input'
import KeyInput from '@/components/KeyInput'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { hslToHex, hexToHsl } from '@/utils/color'
import { Checkbox } from '@/components/ui/checkbox'
import { allHomeSections } from '@/utils/homeSections'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { GripVertical } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs'
import ReactMarkdown from 'react-markdown'
import readme from '../../README.md?raw'

interface ServerInfo {
  ips: string[]
  port: number
  urls: string[]
}

const SettingsPage: React.FC = () => {
  const {
    shortcuts,
    updateShortcut,
    pomodoro,
    updatePomodoro,
    defaultTaskPriority,
    updateDefaultTaskPriority,
    theme,
    updateTheme,
    themeName,
    updateThemeName,
    homeSections,
    homeSectionOrder,
    toggleHomeSection,
    reorderHomeSections,
    showPinnedTasks,
    toggleShowPinnedTasks,
    showPinnedNotes,
    toggleShowPinnedNotes,
    flashcardTimer,
    updateFlashcardTimer,
    flashcardSessionSize,
    updateFlashcardSessionSize,
    flashcardDefaultMode,
    updateFlashcardDefaultMode,
    syncInterval,
    updateSyncInterval,
    syncFolder,
    updateSyncFolder
  } = useSettings()

  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/server-info')
        if (res.ok) {
          const data = await res.json()
          setServerInfo(data)
        }
      } catch (err) {
        console.error('Failed to load server info', err)
      }
    }
    load()
  }, [])

  const handleHomeDrag = (result: DropResult) => {
    if (!result.destination) return
    reorderHomeSections(result.source.index, result.destination.index)
  }

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
    const current = res.ok
      ? await res.json()
      : { tasks: [], categories: [], notes: [] }

    const taskMap = new Map<string, any>()
    for (const t of current.tasks || []) taskMap.set(t.id, t)
    for (const t of incoming.tasks || []) if (!taskMap.has(t.id)) taskMap.set(t.id, t)

    const catMap = new Map<string, any>()
    for (const c of current.categories || []) catMap.set(c.id, c)
    for (const c of incoming.categories || []) if (!catMap.has(c.id)) catMap.set(c.id, c)

    await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: Array.from(taskMap.values()),
        categories: Array.from(catMap.values()),
        notes: current.notes || []
      })
    })
    window.location.reload()
  }

  const importNotes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const incoming = JSON.parse(text)
    const res = await fetch('/api/notes')
    const current = res.ok ? await res.json() : []

    const noteMap = new Map<string, any>()
    for (const n of current) noteMap.set(n.id, n)
    for (const n of incoming || []) if (!noteMap.has(n.id)) noteMap.set(n.id, n)

    await fetch('/api/notes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Array.from(noteMap.values()))
    })
    window.location.reload()
  }

  const importDecks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const data = JSON.parse(text)

    const [cardsRes, decksRes] = await Promise.all([
      fetch('/api/flashcards'),
      fetch('/api/decks')
    ])
    const currentCards = cardsRes.ok ? await cardsRes.json() : []
    const currentDecks = decksRes.ok ? await decksRes.json() : []

    const cardMap = new Map<string, any>()
    for (const c of currentCards) cardMap.set(c.id, c)
    for (const c of data.flashcards || []) if (!cardMap.has(c.id)) cardMap.set(c.id, c)

    const deckMap = new Map<string, any>()
    for (const d of currentDecks) deckMap.set(d.id, d)
    for (const d of data.decks || []) if (!deckMap.has(d.id)) deckMap.set(d.id, d)

    await fetch('/api/flashcards', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Array.from(cardMap.values()))
    })
    await fetch('/api/decks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Array.from(deckMap.values()))
    })
    window.location.reload()
  }

  const importAll = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const incoming = JSON.parse(text)

    const res = await fetch('/api/all')
    const current = res.ok
      ? await res.json()
      : { tasks: [], categories: [], notes: [], flashcards: [], decks: [] }

    const merge = (curr: any[], inc: any[]) => {
      const map = new Map<string, any>()
      for (const item of curr || []) map.set(item.id, item)
      for (const item of inc || []) if (!map.has(item.id)) map.set(item.id, item)
      return Array.from(map.values())
    }

    const merged = {
      tasks: merge(current.tasks, incoming.tasks),
      categories: merge(current.categories, incoming.categories),
      notes: merge(current.notes, incoming.notes),
      flashcards: merge(current.flashcards, incoming.flashcards),
      decks: merge(current.decks, incoming.decks)
    }

    await fetch('/api/all', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged)
    })
    window.location.reload()
  }

  const selectFolder = async () => {
    const res = await fetch('/api/select-folder')
    if (res.ok) {
      const data = await res.json()
      if (data.folder) {
        updateSyncFolder(data.folder)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Einstellungen" />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="shortcuts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
            <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
            <TabsTrigger value="flashcards">Karten</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="home">Startseite</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="data">Daten</TabsTrigger>
            <TabsTrigger value="server">Server</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
          <TabsContent value="shortcuts" className="space-y-4">
            <div>
              <Label htmlFor="open">Command Palette</Label>
              <KeyInput
                value={shortcuts.openCommand}
                onChange={v => updateShortcut('openCommand', v)}
                placeholder="ctrl+k"
              />
            </div>
            <div>
              <Label htmlFor="task">Neue Task</Label>
              <KeyInput
                value={shortcuts.newTask}
                onChange={v => updateShortcut('newTask', v)}
                placeholder="ctrl+alt+t"
              />
            </div>
            <div>
              <Label htmlFor="note">Neue Notiz</Label>
              <KeyInput
                value={shortcuts.newNote}
                onChange={v => updateShortcut('newNote', v)}
                placeholder="ctrl+alt+n"
              />
            </div>
            <div>
              <Label htmlFor="flashcard">Neue Karte</Label>
              <KeyInput
                value={shortcuts.newFlashcard}
                onChange={v => updateShortcut('newFlashcard', v)}
                placeholder="ctrl+alt+f"
              />
            </div>
          </TabsContent>
          <TabsContent value="pomodoro" className="space-y-4">
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
          </TabsContent>
          <TabsContent value="flashcards" className="space-y-4">
            <div>
              <Label htmlFor="timer">Timer pro Karte (Sekunden)</Label>
              <Input
                id="timer"
                type="number"
                value={flashcardTimer}
                onChange={e => updateFlashcardTimer(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="sessionSize">Training-Session Größe</Label>
              <Input
                id="sessionSize"
                type="number"
                value={flashcardSessionSize}
                onChange={e => updateFlashcardSessionSize(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="startMode">Startmodus</Label>
              <Select
                value={flashcardDefaultMode}
                onValueChange={updateFlashcardDefaultMode}
              >
                <SelectTrigger id="startMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spaced">Spaced Repetition</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="typing">Eingabe</SelectItem>
                  <SelectItem value="timed">Timed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          <TabsContent value="tasks" className="space-y-4">
            <div>
              <Label htmlFor="priority">Standard-Priorität</Label>
              <Select value={defaultTaskPriority} onValueChange={updateDefaultTaskPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          <TabsContent value="home" className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showPinnedTasks"
                checked={showPinnedTasks}
                onCheckedChange={toggleShowPinnedTasks}
              />
              <Label htmlFor="showPinnedTasks">Gepinnte Tasks anzeigen</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showPinnedNotes"
                checked={showPinnedNotes}
                onCheckedChange={toggleShowPinnedNotes}
              />
              <Label htmlFor="showPinnedNotes">Gepinnte Notizen anzeigen</Label>
            </div>
            <DragDropContext onDragEnd={handleHomeDrag}>
              <Droppable droppableId="homeOrder">
                {provided => (
                  <div
                    className="space-y-2"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {homeSectionOrder.map((key, index) => {
                      const sec = allHomeSections.find(s => s.key === key)
                      if (!sec) return null
                      return (
                        <Draggable key={sec.key} draggableId={sec.key} index={index}>
                          {prov => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className="flex items-center justify-between border rounded p-2 bg-card"
                            >
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={sec.key}
                                  checked={homeSections.includes(sec.key)}
                                  onCheckedChange={() => toggleHomeSection(sec.key)}
                                />
                                <Label htmlFor={sec.key}>{sec.label}</Label>
                              </div>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </TabsContent>
          <TabsContent value="theme" className="space-y-4">
            <div>
              <Label htmlFor="themePreset">Voreinstellung</Label>
              <Select value={themeName} onValueChange={updateThemeName}>
                <SelectTrigger id="themePreset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(themePresets).map(name => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bgColor">Hintergrund (App)</Label>
              <Input
                id="bgColor"
                type="color"
                value={hslToHex(theme.background)}
                onChange={e => updateTheme('background', hexToHsl(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fgColor">Textfarbe</Label>
              <Input
                id="fgColor"
                type="color"
                value={hslToHex(theme.foreground)}
                onChange={e => updateTheme('foreground', hexToHsl(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Akzentfarbe</Label>
              <Input
                id="accentColor"
                type="color"
                value={hslToHex(theme.accent)}
                onChange={e => updateTheme('accent', hexToHsl(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardBgColor">Karten-Hintergrund</Label>
              <Input
                id="cardBgColor"
                type="color"
                value={hslToHex(theme.card)}
                onChange={e => updateTheme('card', hexToHsl(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardFgColor">Karten-Textfarbe</Label>
              <Input
                id="cardFgColor"
                type="color"
                value={hslToHex(theme['card-foreground'])}
                onChange={e => updateTheme('card-foreground', hexToHsl(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="popoverColor">Dropdown-Hintergrund</Label>
              <Input
                id="popoverColor"
                type="color"
                value={hslToHex(theme.popover)}
                onChange={e => updateTheme('popover', hexToHsl(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statBarPrimary">Statistik Balken Primär</Label>
              <Input
                id="statBarPrimary"
                type="color"
                value={hslToHex(theme['stat-bar-primary'])}
                onChange={e => updateTheme('stat-bar-primary', hexToHsl(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statBarSecondary">Statistik Balken Sekundär</Label>
              <Input
                id="statBarSecondary"
                type="color"
                value={hslToHex(theme['stat-bar-secondary'])}
                onChange={e => updateTheme('stat-bar-secondary', hexToHsl(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kanbanTodo">Kanban ToDo</Label>
              <Input
                id="kanbanTodo"
                type="color"
                value={hslToHex(theme['kanban-todo'])}
                onChange={e => updateTheme('kanban-todo', hexToHsl(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kanbanInprogress">Kanban In Arbeit</Label>
              <Input
                id="kanbanInprogress"
                type="color"
                value={hslToHex(theme['kanban-inprogress'])}
                onChange={e => updateTheme('kanban-inprogress', hexToHsl(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kanbanDone">Kanban Erledigt</Label>
              <Input
                id="kanbanDone"
                type="color"
                value={hslToHex(theme['kanban-done'])}
                onChange={e => updateTheme('kanban-done', hexToHsl(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workRing">Pomodoro Arbeit</Label>
              <Input
                id="workRing"
                type="color"
                value={hslToHex(theme['pomodoro-work-ring'])}
                onChange={e => updateTheme('pomodoro-work-ring', hexToHsl(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakRing">Pomodoro Pause</Label>
              <Input
                id="breakRing"
                type="color"
                value={hslToHex(theme['pomodoro-break-ring'])}
                onChange={e => updateTheme('pomodoro-break-ring', hexToHsl(e.target.value))}
              />
            </div>
          </TabsContent>
          <TabsContent value="data" className="space-y-4">
            <h2 className="font-semibold">Datenexport / -import</h2>
            <div className="space-y-2">
              <p className="font-medium">Sync-Ordner</p>
              <div className="flex items-center gap-2">
                <Input
                  value={syncFolder}
                  onChange={e => updateSyncFolder(e.target.value)}
                  placeholder="/Pfad/zum/Ordner"
                />
                <Button variant="outline" onClick={selectFolder}>Ordner wählen</Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Sync-Intervall (Minuten)</p>
              <Input
                type="number"
                min={1}
                value={syncInterval}
                onChange={e => updateSyncInterval(Number(e.target.value))}
              />
            </div>
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
          </TabsContent>
          <TabsContent value="server" className="space-y-4">
            <h2 className="font-semibold">Server Info</h2>
            {serverInfo ? (
              <div className="space-y-2">
                <p>Port: {serverInfo.port}</p>
                <div>
                  <p className="font-medium">IPs</p>
                  <ul className="list-disc list-inside space-y-1">
                    {serverInfo.ips.map(ip => (
                      <li key={ip}>{ip}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium">URLs</p>
                  <ul className="list-disc list-inside space-y-1">
                    {serverInfo.urls.map(url => (
                      <li key={url}>{url}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p>Lade...</p>
            )}
          </TabsContent>
          <TabsContent value="info" className="space-y-4">
            <div className="prose dark:prose-invert">
              <ReactMarkdown>{readme}</ReactMarkdown>
            </div>
            <p className="text-sm text-muted-foreground">
              Version {__APP_VERSION__}{' '}
              <Link to="/release-notes" className="underline">
                Release Notes
              </Link>
            </p>
          </TabsContent>
        </Tabs>
        <p className="text-xs text-muted-foreground mt-4">
          Version {__APP_VERSION__}{' '}
          <Link to="/release-notes" className="underline">
            Release Notes
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SettingsPage
