// Base URL of the backend API/WebSocket server. Empty string means "same
// origin" (relative paths), which is what local dev relies on via the Vite
// proxy. Set VITE_API_URL when the frontend and backend are deployed on
// different domains.
export const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
