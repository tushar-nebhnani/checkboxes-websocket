import { useState } from "react";
import { AuthShell } from "../components/AuthShell";
import { Brand } from "../components/Brand";
import { ApiError, api } from "../lib/api";
import "../styles/form.css";
import "./AuthPage.css";

export function ResetPasswordPage({ token, onDone }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <Brand size="sm" />
      <h2 className="auth-heading">New passphrase</h2>
      <p className="auth-sub">Choose a new passphrase for your seat.</p>

      {error && <div className="form-banner form-banner-error">{error}</div>}

      {done ? (
        <div className="form-banner form-banner-success">
          Your passphrase has been reset.{" "}
          <a
            href="#continue"
            onClick={(e) => {
              e.preventDefault();
              onDone();
            }}
          >
            Continue to sign in.
          </a>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="password">New passphrase</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••••"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : "Reset passphrase"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
