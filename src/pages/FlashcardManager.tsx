import React, { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import DeckModal from '@/components/DeckModal';
import { useFlashcardStore } from '@/hooks/useFlashcardStore';
import { Deck } from '@/types';
import { useTranslation } from 'react-i18next';

const FlashcardManagerPage: React.FC = () => {
  const {
    decks,
    addDeck,
    updateDeck,
    deleteDeck,
    countCardsForDeck,
    countDueCardsForDeck
  } = useFlashcardStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  const handleSaveDeck = (name: string) => {
    if (editingDeck) {
      updateDeck(editingDeck.id, name);
      setEditingDeck(null);
    } else {
      addDeck(name);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t('flashcardManager.title')} />
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setIsDeckModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> {t('flashcardManager.newDeck')}
          </Button>
        </div>
        {decks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('flashcardManager.none')}</p>
        ) : (
          <div className="space-y-4">
            {decks.map(deck => {
              const total = countCardsForDeck(deck.id);
              const due = countDueCardsForDeck(deck.id);
              return (
                <Card key={deck.id} onClick={() => navigate(`/flashcards/deck/${deck.id}`)} className="cursor-pointer">
                  <CardHeader>
                    <CardTitle>{deck.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {total} Karte{total !== 1 ? 'n' : ''}
                    <div className="text-sm text-muted-foreground">{due}/{total} fällig</div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); setEditingDeck(deck); setIsDeckModalOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); deleteDeck(deck.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <DeckModal
        isOpen={isDeckModalOpen}
        onClose={() => { setIsDeckModalOpen(false); setEditingDeck(null); }}
        onSave={handleSaveDeck}
        deck={editingDeck || undefined}
      />
    </div>
  );
};

export default FlashcardManagerPage;
