import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { LayoutGrid, BookOpen, List } from 'lucide-react';
import { useTaskStore } from '@/hooks/useTaskStore';
import NoteCard from '@/components/NoteCard';

const Home: React.FC = () => {
  const { notes } = useTaskStore();

  const pinnedNotes = useMemo(
    () => notes.filter(n => n.pinned).sort((a, b) => a.order - b.order).slice(0, 3),
    [notes]
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Link to="/tasks">
            <Card className="hover:shadow-md transition-all text-center">
              <CardContent className="py-8">
                <LayoutGrid className="h-8 w-8 mx-auto mb-2" />
                <CardTitle>Tasks</CardTitle>
              </CardContent>
            </Card>
          </Link>
          <Link to="/flashcards">
            <Card className="hover:shadow-md transition-all text-center">
              <CardContent className="py-8">
                <BookOpen className="h-8 w-8 mx-auto mb-2" />
                <CardTitle>Flashcards</CardTitle>
              </CardContent>
            </Card>
          </Link>
          <Link to="/notes">
            <Card className="hover:shadow-md transition-all text-center">
              <CardContent className="py-8">
                <List className="h-8 w-8 mx-auto mb-2" />
                <CardTitle>Notizen</CardTitle>
              </CardContent>
            </Card>
          </Link>
        </div>
        {pinnedNotes.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
              Gepinnte Notizen
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {pinnedNotes.map(note => (
                <Link
                  key={note.id}
                  to={`/notes?noteId=${note.id}`}
                  className="block"
                >
                  <NoteCard note={note} onClick={() => {}} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
