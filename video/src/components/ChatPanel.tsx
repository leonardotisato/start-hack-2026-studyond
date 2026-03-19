import React from "react";
import { theme } from "../theme";
import { ChatMessage, ChatMessageProps } from "./ChatMessage";
import { geist } from "../utils/fonts";

interface ChatPanelProps {
  messages: ChatMessageProps[];
  width?: number;
  height?: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  width = 420,
  height = 500,
}) => {
  return (
    <div
      style={{
        width,
        height,
        background: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radii.lg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: geist,
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: `1px solid ${theme.colors.border}`,
          fontSize: 14,
          fontWeight: 600,
          color: theme.colors.foreground,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${theme.colors.aiGradientFrom}, ${theme.colors.aiGradientVia})`,
          }}
        />
        AI Thesis Assistant
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((msg, i) => (
          <ChatMessage key={i} {...msg} />
        ))}
      </div>
    </div>
  );
};
