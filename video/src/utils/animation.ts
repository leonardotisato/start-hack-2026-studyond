import { spring } from "remotion";

export const springConfigs = {
  nodePopIn: {
    mass: 0.5,
    damping: 12,
    stiffness: 200,
    overshootClamping: false,
  },
  gentle: { mass: 0.8, damping: 15, stiffness: 120, overshootClamping: false },
  snappy: { mass: 0.4, damping: 10, stiffness: 280, overshootClamping: true },
  slow: { mass: 1.2, damping: 20, stiffness: 80, overshootClamping: false },
} as const;

export function activePulse(frame: number): number {
  return 0.3 + 0.15 * Math.sin(frame * 0.15);
}
