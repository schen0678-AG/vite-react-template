import { useEffect, useState, type MouseEvent } from "react";
import { useAuth } from "../auth";
import SignInModal from "./SignInModal";

// Shared guarded-navigation: "Try" links require sign-in. If the user isn't
// signed in, clicking pops the sign-in modal instead of navigating; once
// signed in (and allowlisted), we navigate to the intended page.
export function useGuardedNav() {
  const { user, authError } = useAuth();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authError && pendingHref) {
      const href = pendingHref;
      setPendingHref(null);
      window.location.href = href;
    }
  }, [user, authError, pendingHref]);

  const guard = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (user) return; // signed in → let the link navigate
    e.preventDefault();
    setPendingHref(href);
  };

  const modal = pendingHref ? (
    <SignInModal
      destination={pendingHref}
      authError={authError}
      onClose={() => setPendingHref(null)}
    />
  ) : null;

  return { guard, modal };
}

export default function NavBar() {
  const { user, signOut } = useAuth();
  const { guard, modal } = useGuardedNav();

  return (
    <>
      <nav className="nav">
        <div className="nav-container">
          <a href="/" className="nav-logo">
            <span className="logo-icon">A</span>
            <span className="logo-text">Agenlytics Labs</span>
          </a>
          <div className="nav-links">
            <a href="/#platform">Data &amp; Agent Fusion Platform</a>
            <a href="/agents">Meet the Agent Team</a>
            <a href="/security">Security</a>
            <a href="/crm" onClick={guard("/crm")}>Try Voice CRM</a>
            <a href="/assistant" onClick={guard("/assistant")} className="nav-cta">
              Try Personal Assistant
            </a>
            {user ? (
              <span className="nav-user" title={user.email}>
                {user.picture && (
                  <img
                    src={user.picture}
                    alt=""
                    className="nav-user-avatar"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="nav-user-name">{user.name.split(" ")[0]}</span>
                <button className="nav-user-signout" onClick={signOut}>
                  Sign out
                </button>
              </span>
            ) : null}
          </div>
        </div>
      </nav>
      {modal}
    </>
  );
}
