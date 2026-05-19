import type { ReactNode } from "react";
import { useAuth, GoogleSignInButton } from "../auth";

export default function RequireAuth({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const { user, authError } = useAuth();
  if (user && !authError) return <>{children}</>;

  return (
    <div className="assistant">
      <header className="app-header">
        <div className="app-header-inner">
          <a href="/" className="app-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Agenlytics Labs</span>
          </a>
          <span className="app-subtitle">{label}</span>
          <a href="/" className="back-link">&larr; Home</a>
        </div>
      </header>
      <main className="app-main">
        <div className="auth-gate">
          {authError ? (
            <>
              <h2>Account not authorized</h2>
              <p className="auth-error">{authError}</p>
              <p>Sign in with a different Google account to continue.</p>
            </>
          ) : (
            <>
              <h2>Sign in to continue</h2>
              <p>Use your Google account to access {label}.</p>
            </>
          )}
          <GoogleSignInButton text="continue_with" size="large" />
        </div>
      </main>
    </div>
  );
}
