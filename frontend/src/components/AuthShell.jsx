import { ThemeToggle } from "./ThemeToggle";
import "./AuthShell.css";

export function AuthShell({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell-grid" />
      <div className="auth-shell-toggle">
        <ThemeToggle />
      </div>
      <div className="auth-card">{children}</div>
    </div>
  );
}
