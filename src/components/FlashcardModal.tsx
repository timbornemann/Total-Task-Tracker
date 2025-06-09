import React, { useState, useEffect } from 'react';
import { Flashcard } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Flashcard, 'id' | 'interval' | 'dueDate'>) => void;
  card?: Flashcard;
}

const FlashcardModal: React.FC<FlashcardModalProps> = ({ isOpen, onClose, onSave, card }) => {
  const [formData, setFormData] = useState({ front: '', back: '', deck: '' });

  useEffect(() => {
    if (!isOpen) return;
    if (card) {
      setFormData({ front: card.front, back: card.back, deck: card.deck });
    } else {
      setFormData({ front: '', back: '', deck: '' });
    }
  }, [isOpen, card]);

  const handleChange = (field: 'front' | 'back' | 'deck', value: string) => {
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
          <DialogTitle>{card ? 'Karte bearbeiten' : 'Neue Karte'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="deck">Deck</Label>
            <Input
              id="deck"
              value={formData.deck}
              onChange={e => handleChange('deck', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="front">Vorderseite *</Label>
            <Textarea
              id="front"
              value={formData.front}
              onChange={e => handleChange('front', e.target.value)}
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="back">Rückseite *</Label>
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
              Abbrechen
            </Button>
            <Button type="submit">{card ? 'Speichern' : 'Erstellen'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardModal;
