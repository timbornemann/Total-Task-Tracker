import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MarkdownEditor from '@/components/MarkdownEditor';
import ReactMarkdown from 'react-markdown';

const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notes, updateNote, deleteNote } = useTaskStore();
  const note = notes.find(n => n.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ title: '', text: '', color: '#F59E0B' });

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];

  useEffect(() => {
    if (note) {
      setFormData({ title: note.title, text: note.text, color: note.color });
    }
  }, [note]);

  const handleChange = (field: 'title' | 'text' | 'color', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (note) {
      updateNote(note.id, formData);
      setIsEditing(false);
    }
  };

  if (!note) return <div className="p-4">Notiz nicht gefunden.</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Notiz" onHomeClick={() => navigate('/notes')} />
      <div className="py-8 px-4 w-full flex justify-center">
        <div className="w-full max-w-4xl space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/notes')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
          </Button>
        {isEditing ? (
          <form
            className="space-y-6"
            onSubmit={e => {
              e.preventDefault();
              handleSave();
            }}
          >
            <Input
              id="title"
              placeholder="Titel *"
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              required
              className="text-3xl font-bold border-none focus-visible:ring-0 focus-visible:outline-none p-0 bg-transparent"
            />
            <div className="relative">
              <MarkdownEditor
                value={formData.text}
                onChange={val => handleChange('text', val)}
                rows={20}
                className="min-h-[60vh]"
              />
              <div className="absolute top-4 right-4 flex space-x-2 bg-background/80 p-2 rounded-md shadow">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleChange('color', color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Abbrechen
              </Button>
              <Button type="submit">Speichern</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <h1 className="text-3xl font-bold" style={{ color: note.color }}>
              {note.title}
            </h1>
            <ReactMarkdown className="prose mx-auto">{note.text}</ReactMarkdown>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Bearbeiten
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteNote(note.id);
                  navigate('/notes');
                }}
              >
                Löschen
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default NoteDetailPage;
