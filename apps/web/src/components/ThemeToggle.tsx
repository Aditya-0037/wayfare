import { useTheme } from "../lib/useTheme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-edge/15 bg-panel/60 text-sm transition hover:border-edge/30 hover:bg-panel active:scale-95"
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}
