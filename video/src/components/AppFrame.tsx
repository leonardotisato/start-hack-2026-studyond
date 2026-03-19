import React from "react";
import { theme } from "../theme";
import { geist } from "../utils/fonts";

interface AppFrameProps {
  children: React.ReactNode;
  title?: string;
}

export const AppFrame: React.FC<AppFrameProps> = ({
  children,
  title = "StudyOnd — Thesis GPS Navigator",
}) => {
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        background: theme.colors.background,
        display: "flex",
        flexDirection: "column",
        fontFamily: geist,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: 48,
          background: theme.colors.muted,
          borderBottom: `1px solid ${theme.colors.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 8,
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 6, marginRight: 12 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div
              key={c}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: c,
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontSize: 13,
            color: theme.colors.mutedForeground,
            fontWeight: 500,
          }}
        >
          {title}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
};
