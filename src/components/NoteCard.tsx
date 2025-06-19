import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Note } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, StarOff } from 'lucide-react';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useSettings } from '@/hooks/useSettings';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
  const { updateNote } = useTaskStore();
  const { colorPalette } = useSettings();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNote(note.id, { pinned: !note.pinned });
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all h-full flex flex-col"
      onClick={onClick}
    >
      <CardHeader className="pb-2 flex items-center space-x-2">
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: colorPalette[note.color] }}
        />
        <CardTitle className="text-base font-medium truncate flex-1">
          {note.title}
        </CardTitle>
        <button
          type="button"
          onClick={handleToggle}
          className="text-accent-foreground hover:text-accent"
        >
          {note.pinned ? (
            <Star className="w-4 h-4 fill-current" />
          ) : (
            <StarOff className="w-4 h-4" />
          )}
        </button>
      </CardHeader>
      <CardContent className="flex-1">
        <ReactMarkdown className="prose prose-sm text-muted-foreground line-clamp-3">
          {note.text}
        </ReactMarkdown>
      </CardContent>
    </Card>
  );
};

export default NoteCard;
