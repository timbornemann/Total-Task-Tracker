import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useTaskStore } from '@/hooks/useTaskStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Notiz" onHomeClick={() => navigate('/notes')} />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/notes')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
        </Button>
        {isEditing ? (
          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input id="title" value={formData.title} onChange={e => handleChange('title', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="text">Text (Markdown)</Label>
              <Textarea id="text" rows={10} value={formData.text} onChange={e => handleChange('text', e.target.value)} />
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
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Abbrechen
              </Button>
              <Button type="submit">Speichern</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold" style={{ color: note.color }}>
              {note.title}
            </h1>
            <ReactMarkdown className="prose">
              {note.text}
            </ReactMarkdown>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Bearbeiten
              </Button>
              <Button variant="destructive" onClick={() => { deleteNote(note.id); navigate('/notes'); }}>
                Löschen
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteDetailPage;
