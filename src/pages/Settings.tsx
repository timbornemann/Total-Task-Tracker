import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '@/components/Navbar'
import { useSettings, themePresets } from '@/hooks/useSettings'
import { Task, Category, Note, Flashcard, Deck } from '@/types'
import { Input } from '@/components/ui/input'
import KeyInput from '@/components/KeyInput'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { hslToHex, hexToHsl, themeToGradient } from '@/utils/color'
import { Checkbox } from '@/components/ui/checkbox'
import { allHomeSections } from '@/utils/homeSections'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, CheckCircle, XCircle } from 'lucide-react'
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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion'
import ReactMarkdown from 'react-markdown'
import readme from '../../README.md?raw'
import { useToast } from '@/hooks/use-toast'

interface SortableHomeSectionProps {
  id: string
  children: React.ReactNode
}

const SortableHomeSection: React.FC<SortableHomeSectionProps> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

interface ServerInfo {
  ips: string[]
  port: number
  urls: string[]
  wifiIp: string | null
  wifiUrl: string | null
}

const deriveStructure = <T extends Record<string, unknown>>(items: T[]): Record<string, unknown> => {
  const result: Record<string, unknown> = {}
  for (const item of items) {
    Object.entries(item).forEach(([key, value]) => {
      if (!(key in result)) {
        if (Array.isArray(value)) result[key] = []
        else if (typeof value === 'string') result[key] = ''
        else if (typeof value === 'number') result[key] = 0
        else if (typeof value === 'boolean') result[key] = false
        else result[key] = null
      }
    })
  }
  return result
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
    showPinnedCategories,
    toggleShowPinnedCategories,
    collapseSubtasksByDefault,
    toggleCollapseSubtasksByDefault,
    defaultTaskLayout,
    updateDefaultTaskLayout,
    showCompletedByDefault,
    toggleShowCompletedByDefault,
    defaultTaskColor,
    updateDefaultTaskColor,
    flashcardTimer,
    updateFlashcardTimer,
    flashcardSessionSize,
    updateFlashcardSessionSize,
    flashcardDefaultMode,
    updateFlashcardDefaultMode,
    syncRole,
    updateSyncRole,
    syncServerUrl,
    updateSyncServerUrl,
    syncInterval,
    updateSyncInterval,
    syncEnabled,
    updateSyncEnabled,
    offlineCache,
    toggleOfflineCache,
    language,
    updateLanguage,
    llmUrl,
    updateLlmUrl,
    llmToken,
    updateLlmToken,
    llmModel,
    updateLlmModel,
    colorPalette,
    customThemes,
    addCustomTheme,
    deleteCustomTheme,
    updatePaletteColor,
    homeSectionColors,
    updateHomeSectionColor
  } = useSettings()

  const { t } = useTranslation()
  const { toast } = useToast()

  const tasksInputRef = React.useRef<HTMLInputElement>(null)
  const notesInputRef = React.useRef<HTMLInputElement>(null)
  const decksInputRef = React.useRef<HTMLInputElement>(null)
  const allInputRef = React.useRef<HTMLInputElement>(null)

  const [currentTab, setCurrentTab] = useState(() =>
    localStorage.getItem('settingsTab') || 'overview'
  )
  const handleTabChange = (val: string) => {
    setCurrentTab(val)
    localStorage.setItem('settingsTab', val)
  }

  type ImportType = 'tasks' | 'notes' | 'decks' | 'all'
  type ImportData = Partial<{
    tasks: Task[]
    categories: Category[]
    notes: Note[]
    flashcards: Flashcard[]
    decks: Deck[]
  }>
  const [importInfo, setImportInfo] = useState<
    | { type: ImportType; data: ImportData }
    | null
  >(null)
  const [importResult, setImportResult] = useState<'success' | 'error' | null>(
    null
  )

  const [newThemeName, setNewThemeName] = useState('')

  const baseColors = [
    { key: 'background', label: 'bgColor', desc: 'bgColorDesc' },
    { key: 'foreground', label: 'fgColor', desc: 'fgColorDesc' },
    { key: 'accent', label: 'accentColor', desc: 'accentColorDesc' }
  ] as const

  const interactiveColors = [
    { key: 'primary', label: 'primaryColor', desc: 'primaryColorDesc' },
    { key: 'primary-foreground', label: 'primaryFgColor', desc: 'primaryFgColorDesc' },
    { key: 'destructive', label: 'destructiveColor', desc: 'destructiveColorDesc' },
    { key: 'destructive-foreground', label: 'destructiveFgColor', desc: 'destructiveFgColorDesc' }
  ] as const

  const surfaceColors = [
    { key: 'muted', label: 'mutedColor', desc: 'mutedColorDesc' },
    { key: 'muted-foreground', label: 'mutedFgColor', desc: 'mutedFgColorDesc' },
    { key: 'card', label: 'cardBgColor', desc: 'cardBgColorDesc' },
    { key: 'card-foreground', label: 'cardFgColor', desc: 'cardFgColorDesc' },
    { key: 'popover', label: 'popoverColor', desc: 'popoverColorDesc' }
  ] as const

  const statusColors = [
    { key: 'task-overdue', label: 'taskOverdue', desc: 'taskOverdueDesc' }
  ] as const

  const statsKanbanColors = [
    { key: 'stat-bar-primary', label: 'statBarPrimary', desc: 'statBarPrimaryDesc' },
    { key: 'stat-bar-secondary', label: 'statBarSecondary', desc: 'statBarSecondaryDesc' },
    { key: 'kanban-todo', label: 'kanbanTodo', desc: 'kanbanTodoDesc' },
    { key: 'kanban-inprogress', label: 'kanbanInprogress', desc: 'kanbanInprogressDesc' },
    { key: 'kanban-done', label: 'kanbanDone', desc: 'kanbanDoneDesc' }
  ] as const

  const pomodoroColors = [
    { key: 'pomodoro-work-ring', label: 'workRing', desc: 'workRingDesc' },
    { key: 'pomodoro-break-ring', label: 'breakRing', desc: 'breakRingDesc' }
  ] as const

  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [syncStatus, setSyncStatus] = useState<{ last: number; error: string | null } | null>(null)
  const [syncLog, setSyncLog] = useState<{ time: number; ip: string; method: string }[] | null>(null)

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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/sync-status')
        if (res.ok) {
          const data = await res.json()
          setSyncStatus(data)
        }
      } catch (err) {
        console.error('Failed to load sync status', err)
      }
    }
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (syncRole !== 'server') return
    const load = async () => {
      try {
        const res = await fetch('/api/sync-log')
        if (res.ok) {
          const data = await res.json()
          setSyncLog(data)
        }
      } catch (err) {
        console.error('Failed to load sync log', err)
      }
    }
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [syncRole])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  )

  const handleHomeDrag = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIndex = homeSectionOrder.indexOf(active.id as string)
    const newIndex = homeSectionOrder.indexOf(over.id as string)
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderHomeSections(oldIndex, newIndex)
    }
  }

  const download = (data: unknown, name: string) => {
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

  const exportTaskStructure = async () => {
    const res = await fetch('/api/data')
    if (res.ok) {
      const data = await res.json()
      const tasks = deriveStructure(data.tasks || [])
      const categories = deriveStructure(data.categories || [])
      download(
        { tasks: [tasks], categories: [categories] },
        'tasks-structure.json'
      )
    }
  }

  const exportNoteStructure = async () => {
    const res = await fetch('/api/notes')
    if (res.ok) {
      const notes = await res.json()
      download({ notes: [deriveStructure(notes)] }, 'notes-structure.json')
    }
  }

  const exportDeckStructure = async () => {
    const [cardsRes, decksRes] = await Promise.all([
      fetch('/api/flashcards'),
      fetch('/api/decks')
    ])
    if (cardsRes.ok && decksRes.ok) {
      const cards = await cardsRes.json()
      const decks = await decksRes.json()
      download(
        {
          flashcards: [deriveStructure(cards)],
          decks: [deriveStructure(decks)]
        },
        'decks-structure.json'
      )
    }
  }

  const exportAllStructure = async () => {
    const res = await fetch('/api/all')
    if (res.ok) {
      const data = await res.json()
      download(
        {
          tasks: [deriveStructure(data.tasks || [])],
          categories: [deriveStructure(data.categories || [])],
          notes: [deriveStructure(data.notes || [])],
          flashcards: [deriveStructure(data.flashcards || [])],
          decks: [deriveStructure(data.decks || [])]
        },
        'all-structure.json'
      )
    }
  }

  const handleFile = async (
    type: ImportType,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as ImportData
      setImportInfo({ type, data })
    } catch {
      setImportResult('error')
    }
  }

  const importTasks = async (incoming: ImportData) => {
    const res = await fetch('/api/data')
    const current = res.ok
      ? await res.json()
      : { tasks: [], categories: [], notes: [] };

    const taskMap = new Map<string, Task>()
    for (const t of current.tasks || []) taskMap.set(t.id, t)
    for (const t of incoming.tasks || []) if (!taskMap.has(t.id)) taskMap.set(t.id, t)

    const catMap = new Map<string, Category>()
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
    setImportResult('success')
    setTimeout(() => window.location.reload(), 1500)
  }

  const importNotes = async (incoming: ImportData['notes']) => {
    const res = await fetch('/api/notes')
    const current = res.ok ? await res.json() : []

    const noteMap = new Map<string, Note>()
    for (const n of current) noteMap.set(n.id, n)
    for (const n of incoming || []) if (!noteMap.has(n.id)) noteMap.set(n.id, n)

    await fetch('/api/notes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Array.from(noteMap.values()))
    })
    setImportResult('success')
    setTimeout(() => window.location.reload(), 1500)
  }

  const importDecks = async (data: ImportData) => {

    const [cardsRes, decksRes] = await Promise.all([
      fetch('/api/flashcards'),
      fetch('/api/decks')
    ])
    const currentCards = cardsRes.ok ? await cardsRes.json() : []
    const currentDecks = decksRes.ok ? await decksRes.json() : []

    const cardMap = new Map<string, Flashcard>()
    for (const c of currentCards) cardMap.set(c.id, c)
    for (const c of data.flashcards || []) if (!cardMap.has(c.id)) cardMap.set(c.id, c)

    const deckMap = new Map<string, Deck>()
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
    setImportResult('success')
    setTimeout(() => window.location.reload(), 1500)
  }

  const importAll = async (incoming: ImportData) => {

    const res = await fetch('/api/all')
    const current = res.ok
      ? await res.json()
      : { tasks: [], categories: [], notes: [], flashcards: [], decks: [] };

    const merge = <T extends { id: string }>(curr: T[], inc: T[]) => {
      const map = new Map<string, T>()
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
    setImportResult('success')
    setTimeout(() => window.location.reload(), 1500)
  }

  const confirmImport = async () => {
    if (!importInfo) return
    try {
      if (importInfo.type === 'tasks') await importTasks(importInfo.data)
      if (importInfo.type === 'notes') await importNotes(importInfo.data.notes)
      if (importInfo.type === 'decks') await importDecks(importInfo.data)
      if (importInfo.type === 'all') await importAll(importInfo.data)
    } catch {
      setImportResult('error')
    } finally {
      setImportInfo(null)
    }
  }

  useEffect(() => {
    if (importResult) {
      const id = setTimeout(() => setImportResult(null), 1500)
      return () => clearTimeout(id)
    }
  }, [importResult])


  return (
    <>
      <AlertDialog open={!!importInfo} onOpenChange={o => !o && setImportInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settingsPage.importPreview')}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-1 text-sm">
            {importInfo?.data.tasks && (
              <p>
                {t('navbar.tasks')}: {importInfo.data.tasks.length}
              </p>
            )}
            {importInfo?.data.categories && (
              <p>
                {t('settingsPage.categories', { count: importInfo.data.categories.length })}
              </p>
            )}
            {importInfo?.data.notes && (
              <p>
                {t('navbar.notes')}: {importInfo.data.notes.length}
              </p>
            )}
            {importInfo?.data.flashcards && (
              <p>
                {t('navbar.cards')}: {importInfo.data.flashcards.length}
              </p>
            )}
            {importInfo?.data.decks && (
              <p>
                {t('navbar.decks')}: {importInfo.data.decks.length}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>{t('common.continue')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={importResult !== null} onOpenChange={o => !o && setImportResult(null)}>
        <DialogContent className="w-40 flex flex-col items-center">
          {importResult === 'success' ? (
            <CheckCircle className="w-10 h-10 text-green-500" />
          ) : (
            <XCircle className="w-10 h-10 text-red-500" />
          )}
        </DialogContent>
      </Dialog>
      <div className="min-h-screen bg-background">
        <Navbar title={t('navbar.settings')} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs value={currentTab} onValueChange={handleTabChange} className="flex gap-6">
          <div className="w-48 overflow-y-auto max-h-[calc(100vh-8rem)]">
            <TabsList className="flex flex-col gap-1 mb-2 bg-transparent p-0 h-auto">
              <TabsTrigger className="justify-start" value="overview">
                {t('settings.tabs.overview')}
              </TabsTrigger>
            </TabsList>
            <Accordion type="multiple" className="space-y-2">
              <AccordionItem value="general">
                <AccordionTrigger className="text-sm">
                  {t('settings.groups.general')}
                </AccordionTrigger>
                <AccordionContent className="pl-2">
                  <TabsList className="flex flex-col gap-1 bg-transparent p-0 h-auto">
                    <TabsTrigger className="justify-start" value="shortcuts">
                      {t('settings.tabs.shortcuts')}
                    </TabsTrigger>
                    <TabsTrigger className="justify-start" value="language">
                      {t('settings.tabs.language')}
                    </TabsTrigger>
                  </TabsList>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="customization">
                <AccordionTrigger className="text-sm">
                  {t('settings.groups.customization')}
                </AccordionTrigger>
                <AccordionContent className="pl-2">
                  <TabsList className="flex flex-col gap-1 bg-transparent p-0 h-auto">
                    <TabsTrigger className="justify-start" value="home">
                      {t('settings.tabs.home')}
                    </TabsTrigger>
                    <TabsTrigger className="justify-start" value="theme">
                      {t('settings.tabs.theme')}
                    </TabsTrigger>
                  </TabsList>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="productivity">
                <AccordionTrigger className="text-sm">
                  {t('settings.groups.productivity')}
                </AccordionTrigger>
                <AccordionContent className="pl-2">
                  <TabsList className="flex flex-col gap-1 bg-transparent p-0 h-auto">
                    <TabsTrigger className="justify-start" value="pomodoro">
                      {t('settings.tabs.pomodoro')}
                    </TabsTrigger>
                    <TabsTrigger className="justify-start" value="tasks">
                      {t('settings.tabs.tasks')}
                    </TabsTrigger>
                    <TabsTrigger className="justify-start" value="flashcards">
                      {t('settings.tabs.flashcards')}
                    </TabsTrigger>
                  </TabsList>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="data">
                <AccordionTrigger className="text-sm">
                  {t('settings.groups.data')}
                </AccordionTrigger>
                <AccordionContent className="pl-2">
                  <TabsList className="flex flex-col gap-1 bg-transparent p-0 h-auto">
                  <TabsTrigger className="justify-start" value="data">
                    {t('settings.tabs.data')}
                  </TabsTrigger>
                  <TabsTrigger className="justify-start" value="ai">
                    {t('settings.tabs.ai')}
                  </TabsTrigger>
                </TabsList>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="info">
                <AccordionTrigger className="text-sm">
                  {t('settings.groups.info')}
                </AccordionTrigger>
                <AccordionContent className="pl-2">
                  <TabsList className="flex flex-col gap-1 bg-transparent p-0 h-auto">
                    <TabsTrigger className="justify-start" value="info">
                      {t('settings.tabs.info')}
                    </TabsTrigger>
                  </TabsList>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <div className="flex-1 space-y-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  'shortcuts',
                  'language',
                  'home',
                  'theme',
                  'pomodoro',
                  'tasks',
                  'flashcards',
                  'data',
                  'ai',
                  'info'
                ].map(key => (
                  <Button
                    key={key}
                    variant="outline"
                    onClick={() => handleTabChange(key)}
                  >
                    {t(`settings.tabs.${key}`)}
                  </Button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="shortcuts" className="space-y-4">
              <div>
                <Label htmlFor="open">{t('settingsPage.commandPalette')}</Label>
                <KeyInput
                  value={shortcuts.openCommand}
                  onChange={v => updateShortcut('openCommand', v)}
                  placeholder="ctrl+k"
                />
              </div>
              <div>
                <Label htmlFor="task">{t('settingsPage.newTask')}</Label>
                <KeyInput
                  value={shortcuts.newTask}
                  onChange={v => updateShortcut('newTask', v)}
                  placeholder="ctrl+alt+t"
                />
              </div>
              <div>
                <Label htmlFor="note">{t('settingsPage.newNote')}</Label>
                <KeyInput
                  value={shortcuts.newNote}
                  onChange={v => updateShortcut('newNote', v)}
                  placeholder="ctrl+alt+n"
                />
              </div>
              <div>
                <Label htmlFor="flashcard">{t('settingsPage.newFlashcard')}</Label>
                <KeyInput
                  value={shortcuts.newFlashcard}
                  onChange={v => updateShortcut('newFlashcard', v)}
                  placeholder="ctrl+alt+f"
                />
              </div>
            </TabsContent>
            <TabsContent value="pomodoro" className="space-y-4">
              <div>
                <Label htmlFor="work">{t('settingsPage.workMinutes')}</Label>
                <Input
                  id="work"
                  type="number"
                  value={pomodoro.workMinutes}
                  onChange={e => updatePomodoro('workMinutes', Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="break">{t('settingsPage.breakMinutes')}</Label>
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
                <Label htmlFor="timer">{t('settingsPage.flashcardTimer')}</Label>
                <Input
                  id="timer"
                  type="number"
                  value={flashcardTimer}
                  onChange={e => updateFlashcardTimer(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="sessionSize">{t('settingsPage.flashcardSessionSize')}</Label>
                <Input
                  id="sessionSize"
                  type="number"
                  value={flashcardSessionSize}
                  onChange={e => updateFlashcardSessionSize(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="startMode">{t('settingsPage.startMode')}</Label>
                <Select
                  value={flashcardDefaultMode}
                  onValueChange={updateFlashcardDefaultMode}
                >
                  <SelectTrigger id="startMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spaced">{t('settingsPage.spaced')}</SelectItem>
                    <SelectItem value="training">{t('settingsPage.training')}</SelectItem>
                    <SelectItem value="random">{t('settingsPage.random')}</SelectItem>
                    <SelectItem value="typing">{t('settingsPage.typing')}</SelectItem>
                    <SelectItem value="timed">{t('settingsPage.timed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="tasks" className="space-y-4">
              <div>
                <Label htmlFor="priority">{t('settingsPage.defaultTaskPriority')}</Label>
                <Select value={defaultTaskPriority} onValueChange={updateDefaultTaskPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('settingsPage.low')}</SelectItem>
                    <SelectItem value="medium">{t('settingsPage.medium')}</SelectItem>
                    <SelectItem value="high">{t('settingsPage.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="taskView">{t('settingsPage.defaultTaskView')}</Label>
                <Select value={defaultTaskLayout} onValueChange={updateDefaultTaskLayout}>
                  <SelectTrigger id="taskView">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">{t('dashboard.listView')}</SelectItem>
                    <SelectItem value="grid">{t('dashboard.gridView')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showCompletedDefault"
                  checked={showCompletedByDefault}
                  onCheckedChange={toggleShowCompletedByDefault}
                />
                <Label htmlFor="showCompletedDefault">{t('settingsPage.showCompletedTasks')}</Label>
              </div>
              <div>
                <Label>{t('settingsPage.defaultTaskColor')}</Label>
                <div className="flex space-x-1 mt-1">
                  {colorPalette.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        defaultTaskColor === idx ? 'border-foreground scale-110' : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => updateDefaultTaskColor(idx)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="collapseSubtasks"
                  checked={collapseSubtasksByDefault}
                  onCheckedChange={toggleCollapseSubtasksByDefault}
                />
                <Label htmlFor="collapseSubtasks">{t('settingsPage.collapseSubtasks')}</Label>
              </div>
            </TabsContent>
            <TabsContent value="home" className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showPinnedTasks"
                  checked={showPinnedTasks}
                  onCheckedChange={toggleShowPinnedTasks}
                />
                <Label htmlFor="showPinnedTasks">{t('settingsPage.showPinnedTasks')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showPinnedNotes"
                  checked={showPinnedNotes}
                  onCheckedChange={toggleShowPinnedNotes}
                />
                <Label htmlFor="showPinnedNotes">{t('settingsPage.showPinnedNotes')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showPinnedCategories"
                  checked={showPinnedCategories}
                  onCheckedChange={toggleShowPinnedCategories}
                />
                <Label htmlFor="showPinnedCategories">{t('settingsPage.showPinnedCategories')}</Label>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleHomeDrag}>
                <SortableContext items={homeSectionOrder} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {homeSectionOrder.map(key => {
                      const sec = allHomeSections.find(s => s.key === key)
                      if (!sec) return null
                      return (
                        <SortableHomeSection key={sec.key} id={sec.key}>
                          <div className="flex items-center justify-between border rounded p-2 bg-card">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={sec.key}
                                checked={homeSections.includes(sec.key)}
                                onCheckedChange={() => toggleHomeSection(sec.key)}
                              />
                              <Label htmlFor={sec.key}>{t(sec.labelKey)}</Label>
                                  <div className="flex ml-2 space-x-1">
                                    {colorPalette.map((c, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                                          homeSectionColors[sec.key] === idx
                                            ? 'border-foreground scale-110'
                                            : 'border-gray-300 hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => updateHomeSectionColor(sec.key, idx)}
                                      />
                                    ))}
                                  </div>
                                </div>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </SortableHomeSection>
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </TabsContent>
            <TabsContent value="theme" className="space-y-4">
              <div>
                <Label htmlFor="themePreset">{t('settingsPage.themePreset')}</Label>
                <Select value={themeName} onValueChange={updateThemeName}>
                  <SelectTrigger id="themePreset">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {customThemes.map(ct => (
                      <SelectItem key={ct.name} value={ct.name} className="flex items-center">
                        <span className="flex items-center gap-2 w-full">
                          <span>{ct.name}</span>
                          <span
                            className="flex-1 h-3 rounded w-full"
                            style={{ background: themeToGradient(ct.theme, ct.colorPalette) }}
                          />
                        </span>
                      </SelectItem>
                    ))}
                    {Object.keys(themePresets).map(name => (
                      <SelectItem key={name} value={name} className="flex items-center">
                        <span className="flex items-center gap-2 w-full">
                          <span>{name}</span>
                          <span
                            className="flex-1 h-3 rounded w-full"
                            style={{ background: themeToGradient(themePresets[name].theme, themePresets[name].colorPalette) }}
                          />
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">{t('settingsPage.custom')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={newThemeName}
                    onChange={e => setNewThemeName(e.target.value)}
                    placeholder={t('settingsPage.customThemeName') || ''}
                  />
                  <Button
                    onClick={() => {
                      if (newThemeName.trim()) {
                        addCustomTheme(newThemeName.trim())
                        setNewThemeName('')
                      }
                    }}
                  >
                    {t('settingsPage.addTheme')}
                  </Button>
                </div>
                {customThemes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mt-2">
                      {t('settingsPage.yourThemes')}
                    </p>
                    <ul className="space-y-1 mt-1">
                      {customThemes.map(ct => (
                        <li key={ct.name} className="flex items-center gap-2">
                          <span className="flex-1">{ct.name}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCustomTheme(ct.name)}
                          >
                            {t('common.delete')}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Accordion type="multiple" className="space-y-2">
                <AccordionItem value="base">
                  <AccordionTrigger>{t('settingsPage.themeGroups.base')}</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {baseColors.map(c => (
                      <div key={c.key} className="space-y-1">
                        <Label htmlFor={c.key}>{t(`settingsPage.${c.label}`)}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t(`settingsPage.${c.desc}`)}
                        </p>
                        <Input
                          id={c.key}
                          type="color"
                          value={hslToHex(theme[c.key as keyof typeof theme])}
                          onChange={e =>
                            updateTheme(c.key as keyof typeof theme, hexToHsl(e.target.value))
                          }
                        />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="interactive">
                  <AccordionTrigger>{t('settingsPage.themeGroups.interactive')}</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {interactiveColors.map(c => (
                      <div key={c.key} className="space-y-1">
                        <Label htmlFor={c.key}>{t(`settingsPage.${c.label}`)}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t(`settingsPage.${c.desc}`)}
                        </p>
                        <Input
                          id={c.key}
                          type="color"
                          value={hslToHex(theme[c.key as keyof typeof theme])}
                          onChange={e =>
                            updateTheme(c.key as keyof typeof theme, hexToHsl(e.target.value))
                          }
                        />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="surface">
                  <AccordionTrigger>{t('settingsPage.themeGroups.surface')}</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {surfaceColors.map(c => (
                      <div key={c.key} className="space-y-1">
                        <Label htmlFor={c.key}>{t(`settingsPage.${c.label}`)}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t(`settingsPage.${c.desc}`)}
                        </p>
                        <Input
                          id={c.key}
                          type="color"
                          value={hslToHex(theme[c.key as keyof typeof theme])}
                          onChange={e =>
                            updateTheme(c.key as keyof typeof theme, hexToHsl(e.target.value))
                          }
                        />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="status">
                  <AccordionTrigger>{t('settingsPage.themeGroups.status')}</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {statusColors.map(c => (
                      <div key={c.key} className="space-y-1">
                        <Label htmlFor={c.key}>{t(`settingsPage.${c.label}`)}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t(`settingsPage.${c.desc}`)}
                        </p>
                        <Input
                          id={c.key}
                          type="color"
                          value={hslToHex(theme[c.key as keyof typeof theme])}
                          onChange={e =>
                            updateTheme(c.key as keyof typeof theme, hexToHsl(e.target.value))
                          }
                        />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="stats">
                  <AccordionTrigger>{t('settingsPage.themeGroups.statsKanban')}</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {statsKanbanColors.map(c => (
                      <div key={c.key} className="space-y-1">
                        <Label htmlFor={c.key}>{t(`settingsPage.${c.label}`)}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t(`settingsPage.${c.desc}`)}
                        </p>
                        <Input
                          id={c.key}
                          type="color"
                          value={hslToHex(theme[c.key as keyof typeof theme])}
                          onChange={e =>
                            updateTheme(c.key as keyof typeof theme, hexToHsl(e.target.value))
                          }
                        />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="pomodoro">
                  <AccordionTrigger>{t('settingsPage.themeGroups.pomodoro')}</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {pomodoroColors.map(c => (
                      <div key={c.key} className="space-y-1">
                        <Label htmlFor={c.key}>{t(`settingsPage.${c.label}`)}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t(`settingsPage.${c.desc}`)}
                        </p>
                        <Input
                          id={c.key}
                          type="color"
                          value={hslToHex(theme[c.key as keyof typeof theme])}
                          onChange={e =>
                            updateTheme(c.key as keyof typeof theme, hexToHsl(e.target.value))
                          }
                        />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="palette">
                  <AccordionTrigger>{t('settingsPage.themeGroups.palette')}</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <Label>{t('settingsPage.taskColors')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settingsPage.taskColorsDesc')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {colorPalette.map((c, idx) => (
                        <Input
                          key={idx}
                          type="color"
                          value={c}
                          onChange={e => updatePaletteColor(idx, e.target.value)}
                          className="w-10 h-10 p-0 border-none"
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            <TabsContent value="language" className="space-y-4">
              <div>
                <Label htmlFor="languageSelect">{t('settings.languageLabel')}</Label>
                <Select
                  value={language}
                  onValueChange={updateLanguage}
                >
                  <SelectTrigger id="languageSelect">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">{t('settings.german')}</SelectItem>
                    <SelectItem value="en">{t('settings.english')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="data" className="space-y-4">
              <h2 className="font-semibold">{t('settingsPage.dataTitle')}</h2>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="syncEnabled"
                  checked={syncEnabled}
                  onCheckedChange={v => updateSyncEnabled(Boolean(v))}
                />
                <Label htmlFor="syncEnabled">{t('settingsPage.enableSync')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="offlineCache"
                  checked={offlineCache}
                  onCheckedChange={toggleOfflineCache}
                />
                <Label htmlFor="offlineCache">{t('settingsPage.offlineCache')}</Label>
              </div>
              <div className="space-y-2">
                <p className="font-medium">{t('settingsPage.syncRole')}</p>
                <Select value={syncRole} onValueChange={updateSyncRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="server">{t('settingsPage.roleServer')}</SelectItem>
                    <SelectItem value="client">{t('settingsPage.roleClient')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {syncRole === 'server' && serverInfo?.wifiUrl && (
                <div className="space-y-2">
                  <p className="font-medium">{t('settings.serverInfo.wifiIp')}</p>
                  <p className="text-sm break-all">{serverInfo.wifiUrl}</p>
                </div>
              )}
              {syncRole === 'client' && syncEnabled && (
                <div className="space-y-2">
                  <p className="font-medium">{t('settingsPage.serverUrl')}</p>
                  <Input
                    value={syncServerUrl}
                    onChange={e => updateSyncServerUrl(e.target.value)}
                    placeholder="http://server:3002"
                  />
                </div>
              )}
              {syncRole === 'client' && syncEnabled && (
                <div className="space-y-2">
                  <p className="font-medium">{t('settingsPage.syncInterval')}</p>
                  <Input
                    type="number"
                    min={1}
                    value={syncInterval}
                    onChange={e => updateSyncInterval(Number(e.target.value))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <p className="font-medium">{t('settingsPage.syncStatus')}</p>
                {syncStatus ? (
                  syncStatus.last ? (
                    syncStatus.error ? (
                      <p className="text-red-500 text-sm">
                        {t('settingsPage.syncError', {
                          time: new Date(syncStatus.last).toLocaleString(),
                          error: syncStatus.error
                        })}
                      </p>
                    ) : (
                      <p className="text-sm">
                        {t('settingsPage.syncSuccess', {
                          time: new Date(syncStatus.last).toLocaleString()
                        })}
                      </p>
                    )
                  ) : (
                    <p className="text-sm">{t('settingsPage.syncNever')}</p>
                  )
                ) : (
                  <p className="text-sm">{t('settingsPage.syncLoading')}</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="font-medium">{t('settingsPage.tasksAndCategories')}</p>
                <div className="flex items-center gap-2">
                  <Button onClick={exportTasks}>{t('settingsPage.export')}</Button>
                  <Button onClick={() => tasksInputRef.current?.click()}>{t('settingsPage.import')}</Button>
                  <Button onClick={exportTaskStructure}>{t('settingsPage.exportStructure')}</Button>
                  <Input
                    ref={tasksInputRef}
                    type="file"
                    accept="application/json"
                    onChange={e => handleFile('tasks', e)}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium">{t('settingsPage.notes')}</p>
                <div className="flex items-center gap-2">
                  <Button onClick={exportNotes}>{t('settingsPage.export')}</Button>
                  <Button onClick={() => notesInputRef.current?.click()}>{t('settingsPage.import')}</Button>
                  <Button onClick={exportNoteStructure}>{t('settingsPage.exportStructure')}</Button>
                  <Input
                    ref={notesInputRef}
                    type="file"
                    accept="application/json"
                    onChange={e => handleFile('notes', e)}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium">{t('settingsPage.decksAndCards')}</p>
                <div className="flex items-center gap-2">
                  <Button onClick={exportDecks}>{t('settingsPage.export')}</Button>
                  <Button onClick={() => decksInputRef.current?.click()}>{t('settingsPage.import')}</Button>
                  <Button onClick={exportDeckStructure}>{t('settingsPage.exportStructure')}</Button>
                  <Input
                    ref={decksInputRef}
                    type="file"
                    accept="application/json"
                    onChange={e => handleFile('decks', e)}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium">{t('settingsPage.all')}</p>
                <div className="flex items-center gap-2">
                  <Button onClick={exportAll}>{t('settingsPage.export')}</Button>
                  <Button onClick={() => allInputRef.current?.click()}>{t('settingsPage.import')}</Button>
                  <Button onClick={exportAllStructure}>{t('settingsPage.exportStructure')}</Button>
                  <Input
                    ref={allInputRef}
                    type="file"
                    accept="application/json"
                    onChange={e => handleFile('all', e)}
                    className="hidden"
                  />
                </div>
              </div>
              {serverInfo && (
                <div className="space-y-2">
                  <h3 className="font-medium">{t('settings.serverInfo.title')}</h3>
                  <p>{t('settings.serverInfo.port')}: {serverInfo.port}</p>
                  <div>
                    <p className="font-medium">{t('settings.serverInfo.ips')}</p>
                    <ul className="list-disc list-inside space-y-1">
                      {serverInfo.ips.map(ip => (
                        <li key={ip}>{ip}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">{t('settings.serverInfo.urls')}</p>
                    <ul className="list-disc list-inside space-y-1">
                      {serverInfo.urls.map(url => (
                        <li key={url}>{url}</li>
                      ))}
                    </ul>
                  </div>
                  {serverInfo.wifiUrl && (
                    <div>
                      <p className="font-medium">{t('settings.serverInfo.wifiIp')}</p>
                      <p className="text-sm break-all">{serverInfo.wifiUrl}</p>
                    </div>
                  )}
                  {syncRole === 'server' && syncLog && (
                    <div>
                      <p className="font-medium">{t('settingsPage.syncLog')}</p>
                      <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                        {syncLog.map((entry, idx) => (
                          <li key={idx}>{new Date(entry.time).toLocaleString()} - {entry.ip} - {entry.method}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="ai" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="llmUrl">{t('settingsPage.aiUrl')}</Label>
                <Input
                  id="llmUrl"
                  value={llmUrl}
                  onChange={e => updateLlmUrl(e.target.value)}
                  placeholder="http://localhost:8000/v1/chat/completions"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="llmToken">{t('settingsPage.aiToken')}</Label>
                <Input
                  id="llmToken"
                  type="password"
                  value={llmToken}
                  onChange={e => updateLlmToken(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="llmModel">{t('settingsPage.aiModel')}</Label>
                <Input
                  id="llmModel"
                  value={llmModel}
                  onChange={e => updateLlmModel(e.target.value)}
                  placeholder="gpt-3.5-turbo"
                />
              </div>
            </TabsContent>
            <TabsContent value="info" className="space-y-4">
              <div className="prose dark:prose-invert">
                <ReactMarkdown>{readme}</ReactMarkdown>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('settings.version')} {__APP_VERSION__}{' '}
                <Link to="/release-notes" className="underline">
                  {t('releaseNotes.title')}
                </Link>
              </p>
            </TabsContent>
          </div>
        </Tabs>
        <p className="text-xs text-muted-foreground mt-4">
          {t('settings.version')} {__APP_VERSION__}{' '}
          <Link to="/release-notes" className="underline">
            {t('releaseNotes.title')}
          </Link>
        </p>
      </div>
    </div>
  </>
  )
}

export default SettingsPage
