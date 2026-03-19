import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { geist } from "../utils/fonts";

interface WeekCounterProps {
  startFrame: number;
  endFrame: number;
  totalWeeks: number;
}

export const WeekCounter: React.FC<WeekCounterProps> = ({
  startFrame,
  endFrame,
  totalWeeks,
}) => {
  const frame = useCurrentFrame();

  const week = Math.floor(
    interpolate(
      frame,
      [startFrame, endFrame],
      [1, totalWeeks],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    )
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 30,
        right: 60,
        fontFamily: geist,
        fontSize: 28,
        fontWeight: 700,
        color: theme.colors.foreground,
        display: "flex",
        alignItems: "baseline",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 400, color: theme.colors.mutedForeground }}>
        Week
      </span>
      <span>{week * 2}</span>
      <span style={{ fontSize: 16, fontWeight: 400, color: theme.colors.mutedForeground }}>
        / 16
      </span>
    </div>
  );
};
