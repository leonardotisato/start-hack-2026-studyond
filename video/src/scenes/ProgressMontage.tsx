import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { AppFrame } from "../components/AppFrame";
import { DagGraph } from "../graph/DagGraph";
import { WeekCounter } from "../components/WeekCounter";
import { getProgressNodes, restructuredEdges, TOTAL_WEEKS } from "../graph/graph-data";

export const ProgressMontage: React.FC = () => {
  const frame = useCurrentFrame();
  const totalFrames = 270; // 1680-1949 = 270 frames for this scene

  // Map frame to week index
  const weekIndex = Math.floor(
    interpolate(
      frame,
      [10, totalFrames - 10],
      [0, TOTAL_WEEKS - 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    )
  );

  const currentNodes = getProgressNodes(weekIndex);
  const layout = { nodes: currentNodes, edges: restructuredEdges };

  return (
    <AppFrame>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "20px 40px",
        }}
      >
        <WeekCounter
          startFrame={10}
          endFrame={totalFrames - 10}
          totalWeeks={TOTAL_WEEKS}
        />

        <DagGraph
          layout={layout}
          width={1800}
          height={560}
          baseDelay={0}
          nodeDelayStep={0}
          edgeDelayStep={0}
        />
      </div>
    </AppFrame>
  );
};
