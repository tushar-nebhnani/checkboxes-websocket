import { useTheme } from "../context/ThemeContext";
import "./ThemeToggle.css";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.3" />
          <path
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            d="M8 .8v2M8 13.2v2M15.2 8h-2M2.8 8h-2M13.05 2.95l-1.4 1.4M4.35 11.65l-1.4 1.4M13.05 13.05l-1.4-1.4M4.35 4.35l-1.4-1.4"
          />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            fill="currentColor"
            d="M14 9.3A6 6 0 0 1 6.7 2a6.5 6.5 0 1 0 7.3 7.3Z"
          />
        </svg>
      )}
    </button>
  );
}
