
import React, { useState, useEffect } from 'react';
import { Task, TaskFormData, Category } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: TaskFormData) => void;
  task?: Task;
  categories: Category[];
  parentTask?: Task;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  categories,
  parentTask
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    color: '#3B82F6',
    categoryId: categories[0]?.id || 'default',
    parentId: parentTask?.id
  });

  const priorityOptions = [
    { value: 'low', label: 'Niedrig', icon: '🟢' },
    { value: 'medium', label: 'Mittel', icon: '🟡' },
    { value: 'high', label: 'Hoch', icon: '🔴' }
  ];

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        color: task.color,
        categoryId: task.categoryId,
        parentId: task.parentId
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        color: '#3B82F6',
        categoryId: parentTask?.categoryId || categories[0]?.id || 'default',
        parentId: parentTask?.id
      });
    }
  }, [task, parentTask, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave(formData);
      onClose();
    }
  };

  const handleChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Task bearbeiten' : parentTask ? 'Unteraufgabe hinzufügen' : 'Neue Task erstellen'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Task-Titel eingeben..."
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optionale Beschreibung..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priorität</Label>
              <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!parentTask && (
              <div>
                <Label htmlFor="category">Kategorie</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleChange('categoryId', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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

          {parentTask && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Übergeordnete Task:</strong> {parentTask.title}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit">
              {task ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
