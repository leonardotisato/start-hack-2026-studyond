import React from "react";
import { useCurrentFrame, spring, Img, staticFile } from "remotion";
import { theme } from "../theme";
import { FadeIn } from "../components/FadeIn";
import { crimsonText, geist } from "../utils/fonts";

export const ClosingCta: React.FC = () => {
  const frame = useCurrentFrame();

  const logoOpacity = spring({
    frame: frame - 20,
    fps: 30,
    config: { mass: 0.8, damping: 15, stiffness: 100 },
    durationInFrames: 30,
  });

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: theme.colors.foreground,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      <div style={{ opacity: logoOpacity }}>
        <Img
          src={staticFile("studyond.svg")}
          style={{
            width: 360,
            filter: "brightness(0) invert(1)",
          }}
        />
      </div>

      <FadeIn delay={40} direction="up">
        <div
          style={{
            fontFamily: crimsonText,
            fontSize: 36,
            color: theme.colors.primaryForeground,
            textAlign: "center",
            opacity: 0.9,
          }}
        >
          The thesis journey, navigated.
        </div>
      </FadeIn>

      <FadeIn delay={60} direction="up">
        <div
          style={{
            fontFamily: geist,
            fontSize: 20,
            color: theme.colors.mutedForeground,
            letterSpacing: 2,
          }}
        >
          studyond.com
        </div>
      </FadeIn>
    </div>
  );
};
