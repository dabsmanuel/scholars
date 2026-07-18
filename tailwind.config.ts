import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        "paper-alt": "#F0F6FF",
        surface: "#F8FAFF",
        ink: "#0F172A",
        "ink-soft": "#334155",
        slate: "#64748B",
        brass: "#D97706",
        "brass-light": "#F59E0B",
        forest: "#2563EB",
        "forest-light": "#3B82F6",
        rule: "#E2E8F0",
        "rule-strong": "#CBD5E1",
        alert: "#DC2626",
        navy: "#0D1B2A",
        indigo: "#EEF2FF",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 2px 4px 0 rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.08), 0 8px 24px 0 rgba(0,0,0,0.06)",
        "focus-ring": "0 0 0 3px rgba(37,99,235,0.12)",
        "btn": "0 2px 8px rgba(37,99,235,0.3)",
      },
      borderRadius: {
        none: "0px",
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
        full: "9999px",
      },
      transitionDuration: {
        "150": "150ms",
      },
    },
  },
  plugins: [],
};

export default config;
