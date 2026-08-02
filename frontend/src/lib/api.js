import { API_URL } from "./config";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function raw(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error ?? res.statusText, res.status);
  }
  return data;
}

let refreshing = null;

function refresh() {
  if (!refreshing) {
    refreshing = raw("/auth/refresh", { method: "POST" }).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

// Authenticated request: on a 401, refreshes the access token once and
// retries, so a 15-minute-old access token doesn't bounce the user out.
async function authed(path, options) {
  try {
    return await raw(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await refresh();
      return raw(path, options);
    }
    throw err;
  }
}

export const api = {
  register: (email, password) =>
    raw("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email, password) =>
    raw("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => raw("/auth/logout", { method: "POST" }),
  me: () => authed("/auth/me"),
  refresh,
  forgotPassword: (email) =>
    raw("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token, password) =>
    raw("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  verifyEmail: (token) =>
    raw("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }),
  resendVerification: (email) =>
    raw("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) }),
};

export { ApiError };
