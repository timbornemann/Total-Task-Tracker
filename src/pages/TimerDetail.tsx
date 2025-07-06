import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import TimerCircle from "@/components/TimerCircle";
import { Button } from "@/components/ui/button";
import { useTimers } from "@/hooks/useTimers.tsx";
import { Play, Pause, RotateCcw, Plus, Edit } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { isColorDark, complementaryColor } from "@/utils/color";
import TimerModal from "@/components/TimerModal";

const TimerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const timer = useTimers((state) => state.timers.find((t) => t.id === id));
  const { startTimer, pauseTimer, resumeTimer, stopTimer, extendTimer } =
    useTimers();
  const updateTimer = useTimers((state) => state.updateTimer);
  const { timerExtendSeconds, colorPalette } = useSettings();
  const [editOpen, setEditOpen] = React.useState(false);

  const initialData = React.useMemo(() => {
    if (!timer) return null;
    return {
      title: timer.title,
      hours: Math.floor(timer.duration / 3600),
      minutes: Math.floor((timer.duration % 3600) / 60),
      seconds: Math.floor(timer.duration % 60),
      color: timer.color,
    };
  }, [timer]);

  if (!timer) return null;

  const { title, color, duration, remaining, isRunning, isPaused } = timer;
  const baseColor = colorPalette[color] ?? colorPalette[0];
  const textColor = isColorDark(baseColor) ? "#fff" : "#000";
  const ringColor = complementaryColor(baseColor);
  const actionStyle = { color: ringColor, borderColor: ringColor };
  const iconColor = isColorDark(ringColor) ? "#fff" : "#000";

  const handleEditSave = (data: {
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
    color: number;
  }) => {
    const dur = data.hours * 3600 + data.minutes * 60 + data.seconds;
    updateTimer(id!, { title: data.title, color: data.color, duration: dur });
  };
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        title={t("timers.detailTitle")}
        onHomeClick={() => navigate(-1)}
      />
      <div className="flex-grow flex flex-col items-center justify-center space-y-4 p-4">
        <TimerCircle
          remaining={remaining}
          duration={duration}
          color={color}
          ringColor={ringColor}
          size={200}
          paused={isPaused}
        />
        <div className="text-xl font-semibold" style={{ color: textColor }}>
          {title}
        </div>
        <div className="flex space-x-2">
          {!isRunning && (
            <Button style={actionStyle} onClick={() => startTimer(id!)}>
              <Play className="h-4 w-4 mr-2" style={{ color: iconColor }} />
              {t("timers.start")}
            </Button>
          )}
          {isRunning && !isPaused && (
            <Button
              variant="outline"
              style={actionStyle}
              onClick={() => pauseTimer(id!)}
            >
              <Pause className="h-4 w-4 mr-2" style={{ color: iconColor }} />
              {t("timers.pause")}
            </Button>
          )}
          {isRunning && isPaused && (
            <Button
              variant="outline"
              style={actionStyle}
              onClick={() => resumeTimer(id!)}
            >
              <Play className="h-4 w-4 mr-2" style={{ color: iconColor }} />
              {t("timers.resume")}
            </Button>
          )}
          {isRunning && (
            <Button
              variant="outline"
              style={actionStyle}
              onClick={() => extendTimer(id!, timerExtendSeconds)}
            >
              <Plus className="h-4 w-4 mr-2" style={{ color: iconColor }} />
              <span style={{ color: iconColor }}>
                {t("timers.extend")} +{timerExtendSeconds}s
              </span>
            </Button>
          )}
          {isRunning && (
            <Button
              variant="outline"
              style={actionStyle}
              onClick={() => stopTimer(id!)}
            >
              <RotateCcw
                className="h-4 w-4 mr-2"
                style={{ color: iconColor }}
              />
              {t("timers.stop")}
            </Button>
          )}
          <Button
            variant="outline"
            style={actionStyle}
            onClick={() => setEditOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" style={{ color: iconColor }} />
            {t("common.edit")}
          </Button>
        </div>
      </div>
      <TimerModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleEditSave}
        initialData={initialData}
      />
    </div>
  );
};

export default TimerDetail;
