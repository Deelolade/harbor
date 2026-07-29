const API_URL = import.meta.env.VITE_API_URL || "";
const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

export async function signInWithPopup(provider: "google" | "github") {
  const callbackURL = `${FRONTEND_URL}/workspace`;

  // Step 1: POST to better-auth to get the authorization URL
  const res = await fetch(`${API_URL}/api/auth/sign-in/social`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      callbackURL,
      newUserCallbackURL: callbackURL,
      disableRedirect: true,
    }),
    credentials: "include",
  });

  if (!res.ok) {
    // Fall back to redirect
    window.location.href = `${API_URL}/api/auth/sign-in/social?provider=${provider}`;
    return;
  }

  const data = await res.json();
  const authUrl = data.url;

  if (!authUrl) {
    window.location.href = `${API_URL}/api/auth/sign-in/social?provider=${provider}`;
    return;
  }

  // Step 2: Open the provider's auth page in a popup
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    authUrl,
    "oauth-popup",
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  if (!popup) {
    window.location.href = authUrl;
    return;
  }

  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        resolve();
        return;
      }
      try {
        if (popup.location.href.startsWith(FRONTEND_URL)) {
          popup.close();
          clearInterval(interval);
          resolve();
        }
      } catch {
        // cross-origin until redirect reaches our domain
      }
    }, 500);
  });
}
