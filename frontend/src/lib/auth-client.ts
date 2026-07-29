import { createAuthClient } from "better-auth/react";

const API_URL = import.meta.env.VITE_API_URL || "";
export const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    credentials: "include",
  },
});

export async function refreshSession() {
  const { data, error } = await authClient.getSession();
  console.log("[refreshSession] response:", { data, error });
}
