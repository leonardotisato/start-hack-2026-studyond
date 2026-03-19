export const theme = {
  colors: {
    background: "#FFFFFF",
    foreground: "#1A1A1A",
    primary: "#2B2B2B",
    primaryForeground: "#FBFBFB",
    muted: "#F5F5F5",
    mutedForeground: "#808080",
    border: "#ECECEC",

    // Node statuses
    nodeCompleted: "#10B981",
    nodeActive: "#3B82F6",
    nodeUpcoming: "#9CA3AF",
    nodeBlocked: "#EF4444",

    // Edges
    edgeActive: "#3B82F6",
    edgeSuggested: "#F59E0B",
    edgeDefault: "#D1D5DB",

    // AI gradient
    aiGradientFrom: "#8B5CF6",
    aiGradientVia: "#3B82F6",
    aiGradientTo: "#3B82F6",
  },

  fonts: {
    serif: "Crimson Text, Georgia, serif",
    sans: "Geist, system-ui, sans-serif",
  },

  radii: {
    sm: 6,
    md: 12,
    lg: 20,
  },
} as const;

export type Theme = typeof theme;
