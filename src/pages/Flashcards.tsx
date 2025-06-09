import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useFlashcardStore } from '@/hooks/useFlashcardStore';

const FlashcardsPage: React.FC = () => {
  const { flashcards, decks, rateFlashcard } = useFlashcardStore();
  const dueCards = flashcards.filter(c => new Date(c.dueDate) <= new Date());
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  const current = dueCards[index];

  const handleRate = (d: 'easy' | 'medium' | 'hard') => {
    if (!current) return;
    rateFlashcard(current.id, d);
    setShowBack(false);
    setIndex(i => i + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Karteikarten" />
      <div className="max-w-md mx-auto py-8 px-4">
        {dueCards.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine fälligen Karten.</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{decks.find(d => d.id === current.deckId)?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-center text-lg cursor-pointer py-12"
                onClick={() => setShowBack(b => !b)}
              >
                {showBack ? current.back : current.front}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => handleRate('hard')}>
                Schwer
              </Button>
              <Button variant="outline" onClick={() => handleRate('medium')}>
                Mittel
              </Button>
              <Button variant="outline" onClick={() => handleRate('easy')}>
                Leicht
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FlashcardsPage;
