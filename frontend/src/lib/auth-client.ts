import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8800",
  fetchOptions: {
    credentials: "include",
  },
});

/**
 * Helper to refetch the session — call this after sign-in/sign-up
 * to populate the session store without a full page reload.
 */
export async function refreshSession() {
  await authClient.getSession({
    query: { disableCookieCache: true },
  });
}
