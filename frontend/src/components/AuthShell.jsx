import { BoardBackdrop } from "./BoardBackdrop";
import { ThemeToggle } from "./ThemeToggle";
import "./AuthShell.css";

export function AuthShell({ children }) {
  return (
    <div className="auth-shell">
      <BoardBackdrop />
      <div className="auth-shell-veil" />
      <div className="auth-shell-toggle">
        <ThemeToggle />
      </div>
      <div className="auth-card">{children}</div>
    </div>
  );
}
