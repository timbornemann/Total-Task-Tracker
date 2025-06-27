import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useTaskStore } from '@/hooks/useTaskStore';
import NoteModal from '@/components/NoteModal';
import NoteCard from '@/components/NoteCard';
import { Note } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Navbar from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';

interface SortableNoteProps {
  note: Note;
  onClick: () => void;
}

const SortableNote: React.FC<SortableNoteProps> = ({ note, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: note.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="h-full">
      <NoteCard note={note} onClick={onClick} />
    </div>
  );
};

const NotesPage = () => {
  const { notes, addNote, reorderNotes } = useTaskStore();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();

  const handleSave = (data: { title: string; text: string; color: string }) => {
    addNote(data);
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = notes.findIndex(n => n.id === active.id);
    const newIndex = notes.findIndex(n => n.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderNotes(oldIndex, newIndex);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t('navbar.notes')} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> {t('notes.newNote')}
          </Button>
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('notes.none')}</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={notes.map(n => n.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
                {notes.map(note => (
                  <SortableNote
                    key={note.id}
                    note={note}
                    onClick={() => navigate(`/notes/${note.id}`)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default NotesPage;
