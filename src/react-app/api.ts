import { getStoredToken } from "./auth";

// Install once at app boot. Any same-origin /api/* request automatically gets
// Authorization: Bearer <id_token> if the user is signed in. This lets every
// component keep calling plain `fetch(...)` without touching call sites.
let installed = false;
export function installAuthedFetch() {
  if (installed) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const isApi = url.startsWith("/api/") || url.includes(`${location.origin}/api/`);
    if (!isApi) return originalFetch(input, init);

    const token = getStoredToken();
    if (!token) return originalFetch(input, init);

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return originalFetch(input, { ...init, headers });
  };
}
