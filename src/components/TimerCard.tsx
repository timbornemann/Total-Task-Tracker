import React from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, RotateCcw, Plus, Edit, Trash2 } from "lucide-react";
import TimerCircle from "./TimerCircle";
import { useTimers } from "@/hooks/useTimers";
import { useSettings } from "@/hooks/useSettings";
import { isColorDark, complementaryColor } from "@/utils/color";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const ringColor = complementaryColor(baseColor);
  const actionStyle = { color: ringColor, borderColor: ringColor };
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
      className="relative flex flex-col items-center p-4"
      style={{ backgroundColor: baseColor, color: textColor }}
    >
      <div className="absolute right-2 top-2 flex space-x-1">
        <Button
          size="icon"
          variant="ghost"
          style={actionStyle}
          onClick={() => stopTimer(id)}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          style={actionStyle}
          onClick={() => setEditOpen(true)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          style={actionStyle}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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
              onClick={() => startTimer(id)}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {isRunning && !isPaused && (
            <Button
              size="icon"
              variant="outline"
              style={actionStyle}
              onClick={() => pauseTimer(id)}
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}
          {isRunning && isPaused && (
            <Button
              size="icon"
              variant="outline"
              style={actionStyle}
              onClick={() => resumeTimer(id)}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {isRunning && (
            <Button
              variant="outline"
              style={actionStyle}
              onClick={() => extendTimer(id, timerExtendSeconds)}
            >
              <Plus className="h-4 w-4 mr-1" />+{timerExtendSeconds}s
            </Button>
          )}
          {!isRunning && remaining === 0 && (
            <Button
              size="icon"
              variant="outline"
              style={actionStyle}
              onClick={() => startTimer(id)}
            >
              <RotateCcw className="h-4 w-4" />
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
