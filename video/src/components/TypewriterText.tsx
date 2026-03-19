import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface TypewriterTextProps {
  text: string;
  startFrame: number;
  charsPerFrame?: number;
  style?: React.CSSProperties;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame,
  charsPerFrame = 1.2,
  style,
}) => {
  const frame = useCurrentFrame();
  const totalFrames = Math.ceil(text.length / charsPerFrame);
  const charCount = Math.floor(
    interpolate(
      frame,
      [startFrame, startFrame + totalFrames],
      [0, text.length],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    )
  );

  const visibleText = text.slice(0, charCount);
  const showCursor = frame >= startFrame && charCount < text.length;

  return (
    <span style={style}>
      {visibleText}
      {showCursor && (
        <span style={{ opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0 }}>|</span>
      )}
    </span>
  );
};
