import React from "react";
import { useCurrentFrame, interpolate, spring } from "remotion";
import { theme } from "../theme";
import { AppFrame } from "../components/AppFrame";
import { ChatPanel } from "../components/ChatPanel";
import { DagGraph } from "../graph/DagGraph";
import { initialLayout, restructuredLayout } from "../graph/graph-data";
import { interpolateLayout } from "../graph/useGraphLayout";
import { NodeStatus } from "../graph/types";
import { geist } from "../utils/fonts";

// Chat messages with frame-based delays
const chatMessages = [
  {
    role: "user" as const,
    text: "I need a data augmentation step before model training. Can you add that?",
    delay: 20,
    typewriter: false,
  },
  {
    role: "assistant" as const,
    text: "I'll add a Data Augmentation node between Data Pipeline Design and Model Training. This will ensure your training data is diverse enough for robust model performance.",
    delay: 80,
    typewriter: true,
  },
  {
    role: "assistant" as const,
    text: "Here's the proposed modification to your thesis graph. Accept to apply changes.",
    delay: 200,
    typewriter: true,
  },
];

// Accept button appears at frame 280
const ACCEPT_FRAME = 280;
// Restructure animation starts at frame 320
const RESTRUCTURE_START = 320;
const RESTRUCTURE_DURATION = 120;

export const AiChatRestructure: React.FC = () => {
  const frame = useCurrentFrame();

  // Before restructure: show initial layout with some completed
  const preRestructureNodes = initialLayout.nodes.map((node) => {
    const completedIds = ["problem", "litreview", "pipeline"];
    const activeIds = ["feature"];
    const status: NodeStatus = completedIds.includes(node.id)
      ? "completed"
      : activeIds.includes(node.id)
        ? "active"
        : "upcoming";
    return { ...node, status };
  });

  const preLayout = { ...initialLayout, nodes: preRestructureNodes };

  // Interpolate layout during restructure
  const restructureProgress = interpolate(
    frame,
    [RESTRUCTURE_START, RESTRUCTURE_START + RESTRUCTURE_DURATION],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const currentLayout =
    frame < RESTRUCTURE_START
      ? preLayout
      : interpolateLayout(preLayout, restructuredLayout, restructureProgress);

  // Accept button animation
  const acceptOpacity = interpolate(
    frame,
    [ACCEPT_FRAME, ACCEPT_FRAME + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const acceptClick = frame >= RESTRUCTURE_START;
  const checkmarkOpacity = spring({
    frame: frame - RESTRUCTURE_START,
    fps: 30,
    config: { mass: 0.5, damping: 12, stiffness: 200 },
    durationInFrames: 15,
  });

  return (
    <AppFrame>
      <div
        style={{
          display: "flex",
          height: "100%",
          padding: 30,
          gap: 30,
        }}
      >
        {/* Chat panel on left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ChatPanel messages={chatMessages} width={420} height={560} />

          {/* Accept button */}
          <div
            style={{
              opacity: acceptOpacity,
              width: 420,
              padding: "14px 0",
              borderRadius: theme.radii.md,
              background: acceptClick
                ? theme.colors.nodeCompleted
                : `linear-gradient(135deg, ${theme.colors.aiGradientFrom}, ${theme.colors.aiGradientVia})`,
              color: "white",
              fontFamily: geist,
              fontSize: 15,
              fontWeight: 600,
              textAlign: "center" as const,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {acceptClick ? (
              <>
                <span style={{ opacity: checkmarkOpacity }}>&#10003;</span>
                Applied
              </>
            ) : (
              "Accept Modification"
            )}
          </div>
        </div>

        {/* Graph on right */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DagGraph
            layout={currentLayout}
            width={1400}
            height={560}
            baseDelay={0}
            nodeDelayStep={0}
            edgeDelayStep={0}
            showNewNodes={frame >= RESTRUCTURE_START ? ["augment"] : []}
          />
        </div>
      </div>
    </AppFrame>
  );
};
