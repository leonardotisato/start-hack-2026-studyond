import React from "react";
import { theme } from "../theme";

interface GradientTextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const GradientText: React.FC<GradientTextProps> = ({ children, style }) => {
  return (
    <span
      style={{
        background: `linear-gradient(135deg, ${theme.colors.aiGradientFrom}, ${theme.colors.aiGradientVia})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        ...style,
      }}
    >
      {children}
    </span>
  );
};
