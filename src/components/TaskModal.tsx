
import React, { useState, useEffect } from 'react';
import { Task, TaskFormData, Category } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getPriorityColor } from '@/utils/taskUtils';
import { useSettings } from '@/hooks/useSettings';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: TaskFormData) => void;
  task?: Task;
  categories: Category[];
  parentTask?: Task;
  /**
   * Default category to use when creating a new task. This will be ignored when
   * editing an existing task where the category comes from the task itself.
   */
  defaultCategoryId?: string;
  /**
   * Default due date when creating a new task. Ignored when editing.
   */
  defaultDueDate?: Date;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  categories,
  parentTask,
  defaultCategoryId,
  defaultDueDate
}) => {
  const { defaultTaskPriority } = useSettings()
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: defaultTaskPriority,
    color: '#3B82F6',
    categoryId: '',
    parentId: parentTask?.id,
    dueDate: undefined,
    isRecurring: false,
    recurrencePattern: undefined,
    customIntervalDays: undefined,
    titleTemplate: undefined,
    template: false
  });

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ];

  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        color: task.color,
        categoryId: task.categoryId,
        parentId: task.parentId,
        dueDate: task.dueDate,
        isRecurring: task.isRecurring,
        recurrencePattern: task.recurrencePattern,
        customIntervalDays: task.customIntervalDays,
        titleTemplate: task.titleTemplate,
        template: task.template
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: defaultTaskPriority,
        color: '#3B82F6',
        categoryId:
          defaultCategoryId || parentTask?.categoryId || categories[0]?.id || '',
        parentId: parentTask?.id,
        dueDate: defaultDueDate,
        isRecurring: false,
        recurrencePattern: undefined,
        customIntervalDays: undefined,
        titleTemplate: undefined,
        template: false
      });
    }
  }, [
    isOpen,
    task,
    categories,
    parentTask,
    defaultCategoryId,
    defaultDueDate,
    defaultTaskPriority
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.categoryId) {
      onSave(formData);
      onClose();
    }
  };

  const handleChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Task bearbeiten' : parentTask ? 'Unteraufgabe erstellen' : 'Neue Task erstellen'}
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
                  <SelectItem value="low">
                    <span className={`px-2 py-1 rounded text-sm ${getPriorityColor('low')}`}>
                      🟢 Niedrig
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className={`px-2 py-1 rounded text-sm ${getPriorityColor('medium')}`}>
                      🟡 Mittel
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className={`px-2 py-1 rounded text-sm ${getPriorityColor('high')}`}>
                      🔴 Hoch
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

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
        </div>

        <div>
          <Label htmlFor="dueDate">Fällig am</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange('dueDate', e.target.value ? new Date(e.target.value) : undefined)}
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="recurring">Wiederkehrende Aufgabe</Label>
              <Switch
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => handleChange('isRecurring', checked)}
              />
            </div>

            {formData.isRecurring && (
              <div>
                <Label htmlFor="recurrence">Wiederholung</Label>
                <Select 
                  value={formData.recurrencePattern} 
                  onValueChange={(value) => handleChange('recurrencePattern', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wiederholung auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2">
                <Label htmlFor="customDays">Benutzerdefinierte Tage</Label>
                <Input
                  id="customDays"
                  type="number"
                  value={formData.customIntervalDays ?? ''}
                  onChange={(e) =>
                    handleChange('customIntervalDays', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="z.B. 3"
                />
              </div>
              <div className="mt-2">
                <Label htmlFor="titleTemplate">Dynamischer Titel</Label>
                <Input
                  id="titleTemplate"
                  value={formData.titleTemplate || ''}
                  onChange={(e) => handleChange('titleTemplate', e.target.value)}
                  placeholder="{date} oder {counter} nutzen"
                />
              </div>
            </div>
          )}
          </div>

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
