import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { geist } from "../utils/fonts";

export interface ChatMessageProps {
  role: "user" | "assistant";
  text: string;
  delay: number;
  typewriter?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  text,
  delay,
  typewriter = false,
}) => {
  const frame = useCurrentFrame();
  const isUser = role === "user";

  const opacity = interpolate(
    frame,
    [delay, delay + 8],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const displayText = typewriter
    ? text.slice(
        0,
        Math.floor(
          interpolate(
            frame,
            [delay + 5, delay + 5 + text.length / 1.5],
            [0, text.length],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          )
        )
      )
    : text;

  return (
    <div
      style={{
        opacity,
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "85%",
        padding: "10px 14px",
        borderRadius: 14,
        fontSize: 13,
        lineHeight: 1.5,
        fontFamily: geist,
        color: isUser ? theme.colors.primaryForeground : theme.colors.foreground,
        background: isUser
          ? theme.colors.primary
          : theme.colors.muted,
      }}
    >
      {displayText}
    </div>
  );
};
