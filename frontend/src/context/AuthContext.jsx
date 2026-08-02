import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

// Refresh a bit before the 15-minute access token actually expires.
const SILENT_REFRESH_MS = 13 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  const scheduleRefresh = useCallback(() => {
    clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(() => {
      api.refresh().catch(() => {
        clearInterval(refreshTimer.current);
        setUser(null);
      });
    }, SILENT_REFRESH_MS);
  }, []);

  useEffect(() => {
    api
      .me()
      .then((data) => {
        setUser(data.user);
        scheduleRefresh();
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    return () => clearInterval(refreshTimer.current);
  }, [scheduleRefresh]);

  const login = useCallback(
    async (email, password) => {
      const { user: loggedIn } = await api.login(email, password);
      setUser(loggedIn);
      scheduleRefresh();
      return loggedIn;
    },
    [scheduleRefresh],
  );

  const register = useCallback(
    async (email, password) => {
      const { user: created } = await api.register(email, password);
      setUser(created);
      scheduleRefresh();
      return created;
    },
    [scheduleRefresh],
  );

  const logout = useCallback(async () => {
    clearInterval(refreshTimer.current);
    await api.logout().catch(() => {});
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await api.me();
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
