import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { TypewriterText } from "../components/TypewriterText";
import { FadeIn } from "../components/FadeIn";
import { crimsonText, geist } from "../utils/fonts";

const painPoints = [
  { icon: "?", title: "No Structured Guidance", desc: "Students piece together advice from scattered sources" },
  { icon: "@", title: "Email Overload", desc: "Endless back-and-forth with supervisors for basic questions" },
  { icon: "#", title: "Manual Tracking", desc: "Spreadsheets and sticky notes to manage months of work" },
];

export const ProblemStatement: React.FC = () => {
  const frame = useCurrentFrame();

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
        padding: 80,
      }}
    >
      {/* Headline */}
      <div
        style={{
          fontFamily: crimsonText,
          fontSize: 52,
          fontWeight: 700,
          color: theme.colors.foreground,
          textAlign: "center",
          marginBottom: 64,
          maxWidth: 900,
          lineHeight: 1.3,
        }}
      >
        <TypewriterText
          text="Every year, thousands of students start their thesis journey alone."
          startFrame={10}
          charsPerFrame={1.8}
        />
      </div>

      {/* Pain point cards */}
      <div
        style={{
          display: "flex",
          gap: 40,
          justifyContent: "center",
        }}
      >
        {painPoints.map((point, i) => (
          <FadeIn key={i} delay={80 + i * 25} direction="up" distance={40}>
            <div
              style={{
                width: 320,
                padding: "36px 28px",
                background: theme.colors.muted,
                borderRadius: theme.radii.lg,
                border: `1px solid ${theme.colors.border}`,
                fontFamily: geist,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: theme.radii.sm,
                  background: theme.colors.foreground,
                  color: theme.colors.background,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                {point.icon}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: theme.colors.foreground,
                  marginBottom: 8,
                }}
              >
                {point.title}
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: theme.colors.mutedForeground,
                  lineHeight: 1.5,
                }}
              >
                {point.desc}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
};
