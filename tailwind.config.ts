import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand — friendly health-green (Duolingo vibe).
        // All `belly-*` classes across the app inherit this palette.
        belly: {
          50: "#f2fce4",
          100: "#e4f8c8",
          200: "#c9f08f",
          300: "#a6e35a",
          400: "#84d62f",
          500: "#58cc02",
          600: "#46a302",
          700: "#3a8500",
        },
        // Energetic yellow accent — XP, rewards, "perfect" celebration.
        sun: {
          50: "#fffbeb",
          100: "#fff3c4",
          200: "#ffe88a",
          300: "#ffdd4d",
          400: "#ffd029",
          500: "#ffc800",
          600: "#e0a800",
          700: "#b88400",
        },
        // Macro identity colors (kept in sync with MACROS in src/lib/macros.ts)
        cal: "#ffc800",
        protein: "#fb7185",
        carbs: "#38bdf8",
        fats: "#a78bfa",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // 3D "clicky" bottom edges — the Duolingo button look.
        pop: "0 4px 0 0 rgba(15,23,42,0.12)",
        "pop-green": "0 4px 0 0 #3a8500",
        "pop-sun": "0 4px 0 0 #e0a800",
        card: "0 6px 0 0 rgba(70,163,2,0.08), 0 18px 30px -20px rgba(15,23,42,0.25)",
        soft: "0 10px 30px -12px rgba(15, 23, 42, 0.12)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "4xl": "2.25rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.8) translateY(10px)" },
          "60%": { opacity: "1", transform: "scale(1.05) translateY(-3px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-7deg)" },
          "50%": { transform: "rotate(7deg)" },
        },
        "pulse-glow": {
          "0%,100%": { filter: "drop-shadow(0 0 0 rgba(255,200,0,0))" },
          "50%": { filter: "drop-shadow(0 0 9px rgba(255,200,0,0.7))" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "pop-in": "pop-in 0.18s ease-out",
        "bounce-in": "bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        wiggle: "wiggle 0.5s ease-in-out",
        "pulse-glow": "pulse-glow 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
