import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F2EFE6",
        ink: "#13202E",
        "ink-soft": "#3C4A56",
        slate: "#5C6773",
        brass: "#8C6A2F",
        "brass-light": "#B9924C",
        forest: "#1E4638",
        "forest-light": "#2E6650",
        rule: "#D8D2C1",
        alert: "#8A3324",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        none: "0px",
        card: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
