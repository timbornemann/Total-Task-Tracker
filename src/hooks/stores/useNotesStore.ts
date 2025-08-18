/**
 * Notes Store - Handles note management
 * Extracted from useTaskStore to reduce complexity and improve maintainability
 */

import { useState, useCallback, useMemo } from 'react';
import { Note } from '@/types';

export interface NotesFilters {
  search?: string;
  categoryId?: string;
  pinned?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface NotesSort {
  field: 'title' | 'createdAt' | 'updatedAt' | 'order';
  direction: 'asc' | 'desc';
}

export interface UseNotesStoreOptions {
  initialNotes?: Note[];
  defaultSort?: NotesSort;
  defaultFilters?: NotesFilters;
}

export function useNotesStore(options: UseNotesStoreOptions = {}) {
  const {
    initialNotes = [],
    defaultSort = { field: 'updatedAt', direction: 'desc' },
    defaultFilters = {},
  } = options;

  // State
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [filters, setFilters] = useState<NotesFilters>(defaultFilters);
  const [sort, setSort] = useState<NotesSort>(defaultSort);

  // Utility functions
  const generateId = useCallback(() => {
    return (crypto as { randomUUID?: () => string }).randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, []);

  const sortNotes = useCallback((notesList: Note[]): Note[] => {
    // Separate pinned and unpinned notes
    const pinned = notesList
      .filter(note => note.pinned)
      .sort((a, b) => a.order - b.order)
      .map((note, idx) => ({ ...note, order: idx }));
    
    const unpinned = notesList
      .filter(note => !note.pinned)
      .sort((a, b) => a.order - b.order)
      .map((note, idx) => ({ ...note, order: idx }));
    
    return [...pinned, ...unpinned];
  }, []);

  // CRUD operations
  const addNote = useCallback((
    noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'order'>
  ) => {
    const newNote: Note = {
      ...noteData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 0,
      pinned: noteData.pinned ?? false,
    };

    setNotes(prev => sortNotes([...prev, newNote]));
    return newNote.id;
  }, [generateId, sortNotes]);

  const updateNote = useCallback((noteId: string, updates: Partial<Note>) => {
    setNotes(prev => 
      sortNotes(
        prev.map(note => 
          note.id === noteId 
            ? { ...note, ...updates, updatedAt: new Date() }
            : note
        )
      )
    );
  }, [sortNotes]);

  const deleteNote = useCallback((noteId: string) => {
    setNotes(prev => sortNotes(prev.filter(note => note.id !== noteId)));
  }, [sortNotes]);

  const togglePinNote = useCallback((noteId: string) => {
    updateNote(noteId, { pinned: !notes.find(n => n.id === noteId)?.pinned });
  }, [updateNote, notes]);

  const reorderNotes = useCallback((startIndex: number, endIndex: number) => {
    setNotes(prev => {
      const sorted = sortNotes(prev);
      const [movedNote] = sorted.splice(startIndex, 1);
      sorted.splice(endIndex, 0, movedNote);
      return sortNotes(sorted);
    });
  }, [sortNotes]);

  const duplicateNote = useCallback((noteId: string) => {
    const originalNote = notes.find(note => note.id === noteId);
    if (!originalNote) return null;

    const duplicatedNote = {
      ...originalNote,
      title: `${originalNote.title} (Copy)`,
      pinned: false,
    };

    return addNote(duplicatedNote);
  }, [notes, addNote]);

  // Query functions
  const getNoteById = useCallback((noteId: string): Note | undefined => {
    return notes.find(note => note.id === noteId);
  }, [notes]);

  const getNotesByCategory = useCallback((categoryId: string): Note[] => {
    return notes.filter(note => note.categoryId === categoryId);
  }, [notes]);

  const searchNotes = useCallback((query: string): Note[] => {
    if (!query.trim()) return notes;
    
    const searchLower = query.toLowerCase();
    return notes.filter(note => 
      note.title.toLowerCase().includes(searchLower) ||
      note.content.toLowerCase().includes(searchLower)
    );
  }, [notes]);

  const getFilteredNotes = useCallback((customFilters?: NotesFilters): Note[] => {
    const activeFilters = { ...filters, ...customFilters };
    
    return notes.filter(note => {
      // Search filter
      if (activeFilters.search) {
        const searchLower = activeFilters.search.toLowerCase();
        const matches = 
          note.title.toLowerCase().includes(searchLower) ||
          note.content.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      // Category filter
      if (activeFilters.categoryId && note.categoryId !== activeFilters.categoryId) {
        return false;
      }

      // Pinned filter
      if (activeFilters.pinned !== undefined && note.pinned !== activeFilters.pinned) {
        return false;
      }

      // Date range filter
      if (activeFilters.dateRange) {
        const noteDate = note.updatedAt;
        if (noteDate < activeFilters.dateRange.start || 
            noteDate > activeFilters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [notes, filters]);

  const getSortedNotes = useCallback((notesToSort: Note[] = notes): Note[] => {
    return [...notesToSort].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sort.field) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'order':
        default:
          // Handle pinned notes priority
          if (a.pinned !== b.pinned) {
            return a.pinned ? -1 : 1;
          }
          aValue = a.order;
          bValue = b.order;
          break;
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [notes, sort]);

  // Bulk operations
  const bulkUpdateNotes = useCallback((
    noteIds: string[], 
    updates: Partial<Note>
  ) => {
    setNotes(prev => 
      sortNotes(
        prev.map(note => 
          noteIds.includes(note.id)
            ? { ...note, ...updates, updatedAt: new Date() }
            : note
        )
      )
    );
  }, [sortNotes]);

  const bulkDeleteNotes = useCallback((noteIds: string[]) => {
    setNotes(prev => sortNotes(prev.filter(note => !noteIds.includes(note.id))));
  }, [sortNotes]);

  const bulkPinNotes = useCallback((noteIds: string[], pinned: boolean) => {
    bulkUpdateNotes(noteIds, { pinned });
  }, [bulkUpdateNotes]);

  // Archive/Restore functionality
  const archiveNote = useCallback((noteId: string) => {
    updateNote(noteId, { archived: true });
  }, [updateNote]);

  const restoreNote = useCallback((noteId: string) => {
    updateNote(noteId, { archived: false });
  }, [updateNote]);

  // Computed values
  const filteredNotes = useMemo(() => 
    getSortedNotes(getFilteredNotes()), 
    [getSortedNotes, getFilteredNotes]
  );

  const pinnedNotes = useMemo(() => 
    notes.filter(note => note.pinned && !note.archived),
    [notes]
  );

  const recentNotes = useMemo(() => 
    [...notes]
      .filter(note => !note.archived)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10),
    [notes]
  );

  const notesStats = useMemo(() => {
    const activeNotes = notes.filter(note => !note.archived);
    return {
      total: notes.length,
      active: activeNotes.length,
      pinned: notes.filter(note => note.pinned && !note.archived).length,
      archived: notes.filter(note => note.archived).length,
      withCategory: notes.filter(note => note.categoryId).length,
    };
  }, [notes]);

  // Template and favorites functionality
  const createTemplate = useCallback((noteId: string, templateName: string) => {
    const note = getNoteById(noteId);
    if (!note) return null;

    return addNote({
      ...note,
      title: templateName,
      isTemplate: true,
      pinned: false,
    });
  }, [getNoteById, addNote]);

  const applyTemplate = useCallback((templateId: string, title: string) => {
    const template = getNoteById(templateId);
    if (!template) return null;

    return addNote({
      ...template,
      title,
      isTemplate: false,
    });
  }, [getNoteById, addNote]);

  return {
    // State
    notes: filteredNotes,
    allNotes: notes,
    pinnedNotes,
    recentNotes,
    filters,
    sort,
    stats: notesStats,

    // Actions
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    reorderNotes,
    duplicateNote,
    archiveNote,
    restoreNote,

    // Queries
    getNoteById,
    getNotesByCategory,
    searchNotes,
    getFilteredNotes,
    getSortedNotes,

    // Filter & Sort
    setFilters,
    setSort,
    updateFilters: (updates: Partial<NotesFilters>) => 
      setFilters(prev => ({ ...prev, ...updates })),

    // Bulk operations
    bulkUpdateNotes,
    bulkDeleteNotes,
    bulkPinNotes,

    // Templates
    createTemplate,
    applyTemplate,
    getTemplates: () => notes.filter(note => note.isTemplate),

    // Raw setters for external sync
    setNotes,
  };
}
