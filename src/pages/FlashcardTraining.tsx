import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useFlashcardStore } from '@/hooks/useFlashcardStore';
import { shuffleArray } from '@/utils/shuffle';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction
} from '@/components/ui/alert-dialog';

interface SummaryCounts {
  easy: number;
  medium: number;
  hard: number;
}

const FlashcardTrainingPage: React.FC = () => {
  const { flashcards, decks, rateFlashcard } = useFlashcardStore();
  const [selectedDecks, setSelectedDecks] = useState<string[]>([]);
  const [sessionCards, setSessionCards] = useState<typeof flashcards>([]);
  const [remainingCards, setRemainingCards] = useState<typeof flashcards>([]);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [summary, setSummary] = useState<Record<string, SummaryCounts>>({});
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (decks.length > 0 && selectedDecks.length === 0) {
      setSelectedDecks(decks.map(d => d.id));
    }
  }, [decks, selectedDecks.length]);

  const filtered = useMemo(
    () => flashcards.filter(c => selectedDecks.includes(c.deckId)),
    [flashcards, selectedDecks]
  );

  useEffect(() => {
    const all = shuffleArray(filtered);
    setSessionCards(all.slice(0, 5));
    setRemainingCards(all.slice(5));
    setIndex(0);
    setSummary({});
    setShowSummary(false);
  }, [filtered]);

  const current = sessionCards[index];

  const handleRate = (d: 'easy' | 'medium' | 'hard') => {
    if (!current) return;
    setSummary(prev => {
      const entry = prev[current.id] || { easy: 0, medium: 0, hard: 0 };
      return { ...prev, [current.id]: { ...entry, [d]: entry[d] + 1 } };
    });
    rateFlashcard(current.id, d);

    const cards = [...sessionCards];
    cards.splice(index, 1);
    if (d !== 'easy') cards.push(current);

    if (cards.length === 0) {
      if (remainingCards.length === 0) {
        setShowSummary(true);
        return;
      }
      const next = remainingCards.slice(0, 5);
      setSessionCards(next);
      setRemainingCards(remainingCards.slice(5));
      setIndex(0);
    } else {
      setSessionCards(cards);
      setIndex(i => (i >= cards.length ? 0 : i));
    }
    setShowBack(false);
  };

  const handleRestart = () => {
    const all = shuffleArray(filtered);
    setSessionCards(all.slice(0, 5));
    setRemainingCards(all.slice(5));
    setIndex(0);
    setShowBack(false);
    setSummary({});
    setShowSummary(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Training" />
      <div className="max-w-md mx-auto py-8 px-4 space-y-4">
        {!current ? (
          <p className="text-sm text-muted-foreground">Keine Karten vorhanden.</p>
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
                {showBack ? (
                  <div className="space-y-2">
                    <div>{current.front}</div>
                    <div>{current.back}</div>
                  </div>
                ) : (
                  current.front
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <>
                <Button variant="outline" onClick={() => handleRate('hard')}>
                  Schwer
                </Button>
                <Button variant="outline" onClick={() => handleRate('medium')}>
                  Mittel
                </Button>
                <Button variant="outline" onClick={() => handleRate('easy')}>
                  Leicht
                </Button>
              </>
            </CardFooter>
          </Card>
        )}
      </div>
      <AlertDialog
        open={showSummary}
        onOpenChange={open => {
          if (!open) handleRestart();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Training beendet</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2 my-2 text-sm">
            {Object.entries(summary).map(([id, counts]) => {
              const card = flashcards.find(c => c.id === id);
              return (
                <div key={id}>
                  <div className="font-medium">{card?.front}</div>
                  <div>Leicht: {counts.easy}, Mittel: {counts.medium}, Schwer: {counts.hard}</div>
                </div>
              );
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleRestart}>Fertig</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FlashcardTrainingPage;
