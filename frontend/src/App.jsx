import { AuthShell } from "./components/AuthShell";
import { Brand } from "./components/Brand";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthPage } from "./pages/AuthPage";
import { BoardPage } from "./pages/BoardPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import "./styles/form.css";

function goHome() {
  window.history.replaceState({}, "", "/");
  window.location.reload();
}

function Gate() {
  const { user, loading } = useAuth();
  const path = window.location.pathname;
  const token = new URLSearchParams(window.location.search).get("token");

  if (path === "/verify-email" && token) {
    return <VerifyEmailPage token={token} onDone={goHome} />;
  }

  if (path === "/reset-password" && token) {
    return <ResetPasswordPage token={token} onDone={goHome} />;
  }

  if (loading) {
    return (
      <AuthShell>
        <Brand size="sm" />
        <p className="auth-sub" style={{ marginTop: 24 }}>
          <span className="spinner" /> Loading…
        </p>
      </AuthShell>
    );
  }

  return user ? <BoardPage /> : <AuthPage />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
