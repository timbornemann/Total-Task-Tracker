import React, { useState, useEffect, createContext, useContext } from 'react';
import { Flashcard } from '@/types';

const API_URL = '/api/flashcards';

const useFlashcardStoreImpl = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API_URL);
        if (res.ok) {
          const data = await res.json();
          setFlashcards(
            (data || []).map((c: any) => ({
              ...c,
              dueDate: new Date(c.dueDate)
            }))
          );
        }
      } catch (err) {
        console.error('Fehler beim Laden der Karten', err);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await fetch(API_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flashcards)
        });
      } catch (err) {
        console.error('Fehler beim Speichern der Karten', err);
      }
    };

    save();
  }, [flashcards]);

  const addFlashcard = (data: Omit<Flashcard, 'id' | 'interval' | 'dueDate'>) => {
    const newCard: Flashcard = {
      ...data,
      id: Date.now().toString(),
      interval: 1,
      dueDate: new Date()
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

  const rateFlashcard = (
    id: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ) => {
    setFlashcards(prev => {
      return prev.map(card => {
        if (card.id !== id) return card;
        let factor = 1;
        if (difficulty === 'easy') factor = 2;
        else if (difficulty === 'medium') factor = 1.5;
        const interval = Math.max(1, Math.round(card.interval * factor));
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + interval);
        return { ...card, interval, dueDate };
      });
    });
  };

  return { flashcards, addFlashcard, updateFlashcard, deleteFlashcard, rateFlashcard };
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
