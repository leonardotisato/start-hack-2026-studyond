import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { AppFrame } from "../components/AppFrame";
import { DagGraph } from "../graph/DagGraph";
import { FadeIn } from "../components/FadeIn";
import { initialLayout } from "../graph/graph-data";
import { NodeStatus } from "../graph/types";
import { geist } from "../utils/fonts";

export const GraphReveal: React.FC = () => {
  const frame = useCurrentFrame();

  // Progressive status reveal
  const progress = interpolate(frame, [30, 350], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const animatedNodes = initialLayout.nodes.map((node, i) => {
    const threshold = i / initialLayout.nodes.length;
    const status: NodeStatus =
      progress > threshold + 0.15
        ? "completed"
        : progress > threshold
          ? "active"
          : "upcoming";
    return { ...node, status };
  });

  const animatedLayout = { ...initialLayout, nodes: animatedNodes };

  return (
    <AppFrame>
      <div
        style={{
          padding: "40px 60px",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header */}
        <FadeIn delay={5} direction="left">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${theme.colors.aiGradientFrom}, ${theme.colors.aiGradientVia})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 18,
                fontWeight: 700,
                fontFamily: geist,
              }}
            >
              L
            </div>
            <div style={{ fontFamily: geist }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: theme.colors.foreground }}>
                Lena M. — MSc AI, ETH Zurich
              </div>
              <div style={{ fontSize: 14, color: theme.colors.mutedForeground }}>
                ML Pipeline for Fintech Partner
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Graph */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <DagGraph
            layout={animatedLayout}
            width={1780}
            height={500}
            baseDelay={15}
            nodeDelayStep={8}
            edgeDelayStep={5}
          />
        </div>

        {/* Legend */}
        <FadeIn delay={200} direction="up">
          <div
            style={{
              display: "flex",
              gap: 28,
              justifyContent: "center",
              fontFamily: geist,
              fontSize: 13,
              color: theme.colors.mutedForeground,
            }}
          >
            {[
              { color: theme.colors.nodeCompleted, label: "Completed" },
              { color: theme.colors.nodeActive, label: "Active" },
              { color: theme.colors.nodeUpcoming, label: "Upcoming" },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: color,
                  }}
                />
                {label}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </AppFrame>
  );
};
