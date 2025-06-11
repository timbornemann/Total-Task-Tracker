import React from 'react';
import { Note } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, StarOff } from 'lucide-react';
import { useTaskStore } from '@/hooks/useTaskStore';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
  const { updateNote } = useTaskStore();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNote(note.id, { pinned: !note.pinned });
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <CardHeader className="pb-2 flex items-center space-x-2">
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: note.color }}
        />
        <CardTitle className="text-base font-medium truncate flex-1">
          {note.title}
        </CardTitle>
        <button
          type="button"
          onClick={handleToggle}
          className="text-yellow-500 hover:text-yellow-600"
        >
          {note.pinned ? (
            <Star className="w-4 h-4 fill-current" />
          ) : (
            <StarOff className="w-4 h-4" />
          )}
        </button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-3">{note.text}</p>
      </CardContent>
    </Card>
  );
};

export default NoteCard;
