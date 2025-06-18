import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import MarkdownEditor from '@/components/MarkdownEditor';
import ReactMarkdown from 'react-markdown';

const NoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { notes, updateNote, deleteNote } = useTaskStore();
  const { colorPalette } = useSettings();
  const note = notes.find(n => n.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    color: colorPalette[3] || '#F59E0B'
  });

  const colorOptions = colorPalette;

  useEffect(() => {
    if (note) {
      setFormData({ title: note.title, text: note.text, color: note.color });
    }
  }, [note, colorPalette]);

  const handleChange = (field: 'title' | 'text' | 'color', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (note) {
      updateNote(note.id, formData);
      setIsEditing(false);
    }
  };

  if (!note) return <div className="p-4">{t('noteDetail.notFound')}</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t('noteDetail.title')} onHomeClick={() => navigate('/notes')} />
      <div className="py-8 px-4 w-full flex justify-center">
        <div className="w-full max-w-4xl space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/notes')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> {t('common.back')}
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
              placeholder={t('noteModal.title')}
              value={formData.title}
              onChange={e => handleChange('title', e.target.value)}
              required
              className="text-3xl font-bold border-none focus-visible:ring-0 focus-visible:outline-none p-0 bg-transparent"
            />
            <MarkdownEditor
              value={formData.text}
              onChange={val => handleChange('text', val)}
              rows={20}
              className="min-h-[60vh]"
            />
            <div className="flex flex-wrap gap-2">
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('common.save')}</Button>
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
                {t('common.edit')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteNote(note.id);
                  navigate('/notes');
                }}
              >
                {t('common.delete')}
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
