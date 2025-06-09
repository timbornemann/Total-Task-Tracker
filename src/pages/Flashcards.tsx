import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

const FlashcardsPage: React.FC = () => {
  const { flashcards, decks, rateFlashcard } = useFlashcardStore();
  const [selectedDecks, setSelectedDecks] = useState<string[]>([]);
  const [randomMode, setRandomMode] = useState(false);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

  useEffect(() => {
    if (decks.length > 0 && selectedDecks.length === 0) {
      setSelectedDecks(decks.map(d => d.id));
    }
  }, [decks, selectedDecks.length]);

  const filtered = useMemo(
    () => flashcards.filter(c => selectedDecks.includes(c.deckId)),
    [flashcards, selectedDecks]
  );
  const dueCards = useMemo(
    () => filtered.filter(c => new Date(c.dueDate) <= new Date()),
    [filtered]
  );

  const cards = useMemo(() => {
    if (randomMode) {
      return shuffleArray(filtered);
    }
    return dueCards;
  }, [filtered, dueCards, randomMode, shuffleKey]);

  const current = cards[index];

  useEffect(() => {
    if (randomMode && index >= cards.length && cards.length > 0) {
      setShowDone(true);
    }
  }, [index, randomMode, cards.length]);

  const handleRate = (d: 'easy' | 'medium' | 'hard') => {
    if (!current) return;
    if (!randomMode) {
      rateFlashcard(current.id, d);
    }
    setShowBack(false);
    setIndex(i => i + 1);
  };

  const handleRestart = () => {
    setShowDone(false);
    setIndex(0);
    setShowBack(false);
    setShuffleKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Karteikarten" />
      <div className="max-w-md mx-auto py-8 px-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch checked={randomMode} onCheckedChange={v => { setRandomMode(v); setIndex(0); }} />
            <Label>Random Modus</Label>
          </div>
          <div className="space-y-1">
            {decks.map(deck => (
              <div key={deck.id} className="flex items-center space-x-2">
                <Checkbox
                  id={deck.id}
                  checked={selectedDecks.includes(deck.id)}
                  onCheckedChange={checked => {
                    setSelectedDecks(prev =>
                      checked ? [...prev, deck.id] : prev.filter(id => id !== deck.id)
                    );
                    setIndex(0);
                  }}
                />
                <Label htmlFor={deck.id}>{deck.name}</Label>
              </div>
            ))}
          </div>
        </div>
        {!current ? (
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
              {randomMode ? (
                <Button variant="outline" onClick={() => handleRate('easy')}>
                  Nächste Karte
                </Button>
              ) : (
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
              )}
            </CardFooter>
          </Card>
        )}
      </div>
      <AlertDialog
        open={showDone}
        onOpenChange={open => {
          if (!open) handleRestart();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alle Karten durch</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleRestart}>Weiter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FlashcardsPage;
