import React, { useEffect, useState } from 'react'
import { CommandDialog, CommandInput, CommandList, CommandEmpty } from '@/components/ui/command'
import { useTaskStore } from '@/hooks/useTaskStore'
import { useSettings } from '@/hooks/useSettings'
import { useToast } from '@/hooks/use-toast'

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
  const { addTask, addNote } = useTaskStore()
  const { shortcuts } = useSettings()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'task' | 'note'>('task')
  const [value, setValue] = useState('')

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
        categoryId: 'default',
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
        <CommandEmpty>Keine Ergebnisse</CommandEmpty>
      </CommandList>
    </CommandDialog>
  )
}

export default CommandPalette
