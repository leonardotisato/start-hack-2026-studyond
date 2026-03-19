import React from "react";
import { useCurrentFrame, spring } from "remotion";
import { theme } from "../theme";
import { GradientText } from "../components/GradientText";
import { FadeIn } from "../components/FadeIn";
import { crimsonText, geist } from "../utils/fonts";

export const SolutionIntro: React.FC = () => {
  const frame = useCurrentFrame();

  const wipeProgress = spring({
    frame,
    fps: 30,
    config: { mass: 0.6, damping: 14, stiffness: 120 },
    durationInFrames: 20,
  });

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: theme.colors.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Wipe overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: theme.colors.foreground,
          transform: `translateX(${(1 - wipeProgress) * -100}%)`,
          opacity: 1 - wipeProgress,
        }}
      />

      <FadeIn delay={15} direction="up">
        <div
          style={{
            fontFamily: geist,
            fontSize: 18,
            fontWeight: 500,
            color: theme.colors.mutedForeground,
            textTransform: "uppercase" as const,
            letterSpacing: 4,
            marginBottom: 20,
          }}
        >
          Introducing
        </div>
      </FadeIn>

      <FadeIn delay={25} direction="up" distance={40}>
        <div
          style={{
            fontFamily: crimsonText,
            fontSize: 72,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          <GradientText>Thesis GPS Navigator</GradientText>
        </div>
      </FadeIn>

      <FadeIn delay={40} direction="up">
        <div
          style={{
            fontFamily: geist,
            fontSize: 22,
            color: theme.colors.mutedForeground,
            marginTop: 24,
            textAlign: "center",
            maxWidth: 600,
            lineHeight: 1.6,
          }}
        >
          An AI-powered pipeline that maps your entire thesis journey,
          from first idea to final submission.
        </div>
      </FadeIn>

      {/* Decorative app shell silhouette */}
      <FadeIn delay={55} direction="up" distance={60}>
        <div
          style={{
            marginTop: 48,
            width: 800,
            height: 200,
            borderRadius: theme.radii.lg,
            border: `1px solid ${theme.colors.border}`,
            background: theme.colors.muted,
            opacity: 0.6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 700,
              height: 8,
              borderRadius: 4,
              background: `linear-gradient(90deg, ${theme.colors.aiGradientFrom}40, ${theme.colors.aiGradientVia}40)`,
            }}
          />
        </div>
      </FadeIn>
    </div>
  );
};
