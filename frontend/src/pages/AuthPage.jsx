import { useState } from "react";
import { AuthShell } from "../components/AuthShell";
import { Brand } from "../components/Brand";
import { PasswordVisibilityToggle } from "../components/PasswordVisibilityToggle";
import { useAuth } from "../context/AuthContext";
import { ApiError, api } from "../lib/api";
import "../styles/form.css";
import "./AuthPage.css";

const MODES = { SIGN_IN: "sign-in", SIGN_UP: "sign-up", FORGOT: "forgot" };

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(MODES.SIGN_IN);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setNotice("");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === MODES.SIGN_IN) {
        await login(email, password);
      } else if (mode === MODES.SIGN_UP) {
        await register(email, password);
      } else {
        const res = await api.forgotPassword(email);
        setNotice(res?.message ?? "If that email is registered, a reset link has been sent.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const heading =
    mode === MODES.SIGN_IN
      ? "Enter the field"
      : mode === MODES.SIGN_UP
        ? "Take your place"
        : "Recover your passphrase";

  const sub =
    mode === MODES.FORGOT
      ? "We'll send a reset link to your address."
      : "Your marks are kept, and shown to everyone at once.";

  return (
    <AuthShell>
      <Brand size="sm" />
      <h2 className="auth-heading">{heading}</h2>
      <p className="auth-sub">{sub}</p>

      {error && <div className="form-banner form-banner-error">{error}</div>}
      {notice && <div className="form-banner form-banner-success">{notice}</div>}

      {!notice && (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@domain"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== MODES.FORGOT && (
            <div className="field">
              <div className="field-row">
                <label htmlFor="password">Passphrase</label>
                {mode === MODES.SIGN_IN && (
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      switchMode(MODES.FORGOT);
                    }}
                  >
                    Forgotten?
                  </a>
                )}
              </div>
              <div className="field-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  autoComplete={mode === MODES.SIGN_UP ? "new-password" : "current-password"}
                  minLength={mode === MODES.SIGN_UP ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <PasswordVisibilityToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              </div>
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? (
              <span className="spinner" />
            ) : mode === MODES.SIGN_IN ? (
              "Enter"
            ) : mode === MODES.SIGN_UP ? (
              "Request a seat"
            ) : (
              "Send reset link"
            )}
          </button>
        </form>
      )}

      <p className="auth-switch">
        {mode === MODES.SIGN_IN && (
          <>
            No seat yet?{" "}
            <a
              href="#sign-up"
              onClick={(e) => {
                e.preventDefault();
                switchMode(MODES.SIGN_UP);
              }}
            >
              Take one.
            </a>
          </>
        )}
        {mode === MODES.SIGN_UP && (
          <>
            Already seated?{" "}
            <a
              href="#sign-in"
              onClick={(e) => {
                e.preventDefault();
                switchMode(MODES.SIGN_IN);
              }}
            >
              Sign in.
            </a>
          </>
        )}
        {mode === MODES.FORGOT && (
          <a
            href="#sign-in"
            onClick={(e) => {
              e.preventDefault();
              switchMode(MODES.SIGN_IN);
            }}
          >
            Back to sign in.
          </a>
        )}
      </p>
    </AuthShell>
  );
}
