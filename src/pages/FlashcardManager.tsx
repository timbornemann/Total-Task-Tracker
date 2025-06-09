import React, { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import FlashcardModal from '@/components/FlashcardModal';
import { useFlashcardStore } from '@/hooks/useFlashcardStore';

const FlashcardManagerPage: React.FC = () => {
  const { flashcards, addFlashcard, updateFlashcard, deleteFlashcard } = useFlashcardStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleSave = (data: { front: string; back: string; deck: string }) => {
    if (editingIndex !== null) {
      const card = flashcards[editingIndex];
      updateFlashcard(card.id, data);
      setEditingIndex(null);
    } else {
      addFlashcard(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Karten verwalten" />
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Neue Karte
          </Button>
        </div>
        {flashcards.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Karten vorhanden.</p>
        ) : (
          <div className="space-y-4">
            {flashcards.map((card, index) => (
              <Card key={card.id}>
                <CardHeader>
                  <CardTitle>{card.deck || 'Allgemein'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="font-medium">{card.front}</div>
                  <div className="text-sm text-gray-600">{card.back}</div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingIndex(index); setIsModalOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteFlashcard(card.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      <FlashcardModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingIndex(null); }}
        onSave={handleSave}
        card={editingIndex !== null ? flashcards[editingIndex] : undefined}
      />
    </div>
  );
};

export default FlashcardManagerPage;
