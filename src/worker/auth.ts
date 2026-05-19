import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { MiddlewareHandler } from "hono";

const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

// Cached at module scope. createRemoteJWKSet handles its own internal caching
// of fetched keys with a sensible TTL, and the Workers runtime keeps modules
// warm between requests on the same isolate.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(JWKS_URL));
  return jwks;
}

export interface GoogleUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export type AuthedVars = { user: GoogleUser };

// Routes that should remain public (no Authorization header required).
function isPublic(method: string, path: string): boolean {
  if (path === "/api/" || path === "/api") return true; // health probe
  return false;
}

// Comma-separated allowlist. Empty/unset → any signed-in Google user is allowed.
// Domain entries (e.g. "@yourco.com") allowlist a whole Workspace/Gmail domain.
function isEmailAllowed(email: string, allowedEmails: string | undefined): boolean {
  const list = (allowedEmails ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return true;
  const e = email.toLowerCase();
  return list.some((entry) =>
    entry.startsWith("@") ? e.endsWith(entry) : e === entry,
  );
}

export function googleAuth(): MiddlewareHandler<{
  Bindings: Env;
  Variables: AuthedVars;
}> {
  return async (c, next) => {
    if (!c.req.path.startsWith("/api/")) return next();
    if (isPublic(c.req.method, c.req.path)) return next();

    const clientId = c.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return c.json(
        { error: "Server missing GOOGLE_CLIENT_ID — set it in .dev.vars or via wrangler secret put" },
        500,
      );
    }

    const header = c.req.header("Authorization") || "";
    const m = header.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      return c.json({ error: "Missing bearer token" }, 401);
    }

    let payload: JWTPayload;
    try {
      const verified = await jwtVerify(m[1], getJwks(), {
        issuer: ISSUERS,
        audience: clientId,
      });
      payload = verified.payload;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "invalid token";
      return c.json({ error: `Auth failed: ${msg}` }, 401);
    }

    if (!payload.sub) return c.json({ error: "Token missing sub" }, 401);

    const email = (payload as { email?: string }).email ?? "";
    const emailVerified = (payload as { email_verified?: boolean }).email_verified === true;

    // Require Google to have verified the email (otherwise anyone could claim
    // someone else's address via a custom OIDC payload).
    if (!emailVerified) {
      return c.json({ error: "Email not verified with Google" }, 403);
    }
    if (!isEmailAllowed(email, c.env.ALLOWED_EMAILS)) {
      return c.json(
        { error: `Account ${email} is not authorized to access this app.` },
        403,
      );
    }

    c.set("user", {
      sub: payload.sub,
      email,
      name: (payload as { name?: string }).name ?? "",
      picture: (payload as { picture?: string }).picture,
    });
    await next();
  };
}
