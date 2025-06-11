import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useTaskStore } from '@/hooks/useTaskStore';
import NoteModal from '@/components/NoteModal';
import NoteCard from '@/components/NoteCard';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Navbar from '@/components/Navbar';
import { useSearchParams } from 'react-router-dom';

const NotesPage = () => {
  const { notes, addNote, updateNote, reorderNotes } = useTaskStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<null | number>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSave = (data: { title: string; text: string; color: string }) => {
    if (editingNote !== null) {
      const note = notes[editingNote];
      updateNote(note.id, data);
      setEditingNote(null);
    } else {
      addNote(data);
    }
  };

  useEffect(() => {
    const id = searchParams.get('noteId');
    if (id) {
      const idx = notes.findIndex(n => n.id === id);
      if (idx !== -1) {
        setEditingNote(idx);
        setIsModalOpen(true);
      }
    }
  }, [searchParams, notes]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderNotes(result.source.index, result.destination.index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Notizen" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Neue Notiz
          </Button>
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Notizen vorhanden.</p>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="notes" direction="horizontal">
              {provided => (
                <div
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {notes.map((note, index) => (
                    <Draggable key={note.id} draggableId={note.id} index={index}>
                      {prov => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                        >
                          <NoteCard
                            note={note}
                            onClick={() => {
                              setEditingNote(index);
                              setIsModalOpen(true);
                            }}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
          const params = new URLSearchParams(searchParams);
          if (params.has('noteId')) {
            params.delete('noteId');
            setSearchParams(params, { replace: true });
          }
        }}
        onSave={handleSave}
        note={editingNote !== null ? notes[editingNote] : undefined}
      />
    </div>
  );
};

export default NotesPage;
