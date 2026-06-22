import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { signIn, signUp, ApiError } from "../lib/api";
import TopBar from "../components/TopBar";
import PrimaryButton from "../components/PrimaryButton";

/**
 * Minimal real sign-in / sign-up against the backend (Supabase auth). Only
 * reached in backend mode — the connect flow detours here when no session
 * exists, then returns to `next` (e.g. /connect) once authenticated.
 *
 * Deliberately minimal: no password reset / social sign-in yet (see
 * server/docs/AUTH_FLOW.md "deferred").
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

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        await signUp(email, password);
        // If signup didn't return a session (email confirmation on), sign in.
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
    <div className="flex h-full flex-col bg-surface">
      <TopBar back title={mode === "signin" ? "Sign in" : "Create account"} />

      <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 pb-28 pt-3">
        <div className="flex items-center gap-2 rounded-card bg-primary-tint/60 p-3">
          <Lock size={18} className="shrink-0 text-primary" />
          <p className="text-caption text-ink">
            Your account secures your connected inbox. We never see your password.
          </p>
        </div>

        <label className="mt-5 block text-label font-semibold text-ink">
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
          <PrimaryButton type="submit" disabled={busy}>
            {busy
              ? "Working…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
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
  );
}
