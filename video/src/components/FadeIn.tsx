import React from "react";
import { useCurrentFrame, spring } from "remotion";
import { springConfigs } from "../utils/animation";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  style?: React.CSSProperties;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  direction = "up",
  distance = 30,
  style,
}) => {
  const frame = useCurrentFrame();

  const progress = spring({
    frame: frame - delay,
    fps: 30,
    config: springConfigs.gentle,
    durationInFrames: 25,
  });

  const translateMap = {
    up: `translateY(${(1 - progress) * distance}px)`,
    down: `translateY(${(1 - progress) * -distance}px)`,
    left: `translateX(${(1 - progress) * distance}px)`,
    right: `translateX(${(1 - progress) * -distance}px)`,
    none: "none",
  };

  return (
    <div
      style={{
        opacity: progress,
        transform: translateMap[direction],
        ...style,
      }}
    >
      {children}
    </div>
  );
};
