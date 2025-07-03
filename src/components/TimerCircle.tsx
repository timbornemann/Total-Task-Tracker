import React from "react";
import { useSettings } from "@/hooks/useSettings";
import { complementaryColor } from "@/utils/color";

interface Props {
  remaining: number;
  duration: number;
  size?: number;
  color: number;
  ringColor?: string;
  paused?: boolean;
}

const formatTime = (sec: number) => {
  const h = Math.floor(sec / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return h !== "00" ? `${h}:${m}:${s}` : `${m}:${s}`;
};

const TimerCircle: React.FC<Props> = ({
  remaining,
  duration,
  size = 80,
  color,
  ringColor: ringColorProp,
  paused,
}) => {
  const { colorPalette } = useSettings();
  const radius = size;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = remaining / duration;
  const strokeDashoffset = circumference - progress * circumference;
  const baseColor = colorPalette[color] ?? colorPalette[0];
  const ringColor = ringColorProp ?? complementaryColor(baseColor);
  return (
    <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
      <svg
        width={radius * 2}
        height={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="hsl(var(--muted))"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={ringColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset,
            transition: "stroke-dashoffset 1s linear",
          }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={size > 100 ? "text-4xl font-bold" : "text-2xl font-bold"}
        >
          {formatTime(remaining)}
        </div>
      </div>
    </div>
  );
};

export default TimerCircle;
