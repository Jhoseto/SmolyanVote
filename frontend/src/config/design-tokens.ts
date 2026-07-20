/**
 * Canonical design tokens — mirror of DESIGN_BRIEF.md §13.
 * TS source of truth for JS-land usage (Framer Motion, inline styles, charts).
 * CSS variables live in `app/globals.css`; keep both in sync.
 */

export const smolyanVoteTokens = {
  colors: {
    primary: {
      DEFAULT: "#19861c",
      foreground: "#ffffff",
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#86efac",
      300: "#48a24c",
      400: "#4cb15c",
      500: "#19861c",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },
    gold: {
      400: "#d4b973",
      500: "#c9a961",
      600: "#b8954d",
      800: "#7d6028",
    },
    text: {
      primary: "#2c3e50",
      heading: "#1a202c",
      secondary: "#5a6c7d",
      muted: "#6c757d",
    },
    surface: {
      white: "#ffffff",
      light: "#f8f9fa",
      muted: "#f0f2f5",
    },
    border: "#e4e6ea",
    semantic: {
      success: "#22c55e",
      error: "#ef4444",
      warning: "#f59e0b",
      info: "#3b82f6",
    },
  },
  gradients: {
    primary: "linear-gradient(135deg, #19861c 0%, #48a24c 100%)",
    hero: "linear-gradient(135deg, #0F7B59 0%, #4CAF50 100%)",
  },
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    body: ["Source Sans 3", "system-ui", "sans-serif"],
    ui: ["IBM Plex Sans", "system-ui", "sans-serif"],
    display: ["Manrope", "Inter", "sans-serif"],
  },
  borderRadius: {
    sm: "8px",
    md: "12px",
    lg: "20px",
    xl: "28px",
    pill: "999px",
  },
  boxShadow: {
    navbar: "0 2px 15px rgba(0,0,0,0.08)",
    promo: "0 18px 45px rgba(15,118,110,0.18)",
  },
  motion: {
    durationFast: 0.18,
    durationNormal: 0.3,
    durationSlow: 1.2,
    easeOutQuart: [0.25, 1, 0.5, 1] as const,
    easeOutExpo: [0.19, 1, 0.22, 1] as const,
  },
} as const;

export type SmolyanVoteTokens = typeof smolyanVoteTokens;
