import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { signIn, signUp, signInWithGoogle, ApiError } from "../lib/api";
import { supabaseAuthEnabled } from "../lib/supabase";
import PrimaryButton from "../components/PrimaryButton";

/**
 * Sign in / sign up. "Continue with Google" is the default (identity only —
 * openid/email/profile, NOT Gmail access; connecting an inbox is a separate
 * consent). Email/password is kept as a secondary option. Google requires
 * Supabase auth to be configured; otherwise only the email form shows.
 */
export default function SignIn() {
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as {
    next?: string;
    connectFlow?: boolean;
  };
  const next = state.next ?? "/feed";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle(next); // redirects to Google; returns via /auth/callback
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start Google sign-in.");
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        await signUp(email, password);
        await signIn(email, password).catch(() => {});
      } else {
        await signIn(email, password);
      }
      navigate(next, { state: { connectFlow: state.connectFlow }, replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="pt-2">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-label font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="mb-4 text-h2 font-bold text-ink">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>

      <div>
        <div className="flex items-center gap-2 rounded-card bg-primary-tint/60 p-3">
          <Lock size={18} className="shrink-0 text-primary" />
          <p className="text-caption text-ink">
            Your account secures your connected inbox. We never see your password.
          </p>
        </div>

        {supabaseAuthEnabled && (
          <>
            <button
              type="button"
              onClick={withGoogle}
              disabled={busy}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2.5 rounded-button border border-hairline bg-card text-label font-semibold text-ink shadow-card transition-colors active:bg-surface disabled:opacity-50"
            >
              <GoogleG />
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-caption text-ink-muted">
              <span className="h-px flex-1 bg-hairline" />
              or use email
              <span className="h-px flex-1 bg-hairline" />
            </div>
          </>
        )}

        <form onSubmit={submit}>
          <label className="block text-label font-semibold text-ink">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-button border border-hairline bg-card px-3.5 text-label text-ink outline-none focus:border-primary"
            />
          </label>

          <label className="mt-4 block text-label font-semibold text-ink">
            Password
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-button border border-hairline bg-card px-3.5 text-label text-ink outline-none focus:border-primary"
            />
          </label>

          {error && <p className="mt-3 text-caption text-accent-pressed">{error}</p>}

          <div className="mt-6">
            <PrimaryButton type="submit" variant="ghost" disabled={busy}>
              {busy
                ? "Working…"
                : mode === "signin"
                  ? "Sign in with email"
                  : "Create account with email"}
            </PrimaryButton>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="mt-4 w-full text-center text-caption text-primary"
          >
            {mode === "signin"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Google "G" mark. */
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
