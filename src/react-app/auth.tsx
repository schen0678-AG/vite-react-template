import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (
            el: HTMLElement,
            opts: Record<string, string | number | boolean>,
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  /** Server-side allowlist rejection message (null if no problem). */
  authError: string | null;
  signIn: () => void;
  signOut: () => void;
}

const STORAGE_KEY = "agenlytics_id_token";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GIS_SRC = "https://accounts.google.com/gsi/client";

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwtPayload(token: string): AuthUser | null {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(decodeURIComponent(escape(json))) as {
      sub: string;
      email?: string;
      name?: string;
      picture?: string;
      exp?: number;
    };
    if (claims.exp && claims.exp * 1000 < Date.now()) return null;
    return {
      sub: claims.sub,
      email: claims.email ?? "",
      name: claims.name ?? claims.email ?? "",
      picture: claims.picture,
    };
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  const t = localStorage.getItem(STORAGE_KEY);
  if (!t) return null;
  if (!decodeJwtPayload(t)) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  return t;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = getStoredToken();
    return t ? decodeJwtPayload(t) : null;
  });
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const pendingResolveRef = useRef<((ok: boolean) => void) | null>(null);

  // Confirm the token passes the server-side allowlist. If not, clear local
  // auth and surface the message so the gate / nav can show "not authorized".
  const verifyWithServer = useCallback(async (idToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        setAuthError(null);
        return true;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setAuthError(data.error || `Sign-in rejected (HTTP ${res.status})`);
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
      return false;
    } catch {
      setAuthError("Could not reach auth server");
      return false;
    }
  }, []);

  // On mount: if we already have a stored token, re-verify it server-side.
  useEffect(() => {
    const t = getStoredToken();
    if (t) verifyWithServer(t);
  }, [verifyWithServer]);

  // Load GIS script once.
  useEffect(() => {
    if (!CLIENT_ID) {
      console.warn(
        "[auth] VITE_GOOGLE_CLIENT_ID not set — sign-in is disabled. Set it in .env.local",
      );
      setReady(true);
      return;
    }
    if (document.querySelector(`script[src="${GIS_SRC}"]`)) {
      setReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);

  // Initialize GIS once it's loaded.
  useEffect(() => {
    if (!ready || !CLIENT_ID || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (resp) => {
        const claims = decodeJwtPayload(resp.credential);
        if (!claims) {
          pendingResolveRef.current?.(false);
          pendingResolveRef.current = null;
          return;
        }
        localStorage.setItem(STORAGE_KEY, resp.credential);
        setToken(resp.credential);
        setUser(claims);
        setAuthError(null);
        // Confirm allowlist server-side — surfaces 403 to UI if rejected.
        verifyWithServer(resp.credential);
        pendingResolveRef.current?.(true);
        pendingResolveRef.current = null;
      },
      auto_select: false,
      cancel_on_tap_outside: false,
    });
  }, [ready, verifyWithServer]);

  const signIn = useCallback(() => {
    if (!CLIENT_ID) {
      alert(
        "Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in .env.local and restart the dev server.",
      );
      return;
    }
    if (!window.google) return;
    window.google.accounts.id.prompt();
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setAuthError(null);
    window.google?.accounts.id.disableAutoSelect();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, ready, authError, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

interface GoogleButtonProps {
  text?: "signin_with" | "continue_with" | "signup_with";
  size?: "large" | "medium" | "small";
}

export function GoogleSignInButton({
  text = "continue_with",
  size = "large",
}: GoogleButtonProps) {
  const { ready } = useAuth();
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || !CLIENT_ID || !elRef.current || !window.google) return;
    elRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(elRef.current, {
      type: "standard",
      theme: "outline",
      size,
      text,
      shape: "rectangular",
      logo_alignment: "left",
    });
  }, [ready, size, text]);

  if (!CLIENT_ID) {
    return (
      <div className="auth-warning">
        Set <code>VITE_GOOGLE_CLIENT_ID</code> to enable Google sign-in.
      </div>
    );
  }
  return <div ref={elRef} />;
}
