import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
  const [trainingMode, setTrainingMode] = useState(false);
  const [typingMode, setTypingMode] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [useSpaced, setUseSpaced] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const TIMER_DURATION = 10;
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [sessionCards, setSessionCards] = useState<typeof flashcards>([]);
  const [remainingCards, setRemainingCards] = useState<typeof flashcards>([]);
  const [summary, setSummary] = useState<Record<string, { easy: number; medium: number; hard: number }>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const mode = typingMode
    ? 'typing'
    : trainingMode
    ? 'training'
    : randomMode
    ? 'random'
    : timedMode
    ? 'timed'
    : 'spaced';
  const handleModeChange = (
    value: 'spaced' | 'training' | 'random' | 'typing' | 'timed'
  ) => {
    setRandomMode(value === 'random');
    setTrainingMode(value === 'training');
    setTypingMode(value === 'typing');
    setTimedMode(value === 'timed');
    setUseSpaced(true);
    setIndex(0);
    setShowBack(false);
    setAnswer('');
    setChecked(false);
  };

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

  const nonSpaced = (!useSpaced) && (typingMode || timedMode);

  useEffect(() => {
    if (trainingMode) {
      const all = shuffleArray(filtered);
      setSessionCards(all.slice(0, 5));
      setRemainingCards(all.slice(5));
      setIndex(0);
      setSummary({});
      setShowSummary(false);
    }
  }, [filtered, trainingMode]);

  const cards = useMemo(() => {
    if (randomMode || nonSpaced) {
      return shuffleArray(filtered);
    }
    return dueCards;
  }, [filtered, dueCards, randomMode, nonSpaced, shuffleKey]);

  const current = trainingMode ? sessionCards[index] : cards[index];

  useEffect(() => {
    if (timedMode && current) {
      setTimeLeft(TIMER_DURATION);
    } else if (!current) {
      setTimeLeft(0);
    }
  }, [current, timedMode]);

  useEffect(() => {
    if (!timedMode || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft, timedMode]);

  useEffect(() => {
    if (timedMode && timeLeft === 0) {
      handleRate('hard');
      setTimeLeft(-1);
    }
  }, [timeLeft, timedMode]);

  useEffect(() => {
    if (!trainingMode && randomMode && index >= cards.length && cards.length > 0) {
      setShowDone(true);
    } else if (nonSpaced && index >= cards.length && cards.length > 0) {
      setShowSummary(true);
    }
  }, [index, randomMode, cards.length, trainingMode, nonSpaced]);

  const handleRate = (d: 'easy' | 'medium' | 'hard') => {
    if (!current) return;
    if (trainingMode) {
      setSummary(prev => {
        const entry = prev[current.id] || { easy: 0, medium: 0, hard: 0 };
        return { ...prev, [current.id]: { ...entry, [d]: entry[d] + 1 } };
      });
      const cards = [...sessionCards];
      cards.splice(index, 1);
      if (d !== 'easy') cards.push(current);
      if (cards.length === 0) {
        setSessionCards([]);
        setShowSummary(true);
      } else {
        setSessionCards(cards);
        setIndex(i => (i >= cards.length ? 0 : i));
      }
      setShowBack(false);
      return;
    }
    if (nonSpaced) {
      setSummary(prev => {
        const entry = prev[current.id] || { easy: 0, medium: 0, hard: 0 };
        return { ...prev, [current.id]: { ...entry, [d]: entry[d] + 1 } };
      });
    } else if (!randomMode) {
      rateFlashcard(current.id, d, typingMode ? isCorrect ?? false : undefined);
    }
    setShowBack(false);
    setAnswer('');
    setChecked(false);
    setIsCorrect(null);
    setIndex(i => i + 1);
  };

  const handleRestart = () => {
    if (trainingMode) {
      const all = shuffleArray(filtered);
      setSessionCards(all.slice(0, 5));
      setRemainingCards(all.slice(5));
      setIndex(0);
      setShowBack(false);
      setSummary({});
      setShowSummary(false);
    } else {
      setShowDone(false);
      setIndex(0);
      setShowBack(false);
      setShuffleKey(k => k + 1);
      if (nonSpaced) {
        setSummary({});
        setShowSummary(false);
      }
    }
    setAnswer('');
    setChecked(false);
    setIsCorrect(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Karteikarten" />
      <div className="max-w-md mx-auto py-8 px-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label className="text-sm">Modus:</Label>
            <Select value={mode} onValueChange={handleModeChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Modus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spaced">Spaced Repetition</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="typing">Eingabe</SelectItem>
                <SelectItem value="timed">Timed</SelectItem>
              </SelectContent>
            </Select>
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
          {(typingMode || timedMode) && (
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="useSpaced">Spaced Repetition</Label>
              <Switch
                id="useSpaced"
                checked={useSpaced}
                onCheckedChange={setUseSpaced}
              />
            </div>
          )}
        </div>
        {!current ? (
          <p className="text-sm text-muted-foreground">Keine fälligen Karten.</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{decks.find(d => d.id === current.deckId)?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {timedMode && (
                <div className="text-center text-2xl font-bold text-red-600 mb-4">
                  {Math.max(timeLeft, 0)}
                </div>
              )}
              {typingMode ? (
                <div className="space-y-4 py-8">
                  <div className="text-center text-lg">{current.front}</div>
                  {showBack ? (
                    <>
                      <div className="text-center">{current.back}</div>
                      <div
                        className={`text-sm text-center ${isCorrect ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {isCorrect ? 'Richtig!' : 'Falsch'}
                      </div>
                    </>
                  ) : (
                    <Input value={answer} onChange={e => setAnswer(e.target.value)} />
                  )}
                </div>
              ) : (
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
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {typingMode ? (
                !checked ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const correct =
                        answer.trim().toLowerCase() ===
                        current.back.trim().toLowerCase();
                      setIsCorrect(correct);
                      setChecked(true);
                      setShowBack(true);
                    }}
                  >
                    Check
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleRate('hard')}
                    >
                      Schwer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRate('medium')}
                    >
                      Mittel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRate('easy')}
                    >
                      Leicht
                    </Button>
                  </>
                )
              ) : randomMode && !trainingMode ? (
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
        open={showSummary}
        onOpenChange={open => {
          if (!open) {
            if (trainingMode) {
              if (remainingCards.length === 0) {
                handleRestart();
              } else {
                const next = remainingCards.slice(0, 5);
                setSessionCards(next);
                setRemainingCards(remainingCards.slice(5));
                setIndex(0);
                setShowBack(false);
                setShowSummary(false);
              }
            } else {
              handleRestart();
            }
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {trainingMode ? 'Training beendet' : 'Session beendet'}
            </AlertDialogTitle>
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
            <AlertDialogAction onClick={() => setShowSummary(false)}>
              Weiter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
