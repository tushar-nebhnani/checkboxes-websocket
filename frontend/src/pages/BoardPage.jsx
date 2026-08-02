import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import "./BoardPage.css";

const TOTAL = 1008;
const COLUMNS = 42;
const FLASH_MS = 750;

export function BoardPage() {
  const { user, logout } = useAuth();
  const [checkboxes, setCheckboxes] = useState(() => new Array(TOTAL).fill(false));
  const [connected, setConnected] = useState(false);
  const [flashed, setFlashed] = useState(() => new Set());
  const [resendState, setResendState] = useState("idle");
  const [verifyBannerDismissed, setVerifyBannerDismissed] = useState(false);
  const socketRef = useRef(null);
  const flashTimers = useRef(new Map());

  const flash = (idx) => {
    setFlashed((prev) => new Set(prev).add(idx));
    clearTimeout(flashTimers.current.get(idx));
    flashTimers.current.set(
      idx,
      setTimeout(() => {
        setFlashed((prev) => {
          const next = new Set(prev);
          next.delete(idx);
          return next;
        });
      }, FLASH_MS),
    );
  };

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("server:checkbox:change", ({ idx, checked }) => {
      setCheckboxes((prev) => {
        const next = prev.slice();
        next[idx] = checked;
        return next;
      });
      flash(idx);
    });

    fetch("/checkboxes")
      .then((res) => res.json())
      .then((data) => {
        if (data?.checkboxes) setCheckboxes(data.checkboxes);
      });

    const timers = flashTimers.current;
    return () => {
      socket.disconnect();
      for (const timer of timers.values()) clearTimeout(timer);
    };
  }, []);

  const handleToggle = (idx) => {
    const checked = !checkboxes[idx];
    setCheckboxes((prev) => {
      const next = prev.slice();
      next[idx] = checked;
      return next;
    });
    flash(idx);
    socketRef.current?.emit("client:checkbox:change", { idx, checked });
  };

  const marked = useMemo(() => checkboxes.reduce((n, v) => n + (v ? 1 : 0), 0), [checkboxes]);
  const pct = ((marked / TOTAL) * 100).toFixed(1);

  async function handleResend() {
    setResendState("busy");
    try {
      await api.resendVerification(user.email);
      setResendState("sent");
    } catch {
      setResendState("idle");
    }
  }

  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="board">
      <div className="board-grid-bg" />

      <header className="board-header">
        <div className="board-header-left">
          <span className="brand-mark" />
          <span className="board-brand-name">Checkboxes</span>
        </div>
        <div className="board-header-right">
          <a
            className="board-icon-link"
            href="https://github.com/tushar-nebhnani/checkboxes-websocket"
            target="_blank"
            rel="noreferrer"
            title="View the repository"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
          <span className="board-divider" />
          <div className="board-live">
            <span className={`board-live-dot ${connected ? "" : "board-live-dot-off"}`} />
            <span>{connected ? "Live" : "Reconnecting…"}</span>
          </div>
          <span className="board-divider" />
          <ThemeToggle />
          <span className="board-divider" />
          <div className="board-user">
            <span className="board-avatar">{initial}</span>
            <span className="board-user-email">{user?.email}</span>
          </div>
          <button className="board-signout" type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      {user && !user.emailVerified && !verifyBannerDismissed && (
        <div className="board-verify-banner">
          <span>Verify your email to keep your seat.</span>
          <button type="button" onClick={handleResend} disabled={resendState !== "idle"}>
            {resendState === "sent" ? "Sent" : resendState === "busy" ? "Sending…" : "Resend link"}
          </button>
          <button
            type="button"
            className="board-verify-banner-close"
            aria-label="Dismiss"
            onClick={() => setVerifyBannerDismissed(true)}
          >
            ×
          </button>
        </div>
      )}

      <section className="board-hero">
        <div className="board-hero-copy">
          <h1>Checkboxes</h1>
          <p>One thousand and eight boxes, kept in common. Every mark is seen at once, by everyone present.</p>
        </div>
        <div className="board-hero-stats">
          <div className="board-hero-figure">
            <span className="board-hero-marked">{marked}</span>
            <span className="board-hero-total">/ {TOTAL.toLocaleString()}</span>
          </div>
          <div className="board-hero-bar">
            <div className="board-hero-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="board-hero-pct">{pct}% marked</span>
        </div>
      </section>

      <section className="board-panel-wrap">
        <div className="board-panel">
          <div
            className="board-cells"
            style={{ gridTemplateColumns: `repeat(${COLUMNS}, 16px)` }}
          >
            {checkboxes.map((checked, idx) => (
              <div
                key={idx}
                className={`board-cell ${checked ? "board-cell-on" : ""} ${
                  flashed.has(idx) ? "board-cell-flash" : ""
                }`}
                onClick={() => handleToggle(idx)}
              />
            ))}
          </div>
          <div className="board-panel-footer">
            <span>
              Field 01 · {COLUMNS} × {TOTAL / COLUMNS}
            </span>
            <span>{connected ? "Synchronised" : "Reconnecting…"}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
