import { useEffect, useState } from "react";
import { AuthShell } from "../components/AuthShell";
import { Brand } from "../components/Brand";
import { ApiError, api } from "../lib/api";
import "../styles/form.css";
import "./AuthPage.css";

export function VerifyEmailPage({ token, onDone }) {
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .verifyEmail(token)
      .then(() => setStatus("done"))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Something went wrong.");
        setStatus("error");
      });
  }, [token]);

  return (
    <AuthShell>
      <Brand size="sm" />
      <h2 className="auth-heading">Verifying</h2>

      {status === "pending" && (
        <p className="auth-sub">
          <span className="spinner" /> Confirming your address…
        </p>
      )}

      {status === "done" && (
        <div className="form-banner form-banner-success">
          Your email is verified.{" "}
          <a
            href="#continue"
            onClick={(e) => {
              e.preventDefault();
              onDone();
            }}
          >
            Continue.
          </a>
        </div>
      )}

      {status === "error" && <div className="form-banner form-banner-error">{error}</div>}
    </AuthShell>
  );
}
