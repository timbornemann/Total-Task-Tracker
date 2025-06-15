import React, { useState, useEffect } from 'react';
import { Note } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MarkdownEditor from './MarkdownEditor';
import { Label } from '@/components/ui/label';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'pinned'>
  ) => void;
  note?: Note;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, onSave, note }) => {
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    color: '#F59E0B'
  });

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];

  useEffect(() => {
    if (!isOpen) return;
    if (note) {
      setFormData({ title: note.title, text: note.text, color: note.color });
    } else {
      setFormData({ title: '', text: '', color: '#F59E0B' });
    }
  }, [isOpen, note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave(formData);
      onClose();
    }
  };

  const handleChange = (field: 'title' | 'text' | 'color', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{note ? 'Notiz bearbeiten' : 'Neue Notiz'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="text">Text (Markdown)</Label>
            <MarkdownEditor
              value={formData.text}
              onChange={val => handleChange('text', val)}
              rows={5}
            />
          </div>
          <div>
            <Label>Farbe</Label>
            <div className="flex space-x-2 mt-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleChange('color', color)}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit">{note ? 'Speichern' : 'Erstellen'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NoteModal;
