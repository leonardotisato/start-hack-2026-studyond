import React from "react";
import { useCurrentFrame, spring, Img, staticFile } from "remotion";
import { theme } from "../theme";

export const LogoIntro: React.FC = () => {
  const frame = useCurrentFrame();

  const logoScale = spring({
    frame: frame - 20,
    fps: 30,
    config: { mass: 0.6, damping: 12, stiffness: 150 },
    durationInFrames: 30,
  });

  const logoOpacity = spring({
    frame: frame - 15,
    fps: 30,
    config: { mass: 0.8, damping: 20, stiffness: 100 },
    durationInFrames: 25,
  });

  // AI gradient shimmer
  const shimmerX = (frame * 4) % 400 - 100;

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: theme.colors.foreground,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle gradient background sweep */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at ${shimmerX}% 50%, ${theme.colors.aiGradientFrom}15 0%, transparent 60%)`,
        }}
      />

      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Img
          src={staticFile("studyond.svg")}
          style={{
            width: 400,
            filter: "brightness(0) invert(1)",
          }}
        />
      </div>
    </div>
  );
};
