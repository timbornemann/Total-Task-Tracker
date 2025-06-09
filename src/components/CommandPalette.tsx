import React, { useEffect, useState, useMemo } from 'react'
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command'
import { useTaskStore } from '@/hooks/useTaskStore'
import { useSettings } from '@/hooks/useSettings'
import { useToast } from '@/hooks/use-toast'
import { useCurrentCategory } from '@/hooks/useCurrentCategory'
import { flattenTasks, FlattenedTask } from '@/utils/taskUtils'
import { useNavigate } from 'react-router-dom'

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
  const { addTask, addNote, tasks } = useTaskStore()
  const { shortcuts } = useSettings()
  const { toast } = useToast()
  const { currentCategoryId, setCurrentCategoryId } = useCurrentCategory()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'task' | 'note'>('task')
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
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shortcuts])

  const create = () => {
    const title = value.trim()
    if (!title) return
    if (mode === 'task') {
      addTask({
        title,
        description: '',
        priority: 'medium',
        color: '#3B82F6',
        categoryId: currentCategoryId || 'default',
        isRecurring: false
      })
      toast({ description: 'Task erstellt' })
    } else {
      addNote({ title, text: '', color: '#F59E0B' })
      toast({ description: 'Notiz erstellt' })
    }
    setValue('')
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder={mode === 'task' ? 'Task-Titel eingeben...' : 'Notiz-Titel eingeben...'}
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
        {filteredTasks.map(item => (
          <CommandItem
            key={item.task.id}
            onSelect={() => {
              setCurrentCategoryId(item.task.categoryId)
              setOpen(false)
              setValue('')
              navigate(`/?taskId=${item.task.id}`)
            }}
          >
            {item.path.length > 0
              ? `${item.path.map(p => p.title).join(' › ')} › ${item.task.title}`
              : item.task.title}
          </CommandItem>
        ))}
        <CommandEmpty>Keine Ergebnisse</CommandEmpty>
      </CommandList>
    </CommandDialog>
  )
}

export default CommandPalette
