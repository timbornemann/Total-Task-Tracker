import React from "react";
import { useTranslation } from "react-i18next";
import { Category, Task } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  FolderOpen,
  MoreVertical,
  Star,
  StarOff,
  RotateCcw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTaskProgress } from "@/utils/taskUtils";
import { useSettings } from "@/hooks/useSettings";
import {
  isColorDark,
  adjustColor,
  complementaryColor,
  hslToHex,
} from "@/utils/color";

interface CategoryCardProps {
  category: Category;
  tasks: Task[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onViewTasks: (category: Category) => void;
  onTogglePinned: (categoryId: string, pinned: boolean) => void;
  onReset: (categoryId: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  tasks,
  onEdit,
  onDelete,
  onViewTasks,
  onTogglePinned,
  onReset,
}) => {
  const { t } = useTranslation();
  const { colorPalette, theme } = useSettings();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => {
    const progress = getTaskProgress(task);
    return progress.completed === progress.total;
  }).length;

  const completionPercentage =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const baseColor = colorPalette[category.color] ?? colorPalette[0];
  const textColor = isColorDark(baseColor) ? "#fff" : "#000";
  const hoverColor = isColorDark(baseColor)
    ? adjustColor(baseColor, 10)
    : adjustColor(baseColor, -10);
  const tabColor = isColorDark(baseColor)
    ? adjustColor(baseColor, 15)
    : adjustColor(baseColor, -15);
  const progressBg = isColorDark(baseColor)
    ? adjustColor(baseColor, -30)
    : adjustColor(baseColor, 30);
  const progressColor = complementaryColor(baseColor);
  const titleHoverColor = isColorDark(baseColor)
    ? adjustColor(baseColor, 60)
    : adjustColor(baseColor, -60);
  const destructiveHex = hslToHex(theme.destructive);
  const deleteColor = isColorDark(baseColor)
    ? adjustColor(destructiveHex, 20)
    : adjustColor(destructiveHex, -20);
  const deleteHoverColor = isColorDark(baseColor)
    ? adjustColor(destructiveHex, 40)
    : adjustColor(destructiveHex, -40);

  return (
    <Card
      className="relative h-full transition-all duration-200 hover:shadow-lg cursor-pointer group hover:[background-color:var(--hover-color)] transform hover:-translate-y-1"
      style={
        {
          backgroundColor: baseColor,
          color: textColor,
          "--hover-color": hoverColor,
        } as React.CSSProperties
      }
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
              <CardTitle
                className="text-base sm:text-lg font-semibold transition-colors break-words group-hover:[color:var(--title-hover-color)]"
                style={
                  {
                    "--title-hover-color": titleHoverColor,
                  } as React.CSSProperties
                }
              >
                {category.name}
              </CardTitle>
              {category.description && (
                <p className="text-xs sm:text-sm mt-1 line-clamp-2 break-words">
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
                onTogglePinned(category.id, !category.pinned);
              }}
              className="h-8 w-8 p-0"
            >
              {category.pinned ? (
                <Star className="h-4 w-4" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onReset(category.id);
              }}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            {category.id !== "default" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(category.id);
                }}
                title={t("categoryCard.deleteTooltip")}
                className="h-8 w-8 p-0 hover:[color:var(--delete-hover-color)]"
                style={
                  {
                    color: deleteColor,
                    "--delete-hover-color": deleteHoverColor,
                  } as React.CSSProperties
                }
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
                <DropdownMenuItem
                  onClick={() => onTogglePinned(category.id, !category.pinned)}
                >
                  {category.pinned ? (
                    <Star className="h-4 w-4 mr-2" />
                  ) : (
                    <StarOff className="h-4 w-4 mr-2" />
                  )}
                  {category.pinned
                    ? t("taskDetail.unpin")
                    : t("taskDetail.pin")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReset(category.id)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t("categoryCard.resetTasks")}
                </DropdownMenuItem>
                {category.id !== "default" && (
                  <DropdownMenuItem
                    onClick={() => onDelete(category.id)}
                    className="group"
                    style={
                      {
                        color: deleteColor,
                        "--delete-hover-color": deleteHoverColor,
                      } as React.CSSProperties
                    }
                  >
                    <Trash2 className="h-4 w-4 mr-2 group-hover:[color:var(--delete-hover-color)]" />
                    {t("categoryCard.deleteMenu")}
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
              <FolderOpen
                className="h-4 w-4 flex-shrink-0"
                style={{ color: textColor }}
              />
              <span className="text-xs sm:text-sm">
                {t("dashboard.tasksBadge", { count: totalTasks })}
              </span>
            </div>
            <Badge
              variant="secondary"
              className="text-xs flex-shrink-0"
              style={{
                backgroundColor: `${progressBg}80`,
                color: textColor,
                borderColor: `${progressBg}40`,
              }}
            >
              {t("categoryCard.percentDone", {
                percent: Math.round(completionPercentage),
              })}
            </Badge>
          </div>

          <div
            className="w-full rounded-full h-2"
            style={{ backgroundColor: progressBg }}
          >
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>

          <div className="text-xs text-center">
            {t("categoryCard.completedOfTotal", {
              completed: completedTasks,
              total: totalTasks,
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
