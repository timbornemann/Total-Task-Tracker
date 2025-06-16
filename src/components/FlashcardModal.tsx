import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flashcard, Deck } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Flashcard, 'id' | 'interval' | 'dueDate'>) => void;
  decks: Deck[];
  card?: Flashcard;
}

const FlashcardModal: React.FC<FlashcardModalProps> = ({ isOpen, onClose, onSave, decks, card }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ front: '', back: '', deckId: '' });

  useEffect(() => {
    if (!isOpen) return;
    if (card) {
      setFormData({ front: card.front, back: card.back, deckId: card.deckId });
    } else {
      setFormData({ front: '', back: '', deckId: decks[0]?.id || '' });
    }
  }, [isOpen, card, decks]);

  const handleChange = (field: 'front' | 'back' | 'deckId', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.front.trim() && formData.back.trim()) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {card ? t('flashcardModal.editTitle') : t('flashcardModal.newTitle')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="deck">{t('flashcardModal.deck')}</Label>
            <Select value={formData.deckId} onValueChange={v => handleChange('deckId', v)}>
              <SelectTrigger id="deck">
                <SelectValue placeholder={t('flashcardModal.chooseDeck')} />
              </SelectTrigger>
              <SelectContent>
                {decks.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="front">{t('flashcardModal.front')}</Label>
            <Textarea
              id="front"
              value={formData.front}
              onChange={e => handleChange('front', e.target.value)}
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="back">{t('flashcardModal.back')}</Label>
            <Textarea
              id="back"
              value={formData.back}
              onChange={e => handleChange('back', e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {card ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardModal;
