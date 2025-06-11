import React, { useEffect, useState, useMemo } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup
} from '@/components/ui/command'
import { useTaskStore } from '@/hooks/useTaskStore'
import { useSettings } from '@/hooks/useSettings'
import { useToast } from '@/hooks/use-toast'
import { useCurrentCategory } from '@/hooks/useCurrentCategory'
import { flattenTasks, FlattenedTask } from '@/utils/taskUtils'
import { useNavigate } from 'react-router-dom'
import { useFlashcardStore } from '@/hooks/useFlashcardStore'

const isMatching = (e: KeyboardEvent, shortcut: string) => {
  const keys = shortcut.toLowerCase().split('+')
  const key = keys.pop()!
  const wanted = {
    ctrl: keys.includes('ctrl'),
    shift: keys.includes('shift'),
    alt: keys.includes('alt'),
    meta: keys.includes('meta')
  }
  if (wanted.ctrl !== e.ctrlKey) return false
  if (wanted.shift !== e.shiftKey) return false
  if (wanted.alt !== e.altKey) return false
  if (wanted.meta !== e.metaKey) return false
  return e.key.toLowerCase() === key
}

const CommandPalette: React.FC = () => {
  const { addTask, addNote, tasks, notes } = useTaskStore()
  const { flashcards, decks, addFlashcard } = useFlashcardStore()
  const { shortcuts, defaultTaskPriority } = useSettings()
  const { toast } = useToast()
  const { currentCategoryId, setCurrentCategoryId } = useCurrentCategory()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'task' | 'note' | 'flashcard'>('task')
  const [value, setValue] = useState('')

  const flattened = useMemo(() => flattenTasks(tasks), [tasks])

  const filteredTasks = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    return flattened.filter(
      t =>
        t.task.title.toLowerCase().includes(q) ||
        t.task.description.toLowerCase().includes(q)
    )
  }, [value, flattened])

  const filteredNotes = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    return notes.filter(
      n => n.title.toLowerCase().includes(q) || n.text.toLowerCase().includes(q)
    )
  }, [value, notes])

  const filteredCards = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    return flashcards.filter(
      c => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
    )
  }, [value, flashcards])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isMatching(e, shortcuts.openCommand)) {
        e.preventDefault()
        setMode('task')
        setOpen(o => !o)
      } else if (isMatching(e, shortcuts.newTask)) {
        e.preventDefault()
        setMode('task')
        setOpen(true)
      } else if (isMatching(e, shortcuts.newNote)) {
        e.preventDefault()
        setMode('note')
        setOpen(true)
      } else if (isMatching(e, shortcuts.newFlashcard)) {
        e.preventDefault()
        setMode('flashcard')
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    const openListener = () => setOpen(true)
    window.addEventListener('open-command-palette', openListener)
    return () => {
      document.removeEventListener('keydown', handler)
      window.removeEventListener('open-command-palette', openListener)
    }
  }, [shortcuts])

  const create = () => {
    const title = value.trim()
    if (!title) return
    if (mode === 'task') {
      addTask({
        title,
        description: '',
        priority: defaultTaskPriority,
        color: '#3B82F6',
        categoryId: currentCategoryId || 'default',
        isRecurring: false
      })
      toast({ description: 'Task erstellt' })
    } else if (mode === 'note') {
      addNote({ title, text: '', color: '#F59E0B' })
      toast({ description: 'Notiz erstellt' })
    } else if (mode === 'flashcard') {
      if (decks.length > 0) {
        addFlashcard({ front: title, back: '', deckId: decks[0].id })
        toast({ description: 'Karte erstellt' })
      }
    }
    setValue('')
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={
          mode === 'task'
            ? 'Task-Titel eingeben...'
            : mode === 'note'
              ? 'Notiz-Titel eingeben...'
              : 'Vorderseite eingeben...'
        }
        value={value}
        onValueChange={setValue}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            create()
          }
        }}
      />
      <CommandList>
        {filteredTasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {filteredTasks.map(item => (
              <CommandItem
                key={`task-${item.task.id}`}
                onSelect={() => {
                  setCurrentCategoryId(item.task.categoryId)
                  setOpen(false)
                  setValue('')
                  navigate(`/tasks?taskId=${item.task.id}`)
                }}
              >
                {item.path.length > 0
                  ? `${item.path.map(p => p.title).join(' › ')} › ${item.task.title}`
                  : item.task.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {filteredNotes.length > 0 && (
          <CommandGroup heading="Notizen">
            {filteredNotes.map(note => (
              <CommandItem
                key={`note-${note.id}`}
                onSelect={() => {
                  setOpen(false)
                  setValue('')
                  navigate(`/notes/${note.id}`)
                }}
              >
                {note.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {filteredCards.length > 0 && (
          <CommandGroup heading="Karten">
            {filteredCards.map(card => {
              const deck = decks.find(d => d.id === card.deckId)
              return (
                <CommandItem
                  key={`card-${card.id}`}
                  onSelect={() => {
                    setOpen(false)
                    setValue('')
                    navigate(`/flashcards/deck/${card.deckId}`)
                  }}
                >
                  {deck ? `${deck.name}: ${card.front}` : card.front}
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}
        {filteredTasks.length === 0 &&
          filteredNotes.length === 0 &&
          filteredCards.length === 0 && <CommandEmpty>Keine Ergebnisse</CommandEmpty>}
      </CommandList>
    </CommandDialog>
  )
}

export default CommandPalette
