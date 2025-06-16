import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useTaskStore } from '@/hooks/useTaskStore';
import NoteModal from '@/components/NoteModal';
import NoteCard from '@/components/NoteCard';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Navbar from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';

const NotesPage = () => {
  const { notes, addNote, reorderNotes } = useTaskStore();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();

  const handleSave = (data: { title: string; text: string; color: string }) => {
    addNote(data);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderNotes(result.source.index, result.destination.index);
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
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="notes" direction="horizontal">
              {provided => (
                <div
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr"
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
                          className="h-full"
                        >
                          <NoteCard
                            note={note}
                            onClick={() => navigate(`/notes/${note.id}`)}
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
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default NotesPage;
