/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#10b981", // emerald-500 — primary brand
          light: "#6ee7b7",   // emerald-300 — light accent
          lighter: "#d1fae5", // emerald-100 — badges, backgrounds
          dark: "#059669",    // emerald-600 — hover state
          darker: "#047857",  // emerald-700 — active/pressed
        },
        accent: {
          DEFAULT: "#14b8a6", // teal-500 — secondary accent
          light: "#5eead4",   // teal-300
          dark: "#0d9488",    // teal-600
        },
        surface: {
          DEFAULT: "#0f172a", // slate-900 — main bg
          raised: "#1e293b",  // slate-800 — cards
          overlay: "#334155", // slate-700 — overlays
          hover: "#1e293b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        "fade-up": "fadeUp 620ms ease-out both",
        "fade-up-delay": "fadeUp 820ms ease-out both",
        "shimmer": "shimmer 2.5s ease-in-out infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "wave": "wave 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 35px rgba(16, 185, 129, 0.15)" },
          "50%": { boxShadow: "0 0 75px rgba(16, 185, 129, 0.3)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wave: {
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-6px)" },
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(16, 185, 129, 0.25)",
        "glow-lg": "0 0 40px rgba(16, 185, 129, 0.3)",
        "card": "0 8px 32px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 16px 48px rgba(16, 185, 129, 0.15)",
      },
    },
  },
  plugins: [],
};
