import React, { useState, useEffect, createContext, useContext } from 'react';
import { Flashcard, Deck } from '@/types';

const API_URL = '/api/flashcards';
const DECKS_URL = '/api/decks';

const useFlashcardStoreImpl = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [cardsRes, decksRes] = await Promise.all([
          fetch(API_URL),
          fetch(DECKS_URL)
        ]);

        if (cardsRes.ok) {
          const data = await cardsRes.json();
          setFlashcards(
            (data || []).map(
              (c: Omit<Flashcard, 'dueDate'> & { dueDate: string }) => ({
                ...c,
                dueDate: new Date(c.dueDate),
                easyCount: c.easyCount ?? 0,
                mediumCount: c.mediumCount ?? 0,
                hardCount: c.hardCount ?? 0,
                typedCorrect: c.typedCorrect ?? 0,
                typedTotal: c.typedTotal ?? 0
              })
            )
          );
        }

        if (decksRes.ok) {
          const data = await decksRes.json();
          setDecks(data || []);
        }
      } catch (err) {
        console.error('Error loading flashcards and decks', err);
      } finally {
        setLoaded(true);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const save = async () => {
      try {
        await fetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flashcards)
        });
      } catch (err) {
        console.error('Error saving flashcards', err);
      }
    };

    save();
  }, [flashcards, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const save = async () => {
      try {
        await fetch(DECKS_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(decks)
        });
      } catch (err) {
        console.error('Error saving decks', err);
      }
    };

    save();
  }, [decks, loaded]);

  const addFlashcard = (data: Omit<Flashcard, 'id' | 'interval' | 'dueDate'>) => {
    const newCard: Flashcard = {
      ...data,
      id: Date.now().toString(),
      interval: 1,
      dueDate: new Date(),
      easyCount: 0,
      mediumCount: 0,
      hardCount: 0,
      typedCorrect: 0,
      typedTotal: 0
    };
    setFlashcards(prev => [...prev, newCard]);
  };

  const updateFlashcard = (id: string, updates: Partial<Flashcard>) => {
    setFlashcards(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteFlashcard = (id: string) => {
    setFlashcards(prev => prev.filter(c => c.id !== id));
  };

  const addDeck = (name: string) => {
    const newDeck: Deck = { id: Date.now().toString(), name };
    setDecks(prev => [...prev, newDeck]);
  };

  const updateDeck = (id: string, name: string) => {
    setDecks(prev => prev.map(d => (d.id === id ? { ...d, name } : d)));
    setFlashcards(prev => prev.map(c => (c.deckId === id ? { ...c } : c)));
  };

  const deleteDeck = (id: string) => {
    setDecks(prev => prev.filter(d => d.id !== id));
    setFlashcards(prev => prev.filter(c => c.deckId !== id));
  };

  const countCardsForDeck = (deckId: string) =>
    flashcards.filter(c => c.deckId === deckId).length;

  const countDueCardsForDeck = (deckId: string) =>
    flashcards.filter(
      c => c.deckId === deckId && new Date(c.dueDate) <= new Date()
    ).length;

  const rateFlashcard = (
    id: string,
    difficulty: 'easy' | 'medium' | 'hard',
    typedCorrect?: boolean
  ) => {
    setFlashcards(prev => {
      return prev.map(card => {
        if (card.id !== id) return card;
        const total = card.easyCount + card.mediumCount + card.hardCount;
        const successRate =
          total > 0
            ? (card.easyCount + 0.5 * card.mediumCount) / total
            : 0.5;
        let base = 0.8;
        if (difficulty === 'easy') base = 1.5;
        else if (difficulty === 'medium') base = 1.2;
        const factor = base * (1 + successRate);
        const interval = Math.max(1, Math.round(card.interval * factor));
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + interval);
        return {
          ...card,
          interval,
          dueDate,
          easyCount: card.easyCount + (difficulty === 'easy' ? 1 : 0),
          mediumCount: card.mediumCount + (difficulty === 'medium' ? 1 : 0),
          hardCount: card.hardCount + (difficulty === 'hard' ? 1 : 0),
          typedCorrect: typedCorrect !== undefined
            ? (card.typedCorrect ?? 0) + (typedCorrect ? 1 : 0)
            : card.typedCorrect,
          typedTotal:
            typedCorrect !== undefined
              ? (card.typedTotal ?? 0) + 1
              : card.typedTotal
        };
      });
    });
  };

  return {
    flashcards,
    decks,
    addFlashcard,
    updateFlashcard,
    deleteFlashcard,
    rateFlashcard,
    addDeck,
    updateDeck,
    deleteDeck,
    countCardsForDeck,
    countDueCardsForDeck
  };
};

type FlashcardStore = ReturnType<typeof useFlashcardStoreImpl>;

const FlashcardStoreContext = createContext<FlashcardStore | null>(null);

export const FlashcardStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const store = useFlashcardStoreImpl();
  return (
    <FlashcardStoreContext.Provider value={store}>
      {children}
    </FlashcardStoreContext.Provider>
  );
};

export const useFlashcardStore = () => {
  const ctx = useContext(FlashcardStoreContext);
  if (!ctx) {
    throw new Error('useFlashcardStore must be used within FlashcardStoreProvider');
  }
  return ctx;
};
