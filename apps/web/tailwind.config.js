/** @type {import('tailwindcss').Config} */
function withOpacity(varName) {
  return ({ opacityValue }) =>
    opacityValue === undefined ? `rgb(var(${varName}))` : `rgb(var(${varName}) / ${opacityValue})`;
}

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Clash Display'", "'Space Grotesk'", "sans-serif"],
        sans: ["'Space Grotesk'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        // Semantic, theme-aware tokens — backed by CSS vars in index.css so light/dark
        // (and any opacity modifier, e.g. bg-panel/60) resolve automatically.
        ink: withOpacity("--c-bg"),
        surface: withOpacity("--c-surface"),
        panel: withOpacity("--c-panel"),
        edge: withOpacity("--c-edge"),
        fg: withOpacity("--c-fg"),
        haze: withOpacity("--c-haze"),
        wisp: withOpacity("--c-wisp"),
        signal: withOpacity("--c-signal"),
        signal2: withOpacity("--c-signal2"),
        amber: withOpacity("--c-amber"),
        coral: withOpacity("--c-coral"),
        onaccent: withOpacity("--c-on-accent"),
      },
      boxShadow: {
        glow: "0 0 40px -8px rgb(var(--c-signal) / 0.35)",
        glow2: "0 0 40px -8px rgb(var(--c-signal2) / 0.35)",
        card: "0 8px 30px -12px rgb(var(--c-shadow) / var(--shadow-strength))",
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgb(var(--c-fg) / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--c-fg) / 0.05) 1px, transparent 1px)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        float2: "float 8s ease-in-out infinite",
        "float-slow": "float 11s ease-in-out infinite",
        drift: "drift 20s linear infinite",
        pulseSoft: "pulseSoft 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-18px) rotate(3deg)" },
        },
        drift: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 0.6 },
          "50%": { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
