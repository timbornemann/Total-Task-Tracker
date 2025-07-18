import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Edit,
  Trash2,
  Settings,
} from "lucide-react";
import TimerCircle from "./TimerCircle";
import { useTimers } from "@/hooks/useTimers.tsx";
import { useSettings } from "@/hooks/useSettings";
import { isColorDark, complementarySameHue, adjustColor } from "@/utils/color";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "@/components/ConfirmDialog";
import TimerModal from "./TimerModal";
import { useTranslation } from "react-i18next";

interface Props {
  id: string;
}

const TimerCard: React.FC<Props> = ({ id }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const timer = useTimers((state) => state.timers.find((t) => t.id === id));
  const {
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    extendTimer,
    removeTimer,
    updateTimer,
  } = useTimers();
  const { timerExtendSeconds, colorPalette } = useSettings();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  if (!timer) return null;
  const { title, color, duration, remaining, isRunning, isPaused } = timer;
  const baseColor = colorPalette[color] ?? colorPalette[0];
  const textColor = isColorDark(baseColor) ? "#fff" : "#000";
  const trackColor = isColorDark(baseColor)
    ? adjustColor(baseColor, -30)
    : adjustColor(baseColor, 30);
  const ringColor = complementarySameHue(trackColor);
  const hoverColor = complementarySameHue(ringColor);
  const actionStyle = {
    color: ringColor,
    borderColor: ringColor,
    "--hover-color": hoverColor,
  } as React.CSSProperties;
  const iconColor = isColorDark(ringColor) ? "#fff" : "#000";
  const handleClick = () => navigate(`/timers/${id}`);
  const handleEditSave = (data: {
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
    color: number;
  }) => {
    const dur = data.hours * 3600 + data.minutes * 60 + data.seconds;
    updateTimer(id, { title: data.title, color: data.color, duration: dur });
  };
  return (
    <Card
      className="relative flex flex-col items-center p-4 min-h-[220px] min-w-[160px]"
      style={{ backgroundColor: baseColor, color: textColor }}
    >
      <div className="absolute right-2 top-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              style={actionStyle}
              className="hover:[background-color:var(--hover-color)]"
              onClick={(e) => e.stopPropagation()}
            >
              <Settings className="h-4 w-4" style={{ color: iconColor }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background z-50">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="cursor-pointer" onClick={handleClick}>
        <TimerCircle
          remaining={remaining}
          duration={duration}
          color={color}
          ringColor={ringColor}
          size={60}
          paused={isPaused}
        />
      </div>
      <CardHeader className="py-2">
        <CardTitle className="text-base text-center break-all">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center p-0 space-y-2 mt-1">
        <div className="flex space-x-1">
          {!isRunning && (
            <Button
              size="icon"
              variant="outline"
              style={actionStyle}
              className="hover:[background-color:var(--hover-color)]"
              onClick={() => startTimer(id)}
            >
              <Play className="h-4 w-4" style={{ color: iconColor }} />
            </Button>
          )}
          {isRunning && !isPaused && (
            <Button
              size="icon"
              variant="outline"
              style={actionStyle}
              className="hover:[background-color:var(--hover-color)]"
              onClick={() => pauseTimer(id)}
            >
              <Pause className="h-4 w-4" style={{ color: iconColor }} />
            </Button>
          )}
          {isRunning && isPaused && (
            <Button
              size="icon"
              variant="outline"
              style={actionStyle}
              className="hover:[background-color:var(--hover-color)]"
              onClick={() => resumeTimer(id)}
            >
              <Play className="h-4 w-4" style={{ color: iconColor }} />
            </Button>
          )}
          {isRunning && (
            <Button
              variant="outline"
              style={actionStyle}
              className="hover:[background-color:var(--hover-color)]"
              onClick={() => extendTimer(id, timerExtendSeconds)}
            >
              <Plus className="h-4 w-4 mr-1" style={{ color: iconColor }} />
              <span style={{ color: iconColor }}>+{timerExtendSeconds}s</span>
            </Button>
          )}
          {isRunning && (
            <Button
              size="icon"
              variant="outline"
              style={actionStyle}
              className="hover:[background-color:var(--hover-color)]"
              onClick={() => stopTimer(id)}
            >
              <RotateCcw className="h-4 w-4" style={{ color: iconColor }} />
            </Button>
          )}
          {!isRunning && remaining === 0 && (
            <Button
              size="icon"
              variant="outline"
              style={actionStyle}
              className="hover:[background-color:var(--hover-color)]"
              onClick={() => startTimer(id)}
            >
              <RotateCcw className="h-4 w-4" style={{ color: iconColor }} />
            </Button>
          )}
        </div>
      </CardContent>
      <TimerModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
        initialData={{
          title,
          hours: Math.floor(duration / 3600),
          minutes: Math.floor((duration % 3600) / 60),
          seconds: Math.floor(duration % 60),
          color,
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("timers.deleteConfirm", { title })}
        onConfirm={() => removeTimer(id)}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
      />
    </Card>
  );
};

export default TimerCard;
