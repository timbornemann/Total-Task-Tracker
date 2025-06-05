
import React from 'react';
import { Category, Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FolderOpen, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getTaskProgress } from '@/utils/taskUtils';

interface CategoryCardProps {
  category: Category;
  tasks: Task[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onViewTasks: (category: Category) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  tasks,
  onEdit,
  onDelete,
  onViewTasks
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => {
    const progress = getTaskProgress(task);
    return progress.completed === progress.total;
  }).length;

  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer group">
      <CardHeader 
        className="pb-2 sm:pb-3"
        onClick={() => onViewTasks(category)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div 
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-300 flex-shrink-0 mt-1"
              style={{ backgroundColor: category.color }}
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold group-hover:text-blue-600 transition-colors break-words">
                {category.name}
              </CardTitle>
              {category.description && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 break-words">
                  {category.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            {category.id !== 'default' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(category.id);
                }}
                title="Löschen (Rückgängig über Benachrichtigung)"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Mobile Actions Dropdown */}
          <div className="sm:hidden flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white z-50">
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bearbeiten
                </DropdownMenuItem>
                {category.id !== 'default' && (
                  <DropdownMenuItem
                    onClick={() => onDelete(category.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen (Rückgängig über Benachrichtigung)
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent onClick={() => onViewTasks(category)}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600">
                {totalTasks} Task{totalTasks !== 1 ? 's' : ''}
              </span>
            </div>
            <Badge 
              variant="secondary" 
              className="text-xs flex-shrink-0"
              style={{ 
                backgroundColor: `${category.color}20`,
                color: category.color,
                borderColor: `${category.color}40`
              }}
            >
              {Math.round(completionPercentage)}% erledigt
            </Badge>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${completionPercentage}%`,
                backgroundColor: category.color
              }}
            />
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            {completedTasks} von {totalTasks} abgeschlossen
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
