
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Category, CategoryFormData } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/hooks/useSettings';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: CategoryFormData) => void;
  category?: Category;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category
}) => {
  const { t } = useTranslation();
  const { colorPalette } = useSettings();
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: colorPalette[0] || '#3B82F6'
  });

  const colorOptions = colorPalette;

  useEffect(() => {
    if (!isOpen) return;

    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
        color: category.color
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: colorPalette[0] || '#3B82F6'
      });
    }
  }, [category, isOpen, colorPalette]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
      onClose();
    }
  };

  const handleChange = (field: keyof CategoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? t('categoryModal.editTitle') : t('categoryModal.newTitle')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('categoryModal.name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('categoryModal.placeholderName')}
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="description">{t('categoryModal.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('categoryModal.placeholderDescription')}
              rows={3}
            />
          </div>

          <div>
            <Label>{t('categoryModal.color')}</Label>
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
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {category ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;
