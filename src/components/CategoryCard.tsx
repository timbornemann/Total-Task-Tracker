
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Category, Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FolderOpen, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getTaskProgress } from '@/utils/taskUtils';
import { useSettings } from '@/hooks/useSettings';
import { isColorDark, adjustColor } from '@/utils/color';

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
  const { t } = useTranslation();
  const { colorPalette } = useSettings();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => {
    const progress = getTaskProgress(task);
    return progress.completed === progress.total;
  }).length;

  const completionPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const baseColor = colorPalette[category.color];
  const textColor = isColorDark(baseColor) ? '#fff' : '#000';
  const hoverColor = isColorDark(baseColor)
    ? adjustColor(baseColor, 10)
    : adjustColor(baseColor, -10);
  const tabColor = isColorDark(baseColor)
    ? adjustColor(baseColor, 15)
    : adjustColor(baseColor, -15);
  const progressBg = isColorDark(baseColor)
    ? adjustColor(baseColor, -30)
    : adjustColor(baseColor, 30);

  return (
    <Card
      className="relative h-full transition-all duration-200 hover:shadow-lg cursor-pointer group hover:[background-color:var(--hover-color)]"
      style={{
        backgroundColor: baseColor,
        color: textColor,
        '--hover-color': hoverColor
      } as React.CSSProperties}
    >
      <div
        className="absolute -top-2 left-4 w-8 h-3 rounded-t"
        style={{ backgroundColor: tabColor }}
      />
      <CardHeader 
        className="pb-2 sm:pb-3"
        onClick={() => onViewTasks(category)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold group-hover:text-primary transition-colors break-words">
                {category.name}
              </CardTitle>
              {category.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 break-words">
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
                title={t('categoryCard.deleteTooltip')}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
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
              <DropdownMenuContent align="end" className="bg-background z-50">
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('common.edit')}
                </DropdownMenuItem>
                {category.id !== 'default' && (
                  <DropdownMenuItem
                    onClick={() => onDelete(category.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('categoryCard.deleteMenu')}
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
              <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                {t('dashboard.tasksBadge', { count: totalTasks })}
              </span>
            </div>
            <Badge
              variant="secondary"
              className="text-xs flex-shrink-0"
              style={{
                backgroundColor: `${progressBg}80`,
                color: textColor,
                borderColor: `${progressBg}40`
              }}
            >
              {t('categoryCard.percentDone', { percent: Math.round(completionPercentage) })}
            </Badge>
          </div>

          <div className="w-full rounded-full h-2" style={{ backgroundColor: progressBg }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: baseColor
              }}
            />
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            {t('categoryCard.completedOfTotal', { completed: completedTasks, total: totalTasks })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
