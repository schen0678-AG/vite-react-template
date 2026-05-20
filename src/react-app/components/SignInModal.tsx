import { GoogleSignInButton } from "../auth";

export default function SignInModal({
  destination,
  authError,
  onClose,
}: {
  destination: string;
  authError: string | null;
  onClose: () => void;
}) {
  const label =
    destination === "/assistant"
      ? "Personal Assistant"
      : destination === "/crm"
        ? "Voice CRM"
        : destination === "/dashboard"
          ? "Dashboard"
          : "this use case";

  return (
    <div className="signin-modal-backdrop" onClick={onClose}>
      <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="signin-modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        {authError ? (
          <>
            <h3>Account not authorized</h3>
            <p className="auth-error">{authError}</p>
            <p>Sign in with a different Google account to continue.</p>
          </>
        ) : (
          <>
            <h3>Sign in to try {label}</h3>
            <p>We use Google sign-in — no password to remember.</p>
          </>
        )}
        <div className="signin-modal-button">
          <GoogleSignInButton text="continue_with" size="large" />
        </div>
        <p className="signin-modal-fine">
          By continuing you agree to let Agenlytics Labs see your basic profile info (name, email).
        </p>
      </div>
    </div>
  );
}
