import React from 'react';
import { Note } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
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
        <CardTitle className="text-base font-medium truncate">
          {note.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-3">
          {note.text}
        </p>
      </CardContent>
    </Card>
  );
};

export default NoteCard;
